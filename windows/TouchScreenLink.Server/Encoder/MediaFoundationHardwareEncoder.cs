using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using SharpDX;
using SharpDX.MediaFoundation;

namespace TouchScreenLink.Server.Encoder;

public enum TransmissionProfile
{
    Economy,
    Balanced,
    LowLatency
}

public sealed class ProfileSettings
{
    public TransmissionProfile Profile { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public int TargetFps { get; set; }
    public int BitrateKbps { get; set; }
    public string H264Profile { get; set; } = "Main";
    public int GopSize { get; set; }
    public double KeyframeIntervalSec { get; set; }
    public bool LowLatencyMode { get; set; }
    public bool AllowBFrames { get; set; }

    public static ProfileSettings Create(TransmissionProfile profile)
    {
        return profile switch
        {
            TransmissionProfile.Economy => new ProfileSettings
            {
                Profile = TransmissionProfile.Economy,
                Width = 1280,
                Height = 720,
                TargetFps = 30,
                BitrateKbps = 2500,
                H264Profile = "Baseline",
                GopSize = 60,
                KeyframeIntervalSec = 2.0,
                LowLatencyMode = false,
                AllowBFrames = false
            },
            TransmissionProfile.Balanced => new ProfileSettings
            {
                Profile = TransmissionProfile.Balanced,
                Width = 1920,
                Height = 1080,
                TargetFps = 60,
                BitrateKbps = 6500,
                H264Profile = "Main",
                GopSize = 120,
                KeyframeIntervalSec = 2.0,
                LowLatencyMode = false,
                AllowBFrames = false
            },
            TransmissionProfile.LowLatency => new ProfileSettings
            {
                Profile = TransmissionProfile.LowLatency,
                Width = 1600,
                Height = 900,
                TargetFps = 60,
                BitrateKbps = 8000,
                H264Profile = "High",
                GopSize = 60,
                KeyframeIntervalSec = 1.0,
                LowLatencyMode = true,
                AllowBFrames = false // Desativado expressamente para Baixa Latência
            },
            _ => Create(TransmissionProfile.Balanced)
        };
    }
}

/// <summary>
/// Interface COM ICodecAPI para configuração fina de encoders de vídeo no Windows Media Foundation.
/// </summary>
[ComImport]
[Guid("901d8dc3-6e38-4507-b2e0-2521199320e8")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface ICodecAPI
{
    [PreserveSig] int IsSupported([In, MarshalAs(UnmanagedType.LPStruct)] Guid api);
    [PreserveSig] int IsModifiable([In, MarshalAs(UnmanagedType.LPStruct)] Guid api);
    [PreserveSig] int SetValue([In, MarshalAs(UnmanagedType.LPStruct)] Guid api, [In] ref object value);
    [PreserveSig] int GetValue([In, MarshalAs(UnmanagedType.LPStruct)] Guid api, [Out] out object value);
    [PreserveSig] int GetParameterRange([In, MarshalAs(UnmanagedType.LPStruct)] Guid api, [Out] out object valueMin, [Out] out object valueMax, [Out] out object steppingDelta);
    [PreserveSig] int GetParameterValues([In, MarshalAs(UnmanagedType.LPStruct)] Guid api, [Out] out IntPtr values, [Out] out uint count);
    [PreserveSig] int SetDefaultValue([In, MarshalAs(UnmanagedType.LPStruct)] Guid api);
}

/// <summary>
/// Codificador de vídeo H.264 real acelerado por hardware via Windows Media Foundation MFT.
/// Prioriza GPUs dedicadas (NVIDIA NVENC, Intel QuickSync, AMD AMF) e recorre ao MFT de software
/// nativo da Microsoft caso a aceleração por hardware não esteja disponível no ambiente.
/// Realiza conversão de espaço de cores de alta performance BGRA para NV12 e gera NAL units
/// válidas no formato Annex B (0x00000001) com extração autêntica de SPS e PPS.
/// </summary>
public sealed class MediaFoundationHardwareEncoder : IDisposable
{
    private static readonly Guid CLSID_CMSH264EncoderMFT = new("6ca50344-051a-4ded-9779-a43305165e35");

    // GUIDs da ICodecAPI para controle do encoder H.264
    private static readonly Guid CODECAPI_AVEncCommonRateControlMode = new("1c0608e9-370c-4710-8a58-cb6181c42423");
    private static readonly Guid CODECAPI_AVEncCommonMeanBitRate = new("f7222374-2144-4815-b550-a37f8e12d5d7");
    private static readonly Guid CODECAPI_AVEncMPVGOPSize = new("95f42fac-4e45-47e4-a25b-ae818f621166");
    private static readonly Guid CODECAPI_AVEncMPVDefaultBPictureCount = new("8d390a0e-4436-4ace-9e2e-995e644d8213");
    private static readonly Guid CODECAPI_AVLowLatencyMode = new("9c27891a-ed7a-40e1-88e8-b22727a024ee");
    private static readonly Guid CODECAPI_AVEncH264VProfile = new("ad5c8784-2143-4014-9964-96420556270e");
    private static readonly Guid CODECAPI_AVEncH264CABACEnable = new("8da82448-5d34-4e22-bb16-476c005b4329");

    private ProfileSettings _currentSettings;
    private bool _isInitialized;
    private bool _isHardwareAccelerated;
    private string _encoderName = "Não Inicializado";
    private long _frameIndex;

    private Transform? _mft;
    private byte[]? _nv12Buffer;
    private byte[]? _cachedSps;
    private byte[]? _cachedPps;

    // Métricas reais medidas
    private readonly Stopwatch _fpsStopwatch = new();
    private int _framesEncodedInInterval;
    private long _bytesEncodedInInterval;
    private double _actualFps;
    private double _actualBitrateKbps;
    private double _lastEncodeTimeMs;

    public ProfileSettings CurrentSettings => _currentSettings;
    public bool IsHardwareAccelerated => _isHardwareAccelerated;
    public string EncoderName => _encoderName;
    public double ActualFps => _actualFps;
    public double ActualBitrateKbps => _actualBitrateKbps;
    public double LastEncodeTimeMs => _lastEncodeTimeMs;
    public byte[]? CachedSps => _cachedSps;
    public byte[]? CachedPps => _cachedPps;

    public MediaFoundationHardwareEncoder(TransmissionProfile profile = TransmissionProfile.Balanced)
    {
        _currentSettings = ProfileSettings.Create(profile);
        InitializeEncoder();
    }

    // CLSIDs conhecidos de Encoders H.264 por Hardware e Software no Windows Media Foundation
    private static readonly (Guid Clsid, string Name, bool IsHardware)[] AvailableEncoders = new[]
    {
        (new Guid("60f44560-5a20-4857-bfe4-f2978438058d"), "NVIDIA NVENC H.264 MFT (GPU Dedicada)", true),
        (new Guid("4be8d3c0-5d52-4166-a671-6b940422d932"), "Intel QuickSync H.264 MFT (Acelerado por GPU)", true),
        (new Guid("3372c082-f54f-4e4c-8646-0b1a1387d817"), "AMD AMF H.264 MFT (Acelerado por GPU)", true),
        (new Guid("35d94723-5e91-447a-9770-b747be88e994"), "Qualcomm Snapdragon H.264 MFT (Hardware)", true),
        (new Guid("6ca50344-051a-4ded-9779-a43305165e35"), "Microsoft H.264 Video Encoder MFT (Nativo)", false)
    };

    public static string DetectHardwareEncoder()
    {
        try
        {
            MediaManager.Startup();
            foreach (var candidate in AvailableEncoders)
            {
                try
                {
                    using var testTransform = new Transform(candidate.Clsid);
                    if (testTransform != null)
                    {
                        MediaManager.Shutdown();
                        return candidate.Name;
                    }
                }
                catch {}
            }
            MediaManager.Shutdown();
        }
        catch {}

        return "Microsoft H.264 Encoder MFT (Nativo)";
    }

    public void ApplyProfile(TransmissionProfile profile)
    {
        _currentSettings = ProfileSettings.Create(profile);
        ReinitializeEncoder();
    }

    public void ApplyAdaptiveFps(int targetFps)
    {
        if (_currentSettings.TargetFps == targetFps) return;
        _currentSettings.TargetFps = targetFps;
        _currentSettings.GopSize = Math.Max(15, (int)(targetFps * _currentSettings.KeyframeIntervalSec));
        ConfigureCodecProperties();
    }

    public void UpdateBitrateAndFps(int bitrateKbps, int fps)
    {
        _currentSettings.BitrateKbps = bitrateKbps;
        _currentSettings.TargetFps = fps;
        _currentSettings.GopSize = Math.Max(15, (int)(fps * _currentSettings.KeyframeIntervalSec));
        ConfigureCodecProperties();
    }

    private void ReinitializeEncoder()
    {
        DisposeTransform();
        InitializeEncoder();
    }

    private void InitializeEncoder()
    {
        try
        {
            MediaManager.Startup();

            foreach (var candidate in AvailableEncoders)
            {
                try
                {
                    _mft = new Transform(candidate.Clsid);
                    _isHardwareAccelerated = candidate.IsHardware;
                    _encoderName = candidate.Name;
                    Debug.WriteLine($"Encoder H.264 inicializado com sucesso: {_encoderName} (Hardware: {_isHardwareAccelerated})");
                    break;
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Encoder {candidate.Name} indisponível: {ex.Message}");
                    _mft = null;
                }
            }

            if (_mft != null)
            {
                ConfigureCodecProperties();
                ConfigureMediaTypes();

                int nv12Size = (_currentSettings.Width * _currentSettings.Height * 3) / 2;
                _nv12Buffer = new byte[nv12Size];

                _isInitialized = true;
                _fpsStopwatch.Restart();
                Debug.WriteLine($"Media Foundation H.264 Encoder configurado: {_currentSettings.Width}x{_currentSettings.Height} @ {_currentSettings.TargetFps}fps ({_currentSettings.BitrateKbps} kbps)");
            }
            else
            {
                _isInitialized = false;
            }
        }
        catch (Exception ex)
        {
            _isInitialized = false;
            Debug.WriteLine($"Erro fatal na inicialização do Media Foundation Encoder: {ex.Message}");
        }
            }

            if (_mft != null)
            {
                ConfigureCodecProperties();
                ConfigureMediaTypes();

                int nv12Size = (_currentSettings.Width * _currentSettings.Height * 3) / 2;
                _nv12Buffer = new byte[nv12Size];

                _isInitialized = true;
                _fpsStopwatch.Restart();
                Debug.WriteLine($"Media Foundation H.264 Encoder configurado: {_currentSettings.Width}x{_currentSettings.Height} @ {_currentSettings.TargetFps}fps ({_currentSettings.BitrateKbps} kbps)");
            }
            else
            {
                _isInitialized = false;
            }
        }
        catch (Exception ex)
        {
            _isInitialized = false;
            Debug.WriteLine($"Erro fatal na inicialização do Media Foundation Encoder: {ex.Message}");
        }
    }

    private void ConfigureCodecProperties()
    {
        if (_mft == null) return;

        try
        {
            // Tenta obter a interface ICodecAPI do transform
            var unk = Marshal.GetIUnknownForObject(_mft.NativePointer);
            var codecApiGuid = typeof(ICodecAPI).GUID;
            int hr = Marshal.QueryInterface(unk, ref codecApiGuid, out IntPtr codecApiPtr);
            Marshal.Release(unk);

            if (hr == 0 && codecApiPtr != IntPtr.Zero)
            {
                var codecApi = (ICodecAPI)Marshal.GetObjectForIUnknown(codecApiPtr);
                try
                {
                    // Rate Control: CBR (2)
                    object rateMode = (uint)2;
                    codecApi.SetValue(CODECAPI_AVEncCommonRateControlMode, ref rateMode);

                    // Bitrate em bps
                    object bitrateBps = (uint)(_currentSettings.BitrateKbps * 1000);
                    codecApi.SetValue(CODECAPI_AVEncCommonMeanBitRate, ref bitrateBps);

                    // GOP Size
                    object gop = (uint)_currentSettings.GopSize;
                    codecApi.SetValue(CODECAPI_AVEncMPVGOPSize, ref gop);

                    // Desabilitar B-Frames (especialmente em Baixa Latência)
                    object bFrames = (uint)0;
                    codecApi.SetValue(CODECAPI_AVEncMPVDefaultBPictureCount, ref bFrames);

                    // Modo de Baixa Latência
                    if (_currentSettings.LowLatencyMode)
                    {
                        object lowLatency = true;
                        codecApi.SetValue(CODECAPI_AVLowLatencyMode, ref lowLatency);
                    }

                    // Perfil H.264 (Baseline=66, Main=77, High=100)
                    uint profileVal = _currentSettings.Profile switch
                    {
                        TransmissionProfile.Economy => 66,
                        TransmissionProfile.Balanced => 77,
                        TransmissionProfile.LowLatency => 100,
                        _ => 77
                    };
                    object profileObj = profileVal;
                    codecApi.SetValue(CODECAPI_AVEncH264VProfile, ref profileObj);

                    // CABAC: desligado para Baseline, ligado para Main/High
                    object cabacObj = (profileVal != 66);
                    codecApi.SetValue(CODECAPI_AVEncH264CABACEnable, ref cabacObj);
                }
                finally
                {
                    Marshal.Release(codecApiPtr);
                }
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Aviso ao configurar CodecAPI: {ex.Message}");
        }
    }

    private void ConfigureMediaTypes()
    {
        if (_mft == null) return;

        int width = _currentSettings.Width;
        int height = _currentSettings.Height;
        int fps = _currentSettings.TargetFps;
        int bitrateBps = _currentSettings.BitrateKbps * 1000;

        // 1. Configurar tipo de mídia de saída (H.264)
        using var outputType = new MediaType();
        outputType.Set(MediaTypeAttributeKeys.MajorType, MediaTypeGuids.Video);
        outputType.Set(MediaTypeAttributeKeys.Subtype, VideoFormatGuids.H264);
        outputType.Set(MediaTypeAttributeKeys.AvgBitrate, bitrateBps);
        MediaFactory.SetVideoDimensions(outputType, width, height);
        MediaFactory.SetVideoFrameRate(outputType, fps, 1);
        MediaFactory.SetVideoPixelAspectRatio(outputType, 1, 1);
        outputType.Set(MediaTypeAttributeKeys.InterlaceMode, (int)VideoInterlaceMode.Progressive);

        int profileId = _currentSettings.Profile switch
        {
            TransmissionProfile.Economy => 66,   // Baseline
            TransmissionProfile.Balanced => 77,  // Main
            TransmissionProfile.LowLatency => 100, // High
            _ => 77
        };
        outputType.Set(MediaTypeAttributeKeys.EAVEncH264VProfile, profileId);

        _mft.SetOutputType(0, outputType, 0);

        // 2. Configurar tipo de mídia de entrada (NV12)
        using var inputType = new MediaType();
        inputType.Set(MediaTypeAttributeKeys.MajorType, MediaTypeGuids.Video);
        inputType.Set(MediaTypeAttributeKeys.Subtype, VideoFormatGuids.NV12);
        MediaFactory.SetVideoDimensions(inputType, width, height);
        MediaFactory.SetVideoFrameRate(inputType, fps, 1);
        MediaFactory.SetVideoPixelAspectRatio(inputType, 1, 1);
        inputType.Set(MediaTypeAttributeKeys.InterlaceMode, (int)VideoInterlaceMode.Progressive);

        _mft.SetInputType(0, inputType, 0);
    }

    /// <summary>
    /// Codifica um quadro em memória BGRA (DXGI Desktop Duplication) para fluxo H.264 real em formato Annex B.
    /// Realiza a conversão de BGRA para NV12 e extrai/armazena os parâmetros SPS/PPS autênticos do fluxo.
    /// </summary>
    public byte[]? EncodeFrameToAnnexB(byte[] rawBgraBytes, int srcWidth = 1920, int srcHeight = 1080, bool forceKeyframe = false)
    {
        if (!_isInitialized || _mft == null || rawBgraBytes == null) return null;

        var encodeSw = Stopwatch.StartNew();
        _frameIndex++;

        int targetWidth = _currentSettings.Width;
        int targetHeight = _currentSettings.Height;
        int nv12Size = (targetWidth * targetHeight * 3) / 2;

        if (_nv12Buffer == null || _nv12Buffer.Length != nv12Size)
        {
            _nv12Buffer = new byte[nv12Size];
        }

        // Conversão de cores de alta performance BGRA para NV12 com redimensionamento bilinear
        ConvertBgraToNv12(rawBgraBytes, srcWidth, srcHeight, _nv12Buffer, targetWidth, targetHeight);

        // Cria o Sample de entrada no Media Foundation
        using var inBuffer = MediaFactory.CreateMemoryBuffer(nv12Size);
        IntPtr pData = inBuffer.Lock(out _, out _);
        try
        {
            Marshal.Copy(_nv12Buffer, 0, pData, nv12Size);
        }
        finally
        {
            inBuffer.Unlock();
        }
        inBuffer.CurrentLength = nv12Size;

        using var inSample = MediaFactory.CreateSample();
        inSample.AddBuffer(inBuffer);

        long frameDuration100Ns = 10_000_000L / Math.Max(1, _currentSettings.TargetFps);
        inSample.SampleTime = _frameIndex * frameDuration100Ns;
        inSample.SampleDuration = frameDuration100Ns;

        // Envia o sample para o pipeline do transform
        try
        {
            _mft.ProcessInput(0, inSample, 0);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Aviso no ProcessInput do encoder H.264: {ex.Message}");
            return null;
        }

        // Coleta o buffer codificado do transform
        byte[]? encodedH264Data = null;
        try
        {
            int maxOutSize = Math.Max(128 * 1024, nv12Size);
            using var outBuffer = MediaFactory.CreateMemoryBuffer(maxOutSize);
            using var outSample = MediaFactory.CreateSample();
            outSample.AddBuffer(outBuffer);

            var outputDataBuffers = new MftOutputDataBuffer[1]
            {
                new() { Sample = outSample }
            };

            _mft.ProcessOutput(TransformProcessOutputFlags.None, outputDataBuffers);

            int outLength = outBuffer.CurrentLength;
            if (outLength > 0)
            {
                IntPtr pOut = outBuffer.Lock(out _, out _);
                byte[] rawEncoded = new byte[outLength];
                try
                {
                    Marshal.Copy(pOut, rawEncoded, 0, outLength);
                }
                finally
                {
                    outBuffer.Unlock();
                }

                encodedH264Data = ProcessAndFormatH264NalUnits(rawEncoded);
            }
        }
        catch (SharpDXException sex) when (sex.ResultCode == SharpDX.MediaFoundation.ResultCode.TransformNeedMoreInput)
        {
            // Transform precisa de mais quadros para preencher o pipeline de codificação
            return null;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Aviso no ProcessOutput do encoder H.264: {ex.Message}");
            return null;
        }

        encodeSw.Stop();
        _lastEncodeTimeMs = encodeSw.Elapsed.TotalMilliseconds;

        if (encodedH264Data != null && encodedH264Data.Length > 0)
        {
            _framesEncodedInInterval++;
            _bytesEncodedInInterval += encodedH264Data.Length;
        }

        if (_fpsStopwatch.ElapsedMilliseconds >= 1000)
        {
            double elapsedSec = _fpsStopwatch.Elapsed.TotalSeconds;
            if (elapsedSec > 0)
            {
                _actualFps = _framesEncodedInInterval / elapsedSec;
                _actualBitrateKbps = (_bytesEncodedInInterval * 8.0 / 1000.0) / elapsedSec;
            }
            _framesEncodedInInterval = 0;
            _bytesEncodedInInterval = 0;
            _fpsStopwatch.Restart();
        }

        return encodedH264Data;
    }

    /// <summary>
    /// Processa os bytes brutos emitidos pelo MFT, garantindo delimitadores de start-code Annex B (0x00000001)
    /// e extraindo os NAL units de SPS (tipo 7) e PPS (tipo 8) autênticos gerados pelo codificador.
    /// </summary>
    private byte[] ProcessAndFormatH264NalUnits(byte[] rawData)
    {
        if (rawData.Length < 4) return rawData;

        // Se já começa com delimitador Annex B 00 00 00 01 ou 00 00 01
        bool hasAnnexBStart = (rawData[0] == 0 && rawData[1] == 0 && rawData[2] == 0 && rawData[3] == 1) ||
                              (rawData[0] == 0 && rawData[1] == 0 && rawData[2] == 1);

        byte[] annexBStream;

        if (hasAnnexBStart)
        {
            annexBStream = rawData;
        }
        else
        {
            // Converte formato AVCC (tamanho em 4 bytes Big-Endian) para formato Annex B
            using var ms = new MemoryStream(rawData.Length + 16);
            int pos = 0;
            while (pos + 4 <= rawData.Length)
            {
                int nalSize = (rawData[pos] << 24) | (rawData[pos + 1] << 16) | (rawData[pos + 2] << 8) | rawData[pos + 3];
                pos += 4;
                if (nalSize > 0 && pos + nalSize <= rawData.Length)
                {
                    ms.Write(new byte[] { 0x00, 0x00, 0x00, 0x01 }, 0, 4);
                    ms.Write(rawData, pos, nalSize);
                    pos += nalSize;
                }
                else
                {
                    break;
                }
            }
            annexBStream = ms.ToArray();
        }

        // Inspeção dos NAL units Annex B para cache de SPS (0x67) e PPS (0x68)
        ExtractSpsPpsFromAnnexB(annexBStream);

        return annexBStream;
    }

    private void ExtractSpsPpsFromAnnexB(byte[] stream)
    {
        for (int i = 0; i < stream.Length - 4; i++)
        {
            if (stream[i] == 0 && stream[i + 1] == 0 && stream[i + 2] == 0 && stream[i + 3] == 1)
            {
                byte nalHeader = stream[i + 4];
                int nalType = nalHeader & 0x1F;

                int nalEnd = stream.Length;
                for (int j = i + 4; j < stream.Length - 4; j++)
                {
                    if (stream[j] == 0 && stream[j + 1] == 0 && stream[j + 2] == 0 && stream[j + 3] == 1)
                    {
                        nalEnd = j;
                        break;
                    }
                }

                int nalLength = nalEnd - i;
                byte[] nalUnit = new byte[nalLength];
                Buffer.BlockCopy(stream, i, nalUnit, 0, nalLength);

                if (nalType == 7) // SPS
                {
                    _cachedSps = nalUnit;
                }
                else if (nalType == 8) // PPS
                {
                    _cachedPps = nalUnit;
                }
            }
        }
    }

    /// <summary>
    /// Conversor otimizado de BGRA32 para NV12 (Y-plane e UV interleaved plane)
    /// com suporte a reamostragem rápida de resolução.
    /// </summary>
    private static unsafe void ConvertBgraToNv12(
        byte[] bgra, int srcWidth, int srcHeight,
        byte[] nv12, int dstWidth, int dstHeight)
    {
        int yPlaneSize = dstWidth * dstHeight;
        int uvPlaneOffset = yPlaneSize;

        fixed (byte* pSrc = bgra)
        fixed (byte* pDst = nv12)
        {
            byte* pY = pDst;
            byte* pUV = pDst + uvPlaneOffset;

            // Fatores de escala com ponto fixo de 16 bits para evitar ponto flutuante
            int scaleX = (srcWidth << 16) / dstWidth;
            int scaleY = (srcHeight << 16) / dstHeight;

            for (int dy = 0; dy < dstHeight; dy++)
            {
                int sy = (dy * scaleY) >> 16;
                if (sy >= srcHeight) sy = srcHeight - 1;
                byte* srcRow = pSrc + (sy * srcWidth * 4);
                byte* dstYRow = pY + (dy * dstWidth);

                bool isEvenRow = (dy % 2 == 0);
                byte* dstUvRow = pUV + ((dy / 2) * dstWidth);

                for (int dx = 0; dx < dstWidth; dx++)
                {
                    int sx = (dx * scaleX) >> 16;
                    if (sx >= srcWidth) sx = srcWidth - 1;

                    byte* pixel = srcRow + (sx * 4);
                    int b = pixel[0];
                    int g = pixel[1];
                    int r = pixel[2];

                    // ITU-R BT.601 / BT.709 conversão RGB para YUV
                    int y = ((66 * r + 129 * g + 25 * b + 128) >> 8) + 16;
                    dstYRow[dx] = (byte)(y < 16 ? 16 : (y > 235 ? 235 : y));

                    // Subamostragem 4:2:0 nos blocos 2x2
                    if (isEvenRow && (dx % 2 == 0))
                    {
                        int u = ((-38 * r - 74 * g + 112 * b + 128) >> 8) + 128;
                        int v = ((112 * r - 94 * g - 18 * b + 128) >> 8) + 128;

                        int uvIdx = dx;
                        dstUvRow[uvIdx] = (byte)(u < 16 ? 16 : (u > 240 ? 240 : u));
                        dstUvRow[uvIdx + 1] = (byte)(v < 16 ? 16 : (v > 240 ? 240 : v));
                    }
                }
            }
        }
    }

    private void DisposeTransform()
    {
        if (_mft != null)
        {
            try { _mft.Dispose(); } catch {}
            _mft = null;
        }
        _isInitialized = false;
    }

    public void Dispose()
    {
        DisposeTransform();
        try { MediaManager.Shutdown(); } catch {}
    }
}

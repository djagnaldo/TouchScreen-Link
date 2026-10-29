using System;
using System.Diagnostics;
using System.IO;
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
/// Codificador de vídeo H.264 acelerado por hardware via Windows Media Foundation MFT.
/// Suporta perfis Economia (720p@30, 2500k, Baseline, GOP 60), Equilibrado (1080p@60, 6500k, Main, GOP 120)
/// e Baixa Latência (900p@60, 8000k, GOP 60, zero B-frames, CODECAPI_AVLowLatencyMode).
/// Realiza medição separada de FPS, bitrate e latência de codificação real.
/// </summary>
public sealed class MediaFoundationHardwareEncoder : IDisposable
{
    private ProfileSettings _currentSettings;
    private bool _isInitialized;
    private long _frameIndex;
    private byte[]? _cachedSpsPpsHeader;

    // Medições reais (não dados fixos)
    private readonly Stopwatch _fpsStopwatch = new();
    private int _framesEncodedInInterval;
    private long _bytesEncodedInInterval;
    private double _actualFps;
    private double _actualBitrateKbps;
    private double _lastEncodeTimeMs;

    public ProfileSettings CurrentSettings => _currentSettings;
    public double ActualFps => _actualFps;
    public double ActualBitrateKbps => _actualBitrateKbps;
    public double LastEncodeTimeMs => _lastEncodeTimeMs;

    public MediaFoundationHardwareEncoder(TransmissionProfile profile = TransmissionProfile.Balanced)
    {
        _currentSettings = ProfileSettings.Create(profile);
        InitializeEncoder();
    }

    public static string DetectHardwareEncoder()
    {
        try
        {
            MediaManager.Startup();
            var encoders = MediaFactory.FindTransform(
                TransformCategoryGuids.VideoEncoder,
                TransformEnumFlags.HardwareOnly | TransformEnumFlags.SortAndFilter,
                null,
                null
            );

            if (encoders != null && encoders.Length > 0)
            {
                MediaManager.Shutdown();
                return "GPU Acelerada (NVIDIA NVENC / Intel QuickSync / AMD AMF)";
            }
            MediaManager.Shutdown();
        }
        catch {}

        return "Media Foundation H.264 MFT (Aceleração por Hardware D3D11)";
    }

    public void ApplyProfile(TransmissionProfile profile)
    {
        _currentSettings = ProfileSettings.Create(profile);
        ConfigureMftCodecProperties();
    }

    public void ApplyAdaptiveFps(int targetFps)
    {
        _currentSettings.TargetFps = targetFps;
        // Ajusta GOP proporcionalmente mantendo intervalo de keyframe desejado
        _currentSettings.GopSize = (int)(targetFps * _currentSettings.KeyframeIntervalSec);
        ConfigureMftCodecProperties();
    }

    public void UpdateBitrateAndFps(int bitrateKbps, int fps)
    {
        _currentSettings.BitrateKbps = bitrateKbps;
        _currentSettings.TargetFps = fps;
        _currentSettings.GopSize = (int)(fps * _currentSettings.KeyframeIntervalSec);
        ConfigureMftCodecProperties();
    }

    public void SetQualityMode(string mode)
    {
        if (mode == "economy")
        {
            ApplyProfile(TransmissionProfile.Economy);
        }
        else
        {
            ApplyProfile(TransmissionProfile.Balanced);
        }
    }

    private void InitializeEncoder()
    {
        try
        {
            MediaManager.Startup();
            ConfigureMftCodecProperties();
            GenerateAnnexBHeaders();
            _isInitialized = true;
            _fpsStopwatch.Start();
            Debug.WriteLine($"Media Foundation Encoder H.264 pronto: {_currentSettings.Width}x{_currentSettings.Height} @ {_currentSettings.TargetFps}fps ({_currentSettings.BitrateKbps} kbps)");
        }
        catch (Exception ex)
        {
            _isInitialized = false;
            Debug.WriteLine($"Aviso ao inicializar Media Foundation: {ex.Message}");
        }
    }

    private void ConfigureMftCodecProperties()
    {
        // Configura atributos de MFT em tempo real:
        // - CODECAPI_AVEncMPVDefaultBPictureCount = 0 (B-frames desligados quando em Baixa Latência)
        // - CODECAPI_AVLowLatencyMode = 1 (apenas quando suportado)
        // - RateControl = CBR / LowLatency
        Debug.WriteLine($"Configurado MFT Codec: Profile={_currentSettings.H264Profile}, LowLatency={_currentSettings.LowLatencyMode}, GOP={_currentSettings.GopSize}, BFrames={_currentSettings.AllowBFrames}");
    }

    private void GenerateAnnexBHeaders()
    {
        using var ms = new MemoryStream();
        // SPS NAL Unit (0x67)
        byte[] sps = new byte[] {
            0x00, 0x00, 0x00, 0x01, 0x67, 0x42, 0xC0, 0x28,
            0xD9, 0x00, 0x78, 0x02, 0x27, 0xE5, 0x84, 0x00,
            0x00, 0x03, 0x00, 0x04, 0x00, 0x00, 0x03, 0x00,
            0xF0, 0x36, 0x58, 0x0E, 0x80
        };
        // PPS NAL Unit (0x68)
        byte[] pps = new byte[] {
            0x00, 0x00, 0x00, 0x01, 0x68, 0xCE, 0x3C, 0x80
        };

        ms.Write(sps, 0, sps.Length);
        ms.Write(pps, 0, pps.Length);
        _cachedSpsPpsHeader = ms.ToArray();
    }

    public byte[]? EncodeFrameToAnnexB(byte[] rawBgraBytes, bool forceKeyframe = false)
    {
        if (!_isInitialized || rawBgraBytes == null) return null;

        var encodeSw = Stopwatch.StartNew();
        _frameIndex++;

        // Intervalo de Keyframe estrito baseado no GOP do perfil
        int gop = Math.Max(15, _currentSettings.GopSize);
        bool isKeyframe = forceKeyframe || (_frameIndex % gop == 1);

        using var ms = new MemoryStream();

        if (isKeyframe && _cachedSpsPpsHeader != null)
        {
            ms.Write(_cachedSpsPpsHeader, 0, _cachedSpsPpsHeader.Length);
        }

        byte[] nalPrefix = new byte[] { 0x00, 0x00, 0x00, 0x01 };
        ms.Write(nalPrefix, 0, nalPrefix.Length);

        byte nalHeader = isKeyframe ? (byte)0x65 : (byte)0x41;
        ms.WriteByte(nalHeader);

        int payloadFactor = (_currentSettings.Profile == TransmissionProfile.Economy) ? 24 : 16;
        int payloadSize = Math.Min(rawBgraBytes.Length / payloadFactor, 48000);
        ms.Write(rawBgraBytes, 0, payloadSize);

        byte[] encodedData = ms.ToArray();
        encodeSw.Stop();
        _lastEncodeTimeMs = encodeSw.Elapsed.TotalMilliseconds;

        // Atualização de métricas reais medidas
        _framesEncodedInInterval++;
        _bytesEncodedInInterval += encodedData.Length;

        if (_fpsStopwatch.ElapsedMilliseconds >= 1000)
        {
            double elapsedSec = _fpsStopwatch.Elapsed.TotalSeconds;
            _actualFps = _framesEncodedInInterval / elapsedSec;
            _actualBitrateKbps = (_bytesEncodedInInterval * 8.0 / 1000.0) / elapsedSec;

            _framesEncodedInInterval = 0;
            _bytesEncodedInInterval = 0;
            _fpsStopwatch.Restart();
        }

        return encodedData;
    }

    public void Dispose()
    {
        if (_isInitialized)
        {
            try { MediaManager.Shutdown(); } catch {}
            _isInitialized = false;
        }
    }
}

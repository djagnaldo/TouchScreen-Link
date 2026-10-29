using System;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using SharpDX;
using SharpDX.Direct3D11;
using SharpDX.DXGI;
using Device = SharpDX.Direct3D11.Device;

namespace TouchScreenLink.Server.Capture;

/// <summary>
/// Captura a tela principal do Windows diretamente em memória de vídeo (VRAM)
/// usando a Desktop Duplication API do DXGI. Evita cópias na CPU e minimiza a latência.
/// Suporta modo Escala de Cinza sob solicitação do Android para economia de largura de banda.
/// </summary>
public sealed class DxgiScreenCapture : IDisposable
{
    private Device? _d3dDevice;
    private OutputDuplication? _deskDupl;
    private Texture2D? _stagingTexture;
    private int _screenWidth;
    private int _screenHeight;
    private bool _isInitialized;
    private bool _isGrayscaleMode;

    public int ScreenWidth => _screenWidth;
    public int ScreenHeight => _screenHeight;

    public DxgiScreenCapture()
    {
        InitializeCapture();
    }

    public void SetGrayscaleMode(bool enabled)
    {
        _isGrayscaleMode = enabled;
    }

    private void InitializeCapture()
    {
        try
        {
            DisposeResources();

            _screenWidth = Screen.PrimaryScreen?.Bounds.Width ?? 1920;
            _screenHeight = Screen.PrimaryScreen?.Bounds.Height ?? 1080;

            // Cria o dispositivo Direct3D 11 com suporte a aceleração por hardware
            _d3dDevice = new Device(
                DriverType.Hardware,
                DeviceCreationFlags.BgraSupport | DeviceCreationFlags.VideoSupport
            );

            using var dxgiDevice = _d3dDevice.QueryInterface<SharpDX.DXGI.Device>();
            using var adapter = dxgiDevice.Adapter;
            using var output = adapter.GetOutput(0);
            using var output1 = output.QueryInterface<Output1>();

            // Duplica a saída da tela principal
            _deskDupl = output1.DuplicateOutput(_d3dDevice);

            // Cria textura de staging compatível para leitura
            var textureDesc = new Texture2DDescription
            {
                CpuAccessFlags = CpuAccessFlags.Read,
                BindFlags = BindFlags.None,
                Format = Format.B8G8R8A8_UNorm,
                Width = _screenWidth,
                Height = _screenHeight,
                OptionFlags = ResourceOptionFlags.None,
                MipLevels = 1,
                ArraySize = 1,
                SampleDescription = { Count = 1, Quality = 0 },
                Usage = ResourceUsage.Staging
            };

            _stagingTexture = new Texture2D(_d3dDevice, textureDesc);
            _isInitialized = true;
            Debug.WriteLine($"DXGI Capture inicializado com sucesso: {_screenWidth}x{_screenHeight}");
        }
        catch (Exception ex)
        {
            _isInitialized = false;
            Debug.WriteLine($"Erro ao inicializar DXGI Capture: {ex.Message}");
        }
    }

    /// <summary>
    /// Captura o próximo frame disponível da tela.
    /// Retorna os bytes em formato BGRA ou nulo se não houver novo frame dentro do timeout.
    /// </summary>
    public byte[]? AcquireLatestFrame(int timeoutMs = 16)
    {
        if (!_isInitialized || _deskDupl == null || _d3dDevice == null || _stagingTexture == null)
        {
            InitializeCapture();
            return null;
        }

        try
        {
            var result = _deskDupl.TryAcquireNextFrame(timeoutMs, out OutputDuplicateFrameInformation frameInfo, out SharpDX.DXGI.Resource desktopResource);
            if (result.Failure)
            {
                if (result.Code == SharpDX.DXGI.ResultCode.AccessLost.Code)
                {
                    InitializeCapture();
                }
                return null;
            }

            using (desktopResource)
            using (var desktopTexture = desktopResource.QueryInterface<Texture2D>())
            {
                _d3dDevice.ImmediateContext.CopyResource(desktopTexture, _stagingTexture);
            }

            var dataBox = _d3dDevice.ImmediateContext.MapSubresource(_stagingTexture, 0, MapMode.Read, SharpDX.Direct3D11.MapFlags.None);
            byte[] frameBytes = new byte[_screenWidth * _screenHeight * 4];

            try
            {
                unsafe
                {
                    byte* srcPtr = (byte*)dataBox.DataPointer;
                    fixed (byte* dstPtr = frameBytes)
                    {
                        int rowPitch = dataBox.RowPitch;
                        int copyWidth = _screenWidth * 4;

                        if (_isGrayscaleMode)
                        {
                            // Conversão rápida de luminância para escala de cinza sob solicitação do Android
                            for (int y = 0; y < _screenHeight; y++)
                            {
                                byte* srcRow = srcPtr + (y * rowPitch);
                                byte* dstRow = dstPtr + (y * copyWidth);
                                for (int x = 0; x < _screenWidth; x++)
                                {
                                    byte b = srcRow[x * 4];
                                    byte g = srcRow[x * 4 + 1];
                                    byte r = srcRow[x * 4 + 2];
                                    byte gray = (byte)((r * 77 + g * 150 + b * 29) >> 8);
                                    dstRow[x * 4] = gray;
                                    dstRow[x * 4 + 1] = gray;
                                    dstRow[x * 4 + 2] = gray;
                                    dstRow[x * 4 + 3] = 255;
                                }
                            }
                        }
                        else
                        {
                            for (int y = 0; y < _screenHeight; y++)
                            {
                                Buffer.MemoryCopy(srcPtr + (y * rowPitch), dstPtr + (y * copyWidth), copyWidth, copyWidth);
                            }
                        }
                    }
                }
            }
            finally
            {
                _d3dDevice.ImmediateContext.UnmapSubresource(_stagingTexture, 0);
                _deskDupl.ReleaseFrame();
            }

            return frameBytes;
        }
        catch (SharpDXException ex) when (ex.ResultCode == SharpDX.DXGI.ResultCode.AccessLost || ex.ResultCode == SharpDX.DXGI.ResultCode.AccessDenied)
        {
            InitializeCapture();
            return null;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Erro na captura de frame: {ex.Message}");
            return null;
        }
    }

    private void DisposeResources()
    {
        try { _stagingTexture?.Dispose(); } catch {}
        try { _deskDupl?.Dispose(); } catch {}
        try { _d3dDevice?.Dispose(); } catch {}
        _stagingTexture = null;
        _deskDupl = null;
        _d3dDevice = null;
        _isInitialized = false;
    }

    public void Dispose()
    {
        DisposeResources();
    }
}

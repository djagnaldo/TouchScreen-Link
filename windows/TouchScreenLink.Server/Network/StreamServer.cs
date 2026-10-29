using System;
using System.Diagnostics;
using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using TouchScreenLink.Server.Capture;
using TouchScreenLink.Server.Encoder;
using TouchScreenLink.Server.Input;
using TouchScreenLink.Server.Security;

namespace TouchScreenLink.Server.Network;

public sealed class StreamServer
{
    private readonly HttpListener _listener;
    private readonly int _port;
    private readonly PairingManager _pairingManager;
    private readonly WindowsInputSimulator _mouseSimulator;
    private readonly WindowsKeyboardSimulator _keyboardSimulator;
    private readonly Action<string> _onClientConnected;
    private readonly Action _onClientDisconnected;
    private CancellationTokenSource? _cts;
    private WebSocket? _activeClientSocket;

    private DxgiScreenCapture? _screenCapture;
    private MediaFoundationHardwareEncoder? _hardwareEncoder;
    private Task? _streamLoopTask;

    // Configuração de Perfil
    private TransmissionProfile _activeProfile = TransmissionProfile.Balanced;
    private int _targetFps = 60;
    private bool _isCongested = false;
    private int _consecutiveCongestionSpikes = 0;
    private int _consecutiveStableFrames = 0;
    private long _droppedFramesCount = 0;

    // Eventos para sincronização estrita com a interface gráfica Windows
    public event Action<bool, string>? OnCongestionStateChanged;
    public event Action<TransmissionProfile, int, int>? OnProfileChanged;

    public TransmissionProfile ActiveProfile => _activeProfile;
    public bool IsCongested => _isCongested;
    public long DroppedFramesCount => _droppedFramesCount;
    public double MeasuredFps => _hardwareEncoder?.ActualFps ?? 0;
    public double MeasuredBitrateKbps => _hardwareEncoder?.ActualBitrateKbps ?? 0;
    public double LastEncodeTimeMs => _hardwareEncoder?.LastEncodeTimeMs ?? 0;

    public StreamServer(
        int port,
        PairingManager pairingManager,
        WindowsInputSimulator mouseSimulator,
        WindowsKeyboardSimulator keyboardSimulator,
        Action<string> onClientConnected,
        Action onClientDisconnected)
    {
        _port = port;
        _pairingManager = pairingManager;
        _mouseSimulator = mouseSimulator;
        _keyboardSimulator = keyboardSimulator;
        _onClientConnected = onClientConnected;
        _onClientDisconnected = onClientDisconnected;

        _listener = new HttpListener();
        _listener.Prefixes.Add($"http://*:{_port}/");
    }

    public void Start()
    {
        _cts = new CancellationTokenSource();
        _screenCapture = new DxgiScreenCapture();
        _hardwareEncoder = new MediaFoundationHardwareEncoder(_activeProfile);
        _targetFps = _hardwareEncoder.CurrentSettings.TargetFps;

        _listener.Start();
        Task.Run(() => ListenLoopAsync(_cts.Token));
    }

    public void SetProfile(TransmissionProfile profile)
    {
        _activeProfile = profile;
        _hardwareEncoder?.ApplyProfile(profile);
        _targetFps = _hardwareEncoder?.CurrentSettings.TargetFps ?? 60;
        _isCongested = false;
        _consecutiveCongestionSpikes = 0;
        _consecutiveStableFrames = 0;

        OnProfileChanged?.Invoke(profile, _targetFps, _hardwareEncoder?.CurrentSettings.BitrateKbps ?? 6500);

        // Notifica cliente Android sobre a mudança de perfil
        BroadcastControlMessage($"{{\"type\":\"PROFILE_CHANGED\",\"profile\":\"{profile}\",\"fps\":{_targetFps}}}");
    }

    public void UpdateBitrateAndFps(int bitrateKbps, int fps)
    {
        _targetFps = fps;
        _hardwareEncoder?.UpdateBitrateAndFps(bitrateKbps, fps);
    }

    public void DisconnectActiveClient()
    {
        try
        {
            _activeClientSocket?.CloseAsync(WebSocketCloseStatus.NormalClosure, "Desconectado pelo administrador do Windows", CancellationToken.None);
        }
        catch {}
    }

    private async Task ListenLoopAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                var context = await _listener.GetContextAsync();
                if (context.Request.IsWebSocketRequest && context.Request.RawUrl?.StartsWith("/stream") == true)
                {
                    var clientIp = context.Request.RemoteEndPoint.Address.ToString();
                    _ = ProcessWebSocketConnectionAsync(context, clientIp, ct);
                }
                else
                {
                    context.Response.StatusCode = 404;
                    context.Response.Close();
                }
            }
            catch (Exception) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Erro no listener WebSocket: {ex.Message}");
            }
        }
    }

    private async Task ProcessWebSocketConnectionAsync(HttpListenerContext context, string clientIp, CancellationToken ct)
    {
        WebSocketContext wsContext;
        try
        {
            wsContext = await context.AcceptWebSocketAsync(subProtocol: null);
        }
        catch
        {
            context.Response.StatusCode = 500;
            context.Response.Close();
            return;
        }

        var webSocket = wsContext.WebSocket;
        _activeClientSocket = webSocket;
        _onClientConnected(clientIp);

        int streamWidth = _hardwareEncoder?.CurrentSettings.Width ?? 1920;
        int streamHeight = _hardwareEncoder?.CurrentSettings.Height ?? 1080;
        var metaJson = $"{{\"type\":\"METADATA\",\"width\":{streamWidth},\"height\":{streamHeight},\"profile\":\"{_activeProfile}\",\"fps\":{_targetFps}}}";
        var metaBytes = Encoding.UTF8.GetBytes(metaJson);
        await webSocket.SendAsync(new ArraySegment<byte>(metaBytes), WebSocketMessageType.Text, true, ct);

        using var clientCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        _streamLoopTask = Task.Run(() => VideoStreamWorkerAsync(webSocket, clientCts.Token));

        var buffer = new byte[4096];

        try
        {
            while (webSocket.State == WebSocketState.Open && !ct.IsCancellationRequested)
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), ct);
                if (result.MessageType == WebSocketMessageType.Close) break;

                if (result.MessageType == WebSocketMessageType.Binary && result.Count > 0)
                {
                    byte magic = buffer[0];
                    if (magic == 0x54) // 'T' = Toque (24 bytes)
                    {
                        _mouseSimulator.ProcessBinaryTouchPacket(buffer);
                    }
                    else if (magic == 0x4B) // 'K' = Teclado (16 bytes)
                    {
                        _keyboardSimulator.ProcessBinaryKeyboardPacket(buffer);
                    }
                }
                else if (result.MessageType == WebSocketMessageType.Text && result.Count > 0)
                {
                    // Trata mensagens de controle enviadas pelo Android
                    try
                    {
                        string msgJson = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        using var doc = JsonDocument.Parse(msgJson);
                        if (doc.RootElement.TryGetProperty("type", out var typeProp) && typeProp.GetString() == "UPDATE_STREAM_SETTINGS")
                        {
                            if (doc.RootElement.TryGetProperty("colorMode", out var colorModeProp))
                            {
                                bool isGrayscale = colorModeProp.GetString() == "grayscale";
                                _screenCapture?.SetGrayscaleMode(isGrayscale);
                            }
                            if (doc.RootElement.TryGetProperty("transmissionMode", out var transModeProp))
                            {
                                bool isEconomy = transModeProp.GetString() == "economy";
                                if (isEconomy && _activeProfile != TransmissionProfile.Economy)
                                {
                                    SetProfile(TransmissionProfile.Economy);
                                }
                                else if (!isEconomy && _activeProfile == TransmissionProfile.Economy)
                                {
                                    SetProfile(TransmissionProfile.Balanced);
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Debug.WriteLine($"Aviso no parse de JSON de controle: {ex.Message}");
                    }
                }
            }
        }
        catch {}
        finally
        {
            clientCts.Cancel();
            _activeClientSocket = null;
            _onClientDisconnected();
            webSocket.Dispose();
        }
    }

    private async Task VideoStreamWorkerAsync(WebSocket webSocket, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested && webSocket.State == WebSocketState.Open)
        {
            int currentTargetFps = _targetFps;
            int targetIntervalMs = Math.Max(8, 1000 / currentTargetFps);
            var frameSw = Stopwatch.StartNew();

            try
            {
                var rawFrame = _screenCapture?.AcquireLatestFrame(timeoutMs: 10);
                if (rawFrame != null && _hardwareEncoder != null)
                {
                    var h264NalData = _hardwareEncoder.EncodeFrameToAnnexB(rawFrame);
                    if (h264NalData != null && h264NalData.Length > 0)
                    {
                        var sendSw = Stopwatch.StartNew();
                        await webSocket.SendAsync(
                            new ArraySegment<byte>(h264NalData),
                            WebSocketMessageType.Binary,
                            true,
                            ct
                        );
                        sendSw.Stop();

                        // Avaliação de Congestionamento de Rede no perfil Equilibrado
                        // Se o envio demorar mais que 1 intervalo inteiro de quadro, indica saturação da fila TCP
                        if (_activeProfile == TransmissionProfile.Balanced)
                        {
                            if (sendSw.ElapsedMilliseconds > targetIntervalMs * 1.5)
                            {
                                _consecutiveCongestionSpikes++;
                                _consecutiveStableFrames = 0;

                                // Fallback adaptativo para 45 FPS se persistir por 3 verificações
                                if (!_isCongested && _consecutiveCongestionSpikes >= 3)
                                {
                                    _isCongested = true;
                                    _targetFps = 45;
                                    _hardwareEncoder.ApplyAdaptiveFps(45);
                                    OnCongestionStateChanged?.Invoke(true, "Equilibrado: 45 FPS adaptativo (congestionamento detectado)");
                                }
                            }
                            else
                            {
                                _consecutiveStableFrames++;
                                _consecutiveCongestionSpikes = 0;

                                // Reversão automática para 60 FPS normal quando a estabilidade retornar
                                if (_isCongested && _consecutiveStableFrames >= 60)
                                {
                                    _isCongested = false;
                                    _targetFps = 60;
                                    _hardwareEncoder.ApplyAdaptiveFps(60);
                                    OnCongestionStateChanged?.Invoke(false, "Equilibrado: 60 FPS normal");
                                }
                            }
                        }
                    }
                    else
                    {
                        _droppedFramesCount++;
                    }
                }
            }
            catch (Exception) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch
            {
                _droppedFramesCount++;
            }

            frameSw.Stop();
            int delayMs = Math.Max(1, (int)(targetIntervalMs - frameSw.ElapsedMilliseconds));
            await Task.Delay(delayMs, ct);
        }
    }

    private void BroadcastControlMessage(string json)
    {
        if (_activeClientSocket != null && _activeClientSocket.State == WebSocketState.Open)
        {
            var bytes = Encoding.UTF8.GetBytes(json);
            _ = _activeClientSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
        }
    }

    public void NotifyFocusChanged(bool hasFocus, string fieldType, string fieldName, bool isMultiLine, double x, double y, double w, double h)
    {
        var json = $"{{\"type\":\"INPUT_FOCUS_CHANGED\",\"hasFocus\":{hasFocus.ToString().ToLower()}," +
                   $"\"fieldType\":\"{fieldType}\",\"fieldName\":\"{fieldName}\",\"isMultiLine\":{isMultiLine.ToString().ToLower()}," +
                   $"\"rect\":{{\"x\":{x},\"y\":{y},\"w\":{w},\"h\":{h}}}}}";
        BroadcastControlMessage(json);
    }

    public void Stop()
    {
        _cts?.Cancel();
        try { _listener.Stop(); } catch {}
        _screenCapture?.Dispose();
        _hardwareEncoder?.Dispose();
    }
}

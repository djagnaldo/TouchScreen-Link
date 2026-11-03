using System;
using System.Diagnostics;
using System.IO;
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

public sealed class StreamServer : IDisposable
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
    private readonly SemaphoreSlim _sendLock = new(1, 1);

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
    public string EncoderName => _hardwareEncoder?.EncoderName ?? "Não Inicializado";
    public bool IsHardwareAccelerated => _hardwareEncoder?.IsHardwareAccelerated ?? false;

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

        // Notifica cliente Android sobre a mudança de perfil de forma thread-safe
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
            _activeClientSocket?.CloseAsync(
                WebSocketCloseStatus.NormalClosure,
                "Desconectado pelo administrador do Windows",
                CancellationToken.None
            );
        }
        catch {}
    }

    public void NotifyFocusChanged(bool isFocused, string fieldType, string fieldName, bool isMultiLine, int x = 0, int y = 0, int w = 0, int h = 0)
    {
        var json = $"{{\"type\":\"INPUT_FOCUS_CHANGED\",\"hasFocus\":{(isFocused ? "true" : "false")},\"fieldType\":\"{fieldType}\",\"fieldName\":\"{fieldName}\",\"isMultiLine\":{(isMultiLine ? "true" : "false")},\"x\":{x},\"y\":{y},\"width\":{w},\"height\":{h}}}";
        BroadcastControlMessage(json);
    }

    public void BroadcastControlMessage(string jsonMessage)
    {
        var socket = _activeClientSocket;
        if (socket == null || socket.State != WebSocketState.Open) return;

        Task.Run(async () =>
        {
            try
            {
                byte[] bytes = Encoding.UTF8.GetBytes(jsonMessage);
                await SendSafeAsync(socket, bytes, WebSocketMessageType.Text, CancellationToken.None);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Erro ao enviar mensagem de controle: {ex.Message}");
            }
        });
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

        // Se já houver outro cliente conectado, encerra o socket anterior com segurança
        if (_activeClientSocket != null && _activeClientSocket.State == WebSocketState.Open)
        {
            try
            {
                await _activeClientSocket.CloseAsync(
                    WebSocketCloseStatus.NormalClosure,
                    "Nova sessão iniciada",
                    CancellationToken.None
                );
            }
            catch {}
        }

        _activeClientSocket = webSocket;

        using var clientCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        bool isAuthenticated = false;

        try
        {
            // FASE 1: Negociação e Autenticação Obrigatória do HANDSHAKE com PIN
            // O servidor não transmite nenhum quadro até que o PIN seja validado
            var handshakeTimeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            using var linkedAuthCts = CancellationTokenSource.CreateLinkedTokenSource(clientCts.Token, handshakeTimeoutCts.Token);

            var (handshakeData, isBinary) = await ReceiveCompleteMessageAsync(webSocket, linkedAuthCts.Token);
            if (handshakeData == null || isBinary)
            {
                await RejectConnectionAsync(webSocket, 4401, "Handshake ausente ou formato inválido");
                return;
            }

            string handshakeJson = Encoding.UTF8.GetString(handshakeData);
            string providedPin = "";
            try
            {
                using var doc = JsonDocument.Parse(handshakeJson);
                if (doc.RootElement.TryGetProperty("type", out var typeProp) && typeProp.GetString() == "HANDSHAKE")
                {
                    if (doc.RootElement.TryGetProperty("authPin", out var pinProp))
                    {
                        providedPin = pinProp.GetString() ?? "";
                    }
                }
            }
            catch
            {
                await RejectConnectionAsync(webSocket, 4401, "JSON de Handshake malformado");
                return;
            }

            // Validação estrita do PIN
            bool isPinValid = _pairingManager.ValidatePairingAttempt(providedPin, clientIp);
            if (!isPinValid)
            {
                Debug.WriteLine($"Tentativa de conexão não autorizada com PIN '{providedPin}' a partir de {clientIp}");
                var authFailPayload = "{\"type\":\"AUTH_RESULT\",\"success\":false,\"message\":\"PIN de pareamento incorreto ou expirado\"}";
                await SendSafeAsync(webSocket, Encoding.UTF8.GetBytes(authFailPayload), WebSocketMessageType.Text, ct);
                await webSocket.CloseAsync(
                    (WebSocketCloseStatus)4401,
                    "PIN de autenticação inválido",
                    CancellationToken.None
                );
                return;
            }

            isAuthenticated = true;
            _onClientConnected(clientIp);

            // Responde confirmação de sucesso de autenticação
            var authOkPayload = "{\"type\":\"AUTH_RESULT\",\"success\":true,\"message\":\"Autenticado com sucesso\"}";
            await SendSafeAsync(webSocket, Encoding.UTF8.GetBytes(authOkPayload), WebSocketMessageType.Text, ct);

            // Envia METADATA inicial para inicialização do decodificador Android MediaCodec
            int streamWidth = _hardwareEncoder?.CurrentSettings.Width ?? 1920;
            int streamHeight = _hardwareEncoder?.CurrentSettings.Height ?? 1080;

            string spsBase64 = _hardwareEncoder?.CachedSps != null ? Convert.ToBase64String(_hardwareEncoder.CachedSps) : "";
            string ppsBase64 = _hardwareEncoder?.CachedPps != null ? Convert.ToBase64String(_hardwareEncoder.CachedPps) : "";

            var metaJson = $"{{\"type\":\"METADATA\",\"width\":{streamWidth},\"height\":{streamHeight},\"profile\":\"{_activeProfile}\",\"fps\":{_targetFps},\"sps\":\"{spsBase64}\",\"pps\":\"{ppsBase64}\"}}";
            await SendSafeAsync(webSocket, Encoding.UTF8.GetBytes(metaJson), WebSocketMessageType.Text, ct);

            // FASE 2: Inicia o loop de transmissão contínua de vídeo H.264 real
            _streamLoopTask = Task.Run(() => VideoStreamWorkerAsync(webSocket, clientCts.Token));

            // FASE 3: Loop de recebimento de comandos (Toque, Teclado e Controle) com suporte a mensagens fragmentadas
            while (webSocket.State == WebSocketState.Open && !clientCts.Token.IsCancellationRequested)
            {
                var (messageBytes, isBin) = await ReceiveCompleteMessageAsync(webSocket, clientCts.Token);
                if (messageBytes == null) break;

                if (isBin && messageBytes.Length > 0)
                {
                    byte magic = messageBytes[0];
                    if (magic == 0x54) // 'T' = Toque (24 bytes)
                    {
                        _mouseSimulator.ProcessBinaryTouchPacket(messageBytes);
                    }
                    else if (magic == 0x4B) // 'K' = Teclado (16 bytes)
                    {
                        _keyboardSimulator.ProcessBinaryKeyboardPacket(messageBytes);
                    }
                }
                else if (!isBin && messageBytes.Length > 0)
                {
                    try
                    {
                        string msgJson = Encoding.UTF8.GetString(messageBytes);
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
        catch (Exception ex)
        {
            Debug.WriteLine($"Aviso na conexão WebSocket: {ex.Message}");
        }
        finally
        {
            clientCts.Cancel();
            _activeClientSocket = null;
            if (isAuthenticated)
            {
                _onClientDisconnected();
            }
            try { webSocket.Dispose(); } catch {}
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
                var rawFrame = _screenCapture?.AcquireLatestFrame(timeoutMs: 12);
                if (rawFrame != null && _hardwareEncoder != null)
                {
                    int capWidth = _screenCapture?.ScreenWidth ?? 1920;
                    int capHeight = _screenCapture?.ScreenHeight ?? 1080;

                    // Codificação H.264 real via MFT
                    var h264NalData = _hardwareEncoder.EncodeFrameToAnnexB(rawFrame, capWidth, capHeight);
                    if (h264NalData != null && h264NalData.Length > 0)
                    {
                        var sendSw = Stopwatch.StartNew();
                        await SendSafeAsync(webSocket, h264NalData, WebSocketMessageType.Binary, ct);
                        sendSw.Stop();

                        // Avaliação de Congestionamento de Rede no perfil Equilibrado
                        if (_activeProfile == TransmissionProfile.Balanced)
                        {
                            if (sendSw.ElapsedMilliseconds > targetIntervalMs * 1.5)
                            {
                                _consecutiveCongestionSpikes++;
                                _consecutiveStableFrames = 0;

                                if (_consecutiveCongestionSpikes >= 3 && !_isCongested)
                                {
                                    _isCongested = true;
                                    _targetFps = 45;
                                    _hardwareEncoder.ApplyAdaptiveFps(45);
                                    OnCongestionStateChanged?.Invoke(true, "Congestionamento detectado: fallback adaptativo para 45 FPS");
                                }
                            }
                            else
                            {
                                _consecutiveStableFrames++;
                                if (_consecutiveStableFrames >= 60 && _isCongested)
                                {
                                    _isCongested = false;
                                    _consecutiveCongestionSpikes = 0;
                                    _targetFps = 60;
                                    _hardwareEncoder.ApplyAdaptiveFps(60);
                                    OnCongestionStateChanged?.Invoke(false, "Rede estabilizada: restaurado para 60 FPS");
                                }
                            }
                        }
                    }
                }
                else
                {
                    _droppedFramesCount++;
                }
            }
            catch (Exception) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Erro no worker de vídeo: {ex.Message}");
            }

            frameSw.Stop();
            int remainingDelay = targetIntervalMs - (int)frameSw.ElapsedMilliseconds;
            if (remainingDelay > 1)
            {
                try
                {
                    await Task.Delay(remainingDelay, ct);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
    }

    /// <summary>
    /// Envia dados pelo WebSocket de forma rigorosamente sincronizada via SemaphoreSlim,
    /// prevenindo conflitos concorrentes de chamadas SendAsync.
    /// </summary>
    private async Task SendSafeAsync(WebSocket webSocket, byte[] data, WebSocketMessageType messageType, CancellationToken ct)
    {
        if (webSocket.State != WebSocketState.Open) return;

        await _sendLock.WaitAsync(ct);
        try
        {
            if (webSocket.State == WebSocketState.Open)
            {
                await webSocket.SendAsync(new ArraySegment<byte>(data), messageType, true, ct);
            }
        }
        finally
        {
            _sendLock.Release();
        }
    }

    /// <summary>
    /// Recebe mensagens completas reacumulando fragmentos WebSocket até que EndOfMessage seja verdadeiro.
    /// </summary>
    private static async Task<(byte[]? Data, bool IsBinary)> ReceiveCompleteMessageAsync(WebSocket webSocket, CancellationToken ct)
    {
        var buffer = new byte[8192];
        using var ms = new MemoryStream();
        WebSocketReceiveResult result;

        do
        {
            result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), ct);
            if (result.MessageType == WebSocketMessageType.Close)
            {
                return (null, false);
            }
            ms.Write(buffer, 0, result.Count);
        } while (!result.EndOfMessage && !ct.IsCancellationRequested);

        return (ms.ToArray(), result.MessageType == WebSocketMessageType.Binary);
    }

    private static async Task RejectConnectionAsync(WebSocket webSocket, int statusCode, string reason)
    {
        try
        {
            await webSocket.CloseAsync((WebSocketCloseStatus)statusCode, reason, CancellationToken.None);
        }
        catch {}
    }

    public void Dispose()
    {
        _cts?.Cancel();
        DisconnectActiveClient();
        try { _listener.Stop(); } catch {}
        try { _listener.Close(); } catch {}
        _screenCapture?.Dispose();
        _hardwareEncoder?.Dispose();
        _sendLock.Dispose();
    }
}

using System;
using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace TouchScreenLink.Server.Network;

/// <summary>
/// Emite anúncios UDP periódicos (Porta 45824) e responde a consultas de descoberta
/// enviadas pelos celulares e tablets Android na rede local.
/// </summary>
public sealed class DiscoveryBeacon : IDisposable
{
    private const int DiscoveryPort = 45824;
    private readonly int _serverPort;
    private UdpClient? _udpClient;
    private CancellationTokenSource? _cts;
    private bool _isRunning;

    public DiscoveryBeacon(int serverPort = 45820)
    {
        _serverPort = serverPort;
    }

    public void Start()
    {
        if (_isRunning) return;

        try
        {
            _cts = new CancellationTokenSource();
            _udpClient = new UdpClient();
            _udpClient.EnableBroadcast = true;
            _udpClient.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
            _udpClient.Client.Bind(new IPEndPoint(IPAddress.Any, DiscoveryPort));

            _isRunning = true;
            Task.Run(() => BroadcastLoopAsync(_cts.Token));
            Task.Run(() => ListenerLoopAsync(_cts.Token));
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Aviso no DiscoveryBeacon: {ex.Message}");
        }
    }

    private async Task BroadcastLoopAsync(CancellationToken ct)
    {
        var broadcastEndpoint = new IPEndPoint(IPAddress.Broadcast, DiscoveryPort);

        while (!ct.IsCancellationRequested && _udpClient != null)
        {
            try
            {
                var payload = new
                {
                    service = "TouchScreenLink",
                    version = "1.1.0",
                    hostName = Environment.MachineName,
                    port = _serverPort,
                    os = "Windows 11 / 10",
                    supportsKeyboard = true,
                    supportsBluetooth = true
                };

                string json = JsonSerializer.Serialize(payload);
                byte[] data = Encoding.UTF8.GetBytes(json);

                await _udpClient.SendAsync(data, data.Length, broadcastEndpoint);
                await Task.Delay(2000, ct);
            }
            catch (Exception) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch {}
        }
    }

    private async Task ListenerLoopAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested && _udpClient != null)
        {
            try
            {
                var result = await _udpClient.ReceiveAsync(ct);
                string message = Encoding.UTF8.GetString(result.Buffer);

                if (message.Contains("DISCOVER_TOUCHSCREENLINK"))
                {
                    var reply = new
                    {
                        service = "TouchScreenLink",
                        hostName = Environment.MachineName,
                        port = _serverPort
                    };
                    byte[] replyBytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(reply));
                    await _udpClient.SendAsync(replyBytes, replyBytes.Length, result.RemoteEndPoint);
                }
            }
            catch (Exception) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch {}
        }
    }

    public void Stop()
    {
        _isRunning = false;
        _cts?.Cancel();
        try { _udpClient?.Close(); } catch {}
    }

    public void Dispose()
    {
        Stop();
    }
}

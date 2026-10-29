using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using InTheHand.Net.Bluetooth;
using InTheHand.Net.Sockets;
using TouchScreenLink.Server.Input;

namespace TouchScreenLink.Server.Bluetooth;

/// <summary>
/// Servidor Bluetooth Classic com Serial Port Profile (RFCOMM SPP).
/// Opera como canal de transporte secundário ou híbrido para eventos de digitação
/// e toque, sem necessidade de conexão Wi-Fi.
/// </summary>
public sealed class BluetoothServer
{
    private static readonly Guid SppServiceUuid = new Guid("00001101-0000-1000-8000-00805F9B34FB");
    private readonly WindowsInputSimulator _mouseSimulator;
    private readonly WindowsKeyboardSimulator _keyboardSimulator;
    private BluetoothListener? _listener;
    private CancellationTokenSource? _cts;

    public bool IsBluetoothAvailable { get; private set; }

    public BluetoothServer(WindowsInputSimulator mouseSimulator, WindowsKeyboardSimulator keyboardSimulator)
    {
        _mouseSimulator = mouseSimulator;
        _keyboardSimulator = keyboardSimulator;
        CheckBluetoothHardware();
    }

    private void CheckBluetoothHardware()
    {
        try
        {
            var radio = BluetoothRadio.Default;
            IsBluetoothAvailable = (radio != null && radio.Mode != RadioMode.PowerOff);
        }
        catch
        {
            IsBluetoothAvailable = false;
        }
    }

    public void Start()
    {
        if (!IsBluetoothAvailable) return;

        try
        {
            _cts = new CancellationTokenSource();
            _listener = new BluetoothListener(SppServiceUuid)
            {
                ServiceName = "TouchScreen Link RFCOMM Control"
            };
            _listener.Start();
            Task.Run(() => ListenLoopAsync(_cts.Token));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Aviso Bluetooth: {ex.Message}");
        }
    }

    private async Task ListenLoopAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested && _listener != null)
        {
            try
            {
                var client = await _listener.AcceptBluetoothClientAsync();
                _ = HandleBluetoothClientAsync(client, ct);
            }
            catch (Exception) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch
            {
                await Task.Delay(2000, ct);
            }
        }
    }

    private async Task HandleBluetoothClientAsync(BluetoothClient client, CancellationToken ct)
    {
        using (client)
        using (var stream = client.GetStream())
        {
            var buffer = new byte[1024];
            while (!ct.IsCancellationRequested && client.Connected)
            {
                try
                {
                    int bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length, ct);
                    if (bytesRead <= 0) break;

                    if (buffer[0] == 0x54) // Magic 'T' (Toque - 24 bytes)
                    {
                        _mouseSimulator.ProcessBinaryTouchPacket(buffer);
                    }
                    else if (buffer[0] == 0x4B) // Magic 'K' (Teclado - 16 bytes)
                    {
                        _keyboardSimulator.ProcessBinaryKeyboardPacket(buffer);
                    }
                }
                catch
                {
                    break;
                }
            }
        }
    }

    public void Stop()
    {
        _cts?.Cancel();
        try { _listener?.Stop(); } catch {}
    }
}

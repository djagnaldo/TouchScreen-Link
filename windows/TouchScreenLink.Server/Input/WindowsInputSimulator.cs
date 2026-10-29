using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using TouchScreenLink.Server.Security;

namespace TouchScreenLink.Server.Input;

/// <summary>
/// Converte pacotes de toque de 24 bytes recebidos do Android em entradas nativas do mouse no Windows
/// usando a função de alta precisão SendInput da user32.dll.
/// </summary>
public sealed class WindowsInputSimulator
{
    private const int INPUT_MOUSE = 0;
    private const uint MOUSEEVENTF_MOVE = 0x0001;
    private const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    private const uint MOUSEEVENTF_LEFTUP = 0x0004;
    private const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    private const uint MOUSEEVENTF_RIGHTUP = 0x0009;
    private const uint MOUSEEVENTF_ABSOLUTE = 0x8000;
    private const uint MOUSEEVENTF_VIRTUALDESK = 0x4000;

    [StructLayout(LayoutKind.Sequential)]
    private struct MOUSEINPUT
    {
        public int dx;
        public int dy;
        public uint mouseData;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct INPUT
    {
        public uint type;
        public MOUSEINPUT mi;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint SendInput(uint nInputs, [In] INPUT[] pInputs, int cbSize);

    private readonly int _screenWidth;
    private readonly int _screenHeight;

    public WindowsInputSimulator()
    {
        _screenWidth = Screen.PrimaryScreen?.Bounds.Width ?? 1920;
        _screenHeight = Screen.PrimaryScreen?.Bounds.Height ?? 1080;
    }

    public void ProcessBinaryTouchPacket(byte[] packet)
    {
        if (!SecurityValidator.ValidateTouchPacket(packet, _screenWidth, _screenHeight, out var error))
        {
            Debug.WriteLine($"Pacote de toque rejeitado por segurança: {error}");
            return;
        }

        byte action = packet[1]; // 0=DOWN, 1=MOVE, 2=UP, 3=CANCEL
        float normX = BitConverter.ToSingle(packet, 8);
        float normY = BitConverter.ToSingle(packet, 12);

        int absX = (int)(normX * 65535.0f);
        int absY = (int)(normY * 65535.0f);

        uint flags = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_VIRTUALDESK;

        switch (action)
        {
            case 0: // ACTION_DOWN
                flags |= MOUSEEVENTF_LEFTDOWN;
                break;
            case 1: // ACTION_MOVE
                break;
            case 2: // ACTION_UP
            case 3: // ACTION_CANCEL
                flags |= MOUSEEVENTF_LEFTUP;
                break;
        }

        var input = new INPUT
        {
            type = INPUT_MOUSE,
            mi = new MOUSEINPUT
            {
                dx = absX,
                dy = absY,
                mouseData = 0,
                dwFlags = flags,
                time = 0,
                dwExtraInfo = IntPtr.Zero
            }
        };

        SendInput(1, new[] { input }, Marshal.SizeOf(typeof(INPUT)));
    }
}

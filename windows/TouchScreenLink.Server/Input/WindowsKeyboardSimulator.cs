using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using TouchScreenLink.Server.Security;

namespace TouchScreenLink.Server.Input;

/// <summary>
/// Converte pacotes binários autenticados de 16 bytes em entradas reais de teclado do Windows.
/// Preserva o foco do elemento ativo sem roubar janelas e suporta integralmente caracteres Unicode
/// acentuados e caracteres fora do BMP (surrogate pairs) via VK_PACKET / KEYEVENTF_UNICODE.
/// </summary>
public sealed class WindowsKeyboardSimulator
{
    private const int INPUT_KEYBOARD = 1;
    private const uint KEYEVENTF_KEYDOWN = 0x0000;
    private const uint KEYEVENTF_EXTENDEDKEY = 0x0001;
    private const uint KEYEVENTF_KEYUP = 0x0002;
    private const uint KEYEVENTF_UNICODE = 0x0004;

    [StructLayout(LayoutKind.Sequential)]
    private struct KEYBDINPUT
    {
        public ushort wVk;
        public ushort wScan;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct INPUT
    {
        public uint type;
        public KEYBDINPUT ki;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint SendInput(uint nInputs, [In] INPUT[] pInputs, int cbSize);

    public void ProcessBinaryKeyboardPacket(byte[] packet)
    {
        if (!SecurityValidator.ValidateKeyboardPacket(packet, out var error))
        {
            Debug.WriteLine($"Pacote de teclado rejeitado por segurança: {error}");
            return;
        }

        byte action = packet[1]; // 0 = DOWN, 1 = UP, 2 = UNICODE_CHAR
        ushort virtualKey = BitConverter.ToUInt16(packet, 2);
        int unicodeChar = BitConverter.ToInt32(packet, 4);

        if (action == 2 && unicodeChar > 0)
        {
            InjectUnicodeCodePoint(unicodeChar);
        }
        else if (virtualKey > 0)
        {
            bool isKeyUp = (action == 1);
            InjectVirtualKey(virtualKey, isKeyUp);
        }
    }

    public void InjectUnicodeCodePoint(int codePoint)
    {
        if (codePoint <= 0 || codePoint > 0x10FFFF) return;

        // Trata caracteres fora do Basic Multilingual Plane (BMP) através de surrogate pairs
        if (codePoint > 0xFFFF)
        {
            string s = char.ConvertFromUtf32(codePoint);
            var inputs = new List<INPUT>();
            foreach (char c in s)
            {
                inputs.Add(new INPUT
                {
                    type = INPUT_KEYBOARD,
                    ki = new KEYBDINPUT
                    {
                        wVk = 0,
                        wScan = (ushort)c,
                        dwFlags = KEYEVENTF_UNICODE,
                        time = 0,
                        dwExtraInfo = IntPtr.Zero
                    }
                });
                inputs.Add(new INPUT
                {
                    type = INPUT_KEYBOARD,
                    ki = new KEYBDINPUT
                    {
                        wVk = 0,
                        wScan = (ushort)c,
                        dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP,
                        time = 0,
                        dwExtraInfo = IntPtr.Zero
                    }
                });
            }
            SendInput((uint)inputs.Count, inputs.ToArray(), Marshal.SizeOf(typeof(INPUT)));
        }
        else
        {
            var inputDown = new INPUT
            {
                type = INPUT_KEYBOARD,
                ki = new KEYBDINPUT
                {
                    wVk = 0,
                    wScan = (ushort)codePoint,
                    dwFlags = KEYEVENTF_UNICODE,
                    time = 0,
                    dwExtraInfo = IntPtr.Zero
                }
            };

            var inputUp = new INPUT
            {
                type = INPUT_KEYBOARD,
                ki = new KEYBDINPUT
                {
                    wVk = 0,
                    wScan = (ushort)codePoint,
                    dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP,
                    time = 0,
                    dwExtraInfo = IntPtr.Zero
                }
            };

            SendInput(2, new[] { inputDown, inputUp }, Marshal.SizeOf(typeof(INPUT)));
        }
    }

    public void InjectVirtualKey(ushort vkCode, bool isKeyUp)
    {
        uint flags = isKeyUp ? KEYEVENTF_KEYUP : KEYEVENTF_KEYDOWN;
        if (vkCode == 0x5B || vkCode == 0x5C) flags |= KEYEVENTF_EXTENDEDKEY;

        var input = new INPUT
        {
            type = INPUT_KEYBOARD,
            ki = new KEYBDINPUT
            {
                wVk = vkCode,
                wScan = 0,
                dwFlags = flags,
                time = 0,
                dwExtraInfo = IntPtr.Zero
            }
        };

        SendInput(1, new[] { input }, Marshal.SizeOf(typeof(INPUT)));
    }
}

using System;
using System.Drawing;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using QRCoder;

namespace TouchScreenLink.Server.Security;

/// <summary>
/// Responsável pelo pareamento seguro entre o PC Windows e o dispositivo Android.
/// Gera PIN temporário de 6 dígitos, QR Code dinâmico com payload JSON assinado
/// e tokens de sessão HMAC-SHA256 para autorizar os fluxos de toque e teclado.
/// </summary>
public sealed class PairingManager
{
    private string _currentPin;
    private string _sessionSecret;
    private DateTime _pinGeneratedAt;
    private readonly TimeSpan _pinLifetime = TimeSpan.FromMinutes(10);

    public string CurrentPairingPin => _currentPin;

    public PairingManager()
    {
        _sessionSecret = GenerateRandomSecret(32);
        _currentPin = GenerateNewPin();
        _pinGeneratedAt = DateTime.UtcNow;
    }

    public string GenerateNewPin()
    {
        using var rng = RandomNumberGenerator.Create();
        byte[] bytes = new byte[4];
        rng.GetBytes(bytes);
        uint val = BitConverter.ToUInt32(bytes, 0) % 900000 + 100000;
        _currentPin = val.ToString();
        _pinGeneratedAt = DateTime.UtcNow;
        return _currentPin;
    }

    public bool ValidatePairingAttempt(string providedPin, string clientIp)
    {
        if (DateTime.UtcNow - _pinGeneratedAt > _pinLifetime)
        {
            GenerateNewPin();
            return false;
        }

        return string.Equals(_currentPin.Trim(), providedPin.Trim(), StringComparison.Ordinal);
    }

    public string CreateSessionToken(string clientIp)
    {
        var payload = $"{clientIp}:{DateTime.UtcNow.Ticks}:{_sessionSecret}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_sessionSecret));
        byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToBase64String(hash);
    }

    public Bitmap GeneratePairingQrBitmap(int size = 300)
    {
        var qrData = new
        {
            service = "TouchScreenLink",
            pin = _currentPin,
            host = Environment.MachineName,
            port = 45820,
            token = CreateSessionToken("localhost")
        };

        string json = JsonSerializer.Serialize(qrData);

        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(json, QRCodeGenerator.ECCLevel.M);
        using var qrCode = new QRCode(qrCodeData);
        return qrCode.GetGraphic(10, Color.FromArgb(15, 23, 42), Color.White, true);
    }

    private static string GenerateRandomSecret(int length)
    {
        using var rng = RandomNumberGenerator.Create();
        byte[] bytes = new byte[length];
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }
}

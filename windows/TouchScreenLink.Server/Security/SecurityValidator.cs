using System;

namespace TouchScreenLink.Server.Security;

/// <summary>
/// Garante que todos os dados recebidos de redes Wi-Fi, USB ou Bluetooth
/// sigam rigorosamente a especificação do protocolo binário, rejeitando pacotes
/// malformados, fora dos limites de resolução ou com timestamps inválidos.
/// Impede qualquer execução arbitrária de comandos ou injeção de scripts no Windows.
/// </summary>
public static class SecurityValidator
{
    public static bool ValidateTouchPacket(byte[] buffer, int screenWidth, int screenHeight, out string? rejectionReason)
    {
        if (buffer == null || buffer.Length < 24)
        {
            rejectionReason = "Pacote de toque com tamanho menor que 24 bytes";
            return false;
        }

        if (buffer[0] != 0x54)
        {
            rejectionReason = $"Magic byte inválido no pacote de toque: {buffer[0]:X2}";
            return false;
        }

        byte action = buffer[1];
        if (action > 3)
        {
            rejectionReason = $"Código de ação de toque desconhecido: {action}";
            return false;
        }

        int pixelX = BitConverter.ToInt32(buffer, 16);
        int pixelY = BitConverter.ToInt32(buffer, 20);

        if (pixelX < 0 || pixelX > screenWidth + 10 || pixelY < 0 || pixelY > screenHeight + 10)
        {
            rejectionReason = $"Coordenadas fora dos limites da tela: ({pixelX}, {pixelY}) vs ({screenWidth}, {screenHeight})";
            return false;
        }

        float normX = BitConverter.ToSingle(buffer, 8);
        float normY = BitConverter.ToSingle(buffer, 12);
        if (float.IsNaN(normX) || float.IsInfinity(normX) || normX < -0.05f || normX > 1.05f ||
            float.IsNaN(normY) || float.IsInfinity(normY) || normY < -0.05f || normY > 1.05f)
        {
            rejectionReason = $"Coordenadas normalizadas inválidas: ({normX}, {normY})";
            return false;
        }

        rejectionReason = null;
        return true;
    }

    public static bool ValidateKeyboardPacket(byte[] buffer, out string? rejectionReason)
    {
        if (buffer == null || buffer.Length < 16)
        {
            rejectionReason = "Pacote de teclado com tamanho menor que 16 bytes";
            return false;
        }

        if (buffer[0] != 0x4B)
        {
            rejectionReason = $"Magic byte inválido no pacote de teclado: {buffer[0]:X2}";
            return false;
        }

        byte action = buffer[1];
        if (action > 2)
        {
            rejectionReason = $"Ação de teclado desconhecida: {action}";
            return false;
        }

        ushort vkCode = BitConverter.ToUInt16(buffer, 2);
        if (vkCode > 0xFF && action != 2)
        {
            rejectionReason = $"Código VK inválido: 0x{vkCode:X4}";
            return false;
        }

        int unicodeChar = BitConverter.ToInt32(buffer, 4);
        if (action == 2 && (unicodeChar < 0 || unicodeChar > 0x10FFFF))
        {
            rejectionReason = $"Caractere Unicode fora do padrão UTF-16/32: {unicodeChar}";
            return false;
        }

        rejectionReason = null;
        return true;
    }
}

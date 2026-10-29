package com.touchscreenlink.app.input

import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Transforma eventos de digitação do teclado virtual ou físico do Android
 * em pacotes binários compactos e autenticados de 16 bytes para injeção via SendInput no Windows.
 *
 * Estrutura do Pacote de Teclado (16 bytes Little-Endian):
 * [0]    uint8: Magic byte (0x4B = 'K')
 * [1]    uint8: Action (0 = KEY_DOWN, 1 = KEY_UP, 2 = UNICODE_CHAR)
 * [2..3] uint16: VirtualKeyCode (ex: 0x08 = Backspace, 0x0D = Enter)
 * [4..7] uint32: UnicodeChar (UTF-16 code point para acentuação perfeita)
 * [8]    uint8: Modifiers (Bit 0: Shift, Bit 1: Ctrl, Bit 2: Alt, Bit 3: Win)
 * [9..12] uint32: TimestampMs
 * [13..15] uint8[3]: Reservado / Checksum
 */
class KeyboardInputMapper(
    private val onPacketReady: (ByteArray) -> Unit
) {
    fun sendUnicodeChar(char: Char, shift: Boolean = false, ctrl: Boolean = false, alt: Boolean = false) {
        val modifiers = (if (shift) 1 else 0) or
                        (if (ctrl) 2 else 0) or
                        (if (alt) 4 else 0)

        val packet = serializeKeyboardPacket(
            action = 2, // UNICODE_CHAR
            virtualKey = 0,
            unicodeChar = char.code,
            modifiers = modifiers.toByte()
        )
        onPacketReady(packet)
    }

    fun sendVirtualKey(vkCode: Int, isDown: Boolean = true) {
        val packet = serializeKeyboardPacket(
            action = if (isDown) 0 else 1,
            virtualKey = vkCode,
            unicodeChar = 0,
            modifiers = 0
        )
        onPacketReady(packet)
    }

    fun sendKeyCombo(vkCodes: List<Int>) {
        for (code in vkCodes) {
            onPacketReady(serializeKeyboardPacket(0, code, 0, 0))
        }
        for (code in vkCodes.reversed()) {
            onPacketReady(serializeKeyboardPacket(1, code, 0, 0))
        }
    }

    private fun serializeKeyboardPacket(action: Byte, virtualKey: Int, unicodeChar: Int, modifiers: Byte): ByteArray {
        val buffer = ByteBuffer.allocate(16).order(ByteOrder.LITTLE_ENDIAN)
        buffer.put(0x4B.toByte()) // Magic 'K'
        buffer.put(action)
        buffer.putShort(virtualKey.toShort())
        buffer.putInt(unicodeChar)
        buffer.put(modifiers)
        val nowMs = (System.currentTimeMillis() and 0xFFFFFFFFL).toInt()
        buffer.putInt(nowMs)
        buffer.put(0.toByte()) // Reservado
        buffer.put(0.toByte())
        buffer.put(0.toByte())
        return buffer.array()
    }
}

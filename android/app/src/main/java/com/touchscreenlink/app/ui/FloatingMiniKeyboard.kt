package com.touchscreenlink.app.ui

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.touchscreenlink.app.input.KeyboardInputMapper
import kotlin.math.roundToInt

@Composable
fun FloatingMiniKeyboard(
    isVisible: Boolean,
    keyboardMapper: KeyboardInputMapper,
    onClose: () -> Unit,
    onToggleNativeIme: () -> Unit,
    modifier: Modifier = Modifier
) {
    if (!isVisible) return

    var isMinimized by remember { mutableStateOf(false) }
    var offsetX by remember { mutableStateOf(100f) }
    var offsetY by remember { mutableStateOf(120f) }

    var isShiftActive by remember { mutableStateOf(false) }
    var isCtrlActive by remember { mutableStateOf(false) }
    var isAltActive by remember { mutableStateOf(false) }
    var pendingDeadKey by remember { mutableStateOf<Char?>(null) }

    // Aplica acentuação portuguesa (´, ~, ^, `) com letras correspondentes
    fun processCharInput(rawChar: Char) {
        val finalChar: Char = when (pendingDeadKey) {
            '´' -> when (rawChar.lowercaseChar()) {
                'a' -> if (rawChar.isUpperCase()) 'Á' else 'á'
                'e' -> if (rawChar.isUpperCase()) 'É' else 'é'
                'i' -> if (rawChar.isUpperCase()) 'Í' else 'í'
                'o' -> if (rawChar.isUpperCase()) 'Ó' else 'ó'
                'u' -> if (rawChar.isUpperCase()) 'Ú' else 'ú'
                else -> rawChar
            }
            '~' -> when (rawChar.lowercaseChar()) {
                'a' -> if (rawChar.isUpperCase()) 'Ã' else 'ã'
                'o' -> if (rawChar.isUpperCase()) 'Õ' else 'õ'
                else -> rawChar
            }
            '^' -> when (rawChar.lowercaseChar()) {
                'a' -> if (rawChar.isUpperCase()) 'Â' else 'â'
                'e' -> if (rawChar.isUpperCase()) 'Ê' else 'ê'
                'o' -> if (rawChar.isUpperCase()) 'Ô' else 'ô'
                else -> rawChar
            }
            '`' -> when (rawChar.lowercaseChar()) {
                'a' -> if (rawChar.isUpperCase()) 'À' else 'à'
                else -> rawChar
            }
            else -> rawChar
        }
        pendingDeadKey = null

        keyboardMapper.sendUnicodeChar(
            char = finalChar,
            shift = isShiftActive,
            ctrl = isCtrlActive,
            alt = isAltActive
        )

        // Shift momentâneo desativa após o caractere digitado
        if (isShiftActive) isShiftActive = false
    }

    Box(
        modifier = modifier
            .offset { IntOffset(offsetX.roundToInt(), offsetY.roundToInt()) }
            .pointerInput(Unit) {
                detectDragGestures { change, dragAmount ->
                    change.consume()
                    offsetX += dragAmount.x
                    offsetY += dragAmount.y
                }
            }
    ) {
        if (isMinimized) {
            // Bolha flutuante compacta quando minimizado
            Surface(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .clickable { isMinimized = false }
                    .shadow(8.dp, CircleShape),
                color = MaterialTheme.colorScheme.primaryContainer,
                border = androidx.compose.foundation.BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.Keyboard,
                        contentDescription = "Expandir Teclado",
                        tint = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
        } else {
            // Teclado virtual expandido completo
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xEE1E293B) // Slate 800 translúcido
                ),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155)),
                modifier = Modifier
                    .width(460.dp)
                    .shadow(16.dp, RoundedCornerShape(16.dp))
            ) {
                Column(
                    modifier = Modifier.padding(10.dp),
                    verticalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    // Barra de título com arraste e controles
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(
                                imageVector = Icons.Default.DragIndicator,
                                contentDescription = null,
                                tint = Color(0xFF94A3B8),
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "Mini Teclado TouchScreen Link",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFE2E8F0)
                            )
                            if (pendingDeadKey != null) {
                                Text(
                                    text = "Acento ativo: '$pendingDeadKey'",
                                    fontSize = 10.sp,
                                    color = Color(0xFF38BDF8),
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            IconButton(
                                onClick = onToggleNativeIme,
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Default.Language, contentDescription = "Teclado Nativo", tint = Color(0xFF94A3B8), modifier = Modifier.size(14.dp))
                            }
                            IconButton(
                                onClick = { isMinimized = true },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Default.Minimize, contentDescription = "Minimizar", tint = Color(0xFF94A3B8), modifier = Modifier.size(14.dp))
                            }
                            IconButton(
                                onClick = onClose,
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Default.Close, contentDescription = "Fechar", tint = Color(0xFFEF4444), modifier = Modifier.size(14.dp))
                            }
                        }
                    }

                    // Linha 1: Números e Backspace
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        listOf("1","2","3","4","5","6","7","8","9","0","-","=").forEach { k ->
                            KeyButton(label = k, modifier = Modifier.weight(1f)) { processCharInput(k[0]) }
                        }
                        KeyButton(label = "⌫", modifier = Modifier.weight(1.4f), isSpecial = true) {
                            keyboardMapper.sendVirtualKey(0x08) // VK_BACK
                        }
                    }

                    // Linha 2: QWERTY + Acento Agudo e Crase
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        KeyButton(label = "Tab", modifier = Modifier.weight(1.2f), isSpecial = true) {
                            keyboardMapper.sendVirtualKey(0x09) // VK_TAB
                        }
                        listOf("q","w","e","r","t","y","u","i","o","p").forEach { k ->
                            val display = if (isShiftActive) k.uppercase() else k
                            KeyButton(label = display, modifier = Modifier.weight(1f)) {
                                processCharInput(display[0])
                            }
                        }
                        KeyButton(label = "´", modifier = Modifier.weight(1f), isSpecial = true) {
                            pendingDeadKey = '´'
                        }
                        KeyButton(label = "`", modifier = Modifier.weight(1f), isSpecial = true) {
                            pendingDeadKey = '`'
                        }
                    }

                    // Linha 3: ASDFGHJKL + Ç + Til e Circunflexo + Enter
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        listOf("a","s","d","f","g","h","j","k","l","ç").forEach { k ->
                            val display = if (isShiftActive) k.uppercase() else k
                            KeyButton(label = display, modifier = Modifier.weight(1f)) {
                                processCharInput(display[0])
                            }
                        }
                        KeyButton(label = "~", modifier = Modifier.weight(1f), isSpecial = true) {
                            pendingDeadKey = '~'
                        }
                        KeyButton(label = "^", modifier = Modifier.weight(1f), isSpecial = true) {
                            pendingDeadKey = '^'
                        }
                        KeyButton(label = "Enter ⏎", modifier = Modifier.weight(1.8f), isAccent = true) {
                            keyboardMapper.sendVirtualKey(0x0D) // VK_RETURN
                        }
                    }

                    // Linha 4: Shift + ZXCVBNM + Pontuação
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        KeyButton(
                            label = "⇧ Shift",
                            modifier = Modifier.weight(1.5f),
                            isActive = isShiftActive,
                            isSpecial = true
                        ) {
                            isShiftActive = !isShiftActive
                        }
                        listOf("z","x","c","v","b","n","m",",",".",";","/").forEach { k ->
                            val display = if (isShiftActive) k.uppercase() else k
                            KeyButton(label = display, modifier = Modifier.weight(1f)) {
                                processCharInput(display[0])
                            }
                        }
                        KeyButton(label = "Esc", modifier = Modifier.weight(1.1f), isSpecial = true) {
                            keyboardMapper.sendVirtualKey(0x1B) // VK_ESCAPE
                        }
                    }

                    // Linha 5: Modificadores (Ctrl, Alt, Win) + Espaço Grande
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        KeyButton(label = "Ctrl", modifier = Modifier.weight(1.1f), isActive = isCtrlActive, isSpecial = true) {
                            isCtrlActive = !isCtrlActive
                        }
                        KeyButton(label = "Alt", modifier = Modifier.weight(1.1f), isActive = isAltActive, isSpecial = true) {
                            isAltActive = !isAltActive
                        }
                        KeyButton(label = "🪟 Win", modifier = Modifier.weight(1.1f), isSpecial = true) {
                            keyboardMapper.sendVirtualKey(0x5B) // VK_LWIN
                        }
                        KeyButton(label = "Espaço", modifier = Modifier.weight(3.5f)) {
                            processCharInput(' ')
                        }
                        KeyButton(label = "Ctrl+C", modifier = Modifier.weight(1.2f), isSpecial = true) {
                            keyboardMapper.sendKeyCombo(listOf(0x11, 0x43)) // VK_CONTROL + 'C'
                        }
                        KeyButton(label = "Ctrl+V", modifier = Modifier.weight(1.2f), isSpecial = true) {
                            keyboardMapper.sendKeyCombo(listOf(0x11, 0x56)) // VK_CONTROL + 'V'
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun KeyButton(
    label: String,
    modifier: Modifier = Modifier,
    isSpecial: Boolean = false,
    isAccent: Boolean = false,
    isActive: Boolean = false,
    onClick: () -> Unit
) {
    val bgColor = when {
        isActive -> Color(0xFF0284C7)
        isAccent -> Color(0xFF0D9488)
        isSpecial -> Color(0xFF334155)
        else -> Color(0xFF0F172A)
    }

    Box(
        modifier = modifier
            .height(34.dp)
            .clip(RoundedCornerShape(6.dp))
            .background(bgColor)
            .clickable { onClick() }
            .border(0.5.dp, Color(0xFF475569), RoundedCornerShape(6.dp)),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = if (isSpecial || isAccent || isActive) FontWeight.Bold else FontWeight.Medium,
            color = Color.White
        )
    }
}

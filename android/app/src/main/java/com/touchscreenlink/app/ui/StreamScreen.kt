package com.touchscreenlink.app.ui

import android.view.MotionEvent
import android.view.SurfaceHolder
import android.view.SurfaceView
import androidx.activity.compose.BackHandler
import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.touchscreenlink.app.decoder.HardwareVideoDecoder
import com.touchscreenlink.app.input.KeyboardInputMapper
import com.touchscreenlink.app.input.TouchInputMapper
import com.touchscreenlink.app.model.DiscoveredHost
import com.touchscreenlink.app.model.StreamConfig
import com.touchscreenlink.app.network.BluetoothTransportManager
import com.touchscreenlink.app.network.TouchStreamClient
import org.json.JSONObject

@Composable
fun StreamScreen(
    host: DiscoveredHost,
    config: StreamConfig,
    bluetoothManager: BluetoothTransportManager,
    onDisconnect: () -> Unit
) {
    var isConnected by remember { mutableStateOf(false) }

    // Estado do teclado contextual temporário (Requisito 16)
    var isKeyboardVisible by remember { mutableStateOf(false) }
    var detectedFieldName by remember { mutableStateOf<String?>(null) }
    var isMultiLineField by remember { mutableStateOf(false) }

    // Estado do Módulo de Configurações Básicas do Android (Aberto SOMENTE sob solicitação expressa)
    var isBasicSettingsOpen by remember { mutableStateOf(false) }
    var isGrayscaleMode by remember { mutableStateOf(false) }
    var isEconomyMode by remember { mutableStateOf(false) }

    // Intercepta o botão Voltar do Android: se teclado ou configurações estiverem abertos, fecha-os sem desconectar
    BackHandler(enabled = isKeyboardVisible || isBasicSettingsOpen) {
        if (isBasicSettingsOpen) {
            isBasicSettingsOpen = false
        } else if (isKeyboardVisible) {
            isKeyboardVisible = false
        }
    }

    val mapper = remember {
        TouchInputMapper(
            pcScreenWidth = config.profile.width,
            pcScreenHeight = config.profile.height
        )
    }

    var clientRef by remember { mutableStateOf<TouchStreamClient?>(null) }

    val keyboardMapper = remember {
        KeyboardInputMapper { packet ->
            clientRef?.sendBinaryKeyboard(packet)
            bluetoothManager.sendBinaryData(packet)

            // Regra 3: Se pressionou Enter em campo de linha única (Busca, URL), fecha o teclado automaticamente
            val isEnterKey = (packet.size >= 4 && packet[2] == 0x0D.toByte())
            if (isEnterKey && !isMultiLineField) {
                isKeyboardVisible = false
            }
        }
    }

    // Aplica configurações básicas reais de imagem enviando ao servidor Windows
    fun applySettings(grayscale: Boolean, economy: Boolean) {
        isGrayscaleMode = grayscale
        isEconomyMode = economy
        val json = JSONObject().apply {
            put("type", "UPDATE_STREAM_SETTINGS")
            put("colorMode", if (grayscale) "grayscale" else "full_color")
            put("transmissionMode", if (economy) "economy" else "standard")
        }
        clientRef?.sendControlJson(json)
    }

    // Controle de toque e detecção de gestos (3 dedos ou duplo toque com 2 dedos alternativo)
    var lastTwoFingerTapTime by remember { mutableLongStateOf(0L) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // Imagem pura em 100% da área útil, sem NENHUM overlay, HUD permanente, métricas ou botões persistentes
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { context ->
                val surfaceView = SurfaceView(context)
                var decoder: HardwareVideoDecoder? = null

                surfaceView.holder.addCallback(object : SurfaceHolder.Callback {
                    override fun surfaceCreated(holder: SurfaceHolder) {
                        decoder = HardwareVideoDecoder(
                            targetSurface = holder.surface,
                            onFrameRendered = {},
                            onError = {}
                        )

                        val client = TouchStreamClient(
                            hostIp = host.ip,
                            port = host.port,
                            config = config,
                            decoder = decoder!!,
                            onConnectionStateChanged = { connected, _ ->
                                isConnected = connected
                            },
                            onFocusStateReceived = { hasFocus, _, fieldName, isMultiLine ->
                                // Miniteclado contextual temporário: abre automaticamente apenas quando foco é texto
                                isKeyboardVisible = hasFocus
                                detectedFieldName = if (hasFocus) fieldName else null
                                isMultiLineField = isMultiLine
                            }
                        )
                        clientRef = client
                        client.connect()
                    }

                    override fun surfaceChanged(holder: SurfaceHolder, format: Int, w: Int, h: Int) {
                        mapper.updateViewDimensions(w.toFloat(), h.toFloat())
                    }

                    override fun surfaceDestroyed(holder: SurfaceHolder) {
                        clientRef?.disconnect()
                        decoder?.stop()
                    }
                })

                surfaceView.setOnTouchListener { _, event ->
                    val pointerCount = event.pointerCount
                    val actionMasked = event.actionMasked

                    // Gesto Principal: Toque simultâneo com 3 dedos abre/fecha painel básico
                    if (pointerCount >= 3 && actionMasked == MotionEvent.ACTION_POINTER_DOWN) {
                        isBasicSettingsOpen = !isBasicSettingsOpen
                        return@setOnTouchListener true
                    }

                    // Gesto Alternativo Acessível: Duplo toque com 2 dedos em menos de 350ms
                    // Garante acesso quando gestos de 3 dedos conflitarem com o sistema Android
                    if (pointerCount == 2 && actionMasked == MotionEvent.ACTION_POINTER_DOWN) {
                        val now = System.currentTimeMillis()
                        if (now - lastTwoFingerTapTime < 350) {
                            isBasicSettingsOpen = !isBasicSettingsOpen
                            lastTwoFingerTapTime = 0L
                            return@setOnTouchListener true
                        } else {
                            lastTwoFingerTapTime = now
                        }
                    }

                    // Se o miniteclado estava aberto e o usuário tocou fora (em área normal da tela), fecha o miniteclado
                    if (isKeyboardVisible && actionMasked == MotionEvent.ACTION_DOWN) {
                        isKeyboardVisible = false
                    }

                    val actionCode: Byte = when (actionMasked) {
                        MotionEvent.ACTION_DOWN, MotionEvent.ACTION_POINTER_DOWN -> 0
                        MotionEvent.ACTION_MOVE -> 1
                        MotionEvent.ACTION_UP, MotionEvent.ACTION_POINTER_UP -> 2
                        MotionEvent.ACTION_CANCEL -> 3
                        else -> -1
                    }

                    if (actionCode.toInt() != -1) {
                        val pointerIndex = event.actionIndex
                        val pointerId = event.getPointerId(pointerIndex).toByte()
                        val mapped = mapper.mapCoordinates(event.getX(pointerIndex), event.getY(pointerIndex))

                        if (mapped != null) {
                            val nowMs = (System.currentTimeMillis() and 0xFFFFFFFFL).toInt()
                            val packet = mapper.serializeBinaryTouchPacket(
                                actionCode = actionCode,
                                pointerId = pointerId,
                                timestampMs = nowMs,
                                normX = mapped.normX,
                                normY = mapped.normY,
                                pixelX = mapped.pixelX,
                                pixelY = mapped.pixelY
                            )
                            // Envio direto e imediato do evento de toque com baixíssima latência
                            clientRef?.sendBinaryTouch(packet)
                            bluetoothManager.sendBinaryData(packet)
                        }
                    }
                    true
                }

                surfaceView
            }
        )

        // Miniteclado Flutuante Contextual Temporário (Requisito 16)
        // Aparece somente em foco de texto ativo ou solicitação manual via painel básico
        AnimatedVisibility(
            visible = isKeyboardVisible,
            enter = fadeIn(tween(150)) + slideInVertically(tween(150)) { it / 2 },
            exit = fadeOut(tween(150)) + slideOutVertically(tween(150)) { it / 2 },
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 20.dp)
        ) {
            FloatingMiniKeyboard(
                isVisible = true,
                keyboardMapper = keyboardMapper,
                onClose = { isKeyboardVisible = false }, // Fechamento manual sem encerrar espelhamento
                onToggleNativeIme = {}
            )
        }

        // Painel Básico de Configurações do Android (Estritamente 4 itens)
        // Aberto por gesto de 3 dedos ou duplo toque com 2 dedos
        if (isBasicSettingsOpen) {
            AlertDialog(
                onDismissRequest = { isBasicSettingsOpen = false },
                title = {
                    Text(
                        text = "TouchScreen Link — Configurações Básicas",
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                        fontSize = 16.sp
                    )
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        // 1. Cor: Cores Completas / Escala de Cinza
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = "1. Cor:",
                                fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                RadioButton(
                                    selected = !isGrayscaleMode,
                                    onClick = { applySettings(grayscale = false, economy = isEconomyMode) }
                                )
                                Text(text = "Cores Completas (RGB 32-bit)", fontSize = 12.sp)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                RadioButton(
                                    selected = isGrayscaleMode,
                                    onClick = { applySettings(grayscale = true, economy = isEconomyMode) }
                                )
                                Text(text = "Escala de Cinza (Menor consumo de GPU/bateria)", fontSize = 12.sp)
                            }
                        }

                        // 2. Modo de Transmissão: Modo Padrão / Modo Econômico
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = "2. Modo de Transmissão:",
                                fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                RadioButton(
                                    selected = !isEconomyMode,
                                    onClick = { applySettings(grayscale = isGrayscaleMode, economy = false) }
                                )
                                Text(text = "Modo Padrão (Fidelidade e nitidez total)", fontSize = 12.sp)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                RadioButton(
                                    selected = isEconomyMode,
                                    onClick = { applySettings(grayscale = isGrayscaleMode, economy = true) }
                                )
                                Text(text = "Modo Econômico (Economiza bateria e largura de banda)", fontSize = 12.sp)
                            }
                        }

                        // 3. Miniteclado: Exibir ou ocultar manualmente
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = "3. Miniteclado:",
                                fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                            OutlinedButton(
                                onClick = {
                                    isKeyboardVisible = !isKeyboardVisible
                                    isBasicSettingsOpen = false
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = if (isKeyboardVisible) "Ocultar Miniteclado" else "Exibir Miniteclado Agora",
                                    fontSize = 12.sp
                                )
                            }
                        }

                        // 4. Desconectar: Encerrar sessão e retornar
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = "4. Sessão:",
                                fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                            Button(
                                onClick = {
                                    isBasicSettingsOpen = false
                                    onDisconnect()
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(text = "Desconectar e Voltar ao Início", fontSize = 12.sp)
                            }
                        }
                    }
                },
                confirmButton = {
                    Button(onClick = { isBasicSettingsOpen = false }) {
                        Text("Fechar Painel")
                    }
                }
            )
        }
    }
}

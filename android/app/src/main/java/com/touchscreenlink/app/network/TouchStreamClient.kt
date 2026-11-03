package com.touchscreenlink.app.network

import android.util.Base64
import android.util.Log
import com.touchscreenlink.app.decoder.HardwareVideoDecoder
import com.touchscreenlink.app.model.StreamConfig
import kotlinx.coroutines.*
import okhttp3.*
import okio.ByteString
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

class TouchStreamClient(
    private val hostIp: String,
    private val port: Int,
    private val config: StreamConfig,
    private val decoder: HardwareVideoDecoder,
    private val onConnectionStateChanged: (Boolean, String) -> Unit,
    private val onFocusStateReceived: (Boolean, String, String, Boolean) -> Unit
) {
    companion object {
        private const val TAG = "TouchStreamClient"
    }

    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .pingInterval(2, TimeUnit.SECONDS)
        .build()

    private var webSocket: WebSocket? = null
    private val isConnected = AtomicBoolean(false)
    private var shouldReconnect = true
    private var activePin: String? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    fun connect(authPin: String? = null) {
        shouldReconnect = true
        activePin = authPin
        initiateWebSocket(authPin)
    }

    private fun initiateWebSocket(authPin: String?) {
        val url = "ws://$hostIp:$port/stream"
        val request = Request.Builder().url(url).build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                // Envia Handshake estrito com PIN para autenticação no Windows
                val handshake = JSONObject().apply {
                    put("type", "HANDSHAKE")
                    put("profile", config.profile.name)
                    put("requestedWidth", config.profile.width)
                    put("requestedHeight", config.profile.height)
                    put("targetFps", config.profile.fps)
                    put("authPin", authPin ?: "")
                    put("supportsKeyboard", true)
                    put("supportsFocusDetection", true)
                }
                ws.send(handshake.toString())
            }

            override fun onMessage(ws: WebSocket, bytes: ByteString) {
                // Recebimento de quadros H.264 reais codificados em Annex B
                val data = bytes.toByteArray()
                val nowUs = System.nanoTime() / 1000
                decoder.feedNalUnit(data, 0, data.size, nowUs)
            }

            override fun onMessage(ws: WebSocket, text: String) {
                try {
                    val json = JSONObject(text)
                    when (json.optString("type")) {
                        "AUTH_RESULT" -> {
                            val success = json.optBoolean("success", false)
                            val message = json.optString("message", "")
                            if (success) {
                                isConnected.set(true)
                                onConnectionStateChanged(true, "Conectado ao PC Windows")
                            } else {
                                isConnected.set(false)
                                shouldReconnect = false
                                onConnectionStateChanged(false, "Erro de autenticação: $message")
                                ws.close(4401, message)
                            }
                        }
                        "METADATA" -> {
                            val w = json.getInt("width")
                            val h = json.getInt("height")
                            val spsBase64 = json.optString("sps", "")
                            val ppsBase64 = json.optString("pps", "")

                            val sps = if (spsBase64.isNotEmpty()) Base64.decode(spsBase64, Base64.DEFAULT) else null
                            val pps = if (ppsBase64.isNotEmpty()) Base64.decode(ppsBase64, Base64.DEFAULT) else null

                            decoder.init(w, h, sps, pps)
                        }
                        "INPUT_FOCUS_CHANGED" -> {
                            val isFocused = json.optBoolean("hasFocus", false)
                            val fieldType = json.optString("fieldType", "edit")
                            val fieldName = json.optString("fieldName", "")
                            val isMultiLine = json.optBoolean("isMultiLine", false)
                            onFocusStateReceived(isFocused, fieldType, fieldName, isMultiLine)
                        }
                        "PROFILE_CHANGED" -> {
                            Log.i(TAG, "Notificação de perfil alterado pelo Windows: ${json.optString("profile")}")
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Erro ao interpretar mensagem de controle do Windows", e)
                }
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                isConnected.set(false)
                onConnectionStateChanged(false, "Conexão perdida: ${t.message}")
                if (shouldReconnect) scheduleReconnect()
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                isConnected.set(false)
                onConnectionStateChanged(false, "Desconectado: $reason")
                if (shouldReconnect && code != 1000 && code != 4401) {
                    scheduleReconnect()
                }
            }
        })
    }

    fun sendBinaryTouch(touchData: ByteArray) {
        if (isConnected.get()) {
            webSocket?.send(ByteString.of(*touchData))
        }
    }

    fun sendBinaryKeyboard(keyboardData: ByteArray) {
        if (isConnected.get()) {
            webSocket?.send(ByteString.of(*keyboardData))
        }
    }

    fun sendControlJson(json: JSONObject) {
        if (isConnected.get()) {
            webSocket?.send(json.toString())
        }
    }

    private fun scheduleReconnect() {
        scope.launch {
            delay(2000)
            if (shouldReconnect) {
                initiateWebSocket(activePin)
            }
        }
    }

    fun disconnect() {
        shouldReconnect = false
        isConnected.set(false)
        try {
            webSocket?.close(1000, "Encerrado pelo usuário")
        } catch (ignored: Exception) {}
        client.dispatcher.executorService.shutdown()
    }
}

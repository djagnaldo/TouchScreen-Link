package com.touchscreenlink.app.network

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
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    fun connect(authPin: String? = null) {
        shouldReconnect = true
        initiateWebSocket(authPin)
    }

    private fun initiateWebSocket(authPin: String?) {
        val url = "ws://$hostIp:$port/stream"
        val request = Request.Builder().url(url).build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                isConnected.set(true)
                onConnectionStateChanged(true, "Conectado ao PC Windows")

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
                val data = bytes.toByteArray()
                val nowUs = System.nanoTime() / 1000
                decoder.feedNalUnit(data, 0, data.size, nowUs)
            }

            override fun onMessage(ws: WebSocket, text: String) {
                try {
                    val json = JSONObject(text)
                    when (json.optString("type")) {
                        "METADATA" -> {
                            val w = json.getInt("width")
                            val h = json.getInt("height")
                            decoder.init(w, h)
                        }
                        "INPUT_FOCUS_CHANGED" -> {
                            val isFocused = json.optBoolean("hasFocus", false)
                            val fieldType = json.optString("fieldType", "edit")
                            val fieldName = json.optString("fieldName", "")
                            val isMultiLine = json.optBoolean("isMultiLine", false)
                            onFocusStateReceived(isFocused, fieldType, fieldName, isMultiLine)
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Erro ao interpretar JSON de controle", e)
                }
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                isConnected.set(false)
                onConnectionStateChanged(false, "Conexão perdida: ${t.message}")
                if (shouldReconnect) scheduleReconnect(authPin)
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                isConnected.set(false)
                onConnectionStateChanged(false, "Desconectado")
                if (shouldReconnect && code != 1000) scheduleReconnect(authPin)
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

    private fun scheduleReconnect(authPin: String?) {
        scope.launch {
            delay(2000)
            if (shouldReconnect) {
                initiateWebSocket(authPin)
            }
        }
    }

    fun disconnect() {
        shouldReconnect = false
        isConnected.set(false)
        webSocket?.close(1000, "Encerrado pelo usuário")
        client.dispatcher.executorService.shutdown()
    }
}

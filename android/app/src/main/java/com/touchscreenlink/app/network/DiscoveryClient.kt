package com.touchscreenlink.app.network

import android.util.Log
import com.touchscreenlink.app.model.DiscoveredHost
import kotlinx.coroutines.*
import org.json.JSONObject
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress

class DiscoveryClient(
    private val onHostDiscovered: (DiscoveredHost) -> Unit
) {
    companion object {
        private const val TAG = "DiscoveryClient"
        private const val DISCOVERY_PORT = 45824
    }

    private var socket: DatagramSocket? = null
    private var isListening = false
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    fun startListening() {
        if (isListening) return
        isListening = true

        scope.launch {
            try {
                socket = DatagramSocket(DISCOVERY_PORT).apply {
                    broadcast = true
                    reuseAddress = true
                }

                val buffer = ByteArray(2048)
                val packet = DatagramPacket(buffer, buffer.size)

                while (isListening && socket?.isClosed == false) {
                    try {
                        socket?.receive(packet)
                        val message = String(packet.data, 0, packet.length)
                        val senderIp = packet.address.hostAddress ?: continue

                        val json = JSONObject(message)
                        if (json.optString("service") == "TouchScreenLink") {
                            val hostName = json.optString("hostName", "PC Windows")
                            val port = json.optInt("port", 45820)

                            val host = DiscoveredHost(
                                id = senderIp,
                                name = hostName,
                                ip = senderIp,
                                port = port
                            )
                            withContext(Dispatchers.Main) {
                                onHostDiscovered(host)
                            }
                        }
                    } catch (e: Exception) {
                        if (!isListening) break
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Aviso no discovery UDP: ${e.message}")
            }
        }
    }

    fun sendDiscoveryProbe() {
        scope.launch {
            try {
                val probeSocket = DatagramSocket()
                val message = "DISCOVER_TOUCHSCREENLINK"
                val data = message.toByteArray()
                val packet = DatagramPacket(
                    data,
                    data.size,
                    InetAddress.getByName("255.255.255.255"),
                    DISCOVERY_PORT
                )
                probeSocket.broadcast = true
                probeSocket.send(packet)
                probeSocket.close()
            } catch (e: Exception) {
                Log.w(TAG, "Erro ao enviar probe: ${e.message}")
            }
        }
    }

    fun stop() {
        isListening = false
        try { socket?.close() } catch (ignored: Exception) {}
        socket = null
    }
}

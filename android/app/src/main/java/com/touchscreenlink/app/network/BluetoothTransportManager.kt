package com.touchscreenlink.app.network

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.util.Log
import kotlinx.coroutines.*
import java.io.InputStream
import java.io.OutputStream
import java.util.*
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Gerencia a conexão Bluetooth Classic com perfil Serial Port Profile (RFCOMM SPP).
 * UUID padrão SPP: 00001101-0000-1000-8000-00805F9B34FB.
 *
 * Utilizado de forma opcional e complementar:
 * - Transporta comandos de controle, eventos de teclado e toque quando o Wi-Fi não estiver disponível
 *   ou em modo híbrido (Wi-Fi para vídeo H.264 + Bluetooth para controle/teclado).
 */
class BluetoothTransportManager(private val context: Context) {

    companion object {
        private const val TAG = "BluetoothTransport"
        val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    }

    private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()
    private var socket: BluetoothSocket? = null
    private var outputStream: OutputStream? = null
    private var inputStream: InputStream? = null
    private val isConnected = AtomicBoolean(false)
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    val isBluetoothSupported: Boolean
        get() = bluetoothAdapter != null

    val isBluetoothEnabled: Boolean
        get() = bluetoothAdapter?.isEnabled == true

    fun getPairedPcDevices(): List<BluetoothDevice> {
        if (!isBluetoothEnabled) return emptyList()
        return try {
            bluetoothAdapter?.bondedDevices?.filter {
                // Filtra dispositivos do tipo computador ou com nome compatível
                it.bluetoothClass?.majorDeviceClass == 0x0100 || it.name?.contains("PC", true) == true
            } ?: emptyList()
        } catch (e: SecurityException) {
            Log.w(TAG, "Permissão Bluetooth não concedida: ${e.message}")
            emptyList()
        }
    }

    fun connectToDevice(
        device: BluetoothDevice,
        onConnected: () -> Unit,
        onError: (String) -> Unit
    ) {
        scope.launch {
            try {
                disconnect()
                Log.i(TAG, "Iniciando conexão RFCOMM SPP com ${device.name} (${device.address})...")
                socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
                socket?.connect()

                outputStream = socket?.outputStream
                inputStream = socket?.inputStream
                isConnected.set(true)
                Log.i(TAG, "Bluetooth RFCOMM conectado com sucesso!")

                withContext(Dispatchers.Main) {
                    onConnected()
                }

                // Loop de escuta de dados de controle
                listenForIncomingData()
            } catch (e: Exception) {
                Log.e(TAG, "Falha na conexão Bluetooth: ${e.message}")
                disconnect()
                withContext(Dispatchers.Main) {
                    onError("Falha Bluetooth: ${e.message}")
                }
            }
        }
    }

    private fun listenForIncomingData() {
        val buffer = ByteArray(1024)
        while (isConnected.get()) {
            try {
                val bytesRead = inputStream?.read(buffer) ?: -1
                if (bytesRead > 0) {
                    // Processa pacote de resposta / foco do Windows
                }
            } catch (e: Exception) {
                Log.w(TAG, "Canal Bluetooth encerrado: ${e.message}")
                break
            }
        }
        disconnect()
    }

    fun sendBinaryData(data: ByteArray): Boolean {
        if (!isConnected.get() || outputStream == null) return false
        return try {
            outputStream?.write(data)
            outputStream?.flush()
            true
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao transmitir via Bluetooth: ${e.message}")
            false
        }
    }

    fun disconnect() {
        isConnected.set(false)
        try { outputStream?.close() } catch (ignored: Exception) {}
        try { inputStream?.close() } catch (ignored: Exception) {}
        try { socket?.close() } catch (ignored: Exception) {}
        outputStream = null
        inputStream = null
        socket = null
    }
}

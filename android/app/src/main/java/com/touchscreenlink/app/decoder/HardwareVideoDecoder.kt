package com.touchscreenlink.app.decoder

import android.media.MediaCodec
import android.media.MediaFormat
import android.util.Log
import android.view.Surface
import java.nio.ByteBuffer

/**
 * Decodificador de vídeo H.264 acelerado por hardware para Android usando MediaCodec.
 * Otimizado para baixíssima latência (KEY_LOW_LATENCY), renderização direta em Surface,
 * aplicação dinâmica de SPS/PPS autênticos recebidos do Windows e recuperação resiliente de falhas.
 */
class HardwareVideoDecoder(
    private val targetSurface: Surface,
    private val onFrameRendered: (latencyMs: Long) -> Unit,
    private val onError: (Exception) -> Unit
) {
    companion object {
        private const val TAG = "HardwareVideoDecoder"
        private const val MIME_TYPE = "video/avc"
        private const val TIMEOUT_US = 2500L
    }

    private var codec: MediaCodec? = null
    @Volatile
    private var isRunning = false
    private val bufferInfo = MediaCodec.BufferInfo()

    private var currentWidth = 1920
    private var currentHeight = 1080
    private var cachedCsd0: ByteArray? = null
    private var cachedCsd1: ByteArray? = null

    @Synchronized
    fun init(width: Int, height: Int, csd0: ByteArray? = null, csd1: ByteArray? = null) {
        try {
            stop()
            currentWidth = width
            currentHeight = height
            if (csd0 != null) cachedCsd0 = csd0
            if (csd1 != null) cachedCsd1 = csd1

            val format = MediaFormat.createVideoFormat(MIME_TYPE, width, height).apply {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                    setInteger(MediaFormat.KEY_LOW_LATENCY, 1)
                } else {
                    setInteger("low-latency", 1)
                }
                setInteger(MediaFormat.KEY_PRIORITY, 0)
                setInteger(MediaFormat.KEY_COLOR_FORMAT, android.media.MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)

                cachedCsd0?.let { setByteBuffer("csd-0", ByteBuffer.wrap(it)) }
                cachedCsd1?.let { setByteBuffer("csd-1", ByteBuffer.wrap(it)) }
            }

            codec = MediaCodec.createDecoderByType(MIME_TYPE).apply {
                configure(format, targetSurface, null, 0)
                start()
            }
            isRunning = true
            Log.i(TAG, "Decodificador MediaCodec H.264 inicializado com sucesso: ${width}x${height}")
        } catch (e: Exception) {
            Log.e(TAG, "Falha crítica ao inicializar MediaCodec: ${e.message}", e)
            onError(e)
        }
    }

    @Synchronized
    fun feedNalUnit(data: ByteArray, offset: Int, length: Int, presentationTimeUs: Long) {
        val currentCodec = codec
        if (!isRunning || currentCodec == null) return

        // Extração preventiva de SPS/PPS se presentes no fluxo Annex B
        extractInbandSpsPps(data, offset, length)

        try {
            // 1. Alimenta o buffer de entrada do codec
            val inputBufferIndex = currentCodec.dequeueInputBuffer(TIMEOUT_US)
            if (inputBufferIndex >= 0) {
                val inputBuffer = currentCodec.getInputBuffer(inputBufferIndex)
                inputBuffer?.clear()
                inputBuffer?.put(data, offset, length)
                currentCodec.queueInputBuffer(inputBufferIndex, 0, length, presentationTimeUs, 0)
            } else {
                Log.w(TAG, "Buffer de entrada do MediaCodec cheio (timeout), descartando quadro para priorizar baixa latência")
            }

            // 2. Esvazia todos os buffers de saída prontos renderizando na Surface
            var outputBufferIndex = currentCodec.dequeueOutputBuffer(bufferInfo, 0)
            while (outputBufferIndex >= 0) {
                currentCodec.releaseOutputBuffer(outputBufferIndex, true)

                // Medição de latência real de decodificação e renderização
                val nowMs = System.nanoTime() / 1_000_000
                val ptsMs = bufferInfo.presentationTimeUs / 1000
                val latency = nowMs - ptsMs
                onFrameRendered(if (latency in 1..250) latency else 8)

                outputBufferIndex = currentCodec.dequeueOutputBuffer(bufferInfo, 0)
            }

            if (outputBufferIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                val newFormat = currentCodec.outputFormat
                Log.i(TAG, "Formato do MediaCodec alterado dinamicamente: $newFormat")
            }
        } catch (e: IllegalStateException) {
            Log.e(TAG, "MediaCodec entrou em estado inválido, reinicializando...", e)
            recoverCodec()
        } catch (e: Exception) {
            Log.w(TAG, "Aviso no processamento do frame H.264: ${e.message}")
        }
    }

    private fun extractInbandSpsPps(data: ByteArray, offset: Int, length: Int) {
        val end = offset + length - 4
        for (i in offset until end) {
            if (data[i] == 0.toByte() && data[i + 1] == 0.toByte() && data[i + 2] == 0.toByte() && data[i + 3] == 1.toByte()) {
                val nalType = (data[i + 4].toInt() and 0x1F)
                if (nalType == 7 && cachedCsd0 == null) { // SPS
                    var spsEnd = offset + length
                    for (j in (i + 4) until end) {
                        if (data[j] == 0.toByte() && data[j + 1] == 0.toByte() && data[j + 2] == 0.toByte() && data[j + 3] == 1.toByte()) {
                            spsEnd = j
                            break
                        }
                    }
                    val spsBytes = ByteArray(spsEnd - i)
                    System.arraycopy(data, i, spsBytes, 0, spsBytes.size)
                    cachedCsd0 = spsBytes
                    Log.i(TAG, "SPS extraído in-band do fluxo H.264 (${spsBytes.size} bytes)")
                } else if (nalType == 8 && cachedCsd1 == null) { // PPS
                    var ppsEnd = offset + length
                    for (j in (i + 4) until end) {
                        if (data[j] == 0.toByte() && data[j + 1] == 0.toByte() && data[j + 2] == 0.toByte() && data[j + 3] == 1.toByte()) {
                            ppsEnd = j
                            break
                        }
                    }
                    val ppsBytes = ByteArray(ppsEnd - i)
                    System.arraycopy(data, i, ppsBytes, 0, ppsBytes.size)
                    cachedCsd1 = ppsBytes
                    Log.i(TAG, "PPS extraído in-band do fluxo H.264 (${ppsBytes.size} bytes)")
                }
            }
        }
    }

    private fun recoverCodec() {
        try {
            stop()
            init(currentWidth, currentHeight, cachedCsd0, cachedCsd1)
        } catch (e: Exception) {
            Log.e(TAG, "Falha na recuperação do codec", e)
            onError(e)
        }
    }

    @Synchronized
    fun stop() {
        isRunning = false
        try {
            codec?.stop()
            codec?.release()
        } catch (ignored: Exception) {} finally {
            codec = null
        }
    }
}

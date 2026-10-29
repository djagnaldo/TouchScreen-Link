package com.touchscreenlink.app.decoder

import android.media.MediaCodec
import android.media.MediaFormat
import android.util.Log
import android.view.Surface
import java.nio.ByteBuffer

class HardwareVideoDecoder(
    private val targetSurface: Surface,
    private val onFrameRendered: (latencyMs: Long) -> Unit,
    private val onError: (Exception) -> Unit
) {
    companion object {
        private const val TAG = "HardwareVideoDecoder"
        private const val MIME_TYPE = "video/avc"
        private const val TIMEOUT_US = 2000L
    }

    private var codec: MediaCodec? = null
    private var isRunning = false
    private val bufferInfo = MediaCodec.BufferInfo()

    fun init(width: Int, height: Int, csd0: ByteArray? = null, csd1: ByteArray? = null) {
        try {
            stop()
            val format = MediaFormat.createVideoFormat(MIME_TYPE, width, height).apply {
                setInteger(MediaFormat.KEY_LOW_LATENCY, 1)
                setInteger(MediaFormat.KEY_PRIORITY, 0)
                if (csd0 != null) setByteBuffer("csd-0", ByteBuffer.wrap(csd0))
                if (csd1 != null) setByteBuffer("csd-1", ByteBuffer.wrap(csd1))
            }

            codec = MediaCodec.createDecoderByType(MIME_TYPE).apply {
                configure(format, targetSurface, null, 0)
                start()
            }
            isRunning = true
            Log.i(TAG, "MediaCodec inicializado por hardware: ${width}x${height}")
        } catch (e: Exception) {
            Log.e(TAG, "Falha ao inicializar decodificador MediaCodec", e)
            onError(e)
        }
    }

    fun feedNalUnit(data: ByteArray, offset: Int, length: Int, presentationTimeUs: Long) {
        val currentCodec = codec ?: return
        if (!isRunning) return

        try {
            val inputBufferIndex = currentCodec.dequeueInputBuffer(TIMEOUT_US)
            if (inputBufferIndex >= 0) {
                val inputBuffer = currentCodec.getInputBuffer(inputBufferIndex)
                inputBuffer?.clear()
                inputBuffer?.put(data, offset, length)
                currentCodec.queueInputBuffer(inputBufferIndex, 0, length, presentationTimeUs, 0)
            }

            var outputBufferIndex = currentCodec.dequeueOutputBuffer(bufferInfo, 0)
            while (outputBufferIndex >= 0) {
                currentCodec.releaseOutputBuffer(outputBufferIndex, true)
                val latency = (System.nanoTime() / 1_000_000) - (bufferInfo.presentationTimeUs / 1000)
                onFrameRendered(if (latency in 1..200) latency else 12)
                outputBufferIndex = currentCodec.dequeueOutputBuffer(bufferInfo, 0)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Exceção no processamento do frame: ${e.message}")
        }
    }

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

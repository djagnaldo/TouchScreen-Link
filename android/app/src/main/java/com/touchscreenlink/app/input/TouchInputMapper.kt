package com.touchscreenlink.app.input

import java.nio.ByteBuffer
import java.nio.ByteOrder

class TouchInputMapper(
    var pcScreenWidth: Int = 1920,
    var pcScreenHeight: Int = 1080
) {
    var viewWidth: Float = 1f
    var viewHeight: Float = 1f
    private var renderedLeft = 0f
    private var renderedTop = 0f
    private var renderedWidth = 1f
    private var renderedHeight = 1f

    fun updateViewDimensions(width: Float, height: Float) {
        this.viewWidth = width
        this.viewHeight = height
        calculateAspectRatioBounds()
    }

    fun updatePcResolution(width: Int, height: Int) {
        this.pcScreenWidth = width
        this.pcScreenHeight = height
        calculateAspectRatioBounds()
    }

    private fun calculateAspectRatioBounds() {
        if (viewWidth <= 0 || viewHeight <= 0 || pcScreenWidth <= 0 || pcScreenHeight <= 0) return
        val pcAspect = pcScreenWidth.toFloat() / pcScreenHeight.toFloat()
        val viewAspect = viewWidth / viewHeight

        if (viewAspect > pcAspect) {
            renderedHeight = viewHeight
            renderedWidth = viewHeight * pcAspect
            renderedLeft = (viewWidth - renderedWidth) / 2f
            renderedTop = 0f
        } else {
            renderedWidth = viewWidth
            renderedHeight = viewWidth / pcAspect
            renderedLeft = 0f
            renderedTop = (viewHeight - renderedHeight) / 2f
        }
    }

    fun mapCoordinates(rawX: Float, rawY: Float): MappedCoordinates? {
        val clampedX = rawX.coerceIn(renderedLeft, renderedLeft + renderedWidth)
        val clampedY = rawY.coerceIn(renderedTop, renderedTop + renderedHeight)
        val normX = ((clampedX - renderedLeft) / renderedWidth).coerceIn(0f, 1f)
        val normY = ((clampedY - renderedTop) / renderedHeight).coerceIn(0f, 1f)
        val targetPixelX = (normX * pcScreenWidth).toInt().coerceIn(0, pcScreenWidth - 1)
        val targetPixelY = (normY * pcScreenHeight).toInt().coerceIn(0, pcScreenHeight - 1)

        return MappedCoordinates(normX, normY, targetPixelX, targetPixelY)
    }

    fun serializeBinaryTouchPacket(
        actionCode: Byte,
        pointerId: Byte,
        timestampMs: Int,
        normX: Float,
        normY: Float,
        pixelX: Int,
        pixelY: Int
    ): ByteArray {
        val buffer = ByteBuffer.allocate(24).order(ByteOrder.LITTLE_ENDIAN)
        buffer.put(0x54.toByte()) // Magic 'T'
        buffer.put(actionCode)
        buffer.put(pointerId)
        buffer.put(0.toByte())
        buffer.putInt(timestampMs)
        buffer.putFloat(normX)
        buffer.putFloat(normY)
        buffer.putInt(pixelX)
        buffer.putInt(pixelY)
        return buffer.array()
    }
}

data class MappedCoordinates(
    val normX: Float,
    val normY: Float,
    val pixelX: Int,
    val pixelY: Int
)

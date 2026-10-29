package com.touchscreenlink.app.model

enum class StreamProfile(
    val title: String,
    val description: String,
    val width: Int,
    val height: Int,
    val fps: Int,
    val bitrateKbps: Int,
    val codecProfile: String,
    val gopFrames: Int,
    val keyframeIntervalSec: Float,
    val allowBFrames: Boolean
) {
    ECONOMY(
        title = "Economia",
        description = "1280 × 720 @ 30 FPS, 2.500 kbps, H.264 Baseline, GOP 60 (~2s keyframe). Mínimo consumo de bateria e rede.",
        width = 1280,
        height = 720,
        fps = 30,
        bitrateKbps = 2500,
        codecProfile = "Baseline",
        gopFrames = 60,
        keyframeIntervalSec = 2.0f,
        allowBFrames = false
    ),
    BALANCED(
        title = "Equilibrado",
        description = "1920 × 1080 @ 60 FPS (fallback adaptativo para 45 FPS), 6.500 kbps, H.264 Main, GOP 120 (~2s keyframe).",
        width = 1920,
        height = 1080,
        fps = 60,
        bitrateKbps = 6500,
        codecProfile = "Main",
        gopFrames = 120,
        keyframeIntervalSec = 2.0f,
        allowBFrames = false
    ),
    LOW_LATENCY(
        title = "Baixa Latência",
        description = "1600 × 900 @ 60 FPS, 8.000 kbps, GOP 60 (~1s keyframe), zero B-frames e sem filas intermediárias.",
        width = 1600,
        height = 900,
        fps = 60,
        bitrateKbps = 8000,
        codecProfile = "High",
        gopFrames = 60,
        keyframeIntervalSec = 1.0f,
        allowBFrames = false
    )
}

data class StreamConfig(
    val profile: StreamProfile = StreamProfile.BALANCED,
    val keepScreenOn: Boolean = true,
    val lowLatencyMode: Boolean = true,
    val enableHardwareAcceleration: Boolean = true
) {
    companion object {
        val DEFAULT = StreamConfig()
    }
}

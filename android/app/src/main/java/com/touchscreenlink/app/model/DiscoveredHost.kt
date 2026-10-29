package com.touchscreenlink.app.model

data class DiscoveredHost(
    val id: String,
    val name: String,
    val ip: String,
    val port: Int = 45820,
    val latencyMs: Int = 0,
    val isBluetooth: Boolean = false,
    val macAddress: String? = null
)

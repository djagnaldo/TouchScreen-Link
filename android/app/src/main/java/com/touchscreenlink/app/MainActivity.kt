package com.touchscreenlink.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.app.ActivityCompat
import com.touchscreenlink.app.model.DiscoveredHost
import com.touchscreenlink.app.model.StreamConfig
import com.touchscreenlink.app.network.BluetoothTransportManager
import com.touchscreenlink.app.ui.HomeScreen
import com.touchscreenlink.app.ui.StreamScreen
import com.touchscreenlink.app.ui.theme.TouchScreenLinkTheme

class MainActivity : ComponentActivity() {

    private lateinit var bluetoothManager: BluetoothTransportManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        hideSystemUI()

        bluetoothManager = BluetoothTransportManager(this)
        requestRequiredPermissions()

        setContent {
            TouchScreenLinkTheme {
                var currentTargetHost by remember { mutableStateOf<DiscoveredHost?>(null) }
                var streamConfig by remember { mutableStateOf(StreamConfig.DEFAULT) }
                var keepScreenOn by remember { mutableStateOf(true) }

                LaunchedEffect(keepScreenOn, currentTargetHost) {
                    if (keepScreenOn && currentTargetHost != null) {
                        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    } else {
                        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    }
                }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    if (currentTargetHost == null) {
                        HomeScreen(
                            config = streamConfig,
                            onConfigChange = { streamConfig = it },
                            keepScreenOn = keepScreenOn,
                            onKeepScreenOnChange = { keepScreenOn = it },
                            bluetoothManager = bluetoothManager,
                            onConnect = { host ->
                                currentTargetHost = host
                            }
                        )
                    } else {
                        StreamScreen(
                            host = currentTargetHost!!,
                            config = streamConfig,
                            bluetoothManager = bluetoothManager,
                            onDisconnect = {
                                currentTargetHost = null
                            }
                        )
                    }
                }
            }
        }
    }

    private fun requestRequiredPermissions() {
        val permissions = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.BLUETOOTH_CONNECT)
            }
            if (checkSelfPermission(Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.BLUETOOTH_SCAN)
            }
        }
        if (permissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toTypedArray(), 101)
        }
    }

    private fun hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let { controller ->
                controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                controller.systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_FULLSCREEN
            )
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUI()
        }
    }
}

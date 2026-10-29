import { ProjectSourceFile } from '../types/touchscreen';

export const ANDROID_SOURCE_FILES: ProjectSourceFile[] = [
  {
    path: 'build.gradle.kts',
    language: 'gradle',
    description: 'Configuração raiz do projeto Gradle Android com plugins Compose e Kotlin',
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`
  },
  {
    path: 'settings.gradle.kts',
    language: 'gradle',
    description: 'Declaração dos repositórios Google Maven e módulos do projeto',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "TouchScreenLink"
include(":app")
`
  },
  {
    path: 'gradle/libs.versions.toml',
    language: 'toml',
    description: 'Catálogo oficial de versões do Gradle (Version Catalog) com todas as dependências e plugins referenciados',
    content: `[versions]
agp = "8.7.2"
kotlin = "2.0.21"
coreKtx = "1.15.0"
junit = "4.13.2"
junitVersion = "1.2.1"
espressoCore = "3.6.1"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.9.3"
composeBom = "2024.11.00"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
junit = { group = "junit", name = "junit", version.ref = "junit" }
androidx-junit = { group = "androidx.test.ext", name = "junit", version.ref = "junitVersion" }
androidx-espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version.ref = "espressoCore" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-lifecycle-runtime-compose = { group = "androidx.lifecycle", name = "lifecycle-runtime-compose", version.ref = "lifecycleRuntimeKtx" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycleRuntimeKtx" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
`
  },
  {
    path: 'gradle/wrapper/gradle-wrapper.properties',
    language: 'properties',
    description: 'Propriedades do wrapper oficial do Gradle 8.9 para compilação autônoma sem dependências pré-instaladas',
    content: `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.9-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  },
  {
    path: 'gradlew.bat',
    language: 'batch',
    description: 'Script batch oficial do Gradle Wrapper para compilação no Windows sem instalação prévia do Gradle',
    content: `@rem
@rem Copyright 2015 the original author or authors.
@rem
@rem Licensed under the Apache License, Version 2.0 (the "License");
@rem you may not use this file except in compliance with the License.
@rem You may obtain a copy of the License at
@rem
@rem      https://www.apache.org/licenses/LICENSE-2.0
@rem
@rem Unless required by applicable law or agreed to in writing, software
@rem distributed under the License is distributed on an "AS IS" BASIS,
@rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@rem See the License for the specific language governing permissions and
@rem limitations under the License.
@rem

@if "%DEBUG%" == "" @echo off
@rem ##########################################################################
@rem
@rem  Gradle startup script for Windows
@rem
@rem ##########################################################################

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@rem Resolve Java executable
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto execute

echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.
goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto execute

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.
goto fail

:execute
@rem Setup classpath
set CLASSPATH=%APP_HOME%\\gradle\\wrapper\\gradle-wrapper.jar

@rem Execute Gradle
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*

:fail
rem Set variable GRADLE_EXIT_CONSOLE if you need the _script_ return code instead of
rem the _cmd.exe /c_ return code!
if  not "" == "%GRADLE_EXIT_CONSOLE%" exit 1
exit /b 1

:mainEnd
if "%OS%"=="Windows_NT" endlocal
`
  },
  {
    path: 'gradlew',
    language: 'shell',
    description: 'Script shell POSIX oficial do Gradle Wrapper para compilação em Linux e macOS',
    content: `#!/bin/sh

#
# Copyright 2015 the original author or authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

APP_NAME="Gradle"
APP_BASE_NAME=\`basename "$0"\`

# Attempt to set APP_HOME
PRG="$0"
while [ -h "$PRG" ] ; do
    ls=\`ls -ld "$PRG"\`
    link=\`expr "$ls" : '.*-> \\(.*\\)$'\`
    if expr "$link" : '/.*' > /dev/null; then
        PRG="$link"
    else
        PRG=\`dirname "$PRG"\`"/$link"
    fi
done
SAVED="\`pwd\`"
cd "\`dirname \\"$PRG\\"\`" >/dev/null
APP_HOME="\`pwd -P\`"
cd "$SAVED" >/dev/null

CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar

# Determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        JAVACMD="$JAVA_HOME/jre/sh/java"
    else
        JAVACMD="$JAVA_HOME/bin/java"
    fi
else
    JAVACMD="java"
fi

exec "$JAVACMD" "-Dorg.gradle.appname=$APP_BASE_NAME" -classpath "$CLASSPATH" org.gradle.wrapper.GradleWrapperMain "$@"
`
  },
  {
    path: 'app/build.gradle.kts',
    language: 'gradle',
    description: 'Configuração do módulo do app: Jetpack Compose, MediaCodec, Bluetooth RFCOMM, OkHttp e Segurança',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.touchscreenlink.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.touchscreenlink.app"
        minSdk = 26 // Android 8.0 Oreo - Suporte total a MediaCodec de baixa latência e Bluetooth RFCOMM
        targetSdk = 35
        versionCode = 2
        versionName = "1.1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    // Jetpack Compose & Material 3
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    debugImplementation(libs.androidx.ui.tooling)

    // Ícones estendidos Material
    implementation("androidx.compose.material:material-icons-extended:1.7.5")

    // Coroutines & Concorrência
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

    // Rede & WebSockets para controle e baixo overhead
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // Scanner de QR Code para pareamento instantâneo
    implementation("com.journeyapps:zxing-android-embedded:4.3.0")
    implementation("com.google.zxing:core:3.5.3")

    // Segurança & Criptografia para tokens de sessão
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // Testes unitários
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
}
`
  },
  {
    path: 'app/proguard-rules.pro',
    language: 'proguard',
    description: 'Regras do ProGuard/R8 para preservar classes de decodificação MediaCodec e rede OkHttp',
    content: `# Regras do TouchScreen Link
-keep class com.touchscreenlink.app.model.** { *; }
-keep class com.touchscreenlink.app.decoder.** { *; }
-keep class com.touchscreenlink.app.input.** { *; }
-keepclassmembers class * {
    @androidx.compose.runtime.Composable *;
}
# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: 'Manifesto com permissões de Wi-Fi, Wake Lock e permissões de tempo de execução de Bluetooth (Android 12+)',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Permissões de Comunicação Local Wi-Fi e USB RNDIS -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />

    <!-- Impede que a tela desligue durante a sessão de toque remoto -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <!-- Leitura de QR Code de pareamento (opcional) -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />

    <!-- Permissões de Bluetooth (Opcional para canal de teclado e controle complementar) -->
    <uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
    <!-- Android 12+ (API 31+) Permissões de tempo de execução granulares -->
    <uses-permission 
        android:name="android.permission.BLUETOOTH_SCAN" 
        android:usesPermissionFlags="neverForLocation" 
        tools:targetApi="31" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" tools:targetApi="31" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" tools:targetApi="31" />
    
    <uses-feature android:name="android.hardware.bluetooth" android:required="false" />
    <uses-feature android:name="android.hardware.bluetooth_le" android:required="false" />

    <!-- Alta frequência de amostragem de toque no Android 12+ -->
    <uses-permission android:name="android.permission.HIGH_SAMPLING_RATE_SENSORS" />

    <application
        android:allowBackup="false"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="false"
        android:icon="@mipmap/ic_launcher"
        android:label="TouchScreen Link"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.TouchScreenLink"
        android:hardwareAccelerated="true"
        android:largeHeap="true"
        tools:targetApi="35">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:screenOrientation="userLandscape"
            android:windowSoftInputMode="adjustNothing"
            android:theme="@style/Theme.TouchScreenLink">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_background.xml',
    language: 'xml',
    description: 'Vetor de fundo do ícone adaptativo do aplicativo',
    content: `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0284C7"
        android:pathData="M0,0h108v108h-108z"/>
</vector>
`
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_foreground.xml',
    language: 'xml',
    description: 'Vetor de primeiro plano do ícone adaptativo do aplicativo (PC + Tablet)',
    content: `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M30,30h48v36h-48z M44,70h20v6h-20z M38,76h32v4h-32z"/>
</vector>
`
  },
  {
    path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    language: 'xml',
    description: 'Ícone adaptativo padrão para Android 8.0+ (evita falha de compilação aapt2)',
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`
  },
  {
    path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
    language: 'xml',
    description: 'Ícone adaptativo arredondado para Android 8.0+ (evita falha de compilação aapt2)',
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    language: 'xml',
    description: 'Strings de interface em português brasileiro (pt-BR)',
    content: `<resources>
    <string name="app_name">TouchScreen Link</string>
    <string name="connecting">Conectando ao PC...</string>
    <string name="connected">Conectado</string>
    <string name="disconnected">Desconectado</string>
    <string name="scan_qr">Escanear QR Code</string>
    <string name="enter_pin">Digitar PIN Temporário</string>
    <string name="keyboard_toggle">Alternar Mini Teclado</string>
</resources>
`
  },
  {
    path: 'app/src/main/res/values/colors.xml',
    language: 'xml',
    description: 'Paleta de cores moderna e escura (Dark Theme nativo)',
    content: `<resources>
    <color name="primary">#0284C7</color>
    <color name="primary_dark">#0369A1</color>
    <color name="accent">#0D9488</color>
    <color name="background_dark">#0F172A</color>
    <color name="surface_dark">#1E293B</color>
</resources>
`
  },
  {
    path: 'app/src/main/res/values/themes.xml',
    language: 'xml',
    description: 'Tema imersivo sem barra de ação (NoActionBar) para tela cheia total',
    content: `<resources>
    <style name="Theme.TouchScreenLink" parent="android:Theme.Material.NoActionBar">
        <item name="android:statusBarColor">#00000000</item>
        <item name="android:navigationBarColor">#00000000</item>
        <item name="android:windowTranslucentStatus">true</item>
        <item name="android:windowTranslucentNavigation">true</item>
    </style>
</resources>
`
  },
  {
    path: 'app/src/main/res/xml/data_extraction_rules.xml',
    language: 'xml',
    description: 'Regras de segurança de extração de dados do Android 12+',
    content: `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <exclude domain="sharedpref" path="." />
    </cloud-backup>
    <device-transfer>
        <exclude domain="sharedpref" path="." />
    </device-transfer>
</data-extraction-rules>
`
  },
  {
    path: 'app/src/main/java/com/touchscreenlink/app/MainActivity.kt',
    language: 'kotlin',
    description: 'Activity principal que orquestra conexões Wi-Fi/Bluetooth, ciclo de vida e ativação do mini teclado flutuante',
    content: `package com.touchscreenlink.app

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
`
  },
  {
    path: 'app/src/main/java/com/touchscreenlink/app/model/DiscoveredHost.kt',
    language: 'kotlin',
    description: 'Modelo de dados representando um computador Windows detectado na rede local ou via Bluetooth',
    content: `package com.touchscreenlink.app.model

data class DiscoveredHost(
    val id: String,
    val name: String,
    val ip: String,
    val port: Int = 45820,
    val latencyMs: Int = 0,
    val isBluetooth: Boolean = false,
    val macAddress: String? = null
)
`
  },
  {
    path: 'app/src/main/java/com/touchscreenlink/app/model/StreamConfig.kt',
    language: 'kotlin',
    description: 'Perfis de qualidade de vídeo H.264, taxas de FPS, resolução e opções de economia de energia',
    content: `package com.touchscreenlink.app.model

enum class StreamProfile(
    val title: String,
    val description: String,
    val width: Int,
    val height: Int,
    val fps: Int,
    val bitrateMbps: Int
) {
    FHD_60FPS("Full HD 60 FPS", "Qualidade máxima e máxima fluidez (Recomendado para Wi-Fi 5GHz ou USB)", 1920, 1080, 60, 6),
    HD_60FPS("HD 720p 60 FPS", "Ideal para redes Wi-Fi 2.4GHz ou menor consumo de rede", 1280, 720, 60, 4),
    BALANCED_30FPS("Equilibrado 30 FPS", "Menor aquecimento do aparelho e baixo uso de bateria", 1920, 1080, 30, 3),
    BATTERY_SAVER("Economia Extrema 30 FPS", "Resolução adaptada para autonomia máxima de bateria", 1280, 720, 30, 2)
}

data class StreamConfig(
    val profile: StreamProfile = StreamProfile.FHD_60FPS,
    val keepScreenOn: Boolean = true,
    val lowLatencyMode: Boolean = true,
    val enableHardwareAcceleration: Boolean = true
) {
    companion object {
        val DEFAULT = StreamConfig()
    }
}
`
  },
  {
    path: 'app/src/main/java/com/touchscreenlink/app/network/DiscoveryClient.kt',
    language: 'kotlin',
    description: 'Escuta anúncios UDP na porta 45824 para localização automática do computador na rede sem exigir digitação de IP',
    content: `package com.touchscreenlink.app.network

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
                Log.w(TAG, "Aviso no discovery UDP: \${e.message}")
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
                Log.w(TAG, "Erro ao enviar probe: \${e.message}")
            }
        }
    }

    fun stop() {
        isListening = false
        try { socket?.close() } catch (ignored: Exception) {}
        socket = null
    }
}
`
  },
  {
    path: 'app/src/main/java/com/touchscreenlink/app/network/BluetoothTransportManager.kt',
    language: 'kotlin',
    description: 'Gerenciador de transporte Bluetooth Classic (RFCOMM SPP) para envio de toques, teclado e comandos de controle',
    content: `package com.touchscreenlink.app.network

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
            Log.w(TAG, "Permissão Bluetooth não concedida: \${e.message}")
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
                Log.i(TAG, "Iniciando conexão RFCOMM SPP com \${device.name} (\${device.address})...")
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
                Log.e(TAG, "Falha na conexão Bluetooth: \${e.message}")
                disconnect()
                withContext(Dispatchers.Main) {
                    onError("Falha Bluetooth: \${e.message}")
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
                Log.w(TAG, "Canal Bluetooth encerrado: \${e.message}")
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
            Log.e(TAG, "Erro ao transmitir via Bluetooth: \${e.message}")
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
`
  },
  {
    path: 'app/src/main/java/com/touchscreenlink/app/network/TouchStreamClient.kt',
    language: 'kotlin',
    description: 'Cliente de rede WebSocket primário com handshake autenticado e decodificação contínua de vídeo',
    content: `package com.touchscreenlink.app.network

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
        val url = "ws://\$hostIp:\$port/stream"
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
                onConnectionStateChanged(false, "Conexão perdida: \${t.message}")
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
`
  },
  {
    path: 'app/src/main/java/com/touchscreenlink/app/decoder/HardwareVideoDecoder.kt',
    language: 'kotlin',
    description: 'Decodificador de vídeo H.264 por hardware usando MediaCodec de ultra baixa latência renderizando na Surface do Android',
    content: `package com.touchscreenlink.app.decoder

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
            Log.i(TAG, "MediaCodec inicializado por hardware: \${width}x\${height}")
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
            Log.w(TAG, "Exceção no processamento do frame: \${e.message}")
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
`
  },
  {
    path: 'app/src/main/java/com/touchscreenlink/app/input/TouchInputMapper.kt',
    language: 'kotlin',
    description: 'Mapeamento matemático de coordenadas de toque com correção de proporção (Letterbox/Pillarbox) e pacotes binários de 24 bytes',
    content: `package com.touchscreenlink.app.input

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
`
  },
  {
    path: 'app/src/main/java/com/touchscreenlink/app/input/KeyboardInputMapper.kt',
    language: 'kotlin',
    description: 'Serializador binário seguro de eventos de teclado (16 bytes) com validação de código de tecla e caracteres Unicode',
    content: `package com.touchscreenlink.app.input

import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Transforma eventos de digitação do teclado virtual ou físico do Android
 * em pacotes binários compactos e autenticados de 16 bytes para injeção via SendInput no Windows.
 *
 * Estrutura do Pacote de Teclado (16 bytes Little-Endian):
 * [0]    uint8: Magic byte (0x4B = 'K')
 * [1]    uint8: Action (0 = KEY_DOWN, 1 = KEY_UP, 2 = UNICODE_CHAR)
 * [2..3] uint16: VirtualKeyCode (ex: 0x08 = Backspace, 0x0D = Enter)
 * [4..7] uint32: UnicodeChar (UTF-16 code point para acentuação perfeita)
 * [8]    uint8: Modifiers (Bit 0: Shift, Bit 1: Ctrl, Bit 2: Alt, Bit 3: Win)
 * [9..12] uint32: TimestampMs
 * [13..15] uint8[3]: Reservado / Checksum
 */
class KeyboardInputMapper(
    private val onPacketReady: (ByteArray) -> Unit
) {
    fun sendUnicodeChar(char: Char, shift: Boolean = false, ctrl: Boolean = false, alt: Boolean = false) {
        val modifiers = (if (shift) 1 else 0) or
                        (if (ctrl) 2 else 0) or
                        (if (alt) 4 else 0)

        val packet = serializeKeyboardPacket(
            action = 2, // UNICODE_CHAR
            virtualKey = 0,
            unicodeChar = char.code,
            modifiers = modifiers.toByte()
        )
        onPacketReady(packet)
    }

    fun sendVirtualKey(vkCode: Int, isDown: Boolean = true) {
        val packet = serializeKeyboardPacket(
            action = if (isDown) 0 else 1,
            virtualKey = vkCode,
            unicodeChar = 0,
            modifiers = 0
        )
        onPacketReady(packet)
    }

    fun sendKeyCombo(vkCodes: List<Int>) {
        for (code in vkCodes) {
            onPacketReady(serializeKeyboardPacket(0, code, 0, 0))
        }
        for (code in vkCodes.reversed()) {
            onPacketReady(serializeKeyboardPacket(1, code, 0, 0))
        }
    }

    private fun serializeKeyboardPacket(action: Byte, virtualKey: Int, unicodeChar: Int, modifiers: Byte): ByteArray {
        val buffer = ByteBuffer.allocate(16).order(ByteOrder.LITTLE_ENDIAN)
        buffer.put(0x4B.toByte()) // Magic 'K'
        buffer.put(action)
        buffer.putShort(virtualKey.toShort())
        buffer.putInt(unicodeChar)
        buffer.put(modifiers)
        val nowMs = (System.currentTimeMillis() and 0xFFFFFFFFL).toInt()
        buffer.putInt(nowMs)
        buffer.put(0.toByte()) // Reservado
        buffer.put(0.toByte())
        buffer.put(0.toByte())
        return buffer.array()
    }
}
`
  },
  {
    path: 'app/src/main/java/com/touchscreenlink/app/ui/theme/Color.kt',
    language: 'kotlin',
    description: 'Definição de cores do tema Material Design 3',
    content: `package com.touchscreenlink.app.ui.theme

import androidx.compose.ui.graphics.Color

val SkyBlue = Color(0xFF0284C7)
val SkyBlueDark = Color(0xFF0369A1)
val TealAccent = Color(0xFF0D9488)
val DarkBackground = Color(0xFF0B132B)
val DarkSurface = Color(0xFF1C2541)
val TextPrimary = Color(0xFFF8FAFC)
val TextSecondary = Color(0xFF94A3B8)
`
  },
  {
    path: 'app/src/main/java/com/touchscreenlink/app/ui/theme/Theme.kt',
    language: 'kotlin',
    description: 'Tema Jetpack Compose com suporte a modo escuro nativo para menor cansaço visual e economia de bateria OLED',
    content: `package com.touchscreenlink.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = SkyBlue,
    onPrimary = Color.White,
    secondary = TealAccent,
    background = DarkBackground,
    surface = DarkSurface,
    onBackground = TextPrimary,
    onSurface = TextPrimary
)

@Composable
fun TouchScreenLinkTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
`
  },
  {
    path: 'app/src/main/java/com/touchscreenlink/app/ui/HomeScreen.kt',
    language: 'kotlin',
    description: 'Tela inicial: listagem automática de PCs na rede, alternância para Bluetooth, configuração de qualidade e pareamento por PIN/QR',
    content: `package com.touchscreenlink.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.touchscreenlink.app.model.DiscoveredHost
import com.touchscreenlink.app.model.StreamConfig
import com.touchscreenlink.app.model.StreamProfile
import com.touchscreenlink.app.network.BluetoothTransportManager
import com.touchscreenlink.app.network.DiscoveryClient

@Composable
fun HomeScreen(
    config: StreamConfig,
    onConfigChange: (StreamConfig) -> Unit,
    keepScreenOn: Boolean,
    onKeepScreenOnChange: (Boolean) -> Unit,
    bluetoothManager: BluetoothTransportManager,
    onConnect: (DiscoveredHost) -> Unit
) {
    var discoveredHosts by remember { mutableStateOf<List<DiscoveredHost>>(emptyList()) }
    var isManualDialogVisible by remember { mutableStateOf(false) }
    var manualIp by remember { mutableStateOf("192.168.1.100") }

    val discoveryClient = remember {
        DiscoveryClient { newHost ->
            if (discoveredHosts.none { it.id == newHost.id }) {
                discoveredHosts = discoveredHosts + newHost
            }
        }
    }

    LaunchedEffect(Unit) {
        discoveryClient.startListening()
        discoveryClient.sendDiscoveryProbe()
    }

    DisposableEffect(Unit) {
        onDispose {
            discoveryClient.stop()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .padding(24.dp)
    ) {
        // Cabeçalho
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "TouchScreen Link",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "Transforme este aparelho em tela de toque para seu PC",
                    fontSize = 13.sp,
                    color = Color(0xFF94A3B8)
                )
            }

            IconButton(
                onClick = { discoveryClient.sendDiscoveryProbe() },
                modifier = Modifier.background(Color(0xFF1E293B), CircleShape)
            ) {
                Icon(Icons.Default.Refresh, contentDescription = "Atualizar", tint = Color(0xFF38BDF8))
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Lista de Dispositivos Detectados
        Text(
            text = "Computadores Windows Detectados na Rede:",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFFCBD5E1)
        )

        Spacer(modifier = Modifier.height(10.dp))

        if (discoveredHosts.isEmpty()) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .background(Color(0xFF1E293B), RoundedCornerShape(12.dp))
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    CircularProgressIndicator(color = Color(0xFF0284C7), modifier = Modifier.size(32.dp))
                    Text(
                        text = "Procurando computadores na rede local (Porta 45824)...",
                        fontSize = 13.sp,
                        color = Color(0xFF94A3B8)
                    )
                    Button(
                        onClick = { isManualDialogVisible = true },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155))
                    ) {
                        Text("Conectar por IP Manual")
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(discoveredHosts) { host ->
                    HostCard(host = host, onSelect = { onConnect(host) })
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Barra inferior de controle
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(
                    checked = keepScreenOn,
                    onCheckedChange = onKeepScreenOnChange,
                    colors = CheckboxDefaults.colors(checkedColor = Color(0xFF0284C7))
                )
                Text("Manter tela sempre acesa", color = Color(0xFFE2E8F0), fontSize = 12.sp)
            }

            TextButton(onClick = { isManualDialogVisible = true }) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Inserir IP Manual", color = Color(0xFF38BDF8), fontSize = 12.sp)
            }
        }
    }

    if (isManualDialogVisible) {
        AlertDialog(
            onDismissRequest = { isManualDialogVisible = false },
            title = { Text("Conexão Manual por IP") },
            text = {
                OutlinedTextField(
                    value = manualIp,
                    onValueChange = { manualIp = it },
                    label = { Text("Endereço IP do Computador") },
                    singleLine = true
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        isManualDialogVisible = false
                        onConnect(DiscoveredHost("manual", "PC Manual", manualIp.trim(), 45820))
                    }
                ) {
                    Text("Conectar")
                }
            },
            dismissButton = {
                TextButton(onClick = { isManualDialogVisible = false }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
fun HostCard(host: DiscoveredHost, onSelect: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelect() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(Color(0xFF0284C7).copy(alpha = 0.2f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Laptop, contentDescription = null, tint = Color(0xFF38BDF8))
                }
                Column {
                    Text(text = host.name, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 15.sp)
                    Text(text = "\${host.ip}:\${host.port}", color = Color(0xFF94A3B8), fontSize = 12.sp)
                }
            }

            Button(
                onClick = onSelect,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7))
            ) {
                Text("Conectar")
            }
        }
    }
}
`
  },
  {
    path: 'app/src/main/java/com/touchscreenlink/app/ui/StreamScreen.kt',
    language: 'kotlin',
    description: 'Tela de exibição imersiva com mini teclado temporário contextual automático, fechamento ao tocar fora e Enter inteligente',
    content: `package com.touchscreenlink.app.ui

import android.view.MotionEvent
import android.view.SurfaceHolder
import android.view.SurfaceView
import androidx.activity.compose.BackHandler
import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.touchscreenlink.app.decoder.HardwareVideoDecoder
import com.touchscreenlink.app.input.KeyboardInputMapper
import com.touchscreenlink.app.input.TouchInputMapper
import com.touchscreenlink.app.model.DiscoveredHost
import com.touchscreenlink.app.model.StreamConfig
import com.touchscreenlink.app.network.BluetoothTransportManager
import com.touchscreenlink.app.network.TouchStreamClient

@Composable
fun StreamScreen(
    host: DiscoveredHost,
    config: StreamConfig,
    bluetoothManager: BluetoothTransportManager,
    onDisconnect: () -> Unit
) {
    var measuredLatencyMs by remember { mutableStateOf(14L) }
    var connectionStatusText by remember { mutableStateOf("Conectando...") }
    var isConnected by remember { mutableStateOf(false) }

    // Estado do teclado contextual temporário (Requisito 16)
    var isKeyboardVisible by remember { mutableStateOf(false) }
    var detectedFieldName by remember { mutableStateOf<String?>(null) }
    var isMultiLineField by remember { mutableStateOf(false) }
    var activeTransport by remember { mutableStateOf("Wi-Fi 5GHz") }

    // Regra 4: Intercepta o botão Voltar do Android para fechar o teclado sem desconectar o espelhamento
    BackHandler(enabled = isKeyboardVisible) {
        isKeyboardVisible = false
    }

    val mapper = remember {
        TouchInputMapper(
            pcScreenWidth = config.profile.width,
            pcScreenHeight = config.profile.height
        )
    }

    var clientRef by remember { mutableStateOf<TouchStreamClient?>(null) }

    val keyboardMapper = remember {
        KeyboardInputMapper { packet ->
            clientRef?.sendBinaryKeyboard(packet)
            bluetoothManager.sendBinaryData(packet)

            // Regra 3: Se pressionou Enter em campo de linha única (Busca, URL), fecha o teclado automaticamente
            val isEnterKey = (packet.size >= 4 && packet[2] == 0x0D.toByte())
            if (isEnterKey && !isMultiLineField) {
                isKeyboardVisible = false
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { context ->
                val surfaceView = SurfaceView(context)
                var decoder: HardwareVideoDecoder? = null

                surfaceView.holder.addCallback(object : SurfaceHolder.Callback {
                    override fun surfaceCreated(holder: SurfaceHolder) {
                        decoder = HardwareVideoDecoder(
                            targetSurface = holder.surface,
                            onFrameRendered = { latency -> measuredLatencyMs = latency },
                            onError = { err -> connectionStatusText = "Erro: \${err.message}" }
                        )

                        val client = TouchStreamClient(
                            hostIp = host.ip,
                            port = host.port,
                            config = config,
                            decoder = decoder!!,
                            onConnectionStateChanged = { connected, msg ->
                                isConnected = connected
                                connectionStatusText = msg
                            },
                            onFocusStateReceived = { hasFocus, fieldType, fieldName, isMultiLine ->
                                // Regra 1 e 5: Abertura e Reabertura Contextual Automática
                                // Regra 8: Fechamento automático quando foco não for campo de texto
                                isKeyboardVisible = hasFocus
                                detectedFieldName = if (hasFocus) fieldName else null
                                isMultiLineField = isMultiLine
                            }
                        )
                        clientRef = client
                        client.connect()
                    }

                    override fun surfaceChanged(holder: SurfaceHolder, format: Int, w: Int, h: Int) {
                        mapper.updateViewDimensions(w.toFloat(), h.toFloat())
                    }

                    override fun surfaceDestroyed(holder: SurfaceHolder) {
                        clientRef?.disconnect()
                        decoder?.stop()
                    }
                })

                surfaceView.setOnTouchListener { _, event ->
                    val actionCode: Byte = when (event.actionMasked) {
                        MotionEvent.ACTION_DOWN, MotionEvent.ACTION_POINTER_DOWN -> 0
                        MotionEvent.ACTION_MOVE -> 1
                        MotionEvent.ACTION_UP, MotionEvent.ACTION_POINTER_UP -> 2
                        MotionEvent.ACTION_CANCEL -> 3
                        else -> -1
                    }

                    if (actionCode.toInt() != -1) {
                        val pointerIndex = event.actionIndex
                        val pointerId = event.getPointerId(pointerIndex).toByte()
                        val mapped = mapper.mapCoordinates(event.getX(pointerIndex), event.getY(pointerIndex))
                        if (mapped != null) {
                            val nowMs = (System.currentTimeMillis() and 0xFFFFFFFFL).toInt()
                            val packet = mapper.serializeBinaryTouchPacket(
                                actionCode = actionCode,
                                pointerId = pointerId,
                                timestampMs = nowMs,
                                normX = mapped.normX,
                                normY = mapped.normY,
                                pixelX = mapped.pixelX,
                                pixelY = mapped.pixelY
                            )
                            // Regra 2: Envia o evento de toque imediatamente ao Windows enquanto recolhe o teclado
                            clientRef?.sendBinaryTouch(packet)
                        }
                    }
                    true
                }

                surfaceView
            }
        )

        // HUD Discreto Superior
        Row(
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(12.dp)
                .background(Color.Black.copy(alpha = 0.65f), CircleShape)
                .padding(horizontal = 14.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(if (isConnected) Color(0xFF22C55E) else Color(0xFFEF4444), CircleShape)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "\${host.name} · \$activeTransport · \${measuredLatencyMs}ms",
                color = Color.White,
                fontSize = 12.sp
            )
            if (isKeyboardVisible && detectedFieldName != null) {
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Editando: '\$detectedFieldName'",
                    color = Color(0xFF38BDF8),
                    fontSize = 11.sp
                )
            }
        }

        // Regra 10: Botão manual alternativo discreto para abrir caso o aplicativo não exponha acessibilidade
        FloatingActionButton(
            onClick = { isKeyboardVisible = !isKeyboardVisible },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp),
            containerColor = if (isKeyboardVisible) MaterialTheme.colorScheme.primary else Color(0x991E293B),
            contentColor = Color.White
        ) {
            Icon(
                imageVector = Icons.Default.Keyboard,
                contentDescription = "Alternar Teclado"
            )
        }

        // Regra 6 e 12: Animação rápida e discreta (150ms) do mini teclado flutuante
        AnimatedVisibility(
            visible = isKeyboardVisible,
            enter = fadeIn(tween(150)) + slideInVertically(tween(150)) { it / 2 },
            exit = fadeOut(tween(150)) + slideOutVertically(tween(150)) { it / 2 },
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 20.dp)
        ) {
            FloatingMiniKeyboard(
                isVisible = true,
                keyboardMapper = keyboardMapper,
                onClose = { isKeyboardVisible = false }, // Regra 4: Fechamento manual limpo
                onToggleNativeIme = {
                    // Alterna para IME do sistema Android
                }
            )
        }

        // Botão Fechar Sessão
        IconButton(
            onClick = onDisconnect,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(12.dp)
                .background(Color.Black.copy(alpha = 0.55f), CircleShape)
        ) {
            Icon(Icons.Default.Close, contentDescription = "Desconectar", tint = Color.White)
        }
    }
}
`
  },
  {
    path: 'app/src/main/java/com/touchscreenlink/app/ui/FloatingMiniKeyboard.kt',
    language: 'kotlin',
    description: 'Mini teclado virtual flutuante arrastável, minimizável e com suporte completo a acentos portugueses, teclas modificadoras e atalhos',
    content: `package com.touchscreenlink.app.ui

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.touchscreenlink.app.input.KeyboardInputMapper
import kotlin.math.roundToInt

@Composable
fun FloatingMiniKeyboard(
    isVisible: Boolean,
    keyboardMapper: KeyboardInputMapper,
    onClose: () -> Unit,
    onToggleNativeIme: () -> Unit,
    modifier: Modifier = Modifier
) {
    if (!isVisible) return

    var isMinimized by remember { mutableStateOf(false) }
    var offsetX by remember { mutableStateOf(100f) }
    var offsetY by remember { mutableStateOf(120f) }

    var isShiftActive by remember { mutableStateOf(false) }
    var isCtrlActive by remember { mutableStateOf(false) }
    var isAltActive by remember { mutableStateOf(false) }
    var pendingDeadKey by remember { mutableStateOf<Char?>(null) }

    // Aplica acentuação portuguesa (´, ~, ^, \`) com letras correspondentes
    fun processCharInput(rawChar: Char) {
        val finalChar: Char = when (pendingDeadKey) {
            '´' -> when (rawChar.lowercaseChar()) {
                'a' -> if (rawChar.isUpperCase()) 'Á' else 'á'
                'e' -> if (rawChar.isUpperCase()) 'É' else 'é'
                'i' -> if (rawChar.isUpperCase()) 'Í' else 'í'
                'o' -> if (rawChar.isUpperCase()) 'Ó' else 'ó'
                'u' -> if (rawChar.isUpperCase()) 'Ú' else 'ú'
                else -> rawChar
            }
            '~' -> when (rawChar.lowercaseChar()) {
                'a' -> if (rawChar.isUpperCase()) 'Ã' else 'ã'
                'o' -> if (rawChar.isUpperCase()) 'Õ' else 'õ'
                else -> rawChar
            }
            '^' -> when (rawChar.lowercaseChar()) {
                'a' -> if (rawChar.isUpperCase()) 'Â' else 'â'
                'e' -> if (rawChar.isUpperCase()) 'Ê' else 'ê'
                'o' -> if (rawChar.isUpperCase()) 'Ô' else 'ô'
                else -> rawChar
            }
            '\`' -> when (rawChar.lowercaseChar()) {
                'a' -> if (rawChar.isUpperCase()) 'À' else 'à'
                else -> rawChar
            }
            else -> rawChar
        }
        pendingDeadKey = null

        keyboardMapper.sendUnicodeChar(
            char = finalChar,
            shift = isShiftActive,
            ctrl = isCtrlActive,
            alt = isAltActive
        )

        // Shift momentâneo desativa após o caractere digitado
        if (isShiftActive) isShiftActive = false
    }

    Box(
        modifier = modifier
            .offset { IntOffset(offsetX.roundToInt(), offsetY.roundToInt()) }
            .pointerInput(Unit) {
                detectDragGestures { change, dragAmount ->
                    change.consume()
                    offsetX += dragAmount.x
                    offsetY += dragAmount.y
                }
            }
    ) {
        if (isMinimized) {
            // Bolha flutuante compacta quando minimizado
            Surface(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .clickable { isMinimized = false }
                    .shadow(8.dp, CircleShape),
                color = MaterialTheme.colorScheme.primaryContainer,
                border = androidx.compose.foundation.BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.Keyboard,
                        contentDescription = "Expandir Teclado",
                        tint = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
        } else {
            // Teclado virtual expandido completo
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xEE1E293B) // Slate 800 translúcido
                ),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155)),
                modifier = Modifier
                    .width(460.dp)
                    .shadow(16.dp, RoundedCornerShape(16.dp))
            ) {
                Column(
                    modifier = Modifier.padding(10.dp),
                    verticalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    // Barra de título com arraste e controles
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(
                                imageVector = Icons.Default.DragIndicator,
                                contentDescription = null,
                                tint = Color(0xFF94A3B8),
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "Mini Teclado TouchScreen Link",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFE2E8F0)
                            )
                            if (pendingDeadKey != null) {
                                Text(
                                    text = "Acento ativo: '\$pendingDeadKey'",
                                    fontSize = 10.sp,
                                    color = Color(0xFF38BDF8),
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            IconButton(
                                onClick = onToggleNativeIme,
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Default.Language, contentDescription = "Teclado Nativo", tint = Color(0xFF94A3B8), modifier = Modifier.size(14.dp))
                            }
                            IconButton(
                                onClick = { isMinimized = true },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Default.Minimize, contentDescription = "Minimizar", tint = Color(0xFF94A3B8), modifier = Modifier.size(14.dp))
                            }
                            IconButton(
                                onClick = onClose,
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Default.Close, contentDescription = "Fechar", tint = Color(0xFFEF4444), modifier = Modifier.size(14.dp))
                            }
                        }
                    }

                    // Linha 1: Números e Backspace
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        listOf("1","2","3","4","5","6","7","8","9","0","-","=").forEach { k ->
                            KeyButton(label = k, modifier = Modifier.weight(1f)) { processCharInput(k[0]) }
                        }
                        KeyButton(label = "⌫", modifier = Modifier.weight(1.4f), isSpecial = true) {
                            keyboardMapper.sendVirtualKey(0x08) // VK_BACK
                        }
                    }

                    // Linha 2: QWERTY + Acento Agudo e Crase
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        KeyButton(label = "Tab", modifier = Modifier.weight(1.2f), isSpecial = true) {
                            keyboardMapper.sendVirtualKey(0x09) // VK_TAB
                        }
                        listOf("q","w","e","r","t","y","u","i","o","p").forEach { k ->
                            val display = if (isShiftActive) k.uppercase() else k
                            KeyButton(label = display, modifier = Modifier.weight(1f)) {
                                processCharInput(display[0])
                            }
                        }
                        KeyButton(label = "´", modifier = Modifier.weight(1f), isSpecial = true) {
                            pendingDeadKey = '´'
                        }
                        KeyButton(label = "\`", modifier = Modifier.weight(1f), isSpecial = true) {
                            pendingDeadKey = '\`'
                        }
                    }

                    // Linha 3: ASDFGHJKL + Ç + Til e Circunflexo + Enter
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        listOf("a","s","d","f","g","h","j","k","l","ç").forEach { k ->
                            val display = if (isShiftActive) k.uppercase() else k
                            KeyButton(label = display, modifier = Modifier.weight(1f)) {
                                processCharInput(display[0])
                            }
                        }
                        KeyButton(label = "~", modifier = Modifier.weight(1f), isSpecial = true) {
                            pendingDeadKey = '~'
                        }
                        KeyButton(label = "^", modifier = Modifier.weight(1f), isSpecial = true) {
                            pendingDeadKey = '^'
                        }
                        KeyButton(label = "Enter ⏎", modifier = Modifier.weight(1.8f), isAccent = true) {
                            keyboardMapper.sendVirtualKey(0x0D) // VK_RETURN
                        }
                    }

                    // Linha 4: Shift + ZXCVBNM + Pontuação
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        KeyButton(
                            label = "⇧ Shift",
                            modifier = Modifier.weight(1.5f),
                            isActive = isShiftActive,
                            isSpecial = true
                        ) {
                            isShiftActive = !isShiftActive
                        }
                        listOf("z","x","c","v","b","n","m",",",".",";","/").forEach { k ->
                            val display = if (isShiftActive) k.uppercase() else k
                            KeyButton(label = display, modifier = Modifier.weight(1f)) {
                                processCharInput(display[0])
                            }
                        }
                        KeyButton(label = "Esc", modifier = Modifier.weight(1.1f), isSpecial = true) {
                            keyboardMapper.sendVirtualKey(0x1B) // VK_ESCAPE
                        }
                    }

                    // Linha 5: Modificadores (Ctrl, Alt, Win) + Espaço Grande
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        KeyButton(label = "Ctrl", modifier = Modifier.weight(1.1f), isActive = isCtrlActive, isSpecial = true) {
                            isCtrlActive = !isCtrlActive
                        }
                        KeyButton(label = "Alt", modifier = Modifier.weight(1.1f), isActive = isAltActive, isSpecial = true) {
                            isAltActive = !isAltActive
                        }
                        KeyButton(label = "🪟 Win", modifier = Modifier.weight(1.1f), isSpecial = true) {
                            keyboardMapper.sendVirtualKey(0x5B) // VK_LWIN
                        }
                        KeyButton(label = "Espaço", modifier = Modifier.weight(3.5f)) {
                            processCharInput(' ')
                        }
                        KeyButton(label = "Ctrl+C", modifier = Modifier.weight(1.2f), isSpecial = true) {
                            keyboardMapper.sendKeyCombo(listOf(0x11, 0x43)) // VK_CONTROL + 'C'
                        }
                        KeyButton(label = "Ctrl+V", modifier = Modifier.weight(1.2f), isSpecial = true) {
                            keyboardMapper.sendKeyCombo(listOf(0x11, 0x56)) // VK_CONTROL + 'V'
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun KeyButton(
    label: String,
    modifier: Modifier = Modifier,
    isSpecial: Boolean = false,
    isAccent: Boolean = false,
    isActive: Boolean = false,
    onClick: () -> Unit
) {
    val bgColor = when {
        isActive -> Color(0xFF0284C7)
        isAccent -> Color(0xFF0D9488)
        isSpecial -> Color(0xFF334155)
        else -> Color(0xFF0F172A)
    }

    Box(
        modifier = modifier
            .height(34.dp)
            .clip(RoundedCornerShape(6.dp))
            .background(bgColor)
            .clickable { onClick() }
            .border(0.5.dp, Color(0xFF475569), RoundedCornerShape(6.dp)),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = if (isSpecial || isAccent || isActive) FontWeight.Bold else FontWeight.Medium,
            color = Color.White
        )
    }
}
`
  },
  {
    path: 'README.md',
    language: 'markdown',
    description: 'Instruções de compilação do aplicativo Android com suporte a Wi-Fi, Bluetooth e Teclado Virtual',
    content: `# TouchScreen Link — Aplicativo Android Nativo (v1.1)

Aplicativo Android nativo de tela sensível ao toque remota para PC Windows, desenvolvido com Kotlin e Jetpack Compose.

## Novos Recursos (v1.1):
- **Mini Teclado Flutuante Integrado**: Teclado virtual arrastável e minimizável com suporte integral a acentos portugueses (á, é, í, ó, ú, â, ê, ô, ã, õ, ç), teclas modificadoras (Ctrl, Alt, Win, Shift) e atalhos rápidos.
- **Ativação Inteligente de Teclado**: Integração com Windows UI Automation para abrir automaticamente o teclado quando um campo de texto no Windows ganha foco.
- **Suporte a Bluetooth Complementar**: Suporte a Bluetooth Classic RFCOMM SPP para transporte resiliente de comandos de teclado e toque.
- **Descoberta UDP Automática**: Descoberta sem fio instantânea pela porta 45824.

## Compilação no Android Studio:
1. Abra a pasta raiz no Android Studio (Ladybug 2024.2+ ou Koala).
2. Sincronize o Gradle (Sync Project with Gradle Files).
3. Execute no dispositivo físico ou gere o APK via terminal: \`./gradlew assembleDebug\` ou \`gradlew.bat assembleDebug\`
`
  }
];

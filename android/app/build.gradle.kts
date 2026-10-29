plugins {
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

# Regras do TouchScreen Link
-keep class com.touchscreenlink.app.model.** { *; }
-keep class com.touchscreenlink.app.decoder.** { *; }
-keep class com.touchscreenlink.app.input.** { *; }
-keepclassmembers class * {
    @androidx.compose.runtime.Composable *;
}
# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**

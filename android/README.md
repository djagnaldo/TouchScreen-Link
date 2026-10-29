# TouchScreen Link — Aplicativo Android Nativo (v1.1)

Aplicativo Android nativo de tela sensível ao toque remota para PC Windows, desenvolvido com Kotlin e Jetpack Compose.

## Novos Recursos (v1.1):
- **Mini Teclado Flutuante Integrado**: Teclado virtual arrastável e minimizável com suporte integral a acentos portugueses (á, é, í, ó, ú, â, ê, ô, ã, õ, ç), teclas modificadoras (Ctrl, Alt, Win, Shift) e atalhos rápidos.
- **Ativação Inteligente de Teclado**: Integração com Windows UI Automation para abrir automaticamente o teclado quando um campo de texto no Windows ganha foco.
- **Suporte a Bluetooth Complementar**: Suporte a Bluetooth Classic RFCOMM SPP para transporte resiliente de comandos de teclado e toque.
- **Descoberta UDP Automática**: Descoberta sem fio instantânea pela porta 45824.

## Compilação no Android Studio:
1. Abra a pasta raiz no Android Studio (Ladybug 2024.2+ ou Koala).
2. Sincronize o Gradle (Sync Project with Gradle Files).
3. Execute no dispositivo físico ou gere o APK via terminal: `./gradlew assembleDebug` ou `gradlew.bat assembleDebug`

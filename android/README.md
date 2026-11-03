# TouchScreen Link — Aplicativo Android Nativo (v1.1)

Aplicativo Android nativo de tela sensível ao toque remota para PC Windows, desenvolvido com Kotlin e Jetpack Compose.

## Recursos de Produção (v1.1):
- **Decodificação Real H.264 por Hardware**: MediaCodec com `KEY_LOW_LATENCY` e renderização direta via `SurfaceView`.
- **Autenticação Segura por PIN**: Validação de PIN de 6 dígitos no Handshake WebSocket antes de liberar a transmissão.
- **Mini Teclado Flutuante Contextual**: Teclado virtual arrastável e minimizável com suporte integral a acentos portugueses (á, é, í, ó, ú, â, ê, ô, ã, õ, ç), teclas modificadoras (Ctrl, Alt, Win, Shift) e fechamento automático ao tocar fora ou concluir busca.
- **Ativação Inteligente de Teclado**: Integração com Windows UI Automation para abrir automaticamente o teclado quando um campo de texto no Windows ganha foco.
- **Descoberta UDP Automática**: Descoberta sem fio instantânea na rede local (Wi-Fi e USB RNDIS) pela porta 45824, com opção de conexão manual por IP.

## Compilação Local do APK:
1. Requisitos: JDK 17 e Android SDK (API 35, Build-Tools 35.0.0).
2. No terminal (Linux/macOS):
   ```bash
   cd android
   chmod +x gradlew
   ./gradlew assembleDebug
   ```
3. No terminal (Windows PowerShell / CMD):
   ```cmd
   cd android
   gradlew.bat assembleDebug
   ```
4. O APK gerado estará em:
   `android/app/build/outputs/apk/debug/app-debug.apk` (renomeado para `TouchScreenLink-Android-Teste.apk`).

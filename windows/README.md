# TouchScreen Link — Servidor Nativo para PC Windows (v1.1)

Componente de servidor nativo para Windows 10 e Windows 11 desenvolvido em C# com .NET 8 e APIs nativas de alta performance.

## Arquitetura de Componentes Nativos:
1. **Centro de Administração e Configuração (`MainWindow.cs`)**: Painel de controle visual com abas de Início/Pareamento, Configurações Avançadas de Transmissão (Perfis de Economia, Equilibrado e Baixa Latência), Diagnóstico Técnico com métricas reais e Segurança por PIN.
2. **Captura DXGI Desktop Duplication (`DxgiScreenCapture.cs`)**: Captura direta de buffers de vídeo BGRA na VRAM do DirectX 11 via SharpDX com reutilização de memória (zero alocação no loop) e modo Grayscale adaptativo.
3. **Media Foundation H.264 MFT Hardware Encoder (`MediaFoundationHardwareEncoder.cs`)**: Codificação H.264 real acelerada por GPU (NVIDIA NVENC, Intel QuickSync, AMD AMF) com fallback seguro para MFT de software da Microsoft. Conversão BGRA para NV12 de alto desempenho e extração real de NAL units SPS e PPS no formato Annex B.
4. **Comunicação WebSocket Sincronizada (`StreamServer.cs`)**: Autenticação prévia via PIN de 6 dígitos no Handshake, envio seguro com `SemaphoreSlim` para evitar concorrência e remontagem de fragmentos de pacotes.
5. **Injeção de Toque e Teclado (`WindowsInputSimulator.cs` e `WindowsKeyboardSimulator.cs`)**: Simulação via Win32 `SendInput` com suporte a clique esquerdo/direito, arrastar, caracteres fora do BMP (surrogate pairs) e acentuação brasileira instantânea (á, é, í, ó, ú, â, ê, ô, ã, õ, ç).
6. **Ativação Inteligente de Teclado (`FocusDetectionService.cs`)**: Integração com Windows UI Automation para sinalizar quando o usuário clica em caixas de pesquisa, formulários ou campos de texto.
7. **Segurança Rigorosa (`SecurityValidator.cs`)**: Validação de pacotes binários de 24 bytes (toque) e 16 bytes (teclado), checagem estrita de limites de tela e anti-injeção.

## Compilação Local do Executável (.EXE Self-Contained):
1. Requisito: .NET 8.0 SDK para Windows x64.
2. No PowerShell:
   ```powershell
   cd windows
   ./build.ps1
   ```
   ou diretamente via CLI:
   ```powershell
   dotnet publish windows/TouchScreenLink.Server/TouchScreenLink.Server.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o publish/
   ```
3. O executável autônomo gerado será:
   `publish/TouchScreenLinkServer.exe` (renomeado para `TouchScreenLink-Windows-Teste.exe`), pronto para rodar sem exigir a instalação de runtimes externos.

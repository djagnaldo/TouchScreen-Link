# TouchScreen Link — Servidor Nativo para PC Windows (v1.1)

Componente de servidor nativo para Windows 10 e Windows 11 desenvolvido em C# com .NET 8 e APIs nativas de alta performance.

## Arquitetura de Componentes Nativos:
1. **Centro de Administração e Configuração (`MainWindow.cs`)**: Painel de controle visual com abas de Início/Pareamento, Configurações Avançadas de Transmissão (Perfis de Economia, Equilibrado e Baixa Latência), Diagnóstico Técnico em tempo real e Segurança.
2. **Captura DXGI Desktop Duplication**: Captura direta de buffers de vídeo BGRA na VRAM do DirectX 11 via SharpDX com suporte a Grayscale sob solicitação do Android.
3. **Media Foundation H.264 MFT Hardware Encoder**: Codificação em fluxo de bits Annex B de ultra baixa latência com zero B-frames, CBR e SPS/PPS pré-anexados.
4. **Injeção de Teclado Unicode**: Simulação de teclas via Win32 `SendInput` com `KEYEVENTF_UNICODE` para acentuação brasileira instantânea (á, é, í, ó, ú, â, ê, ô, ã, õ, ç) sem perda de foco.
5. **Ativação Inteligente de Teclado**: Integração com Windows UI Automation para sinalizar quando o usuário clica ou navega para caixas de pesquisa, formulários ou campos de texto.
6. **Bluetooth Classic RFCOMM SPP**: Canal de transporte complementar para digitação e controle mesmo sem rede Wi-Fi disponível.
7. **Segurança Rigorosa**: Validação de pacotes binários de 24 bytes (toque) e 16 bytes (teclado), checagem de limites e anti-replay, sem execução arbitrária de comandos shell.

## Compilação Rápida:
Execute o script `build.ps1` no PowerShell ou via CLI do .NET SDK:
```powershell
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o publish/
```

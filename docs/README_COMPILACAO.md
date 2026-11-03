# TouchScreen Link — Guia Oficial de Compilação e Instalação

## 1. Visão Geral dos Artefatos
O projeto **TouchScreen Link** é composto por dois aplicativos nativos que trabalham de forma integrada via rede local Wi-Fi ou cabo USB (RNDIS/Tethering):
1. **Aplicativo Android (APK)**: `TouchScreenLink-Android-Teste.apk`
2. **Servidor Windows (EXE)**: `TouchScreenLink-Windows-Teste.exe` (Self-Contained x64, sem necessidade de instalar .NET runtime separado)

---

## 2. Compilação Automatizada via GitHub Actions (Recomendado)
Um fluxo de trabalho de Integração Contínua (CI/CD) está configurado em `.github/workflows/build-artifacts.yml`.

### Como Baixar os Artefatos Prontos:
1. Acesse o repositório no GitHub: `https://github.com/djagnaldo/TouchScreen-Link`
2. Clique na aba **Actions**.
3. Selecione a execução mais recente do workflow **"Build TouchScreen Link (Android APK & Windows EXE)"**.
4. Na seção inferior da página (**Artifacts**), clique para baixar:
   - `TouchScreenLink-Android-Teste-APK` (contendo o arquivo `TouchScreenLink-Android-Teste.apk`).
   - `TouchScreenLink-Windows-Teste-EXE` (contendo `TouchScreenLink-Windows-Teste.exe` e o instalador).

---

## 3. Compilação Local do Aplicativo Android (APK)

### Pré-requisitos:
- **JDK 17** (Java Development Kit)
- **Android SDK** com API Level 35 e Build-Tools 35.0.0

### Comandos de Compilação:
No terminal Linux / macOS:
```bash
cd android
chmod +x gradlew
./gradlew assembleDebug --no-daemon
```

No prompt de comando ou PowerShell do Windows:
```cmd
cd android
gradlew.bat assembleDebug --no-daemon
```

### Localização do APK gerado:
`android/app/build/outputs/apk/debug/app-debug.apk`  
*(Pode ser renomeado para `TouchScreenLink-Android-Teste.apk`)*

---

## 4. Compilação Local do Servidor Windows (EXE)

### Pré-requisitos:
- **.NET 8.0 SDK** (versão 8.0.100 ou superior) para Windows x64.
- Windows 10 (versão 19041+) ou Windows 11.

### Comandos de Compilação:
Abra o PowerShell na pasta `windows`:
```powershell
cd windows
./build.ps1
```

Ou execute diretamente o comando de publicação self-contained do .NET:
```powershell
dotnet publish windows/TouchScreenLink.Server/TouchScreenLink.Server.csproj `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -p:EnableCompressionInSingleFile=true `
    -o publish/
```

### Localização do Executável gerado:
`publish/TouchScreenLinkServer.exe`  
*(Pode ser renomeado para `TouchScreenLink-Windows-Teste.exe`)*

---

## 5. Instruções de Instalação e Teste

### No Celular ou Tablet Android:
1. Transfira o arquivo `TouchScreenLink-Android-Teste.apk` para o aparelho (via USB, Google Drive, WhatsApp ou download direto).
2. Toque no APK para instalar (habilite "Instalar fontes desconhecidas" se solicitado).
3. Abra o **TouchScreen Link**.

### No Computador Windows:
1. Copie o executável `TouchScreenLink-Windows-Teste.exe` para qualquer pasta do PC.
2. Dê duplo clique para executar.
3. Se o Windows Defender SmartScreen exibir um aviso ("Windows protegeu o seu computador"), clique em **Mais informações** -> **Executar assim mesmo** (comum em binários de teste sem assinatura EV comercial).
4. O painel de administração exibirá o **PIN de 6 dígitos** (ex: `123456`) e iniciará os servidores na porta `45820` (WebSocket) e `45824` (Descoberta UDP).

### Conexão e Controle:
1. Certifique-se de que o Android e o Windows estão na mesma rede Wi-Fi ou conectados via cabo USB com "Ancoragem USB / USB Tethering" ativo.
2. No Android, o computador Windows aparecerá automaticamente na lista.
3. Toque em **Conectar**, informe o PIN de 6 dígitos exibido no PC e confirme.
4. A tela do Windows será transmitida em tempo real com decodificação por hardware, e qualquer toque na tela do Android moverá o mouse e acionará os cliques no Windows.
5. Ao tocar em campos de busca ou texto, o **Mini Teclado Flutuante** se abrirá automaticamente com suporte a acentos brasileiros.

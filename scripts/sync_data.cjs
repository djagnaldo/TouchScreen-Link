const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

function getLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.kt': return 'kotlin';
    case '.cs': return 'csharp';
    case '.xml': return 'xml';
    case '.json': return 'json';
    case '.iss': return 'inno';
    case '.bat': return 'batch';
    case '.ps1': return 'powershell';
    case '.md': return 'markdown';
    case '.kts': return 'gradle';
    case '.toml': return 'toml';
    case '.properties': return 'properties';
    case '.pro': return 'proguard';
    default: return 'shell';
  }
}

function getDescription(filePath) {
  const name = path.basename(filePath);
  if (name === 'TouchScreenLink.sln') return 'Solução Visual Studio 2022 / .NET 8';
  if (name.endsWith('.csproj')) return 'Arquivo de projeto C# .NET 8 com referências SharpDX, UI Automation e InnoSetup';
  if (name === 'MainWindow.cs') return 'Interface Windows com 4 abas estritas: Conexão, Transmissão, Diagnóstico e Segurança';
  if (name === 'MediaFoundationHardwareEncoder.cs') return 'Codificador H.264 acelerado por hardware MFT com perfis Economia, Equilibrado e Baixa Latência';
  if (name === 'StreamServer.cs') return 'Servidor WebSocket de streaming com fallback adaptativo para 45 FPS em caso de congestionamento';
  if (name === 'DxgiScreenCapture.cs') return 'Captura DXGI Desktop Duplication de alta taxa e conversão de escala de cinza';
  if (name === 'StreamScreen.kt') return 'Tela cheia Android sem HUD, detecção de gestos (3 dedos e 2 dedos duplo-toque) e painel básico';
  if (name === 'StreamConfig.kt') return 'Modelos de perfis de transmissão: Economia, Equilibrado e Baixa Latência';
  if (name === 'FloatingMiniKeyboard.kt') return 'Mini teclado contextual temporário com suporte a acentuação PT-BR';
  if (name === 'FocusDetectionService.cs') return 'Monitoramento de foco em campos de texto via Windows UI Automation';
  if (name === 'BluetoothServer.cs') return 'Servidor Bluetooth RFCOMM SPP para transporte alternativo';
  if (name === 'BluetoothTransportManager.kt') return 'Cliente Android Bluetooth Classic / BLE';
  if (name === 'PairingManager.cs') return 'Gerenciador de pareamento seguro por PIN e QR Code HMAC-SHA256';
  return `Arquivo do projeto: ${name}`;
}

function crawlDir(dir, baseDir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(crawlDir(fullPath, baseDir));
    } else {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push({
        fullPath,
        relPath
      });
    }
  }
  return results;
}

async function main() {
  console.log('Iniciando sincronização e geração do ZIP...');
  const appRoot = process.cwd();
  const windowsDir = path.join(appRoot, 'windows');
  const androidDir = path.join(appRoot, 'android');
  const publicDir = path.join(appRoot, 'public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const windowsFiles = crawlDir(windowsDir, windowsDir);
  const androidFiles = crawlDir(androidDir, androidDir);

  console.log(`Encontrados ${windowsFiles.length} arquivos Windows e ${androidFiles.length} arquivos Android.`);

  // 1. Gera o ZIP completo
  const zip = new JSZip();
  const winZipFolder = zip.folder('windows');
  for (const f of windowsFiles) {
    const content = fs.readFileSync(f.fullPath);
    winZipFolder.file(f.relPath, content);
  }

  const androidZipFolder = zip.folder('android');
  for (const f of androidFiles) {
    const content = fs.readFileSync(f.fullPath);
    androidZipFolder.file(f.relPath, content);
  }

  const docsZipFolder = zip.folder('docs');
  docsZipFolder.file('README_COMPILACAO.md', `# TouchScreen Link - Instruções Oficiais de Compilação

## 1. Aplicativo Android Nativo
- Pré-requisitos: JDK 17 e Android SDK 34
- Comando:
  cd android
  ./gradlew assembleRelease
  (ou gradlew.bat assembleRelease no Windows)
- Saída: android/app/build/outputs/apk/release/app-release-unsigned.apk

## 2. Servidor Windows Nativo
- Pré-requisitos: .NET 8 SDK
- Comando:
  cd windows
  dotnet publish TouchScreenLink.Server/TouchScreenLink.Server.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
- Saída: windows/TouchScreenLink.Server/bin/Release/net8.0-windows10.0.19041.0/win-x64/publish/TouchScreenLinkServer.exe
`);

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const zipDest = path.join(publicDir, 'TouchScreenLink-Completo-Android-Windows-v1.1.zip');
  fs.writeFileSync(zipDest, zipBuffer);
  console.log(`ZIP gerado com sucesso em ${zipDest} (${zipBuffer.length} bytes)`);

  // 2. Atualiza src/data/windowsFiles.ts
  const windowsDataList = windowsFiles.map(f => {
    const content = fs.readFileSync(f.fullPath, 'utf8');
    return {
      path: f.relPath,
      language: getLanguage(f.relPath),
      description: getDescription(f.relPath),
      content: content
    };
  });

  const windowsDataTs = `import { ProjectSourceFile } from '../types/touchscreen';\n\nexport const WINDOWS_SOURCE_FILES: ProjectSourceFile[] = ${JSON.stringify(windowsDataList, null, 2)};\n`;
  fs.writeFileSync(path.join(appRoot, 'src/data/windowsFiles.ts'), windowsDataTs, 'utf8');
  console.log('src/data/windowsFiles.ts atualizado.');

  // 3. Atualiza src/data/androidFiles.ts
  const androidDataList = androidFiles.map(f => {
    const content = fs.readFileSync(f.fullPath, 'utf8');
    return {
      path: f.relPath,
      language: getLanguage(f.relPath),
      description: getDescription(f.relPath),
      content: content
    };
  });

  const androidDataTs = `import { ProjectSourceFile } from '../types/touchscreen';\n\nexport const ANDROID_SOURCE_FILES: ProjectSourceFile[] = ${JSON.stringify(androidDataList, null, 2)};\n`;
  fs.writeFileSync(path.join(appRoot, 'src/data/androidFiles.ts'), androidDataTs, 'utf8');
  console.log('src/data/androidFiles.ts atualizado.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

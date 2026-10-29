import JSZip from 'jszip';
import { ANDROID_SOURCE_FILES } from '../data/androidFiles';
import { WINDOWS_SOURCE_FILES } from '../data/windowsFiles';

export async function downloadAndroidProjectZip(): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('TouchScreenLink-Android');

  if (folder) {
    for (const file of ANDROID_SOURCE_FILES) {
      folder.file(file.path, file.content);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, 'TouchScreenLink-Android-v1.1.zip');
}

export async function downloadWindowsProjectZip(): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('TouchScreenLink-Windows');

  if (folder) {
    for (const file of WINDOWS_SOURCE_FILES) {
      folder.file(file.path, file.content);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, 'TouchScreenLink-Windows-v1.1.zip');
}

export async function downloadFullSolutionBundleZip(): Promise<void> {
  const zip = new JSZip();
  const androidFolder = zip.folder('android');
  const windowsFolder = zip.folder('windows');
  const docsFolder = zip.folder('docs');

  if (androidFolder) {
    for (const file of ANDROID_SOURCE_FILES) {
      androidFolder.file(file.path, file.content);
    }
  }

  if (windowsFolder) {
    for (const file of WINDOWS_SOURCE_FILES) {
      windowsFolder.file(file.path, file.content);
    }
  }

  if (docsFolder) {
    docsFolder.file(
      'ARQUITETURA_E_SEGURANCA.md',
      `# TouchScreen Link - Especificação Geral de Arquitetura e Segurança
Data: 2026-10-29
Versão: 1.1.0

## Resumo Técnico dos Componentes Integrados:
1. Captura de Tela Windows:
   - Direct3D 11 DXGI Desktop Duplication API (SharpDX) com extração em VRAM.
   - Tratamento de transições de modo e UAC (DXGI_ERROR_ACCESS_LOST).
2. Codificação de Vídeo H.264 por Hardware:
   - Windows Media Foundation MFT (NVENC / Intel QuickSync / AMD AMF).
   - Formato de fluxo de bits: Annex B NAL units (prefixo 00 00 00 01) com cabeçalhos SPS (NAL 7) e PPS (NAL 8).
   - Perfil de latência ultra baixa: taxa CBR, zero B-frames.
3. Decodificação por Hardware no Android:
   - MediaCodec ("video/avc") com baixa latência (KEY_LOW_LATENCY = 1) renderizando diretamente na SurfaceView.
4. Entrada de Toque e Mouse:
   - Pacotes binários compactos de 24 bytes com checagem de limites e anti-replay.
   - Injeção precisa via Win32 SendInput com mapeamento de coordenadas normalizadas 0..65535.
5. Injeção de Teclado e Acentuação Brasileira:
   - Pacotes binários de 16 bytes.
   - Injeção Unicode via SendInput com flag KEYEVENTF_UNICODE preservando o foco da janela.
6. Mini Teclado Contextual Temporário (Requisito 16):
   - Abertura automática via Windows UI Automation (FocusDetectionService escutando Edit, Document, ComboBox).
   - Fechamento imediato ao tocar fora (executando o toque simultaneamente sem perda de clique).
   - Fechamento ao pressionar Enter em buscas e preservação de quebra de linha em editores multilinhas.
7. Comunicação Complementar Bluetooth:
   - Suporte a Bluetooth Classic RFCOMM SPP (UUID 00001101-0000-1000-8000-00805F9B34FB).
   - Modo Híbrido: Wi-Fi para vídeo 1080p60 + Bluetooth para controle/teclado.
8. Segurança e Validação:
   - Pareamento seguro por PIN temporário de 6 dígitos e QR Code.
   - Assinatura HMAC-SHA256 para tokens de sessão.
   - Validador estrito SecurityValidator que bloqueia qualquer comando arbitrário de shell.
`
    );
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, 'TouchScreenLink-Completo-Android-Windows-v1.1.zip');
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

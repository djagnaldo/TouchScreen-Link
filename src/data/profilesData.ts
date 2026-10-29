import { StreamProfileConfig } from '../types/touchscreen';

export const STREAM_PROFILES: Record<string, StreamProfileConfig> = {
  economy: {
    id: 'economy',
    name: 'Economia',
    tagline: 'Mínimo consumo de bateria e recursos',
    resolution: '1280 × 720 (720p)',
    width: 1280,
    height: 720,
    targetFps: 30,
    bitrateKbps: 2500,
    encoderPreset: 'LowPower / Fast Profile',
    bufferFrames: 1,
    cpuTargetPercent: '< 2.5% em CPU moderna',
    networkBandwidth: '~2.5 Mbps',
    latencyEstimateMs: 22,
    description: 'Prioriza a economia de bateria no Android e minimiza a carga de GPU e CPU no PC. Ideal para leitura de documentos e tarefas estáticas.'
  },
  balanced: {
    id: 'balanced',
    name: 'Equilibrado',
    tagline: 'Excelente nitidez e fluidez constante',
    resolution: '1920 × 1080 (Full HD)',
    width: 1920,
    height: 1080,
    targetFps: 60,
    bitrateKbps: 6000,
    encoderPreset: 'RealTime / Balanced',
    bufferFrames: 1,
    cpuTargetPercent: '< 4.0% em CPU moderna',
    networkBandwidth: '~6.0 Mbps',
    latencyEstimateMs: 16,
    description: 'Perfil padrão recomendado: texto nítido, navegação natural a 60 FPS com excelente estabilidade de rede em Wi-Fi 2.4GHz ou 5GHz.'
  },
  low_latency: {
    id: 'low_latency',
    name: 'Baixa Latência',
    tagline: 'Resposta ao toque em tempo real (< 15ms)',
    resolution: '1920 × 1080 (Full HD / Nativa)',
    width: 1920,
    height: 1080,
    targetFps: 60,
    bitrateKbps: 8000,
    encoderPreset: 'UltraLowLatency / Zero-Buffer',
    bufferFrames: 0,
    cpuTargetPercent: '< 5.5% em CPU moderna',
    networkBandwidth: '~8.0 Mbps',
    latencyEstimateMs: 12,
    description: 'Modo de latência ultra reduzida: descarta qualquer quadro enfileirado para exibir sempre o frame mais recente e prioriza pacotes de toque com envio imediato.'
  }
};

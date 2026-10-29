export type StreamProfileType = 'economy' | 'balanced' | 'low_latency';
export type ConnectionTransportType = 'wifi' | 'usb_rndis' | 'bluetooth_rfcomm' | 'hybrid';
export type AndroidColorMode = 'full_color' | 'grayscale';
export type AndroidTransmissionMode = 'standard' | 'economy';

export interface AndroidStreamSettings {
  colorMode: AndroidColorMode;
  transmissionMode: AndroidTransmissionMode;
}

export interface WindowsAdvancedConfig {
  profile: StreamProfileType;
  resolution: string;
  fps: number;
  bitrateKbps: number;
  useHardwareEncoder: boolean;
  networkAdaptation: boolean;
  autoReconnect: boolean;
  resourceLimitCpuPct: number;
}

export interface StreamProfileConfig {
  id: StreamProfileType;
  name: string;
  tagline: string;
  resolution: string;
  width: number;
  height: number;
  targetFps: number;
  bitrateKbps: number;
  encoderPreset: string;
  bufferFrames: number;
  cpuTargetPercent: string;
  networkBandwidth: string;
  latencyEstimateMs: number;
  description: string;
}

export interface TouchEventPacket {
  version: number;
  sequence: number;
  timestamp: number;
  action: 'DOWN' | 'MOVE' | 'UP' | 'CANCEL';
  pointerId: number;
  normX: number;
  normY: number;
  targetPixelX: number;
  targetPixelY: number;
  pressure: number;
  majorAxis: number;
  buttonState: number; // 1 = Left, 2 = Right, 4 = Middle
}

export interface KeyboardEventPacket {
  version: number;
  sequence: number;
  timestamp: number;
  action: 'KEY_DOWN' | 'KEY_UP' | 'UNICODE_CHAR';
  virtualKey: number;    // Windows VK_* code (ex: VK_BACK=0x08, VK_RETURN=0x0D)
  unicodeChar: number;   // UTF-16 code point (ex: 'á', 'ç', 'ã', 'õ')
  modifiers: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    win: boolean;
  };
}

export interface InputFocusState {
  isTextFieldFocused: boolean;
  fieldType?: string;    // 'edit' | 'document' | 'combobox' | 'password'
  fieldName?: string;    // Label or accessible name (ex: "Pesquisar no Windows")
  sourceApp?: string;    // Process or app name (ex: "chrome.exe", "notepad.exe")
  isMultiLine?: boolean; // Se true, Enter insere quebra de linha; se false, Enter conclui e fecha teclado
  dismissOnEnter?: boolean;
  boundingRectangle?: { left: number; top: number; width: number; height: number };
}

export interface BluetoothDeviceInfo {
  address: string;
  name: string;
  rssi?: number;
  isPaired: boolean;
  isConnected: boolean;
  supportedProfiles: ('RFCOMM_SPP' | 'BLE_GATT')[];
  latencyMs: number;
}

export interface DevicePairingInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'android_phone' | 'android_tablet' | 'windows_pc';
  ipAddress: string;
  port: number;
  bluetoothAddress?: string;
  activeTransport: ConnectionTransportType;
  pairingCode: string;
  pairingQrData: string;
  pairedAt?: string;
  status: 'discovered' | 'pairing_pending' | 'paired' | 'rejected' | 'connected' | 'disconnected';
}

export interface BenchmarkMetrics {
  captureTimeMs: number;
  hardwareEncodeTimeMs: number;
  networkTransferTimeMs: number;
  hardwareDecodeTimeMs: number;
  surfaceRenderTimeMs: number;
  touchInputRoundTripMs: number;
  totalEndToEndLatencyMs: number;
  actualFps: number;
  droppedFrames: number;
  bitrateUsedKbps: number;
  cpuUsagePct: number;
  gpuVideoDecodePct: number;
  ramUsageMb: number;
}

export interface ProjectSourceFile {
  path: string;
  language: 'kotlin' | 'csharp' | 'xml' | 'json' | 'inno' | 'batch' | 'powershell' | 'markdown' | 'gradle' | 'toml' | 'properties' | 'proguard' | 'shell';
  description: string;
  content: string;
}


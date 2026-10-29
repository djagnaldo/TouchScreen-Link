import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Square, 
  Smartphone, 
  Monitor, 
  Activity, 
  Zap, 
  MousePointer2, 
  CheckCircle, 
  Layers, 
  Maximize2,
  RefreshCw,
  Sliders,
  Paintbrush,
  Sparkles,
  AlertCircle,
  Keyboard,
  Minimize2,
  Bluetooth,
  Usb,
  Wifi,
  Search,
  Type,
  FileText,
  Settings,
  Shield,
  Palette,
  Power,
  X,
  Lock,
  UserCheck,
  Check,
  ArrowRight
} from 'lucide-react';
import { 
  StreamProfileType, 
  TouchEventPacket, 
  KeyboardEventPacket, 
  ConnectionTransportType,
  AndroidColorMode,
  AndroidTransmissionMode
} from '../types/touchscreen';
import { STREAM_PROFILES } from '../data/profilesData';

interface InteractiveTestBenchProps {
  activeProfile: StreamProfileType;
  onChangeProfile: (profile: StreamProfileType) => void;
}

export const InteractiveTestBench: React.FC<InteractiveTestBenchProps> = ({
  activeProfile,
  onChangeProfile
}) => {
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [streamSource, setStreamSource] = useState<'interactive_desktop' | 'real_screen'>('interactive_desktop');
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [deviceOrientation, setDeviceOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [activeTransport, setActiveTransport] = useState<ConnectionTransportType>('wifi');
  
  // Android Client Basic Settings (on-demand modal - Section 3.1)
  const [isBasicSettingsOpen, setIsBasicSettingsOpen] = useState<boolean>(false);
  const [colorMode, setColorMode] = useState<AndroidColorMode>('full_color');
  const [transmissionMode, setTransmissionMode] = useState<AndroidTransmissionMode>('standard');

  // Windows Administration Console State (Section 3.2)
  const [windowsTab, setWindowsTab] = useState<'quick_connect' | 'stream_config' | 'diagnostics' | 'security'>('quick_connect');
  const [windowsServerStatus, setWindowsServerStatus] = useState<'running' | 'stopped' | 'waiting'>('running');
  const [authorizedPin, setAuthorizedPin] = useState<string>('748291');
  const [requirePriorAuthorization, setRequirePriorAuthorization] = useState<boolean>(true);
  const [clientConnected, setClientConnected] = useState<boolean>(true);
  const [authorizedDevices, setAuthorizedDevices] = useState<Array<{ id: string; name: string; ip: string; transport: string; pairedAt: string }>>([
    { id: 'dev-1', name: 'Tablet Samsung Galaxy Tab S8', ip: '192.168.1.142', transport: 'Wi-Fi 5GHz', pairedAt: 'Hoje, 10:24' },
    { id: 'dev-2', name: 'Xiaomi Pad 6', ip: '192.168.1.175', transport: 'USB RNDIS', pairedAt: 'Ontem, 16:50' }
  ]);

  // Floating Mini Keyboard State (Section 13, 14, 16)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);
  const [isKeyboardMinimized, setIsKeyboardMinimized] = useState<boolean>(false);
  const [keyboardPos, setKeyboardPos] = useState<{ x: number; y: number }>({ x: 30, y: 180 });
  const [isDraggingKeyboard, setIsDraggingKeyboard] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({ startX: 0, startY: 0, initX: 0, initY: 0 });
  
  // Typing & Text Focus state inside simulated PC desktop
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [smartFocusEnabled, setSmartFocusEnabled] = useState<boolean>(true);
  const [simulatedPcText, setSimulatedPcText] = useState<string>('TouchScreen Link ');
  const [pendingDeadKey, setPendingDeadKey] = useState<string | null>(null);
  const [isShiftActive, setIsShiftActive] = useState<boolean>(false);
  const [isCtrlActive, setIsCtrlActive] = useState<boolean>(false);
  const [isAltActive, setIsAltActive] = useState<boolean>(false);
  const [lastKeyboardPacket, setLastKeyboardPacket] = useState<KeyboardEventPacket | null>(null);

  // Real-time diagnostics state
  const [fps, setFps] = useState<number>(60);
  const [latencyMs, setLatencyMs] = useState<number>(14);
  const [packetCount, setPacketCount] = useState<number>(0);
  const [lastPacket, setLastPacket] = useState<TouchEventPacket | null>(null);
  const [binaryBytePreview, setBinaryBytePreview] = useState<string>('');
  
  // Canvas & Interaction references
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const paintCanvasRef = useRef<HTMLCanvasElement>(null);
  const [touchTrail, setTouchTrail] = useState<{ x: number; y: number; id: number }[]>([]);

  // Simulation parameters based on active profile
  const profileConfig = STREAM_PROFILES[activeProfile];
  const pcWidth = profileConfig.width;
  const pcHeight = profileConfig.height;

  // Real Screen Capture handler
  const handleStartRealScreenCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: profileConfig.targetFps,
          displaySurface: 'monitor'
        },
        audio: false
      });
      setScreenStream(stream);
      setStreamSource('real_screen');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Captura cancelada:', err);
      setStreamSource('interactive_desktop');
    }
  };

  const handleStopRealScreenCapture = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    setStreamSource('interactive_desktop');
  };

  // Keyboard Typing Engine with Portuguese Accents
  const handleVirtualKeyPress = (key: string, isSpecial: boolean = false) => {
    let finalChar = key;

    if (isSpecial) {
      if (key === 'Backspace') {
        setSimulatedPcText(prev => prev.slice(0, -1));
        const pkt: KeyboardEventPacket = {
          version: 1,
          sequence: packetCount + 1,
          timestamp: Date.now() & 0xFFFFFFFF,
          action: 'KEY_DOWN',
          virtualKey: 0x08, // VK_BACK
          unicodeChar: 0,
          modifiers: { shift: isShiftActive, ctrl: isCtrlActive, alt: isAltActive, win: false }
        };
        setLastKeyboardPacket(pkt);
        setPacketCount(prev => prev + 1);
        return;
      }
      if (key === 'Enter') {
        const isSingleLine = focusedField === 'Pesquisar no Windows' || focusedField === 'Barra de Endereço';
        if (isSingleLine) {
          // Regra 3: Fechamento após concluir busca com Enter
          setIsKeyboardOpen(false);
          setFocusedField(null);
        } else {
          // Multilinhas (ex: Bloco de Notas): insere quebra de linha normalmente
          setSimulatedPcText(prev => prev + '\n');
        }

        const pkt: KeyboardEventPacket = {
          version: 1,
          sequence: packetCount + 1,
          timestamp: Date.now() & 0xFFFFFFFF,
          action: 'KEY_DOWN',
          virtualKey: 0x0D, // VK_RETURN
          unicodeChar: 0,
          modifiers: { shift: isShiftActive, ctrl: isCtrlActive, alt: isAltActive, win: false }
        };
        setLastKeyboardPacket(pkt);
        setPacketCount(prev => prev + 1);
        return;
      }
      if (key === 'Tab') {
        setSimulatedPcText(prev => prev + '    ');
        return;
      }
      if (['´', '`', '~', '^'].includes(key)) {
        setPendingDeadKey(key);
        return;
      }
    }

    // Apply pending dead key accent
    if (pendingDeadKey) {
      const lower = key.toLowerCase();
      if (pendingDeadKey === '´') {
        if (lower === 'a') finalChar = isShiftActive ? 'Á' : 'á';
        else if (lower === 'e') finalChar = isShiftActive ? 'É' : 'é';
        else if (lower === 'i') finalChar = isShiftActive ? 'Í' : 'í';
        else if (lower === 'o') finalChar = isShiftActive ? 'Ó' : 'ó';
        else if (lower === 'u') finalChar = isShiftActive ? 'Ú' : 'ú';
      } else if (pendingDeadKey === '~') {
        if (lower === 'a') finalChar = isShiftActive ? 'Ã' : 'ã';
        else if (lower === 'o') finalChar = isShiftActive ? 'Õ' : 'õ';
      } else if (pendingDeadKey === '^') {
        if (lower === 'a') finalChar = isShiftActive ? 'Â' : 'â';
        else if (lower === 'e') finalChar = isShiftActive ? 'Ê' : 'ê';
        else if (lower === 'o') finalChar = isShiftActive ? 'Ô' : 'ô';
      } else if (pendingDeadKey === '`') {
        if (lower === 'a') finalChar = isShiftActive ? 'À' : 'à';
      }
      setPendingDeadKey(null);
    } else {
      finalChar = isShiftActive ? key.toUpperCase() : key;
    }

    setSimulatedPcText(prev => prev + finalChar);

    const pkt: KeyboardEventPacket = {
      version: 1,
      sequence: packetCount + 1,
      timestamp: Date.now() & 0xFFFFFFFF,
      action: 'UNICODE_CHAR',
      virtualKey: 0,
      unicodeChar: finalChar.charCodeAt(0),
      modifiers: { shift: isShiftActive, ctrl: isCtrlActive, alt: isAltActive, win: false }
    };
    setLastKeyboardPacket(pkt);
    setPacketCount(prev => prev + 1);

    if (isShiftActive) setIsShiftActive(false);
  };

  // Regra 1 e 5: Abertura e Reabertura Contextual Automática
  const handleSelectSimulatedField = (fieldName: string, defaultPosition: 'bottom' | 'top' = 'bottom') => {
    setFocusedField(fieldName);
    if (smartFocusEnabled) {
      // Regra 6: Posiciona de forma inteligente para não bloquear o campo
      if (defaultPosition === 'bottom') {
        setKeyboardPos({ x: 30, y: 190 });
      } else {
        setKeyboardPos({ x: 30, y: 40 });
      }
      setIsKeyboardOpen(true);
      setIsKeyboardMinimized(false);
    }
  };

  // Touch and pointer interaction calculations
  const processPointerEvent = useCallback((e: React.PointerEvent<HTMLDivElement>, action: 'DOWN' | 'MOVE' | 'UP') => {
    if (!containerRef.current || !isStreaming || !clientConnected) return;

    // Regra 2: Fechamento ao tocar fora do campo de texto
    // Se o usuário tocou em uma área livre da tela, fecha o teclado imediatamente
    // e executa a ação de toque no Windows simultaneamente (sem perda de tempo)
    if (action === 'DOWN') {
      const targetElement = e.target as HTMLElement;
      const isClickInsideTextField = targetElement.closest('.windows-text-field-area') !== null;
      const isClickInsideKeyboard = targetElement.closest('.touchscreen-virtual-keyboard') !== null;

      if (!isClickInsideTextField && !isClickInsideKeyboard) {
        if (isKeyboardOpen) {
          setIsKeyboardOpen(false);
          setFocusedField(null);
        }
      }
    }

    const rect = containerRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    // Proporção de aspecto para cálculo exato de letterbox / pillarbox
    const viewWidth = rect.width;
    const viewHeight = rect.height;
    const pcAspect = pcWidth / pcHeight;
    const viewAspect = viewWidth / viewHeight;

    let renderedLeft = 0;
    let renderedTop = 0;
    let renderedWidth = viewWidth;
    let renderedHeight = viewHeight;

    if (viewAspect > pcAspect) {
      // Pillarbox (barras pretas laterais)
      renderedHeight = viewHeight;
      renderedWidth = viewHeight * pcAspect;
      renderedLeft = (viewWidth - renderedWidth) / 2;
    } else {
      // Letterbox (barras pretas superior/inferior)
      renderedWidth = viewWidth;
      renderedHeight = viewWidth / pcAspect;
      renderedTop = (viewHeight - renderedHeight) / 2;
    }

    // Clamp e normalização
    const clampedX = Math.max(renderedLeft, Math.min(rawX, renderedLeft + renderedWidth));
    const clampedY = Math.max(renderedTop, Math.min(rawY, renderedTop + renderedHeight));

    const normX = (clampedX - renderedLeft) / renderedWidth;
    const normY = (clampedY - renderedTop) / renderedHeight;

    const targetPixelX = Math.round(normX * (pcWidth - 1));
    const targetPixelY = Math.round(normY * (pcHeight - 1));

    const timestamp = Date.now() & 0xFFFFFFFF;
    const actionCode = action === 'DOWN' ? 0 : action === 'MOVE' ? 1 : 2;

    const packet: TouchEventPacket = {
      version: 1,
      sequence: packetCount + 1,
      timestamp,
      action,
      pointerId: e.pointerId % 10,
      normX,
      normY,
      targetPixelX,
      targetPixelY,
      pressure: e.pressure || 0.5,
      majorAxis: 10,
      buttonState: e.buttons || (action === 'UP' ? 0 : 1)
    };

    setLastPacket(packet);
    setPacketCount(prev => prev + 1);

    // Formata os 24 bytes para visualização em hexadecimal
    const hex = [
      '54', // Magic 'T'
      actionCode.toString(16).padStart(2, '0'),
      (packet.pointerId).toString(16).padStart(2, '0'),
      '00', // Flags
      (timestamp & 0xFF).toString(16).padStart(2, '0'),
      ((timestamp >> 8) & 0xFF).toString(16).padStart(2, '0'),
      ((timestamp >> 16) & 0xFF).toString(16).padStart(2, '0'),
      ((timestamp >> 24) & 0xFF).toString(16).padStart(2, '0'),
      '..[normX]..',
      '..[normY]..',
      targetPixelX.toString(16).padStart(4, '0'),
      targetPixelY.toString(16).padStart(4, '0')
    ].join(' ');
    setBinaryBytePreview(hex);

    // Atualiza rastro de toque visual
    if (action === 'UP') {
      setTouchTrail(prev => prev.filter(t => t.id !== e.pointerId));
    } else {
      setTouchTrail(prev => {
        const others = prev.filter(t => t.id !== e.pointerId);
        return [...others, { x: rawX, y: rawY, id: e.pointerId }];
      });
    }

    // Desenha na tela de teste de desenho interativo se ativo
    if (paintCanvasRef.current && (action === 'DOWN' || action === 'MOVE')) {
      const ctx = paintCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        if (action === 'DOWN') {
          ctx.beginPath();
          ctx.moveTo(normX * paintCanvasRef.current.width, normY * paintCanvasRef.current.height);
        } else {
          ctx.lineTo(normX * paintCanvasRef.current.width, normY * paintCanvasRef.current.height);
          ctx.stroke();
        }
      }
    }
  }, [containerRef, isStreaming, clientConnected, packetCount, pcWidth, pcHeight, isKeyboardOpen]);

  // Limpa o canvas de teste de desenho
  const clearPaintCanvas = () => {
    if (paintCanvasRef.current) {
      const ctx = paintCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, paintCanvasRef.current.width, paintCanvasRef.current.height);
      }
    }
  };

  // FPS e Latency fluctuation simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const jitter = (Math.random() - 0.5) * 2;
      setFps(Math.round(profileConfig.targetFps + (Math.random() > 0.8 ? -1 : 0)));
      setLatencyMs(Math.max(8, Math.round(profileConfig.latencyEstimateMs + jitter)));
    }, 1200);
    return () => clearInterval(interval);
  }, [profileConfig]);

  // Generate random 6-digit PIN
  const handleRegeneratePin = () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setAuthorizedPin(newPin);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-200">
      {/* Test Bench Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setIsStreaming(!isStreaming);
              setClientConnected(!isStreaming);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
              isStreaming && clientConnected
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            {isStreaming && clientConnected ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                Sessão Ativa (Pausar)
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Iniciar Sessão
              </>
            )}
          </button>

          {/* Modalidade de Conexão (Wi-Fi, USB, Bluetooth, Híbrido) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="px-2 text-slate-400 font-medium hidden sm:inline">Transporte:</span>
            <button
              onClick={() => { setActiveTransport('wifi'); setLatencyMs(13); }}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                activeTransport === 'wifi' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              Wi-Fi 5GHz
            </button>
            <button
              onClick={() => { setActiveTransport('usb_rndis'); setLatencyMs(6); }}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                activeTransport === 'usb_rndis' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Usb className="w-3.5 h-3.5" />
              USB (RNDIS)
            </button>
            <button
              onClick={() => { setActiveTransport('bluetooth_rfcomm'); setLatencyMs(24); }}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                activeTransport === 'bluetooth_rfcomm' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Bluetooth Classic RFCOMM para controle e digitação sem rede"
            >
              <Bluetooth className="w-3.5 h-3.5" />
              Bluetooth SPP
            </button>
            <button
              onClick={() => { setActiveTransport('hybrid'); setLatencyMs(11); }}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                activeTransport === 'hybrid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Híbrido: Vídeo por Wi-Fi + Comandos de Teclado/Toque por Bluetooth"
            >
              <Zap className="w-3.5 h-3.5" />
              Híbrido
            </button>
          </div>

          {/* Fonte do Stream */}
          <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={handleStopRealScreenCapture}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                streamSource === 'interactive_desktop'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Desktop PC
            </button>
            <button
              onClick={handleStartRealScreenCapture}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                streamSource === 'real_screen'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Transmitir Tela Real
            </button>
          </div>
        </div>

        {/* Orientation & Clear Paint */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setDeviceOrientation(prev => prev === 'landscape' ? 'portrait' : 'landscape')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
          >
            <Smartphone className="w-3.5 h-3.5" />
            {deviceOrientation === 'landscape' ? 'Horizontal' : 'Vertical'}
          </button>
          <button
            onClick={clearPaintCanvas}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
            title="Limpar tela de desenho"
          >
            <Paintbrush className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Sandbox Area: Left side Tablet (100% clean), Right side Windows Console */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Simulated Android Tablet Surface (Clean Mirror - Section 3.1) */}
        <div className="xl:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${clientConnected && isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <b>Tela do Tablet Android (Cliente)</b>
              <span className="text-emerald-400 text-[11px] font-medium hidden sm:inline">— 100% Limpa, sem HUD ou sobreposições</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBasicSettingsOpen(true)}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Simular Gesto com 3 Dedos para abrir Configurações Básicas"
              >
                <Sliders className="w-3 h-3 text-cyan-400" />
                Gesto: 3 Dedos
              </button>
            </div>
          </div>

          {/* Tablet Outer Physical Frame */}
          <div className="bg-slate-950 p-3 sm:p-5 rounded-3xl border-4 border-slate-800 shadow-2xl relative">
            {/* Tablet Camera notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-800/80 border border-slate-700"></div>

            {/* Active Display Surface — ZERO PERMANENT OVERLAYS (Section 3.1) */}
            <div
              ref={containerRef}
              onPointerDown={e => {
                e.currentTarget.setPointerCapture(e.pointerId);
                processPointerEvent(e, 'DOWN');
              }}
              onPointerMove={e => {
                processPointerEvent(e, 'MOVE');
              }}
              onPointerUp={e => {
                processPointerEvent(e, 'UP');
              }}
              onPointerCancel={e => {
                processPointerEvent(e, 'UP');
              }}
              className={`w-full ${
                deviceOrientation === 'landscape' ? 'aspect-16/10' : 'aspect-10/16'
              } bg-black rounded-xl overflow-hidden relative select-none cursor-crosshair touch-none border border-slate-800 flex items-center justify-center`}
            >
              {/* Stream Content (With Grayscale Filter support when selected by user) */}
              {!clientConnected || !isStreaming ? (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <Power className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Desconectado do Computador</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      O espelhamento foi pausado ou desconectado. Inicie uma nova sessão no controle superior.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsStreaming(true);
                      setClientConnected(true);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                  >
                    Reconectar
                  </button>
                </div>
              ) : streamSource === 'real_screen' ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ filter: colorMode === 'grayscale' ? 'grayscale(100%)' : 'none' }}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                /* Simulated Windows 11 Desktop with interactive testing elements */
                <div 
                  style={{ filter: colorMode === 'grayscale' ? 'grayscale(100%)' : 'none' }}
                  className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 relative overflow-hidden flex flex-col justify-between p-4"
                >
                  {/* Canvas layer for touch drawing latency verification */}
                  <canvas
                    ref={paintCanvasRef}
                    width={960}
                    height={600}
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  />

                  {/* Desktop Icons (Clicking them closes keyboard if open and selects icon in 1 tap - Rule 2 & 8) */}
                  <div className="grid grid-cols-3 gap-3 w-56 text-[11px] text-white z-20">
                    <button 
                      onClick={() => {
                        setIsKeyboardOpen(false);
                        setFocusedField(null);
                      }}
                      className="flex flex-col items-center p-2 rounded-lg hover:bg-white/10 active:bg-cyan-500/20 text-center transition-colors cursor-pointer"
                    >
                      <Monitor className="w-6 h-6 text-cyan-400 mb-1" />
                      <span>Este PC</span>
                    </button>
                    <button 
                      onClick={() => {
                        setIsKeyboardOpen(false);
                        setFocusedField(null);
                      }}
                      className="flex flex-col items-center p-2 rounded-lg hover:bg-white/10 active:bg-cyan-500/20 text-center transition-colors cursor-pointer"
                    >
                      <Paintbrush className="w-6 h-6 text-pink-400 mb-1" />
                      <span>Desenho</span>
                    </button>
                    <button 
                      onClick={() => {
                        setIsKeyboardOpen(false);
                        setFocusedField(null);
                      }}
                      className="flex flex-col items-center p-2 rounded-lg hover:bg-white/10 active:bg-cyan-500/20 text-center transition-colors cursor-pointer"
                    >
                      <Zap className="w-6 h-6 text-amber-400 mb-1" />
                      <span>Controles</span>
                    </button>
                  </div>

                  {/* Windows Search Bar (Interactive for testing Smart Focus - Rule 1 & 3) */}
                  <div className="z-20 max-w-sm windows-text-field-area">
                    <label className="text-[10px] text-cyan-300 block mb-1 font-semibold flex items-center gap-1">
                      <Search className="w-3 h-3" />
                      Toque para testar detecção de foco no Windows:
                    </label>
                    <div
                      onClick={() => handleSelectSimulatedField('Pesquisar no Windows', 'bottom')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all cursor-text ${
                        focusedField === 'Pesquisar no Windows'
                          ? 'bg-slate-900/90 border-cyan-400 ring-2 ring-cyan-500/30 text-white'
                          : 'bg-slate-950/70 hover:bg-slate-900/80 border-slate-700 text-slate-300'
                      }`}
                    >
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">
                        {focusedField === 'Pesquisar no Windows' ? simulatedPcText || 'Digite aqui...' : 'Pesquisar aplicativos e arquivos...'}
                      </span>
                    </div>
                  </div>

                  {/* Windows 11 Taskbar */}
                  <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-lg p-1.5 border border-white/10 flex items-center justify-between text-xs text-white z-20">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-cyan-600 flex items-center justify-center font-bold text-xs shadow">
                        田
                      </div>
                      <button 
                        onClick={() => handleSelectSimulatedField('Barra de Endereço', 'top')}
                        className="windows-text-field-area px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1.5 cursor-text"
                      >
                        <FileText className="w-3 h-3 text-cyan-400" />
                        <span>Bloco de Notas</span>
                      </button>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
                      <span>{colorMode === 'grayscale' ? 'PB' : 'RGB'}</span>
                      <span>14:32</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Mini Virtual Keyboard (Regras 1 a 9) */}
              {isKeyboardOpen && clientConnected && (
                <div
                  style={{
                    left: `${keyboardPos.x}px`,
                    top: `${keyboardPos.y}px`
                  }}
                  className={`touchscreen-virtual-keyboard absolute z-50 transition-shadow select-none shadow-2xl rounded-2xl border border-cyan-500/40 bg-slate-950/95 backdrop-blur-xl ${
                    isKeyboardMinimized ? 'w-48 p-2' : 'w-76 sm:w-88 p-3'
                  }`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {/* Keyboard Header with drag handle and close button (Rule 4) */}
                  <div 
                    className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 cursor-grab active:cursor-grabbing"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setIsDraggingKeyboard(true);
                      dragStartRef.current = {
                        startX: e.clientX,
                        startY: e.clientY,
                        initX: keyboardPos.x,
                        initY: keyboardPos.y
                      };
                      const onMove = (moveEvt: PointerEvent) => {
                        const deltaX = moveEvt.clientX - dragStartRef.current.startX;
                        const deltaY = moveEvt.clientY - dragStartRef.current.startY;
                        setKeyboardPos({
                          x: Math.max(10, Math.min(320, dragStartRef.current.initX + deltaX)),
                          y: Math.max(10, Math.min(220, dragStartRef.current.initY + deltaY))
                        });
                      };
                      const onUp = () => {
                        window.removeEventListener('pointermove', onMove);
                        window.removeEventListener('pointerup', onUp);
                        setIsDraggingKeyboard(false);
                      };
                      window.addEventListener('pointermove', onMove);
                      window.addEventListener('pointerup', onUp);
                    }}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>Mini Teclado</span>
                      {pendingDeadKey && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded border border-amber-500/40 animate-pulse">
                          Acento '{pendingDeadKey}'
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setIsKeyboardMinimized(!isKeyboardMinimized)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                        title={isKeyboardMinimized ? 'Expandir' : 'Minimizar'}
                      >
                        {isKeyboardMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => {
                          setIsKeyboardOpen(false);
                          setFocusedField(null);
                        }}
                        className="p-1 rounded hover:bg-rose-900/50 text-slate-400 hover:text-rose-300"
                        title="Fechar (Voltar)"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {!isKeyboardMinimized && (
                    <div className="space-y-1.5 text-xs">
                      {/* Portuguese Accents Row */}
                      <div className="flex gap-1 justify-center">
                        {['´', '`', '~', '^', 'ç'].map(acc => (
                          <button
                            key={acc}
                            onClick={() => handleVirtualKeyPress(acc, acc !== 'ç')}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-600/40 active:bg-cyan-500 border border-slate-700 text-amber-300 font-bold transition-colors cursor-pointer"
                          >
                            {acc}
                          </button>
                        ))}
                      </div>

                      {/* Row 1: Numbers */}
                      <div className="grid grid-cols-10 gap-1">
                        {['1','2','3','4','5','6','7','8','9','0'].map(num => (
                          <button
                            key={num}
                            onClick={() => handleVirtualKeyPress(num)}
                            className="py-1 rounded bg-slate-900 hover:bg-slate-800 active:bg-cyan-600 text-white font-mono text-center border border-slate-800 text-[11px]"
                          >
                            {num}
                          </button>
                        ))}
                      </div>

                      {/* Row 2: QWERTY */}
                      <div className="grid grid-cols-10 gap-1">
                        {['q','w','e','r','t','y','u','i','o','p'].map(char => (
                          <button
                            key={char}
                            onClick={() => handleVirtualKeyPress(char)}
                            className="py-1 rounded bg-slate-900 hover:bg-slate-800 active:bg-cyan-600 text-slate-200 font-medium text-center border border-slate-800 text-[11px]"
                          >
                            {isShiftActive ? char.toUpperCase() : char}
                          </button>
                        ))}
                      </div>

                      {/* Row 3: ASDF */}
                      <div className="grid grid-cols-9 gap-1 px-2">
                        {['a','s','d','f','g','h','j','k','l'].map(char => (
                          <button
                            key={char}
                            onClick={() => handleVirtualKeyPress(char)}
                            className="py-1 rounded bg-slate-900 hover:bg-slate-800 active:bg-cyan-600 text-slate-200 font-medium text-center border border-slate-800 text-[11px]"
                          >
                            {isShiftActive ? char.toUpperCase() : char}
                          </button>
                        ))}
                      </div>

                      {/* Row 4: ZXCV + Modifiers */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => setIsShiftActive(!isShiftActive)}
                          className={`px-2 py-1 rounded font-bold text-[10px] border ${
                            isShiftActive ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          Shift
                        </button>
                        <div className="grid grid-cols-7 gap-1 flex-1">
                          {['z','x','c','v','b','n','m'].map(char => (
                            <button
                              key={char}
                              onClick={() => handleVirtualKeyPress(char)}
                              className="py-1 rounded bg-slate-900 hover:bg-slate-800 active:bg-cyan-600 text-slate-200 font-medium text-center border border-slate-800 text-[11px]"
                            >
                              {isShiftActive ? char.toUpperCase() : char}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => handleVirtualKeyPress('Backspace', true)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 active:bg-rose-600 text-slate-300 text-[10px] border border-slate-700"
                        >
                          ←
                        </button>
                      </div>

                      {/* Row 5: Action Keys */}
                      <div className="flex gap-1 pt-1">
                        <button
                          onClick={() => handleVirtualKeyPress('Tab', true)}
                          className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-[10px] border border-slate-700"
                        >
                          Tab
                        </button>
                        <button
                          onClick={() => handleVirtualKeyPress(' ')}
                          className="flex-1 py-1 rounded bg-slate-900 hover:bg-slate-800 active:bg-cyan-600 text-slate-400 text-[10px] border border-slate-800 text-center"
                        >
                          Espaço
                        </button>
                        <button
                          onClick={() => handleVirtualKeyPress('Enter', true)}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow"
                        >
                          <span>Enter</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Touch Visualizer Circles */}
              {touchTrail.map((touch) => (
                <div
                  key={touch.id}
                  style={{
                    left: `${touch.x}px`,
                    top: `${touch.y}px`
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-cyan-400 bg-cyan-400/30 pointer-events-none z-40 animate-ping-once"
                />
              ))}

              {/* On-Demand Android Basic Settings Modal (Section 3.1) */}
              {isBasicSettingsOpen && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Sliders className="w-4 h-4 text-cyan-400" />
                        <span>Configurações Básicas (Android)</span>
                      </div>
                      <button
                        onClick={() => setIsBasicSettingsOpen(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Mode de Cor */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Modo de Cor da Imagem:
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          onClick={() => setColorMode('full_color')}
                          className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                            colorMode === 'full_color'
                              ? 'bg-cyan-950/60 border-cyan-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="font-bold flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5 text-cyan-400" />
                            Cores Completas
                          </span>
                          <span className="text-[10px] text-slate-400">Padrão RGB 32-bits</span>
                        </button>

                        <button
                          onClick={() => setColorMode('grayscale')}
                          className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                            colorMode === 'grayscale'
                              ? 'bg-cyan-950/60 border-cyan-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="font-bold flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-slate-400 inline-block"></span>
                            Escala de Cinza
                          </span>
                          <span className="text-[10px] text-slate-400">Economia máxima</span>
                        </button>
                      </div>
                    </div>

                    {/* Modo de Transmissão */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Modo de Transmissão:
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          onClick={() => setTransmissionMode('standard')}
                          className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                            transmissionMode === 'standard'
                              ? 'bg-cyan-950/60 border-cyan-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="font-bold">Padrão</span>
                          <span className="text-[10px] text-slate-400">Fidelidade e nitidez</span>
                        </button>

                        <button
                          onClick={() => setTransmissionMode('economy')}
                          className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                            transmissionMode === 'economy'
                              ? 'bg-cyan-950/60 border-cyan-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="font-bold">Econômico</span>
                          <span className="text-[10px] text-slate-400">Poupa bateria e rede</span>
                        </button>
                      </div>
                    </div>

                    {/* Teclado Virtual Manual Toggle */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-300">Exibir Mini Teclado Flutuante:</span>
                      <button
                        onClick={() => {
                          setIsKeyboardOpen(!isKeyboardOpen);
                          setIsKeyboardMinimized(false);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                          isKeyboardOpen
                            ? 'bg-cyan-600 text-white border-cyan-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {isKeyboardOpen ? 'Ativo' : 'Oculto'}
                      </button>
                    </div>

                    {/* Disconnect Action */}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setClientConnected(false);
                          setIsStreaming(false);
                          setIsBasicSettingsOpen(false);
                        }}
                        className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Power className="w-3.5 h-3.5" />
                        Desconectar Sessão
                      </button>
                      <button
                        onClick={() => setIsBasicSettingsOpen(false)}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Instruction Footer on Tablet */}
            <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
              <span>Orientação paisagem recomendada. Display 100% limpo sem sobreposições.</span>
              <span className="text-cyan-400 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Toque de 3 dedos abre controles básicos
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Windows Administration & Server Console (Section 3.2) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-md overflow-hidden">
            {/* Windows Console Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">TouchScreen Link — PC Windows</h3>
                  <span className="text-[10px] text-slate-400">Central de Administração do Servidor</span>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2.5 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Servidor Ativo
              </span>
            </div>

            {/* Windows 4 Sections Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/60 text-xs font-medium overflow-x-auto">
              <button
                onClick={() => setWindowsTab('quick_connect')}
                className={`flex-1 py-2.5 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
                  windowsTab === 'quick_connect'
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                Início & Conexão
              </button>
              <button
                onClick={() => setWindowsTab('stream_config')}
                className={`flex-1 py-2.5 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
                  windowsTab === 'stream_config'
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Transmissão
              </button>
              <button
                onClick={() => setWindowsTab('diagnostics')}
                className={`flex-1 py-2.5 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
                  windowsTab === 'diagnostics'
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Diagnóstico
              </button>
              <button
                onClick={() => setWindowsTab('security')}
                className={`flex-1 py-2.5 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
                  windowsTab === 'security'
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Segurança
              </button>
            </div>

            {/* Tab 1: Início & Conexão Rápida */}
            {windowsTab === 'quick_connect' && (
              <div className="p-4 space-y-4 text-xs">
                {/* Server Network Details */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-semibold text-white">Status do Servidor:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Em execução (Porta 59100)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-400 pt-1 border-t border-slate-800">
                    <div>
                      <span className="block text-[10px] text-slate-500">Endereço IP Local:</span>
                      <span className="font-mono text-cyan-400 font-semibold">192.168.1.105</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500">Descoberta UDP:</span>
                      <span className="font-mono text-slate-300">Porta 59101 (Ativo)</span>
                    </div>
                  </div>
                </div>

                {/* Active Connected Clients List */}
                <div className="space-y-2">
                  <span className="font-semibold text-white block">Conexão Ativa no Momento:</span>
                  {clientConnected ? (
                    <div className="bg-slate-950 p-3 rounded-lg border border-cyan-500/30 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Galaxy Tab S8 (Android 14)</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          192.168.1.142 • {activeTransport === 'wifi' ? 'Wi-Fi 5GHz' : activeTransport.toUpperCase()}
                        </div>
                        <div className="text-[10px] text-emerald-400">
                          Resolução: {pcWidth}×{pcHeight} @ {fps} FPS
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setClientConnected(false);
                          setIsStreaming(false);
                        }}
                        className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-md font-semibold text-[11px] transition-colors"
                      >
                        Desconectar
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center text-slate-500">
                      Nenhum cliente conectado no momento. Abra o app no Android para conectar.
                    </div>
                  )}
                </div>

                {/* System Settings & Startup */}
                <div className="pt-2 border-t border-slate-800 space-y-2 text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-cyan-600 bg-slate-950 border-slate-800" />
                    <span>Iniciar servidor automaticamente com o Windows</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-cyan-600 bg-slate-950 border-slate-800" />
                    <span>Minimizar para a bandeja do sistema ao fechar</span>
                  </label>
                </div>
              </div>
            )}

            {/* Tab 2: Configurações Avançadas de Transmissão (3 perfis reais) */}
            {windowsTab === 'stream_config' && (
              <div className="p-4 space-y-4 text-xs">
                <div>
                  <span className="font-semibold text-white block mb-1.5">Perfis Pré-configurados de Transmissão:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onChangeProfile('economy')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        activeProfile === 'economy'
                          ? 'bg-cyan-950 border-cyan-400 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-xs block text-cyan-300">1. Economia</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">720p @ 30 FPS</span>
                      <span className="text-[10px] text-emerald-400 font-mono block mt-1">2.5 Mbps • CPU mín.</span>
                    </button>

                    <button
                      onClick={() => onChangeProfile('balanced')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        activeProfile === 'balanced'
                          ? 'bg-cyan-950 border-cyan-400 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-xs block text-cyan-300">2. Equilibrado</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">1080p @ 45-60 FPS</span>
                      <span className="text-[10px] text-blue-400 font-mono block mt-1">6.5 Mbps • Ideal</span>
                    </button>

                    <button
                      onClick={() => onChangeProfile('low_latency')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        activeProfile === 'low_latency'
                          ? 'bg-cyan-950 border-cyan-400 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-xs block text-cyan-300">3. Baixa Latência</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">900p @ 60 FPS</span>
                      <span className="text-[10px] text-purple-400 font-mono block mt-1">8.0 Mbps • 1-frame</span>
                    </button>
                  </div>
                </div>

                {/* Manual Tuning Parameters */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-3">
                  <span className="font-semibold text-white block">Parâmetros Manuais de Hardware:</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Acelerador H.264:</label>
                      <select className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200 text-xs">
                        <option>D3D11 Video Processing (GPU)</option>
                        <option>NVIDIA NVENC Hardware</option>
                        <option>Intel QuickSync Video</option>
                        <option>AMD AMF Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Estratégia de Buffer:</label>
                      <select className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200 text-xs">
                        <option>Zero-Latency (1 frame)</option>
                        <option>Smooth Jitter (2 frames)</option>
                        <option>Adaptive Dynamico</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Diagnóstico Técnico & Métricas */}
            {windowsTab === 'diagnostics' && (
              <div className="p-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Latência Estimada</span>
                    <span className="text-base font-mono font-bold text-emerald-400">
                      {latencyMs} <span className="text-xs font-normal text-slate-400">ms</span>
                    </span>
                    <span className="text-[10px] text-slate-500 block">Ponta a ponta</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Captura DXGI & FPS</span>
                    <span className="text-base font-mono font-bold text-amber-400">
                      {fps} <span className="text-xs font-normal text-slate-400">FPS</span>
                    </span>
                    <span className="text-[10px] text-slate-500 block">Alvo: {profileConfig.targetFps} FPS</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Uso de CPU no PC</span>
                    <span className="text-base font-mono font-bold text-cyan-400">
                      2.4% <span className="text-xs font-normal text-slate-400">CPU</span>
                    </span>
                    <span className="text-[10px] text-slate-500 block">Zero cópia na memória</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Taxa de Dados</span>
                    <span className="text-base font-mono font-bold text-purple-400">
                      {(profileConfig.bitrateKbps / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">Mbps</span>
                    </span>
                    <span className="text-[10px] text-slate-500 block">H.264 MFT</span>
                  </div>
                </div>

                {/* Live Binary Packet Inspector */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-semibold text-white block">Último Pacote de Toque Recebido (24 bytes):</span>
                  {lastPacket ? (
                    <div className="font-mono text-[11px] text-cyan-300 bg-slate-900 p-2 rounded border border-slate-800 space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Ação / ID:</span>
                        <span className="text-emerald-400 font-bold">{lastPacket.action} (#{lastPacket.pointerId})</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Pixel Alvo:</span>
                        <span className="text-amber-400 font-bold">{lastPacket.targetPixelX} × {lastPacket.targetPixelY} px</span>
                      </div>
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 truncate">
                        Hex: {binaryBytePreview}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-center py-2 text-[11px]">
                      Aguardando eventos de toque na tela do tablet...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: Segurança & Pareamento */}
            {windowsTab === 'security' && (
              <div className="p-4 space-y-4 text-xs">
                {/* Authentication PIN Panel */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Chave PIN de Pareamento:</span>
                    <button
                      onClick={handleRegeneratePin}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Novo PIN
                    </button>
                  </div>
                  <div className="flex items-center justify-center p-3 bg-slate-900 rounded-lg border border-cyan-500/30">
                    <span className="text-2xl font-mono font-extrabold tracking-widest text-cyan-400">
                      {authorizedPin}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Digite este PIN no aplicativo Android para autorizar o acesso à tela e aos controles.
                  </p>
                </div>

                {/* Prior Authorization Toggle */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Exigir autorização manual no Windows para novos dispositivos</span>
                    <input
                      type="checkbox"
                      checked={requirePriorAuthorization}
                      onChange={e => setRequirePriorAuthorization(e.target.checked)}
                      className="rounded text-cyan-600 bg-slate-950 border-slate-800 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Authorized Devices List */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="font-semibold text-white block">Dispositivos Autorizados ({authorizedDevices.length}):</span>
                  {authorizedDevices.map(dev => (
                    <div key={dev.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-200 block">{dev.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{dev.ip} • Pareado: {dev.pairedAt}</span>
                      </div>
                      <button
                        onClick={() => setAuthorizedDevices(prev => prev.filter(d => d.id !== dev.id))}
                        className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline px-2 py-1"
                      >
                        Revogar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

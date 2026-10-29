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
  FileText
} from 'lucide-react';
import { StreamProfileType, TouchEventPacket, KeyboardEventPacket, ConnectionTransportType } from '../types/touchscreen';
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
  
  // Floating Mini Keyboard State
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);
  const [isKeyboardMinimized, setIsKeyboardMinimized] = useState<boolean>(false);
  const [keyboardPos, setKeyboardPos] = useState<{ x: number; y: number }>({ x: 40, y: 80 });
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
        setKeyboardPos({ x: 30, y: 220 });
      } else {
        setKeyboardPos({ x: 30, y: 40 });
      }
      setIsKeyboardOpen(true);
      setIsKeyboardMinimized(false);
    }
  };

  // Touch and pointer interaction calculations
  const processPointerEvent = useCallback((e: React.PointerEvent<HTMLDivElement>, action: 'DOWN' | 'MOVE' | 'UP') => {
    if (!containerRef.current || !isStreaming) return;

    // Regra 2: Fechamento ao tocar fora do campo de texto
    // Se o usuário tocou em uma área livre da tela, fecha o teclado imediatamente
    // e executa a ação de toque no Windows simultaneamente (sem engasgos)
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
  }, [containerRef, isStreaming, packetCount, pcWidth, pcHeight]);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-200">
      {/* Test Bench Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
              isStreaming
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            {isStreaming ? (
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

        {/* Orientation & Floating Keyboard Toggle */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setIsKeyboardOpen(!isKeyboardOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              isKeyboardOpen
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            {isKeyboardOpen ? 'Fechar Mini Teclado' : 'Abrir Mini Teclado'}
          </button>
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

      {/* Main Sandbox Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Simulated Android Tablet Surface */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <b>Tablet Android com Tela Remota</b> — Toque para desenhar, clique nos campos para ativar o mini teclado
            </span>
            <span className="font-mono text-cyan-400">
              {activeTransport === 'wifi' && '📶 Wi-Fi 5GHz'}
              {activeTransport === 'usb_rndis' && '🔌 Cabo USB (RNDIS)'}
              {activeTransport === 'bluetooth_rfcomm' && '🔷 Bluetooth RFCOMM'}
              {activeTransport === 'hybrid' && '⚡ Híbrido (Wi-Fi + BT)'}
            </span>
          </div>

          {/* Tablet Frame */}
          <div className="bg-slate-950 p-4 sm:p-6 rounded-3xl border-4 border-slate-800 shadow-2xl relative">
            {/* Tablet Camera notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-800/80 border border-slate-700"></div>

            {/* Active Display Surface */}
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
              {/* Discrete In-Stream HUD Overlay */}
              <div className="absolute top-2 left-2 z-30 pointer-events-none flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] text-white border border-white/10 font-mono shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>PC-WIN11</span>
                <span className="text-slate-400">|</span>
                <span className="text-cyan-300">{latencyMs}ms</span>
                <span className="text-slate-400">|</span>
                <span className="text-amber-300">{fps} FPS</span>
                {focusedField && (
                  <span className="text-emerald-300 bg-emerald-950/80 px-2 py-0.2 rounded border border-emerald-800 text-[10px]">
                    Foco: {focusedField}
                  </span>
                )}
              </div>

              {/* Stream Content */}
              {streamSource === 'real_screen' ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                /* Simulated Windows 11 Desktop with interactive testing elements */
                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 relative overflow-hidden flex flex-col justify-between p-4">
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
                    <div 
                      onClick={() => handleSelectSimulatedField('Pesquisar no Windows', 'bottom')}
                      className={`cursor-pointer transition-all p-2 rounded-lg border flex items-center gap-2 ${
                        focusedField === 'Pesquisar no Windows'
                          ? 'bg-blue-900/90 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                          : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-500'
                      }`}
                    >
                      <Search className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="flex-1 truncate text-xs">
                        <span className="text-slate-400 block text-[10px]">Busca (Enter conclui e fecha teclado):</span>
                        <span className="text-white font-mono font-medium">{simulatedPcText || 'Digite aqui...'}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        Linha Única
                      </span>
                    </div>
                  </div>

                  {/* Window Simulation: Notepad Text Editor (Multiline - Rule 3 respects Enter as newline) */}
                  <div 
                    onClick={() => handleSelectSimulatedField('Bloco de Notas', 'bottom')}
                    className={`absolute top-16 right-6 w-80 bg-slate-900/95 backdrop-blur-md rounded-lg border shadow-2xl p-3 text-xs z-20 cursor-pointer transition-all windows-text-field-area ${
                      focusedField === 'Bloco de Notas'
                        ? 'border-cyan-400 shadow-cyan-500/10 ring-1 ring-cyan-400'
                        : 'border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs">
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        Sem título - Bloco de Notas (Windows)
                      </span>
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-yellow-500/80"></span>
                        <span className="w-2 h-2 rounded-full bg-green-500/80"></span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-xs text-emerald-300 min-h-[70px] whitespace-pre-wrap leading-relaxed">
                      {simulatedPcText}
                      <span className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-0.5 animate-pulse align-middle"></span>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400 flex justify-between items-center">
                      <span>Campo Multilinhas (Enter quebra linha)</span>
                      <span className="text-cyan-400 font-medium">UTF-16</span>
                    </div>
                  </div>

                  {/* Windows Taskbar */}
                  <div className="w-full bg-slate-950/85 backdrop-blur-md py-1.5 px-3 rounded-lg border border-slate-800 flex items-center justify-between z-20">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setIsKeyboardOpen(false);
                          setFocusedField(null);
                        }}
                        className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white hover:bg-blue-500"
                      >
                        🪟
                      </button>
                      <span className="text-[11px] font-medium text-slate-300">Iniciar</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Mini Keyboard Overlay on Top of Mirrored Display */}
              {isKeyboardOpen && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${keyboardPos.x}px`,
                    top: `${keyboardPos.y}px`,
                    zIndex: 50
                  }}
                  className="touchscreen-virtual-keyboard touch-auto transition-all duration-150 ease-out"
                >
                  {isKeyboardMinimized ? (
                    /* Floating Bubble when Minimized */
                    <button
                      onClick={() => setIsKeyboardMinimized(false)}
                      className="w-12 h-12 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-2xl flex items-center justify-center border-2 border-cyan-300 cursor-pointer animate-bounce-subtle"
                      title="Expandir Mini Teclado"
                    >
                      <Keyboard className="w-6 h-6" />
                    </button>
                  ) : (
                    /* Expanded Virtual Mini Keyboard Panel */
                    <div className="w-[360px] sm:w-[460px] bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-2.5 text-xs select-none">
                      {/* Keyboard Drag Header & Controls */}
                      <div 
                        onMouseDown={e => {
                          setIsDraggingKeyboard(true);
                          dragStartRef.current = { startX: e.clientX, startY: e.clientY, initX: keyboardPos.x, initY: keyboardPos.y };
                        }}
                        className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700/80 cursor-grab active:cursor-grabbing text-slate-400 text-[11px]"
                      >
                        <div className="flex items-center gap-1.5 font-medium text-slate-200">
                          <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Mini Teclado Flutuante</span>
                          {pendingDeadKey && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                              Acento: '{pendingDeadKey}'
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setIsKeyboardMinimized(true)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                            title="Minimizar para bolha flutuante"
                          >
                            <Minimize2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setIsKeyboardOpen(false)}
                            className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                            title="Fechar teclado"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Keyboard Layout: Row 1 Numbers */}
                      <div className="grid grid-cols-12 gap-1 mb-1">
                        {['1','2','3','4','5','6','7','8','9','0','-','='].map(k => (
                          <button
                            key={k}
                            onClick={() => handleVirtualKeyPress(k)}
                            className="h-7 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded text-slate-200 font-mono font-medium text-[11px] border border-slate-700/80"
                          >
                            {k}
                          </button>
                        ))}
                      </div>

                      {/* Row 2 QWERTY + Accents */}
                      <div className="grid grid-cols-12 gap-1 mb-1">
                        {['q','w','e','r','t','y','u','i','o','p'].map(k => {
                          const display = isShiftActive ? k.toUpperCase() : k;
                          return (
                            <button
                              key={k}
                              onClick={() => handleVirtualKeyPress(display)}
                              className="h-7 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded text-slate-200 font-mono font-medium text-[11px] border border-slate-700/80"
                            >
                              {display}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handleVirtualKeyPress('´', true)}
                          className={`h-7 rounded font-mono font-bold text-[11px] border ${
                            pendingDeadKey === '´' ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-800 text-amber-400 border-slate-700'
                          }`}
                          title="Acento Agudo (´ + a = á)"
                        >
                          ´
                        </button>
                        <button
                          onClick={() => handleVirtualKeyPress('`', true)}
                          className={`h-7 rounded font-mono font-bold text-[11px] border ${
                            pendingDeadKey === '`' ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-800 text-amber-400 border-slate-700'
                          }`}
                          title="Crase (` + a = à)"
                        >
                          `
                        </button>
                      </div>

                      {/* Row 3 ASDFGHJKL + Ç + Til + Enter */}
                      <div className="grid grid-cols-12 gap-1 mb-1">
                        {['a','s','d','f','g','h','j','k','l','ç'].map(k => {
                          const display = isShiftActive ? k.toUpperCase() : k;
                          return (
                            <button
                              key={k}
                              onClick={() => handleVirtualKeyPress(display)}
                              className="h-7 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded text-slate-200 font-mono font-medium text-[11px] border border-slate-700/80"
                            >
                              {display}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handleVirtualKeyPress('~', true)}
                          className={`h-7 rounded font-mono font-bold text-[11px] border ${
                            pendingDeadKey === '~' ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-800 text-amber-400 border-slate-700'
                          }`}
                          title="Til (~ + a = ã, ~ + o = õ)"
                        >
                          ~
                        </button>
                        <button
                          onClick={() => handleVirtualKeyPress('^', true)}
                          className={`h-7 rounded font-mono font-bold text-[11px] border ${
                            pendingDeadKey === '^' ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-800 text-amber-400 border-slate-700'
                          }`}
                          title="Circunflexo (^ + a = â, ^ + e = ê)"
                        >
                          ^
                        </button>
                      </div>

                      {/* Row 4 Shift + ZXCVBNM + Backspace */}
                      <div className="grid grid-cols-12 gap-1 mb-1">
                        <button
                          onClick={() => setIsShiftActive(!isShiftActive)}
                          className={`col-span-2 h-7 rounded font-medium text-[10px] border transition-colors ${
                            isShiftActive ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          ⇧ Shift
                        </button>
                        {['z','x','c','v','b','n','m',',','.'].map(k => {
                          const display = isShiftActive ? k.toUpperCase() : k;
                          return (
                            <button
                              key={k}
                              onClick={() => handleVirtualKeyPress(display)}
                              className="h-7 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded text-slate-200 font-mono font-medium text-[11px] border border-slate-700/80"
                            >
                              {display}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handleVirtualKeyPress('Backspace', true)}
                          className="col-span-1 h-7 bg-slate-800 hover:bg-red-900/50 active:bg-red-600 rounded text-red-300 font-medium text-[10px] border border-slate-700 flex items-center justify-center"
                          title="Backspace"
                        >
                          ⌫
                        </button>
                      </div>

                      {/* Row 5 Modifiers, Space, Enter, Shortcuts */}
                      <div className="grid grid-cols-12 gap-1">
                        <button
                          onClick={() => setIsCtrlActive(!isCtrlActive)}
                          className={`h-7 rounded text-[10px] font-medium border ${
                            isCtrlActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          Ctrl
                        </button>
                        <button
                          onClick={() => setIsAltActive(!isAltActive)}
                          className={`h-7 rounded text-[10px] font-medium border ${
                            isAltActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          Alt
                        </button>
                        <button
                          onClick={() => handleVirtualKeyPress(' ')}
                          className="col-span-5 h-7 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-medium text-[11px] border border-slate-700"
                        >
                          Espaço
                        </button>
                        <button
                          onClick={() => handleVirtualKeyPress('Enter', true)}
                          className="col-span-2 h-7 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-bold text-[10px] border border-emerald-500 flex items-center justify-center gap-1"
                        >
                          Enter ⏎
                        </button>
                        <button
                          onClick={() => {
                            setSimulatedPcText(prev => prev + ' [Copiado]');
                          }}
                          className="col-span-1 h-7 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[9px] border border-slate-700"
                          title="Atalho Ctrl+C"
                        >
                          ^C
                        </button>
                        <button
                          onClick={() => {
                            setSimulatedPcText(prev => prev + ' [Colado]');
                          }}
                          className="col-span-2 h-7 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[9px] border border-slate-700"
                          title="Atalho Ctrl+V"
                        >
                          ^V
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Floating Action Button (FAB) on Bottom-Right of Tablet */}
              <button
                onClick={() => {
                  setIsKeyboardOpen(!isKeyboardOpen);
                  setIsKeyboardMinimized(false);
                }}
                className={`absolute bottom-3 right-3 z-40 p-2.5 rounded-full shadow-xl border flex items-center justify-center transition-all ${
                  isKeyboardOpen
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-slate-900/90 text-cyan-400 border-slate-700 hover:bg-slate-800'
                }`}
                title="Abrir/Fechar Mini Teclado Flutuante"
              >
                <Keyboard className="w-5 h-5" />
              </button>

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
            </div>

            {/* Instruction Footer on Tablet */}
            <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
              <span>Orientação paisagem recomendada. O mini teclado pode ser arrastado para qualquer posição.</span>
              <span className="text-cyan-400 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Preserva foco do Windows com SendInput
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Live Packet Inspector & Diagnostic Meters */}
        <div className="space-y-4">
          {/* Performance Gauges */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Métricas do Transporte: {activeTransport.toUpperCase()}
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Latência Medida</span>
                <span className="text-lg font-mono font-bold text-emerald-400">
                  {latencyMs} <span className="text-xs font-normal text-slate-400">ms</span>
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {activeTransport === 'bluetooth_rfcomm' ? 'RFCOMM SPP' : 'Wi-Fi/USB Direto'}
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Taxa de Quadros</span>
                <span className="text-lg font-mono font-bold text-amber-400">
                  {fps} <span className="text-xs font-normal text-slate-400">FPS</span>
                </span>
                <span className="text-[10px] text-slate-500 block">Alvo: {profileConfig.targetFps} FPS</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Bitrate do Vídeo</span>
                <span className="text-lg font-mono font-bold text-blue-400">
                  {(profileConfig.bitrateKbps / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">Mbps</span>
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {activeTransport === 'bluetooth_rfcomm' ? 'Vídeo prioriza Wi-Fi' : 'H.264 Hardware'}
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Eventos Registrados</span>
                <span className="text-lg font-mono font-bold text-purple-400">
                  {packetCount}
                </span>
                <span className="text-[10px] text-slate-500 block">Toque & Teclado</span>
              </div>
            </div>

            {/* Smart Focus Detection Toggle */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white block">Ativação Inteligente (UI Automation)</span>
                <span className="text-[11px] text-slate-400">Abre o teclado ao focar campos no Windows</span>
              </div>
              <input
                type="checkbox"
                checked={smartFocusEnabled}
                onChange={e => setSmartFocusEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-700 bg-slate-950 cursor-pointer"
              />
            </div>
          </div>

          {/* Coordinate & Keyboard Packet Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-cyan-400" />
              Inspetor de Pacotes de Teclado (16 bytes) & Toque (24 bytes)
            </h3>

            {lastKeyboardPacket ? (
              <div className="space-y-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-cyan-500/30 font-mono space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Ação de Teclado:</span>
                    <span className="text-cyan-400 font-bold">{lastKeyboardPacket.action}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Caractere Unicode / Código:</span>
                    <span className="text-emerald-400 font-bold">
                      '{String.fromCharCode(lastKeyboardPacket.unicodeChar || 32)}' (U+{lastKeyboardPacket.unicodeChar.toString(16).toUpperCase().padStart(4, '0')})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Modificadores:</span>
                    <span className="text-slate-300">
                      Shift: {lastKeyboardPacket.modifiers.shift ? 'SIM' : 'NÃO'} | Ctrl: {lastKeyboardPacket.modifiers.ctrl ? 'SIM' : 'NÃO'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  <span className="block mb-1">Pacote Binário (16 bytes Little-Endian):</span>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[11px] text-cyan-300">
                    4B 02 00 00 {(lastKeyboardPacket.unicodeChar & 0xFF).toString(16).padStart(2, '0')} {((lastKeyboardPacket.unicodeChar >> 8) & 0xFF).toString(16).padStart(2, '0')} 00 00 ...
                  </div>
                </div>
              </div>
            ) : lastPacket ? (
              <div className="space-y-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Toque Ação / Ponteiro:</span>
                    <span className="text-emerald-400 font-bold">{lastPacket.action} (#{lastPacket.pointerId})</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Coordenadas Normalizadas:</span>
                    <span className="text-cyan-400">X: {lastPacket.normX.toFixed(4)} | Y: {lastPacket.normY.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Pixel Alvo no PC:</span>
                    <span className="text-amber-400 font-bold">{lastPacket.targetPixelX} × {lastPacket.targetPixelY} px</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center text-xs text-slate-500">
                Toque no tablet ou digite no mini teclado para inspecionar os pacotes binários.
              </div>
            )}

            <div className="text-[11px] bg-slate-950/80 p-2 rounded border border-slate-800 text-slate-400">
              <b>Segurança Estrita:</b> Pacotes de teclado transmitem códigos virtuais sanitizados ou pontos de código UTF-16 validados. O servidor Windows nunca executa comandos de shell ou scripts arbitrários.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


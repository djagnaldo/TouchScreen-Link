import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  ShieldCheck, 
  QrCode, 
  KeyRound, 
  RefreshCw, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Wifi, 
  Radio, 
  Laptop, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { DevicePairingInfo } from '../types/touchscreen';

export const PairingStation: React.FC = () => {
  const [pinCode, setPinCode] = useState<string>('582914');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedPin, setCopiedPin] = useState<boolean>(false);
  const [pendingDevices, setPendingDevices] = useState<DevicePairingInfo[]>([
    {
      deviceId: 'dev-tab-s9',
      deviceName: 'Samsung Galaxy Tab S9 Ultra',
      deviceType: 'android_tablet',
      ipAddress: '192.168.1.145',
      port: 45820,
      bluetoothAddress: '78:BD:BC:4A:12:89',
      activeTransport: 'wifi',
      pairingCode: '582914',
      pairingQrData: 'tslink://pair?dev=GalaxyTabS9',
      status: 'pairing_pending'
    }
  ]);
  const [pairedDevices, setPairedDevices] = useState<DevicePairingInfo[]>([
    {
      deviceId: 'dev-pixel-tablet',
      deviceName: 'Google Pixel Tablet (Sala)',
      deviceType: 'android_tablet',
      ipAddress: '192.168.1.189',
      port: 45820,
      bluetoothAddress: '34:8A:12:F0:99:C1',
      activeTransport: 'hybrid',
      pairingCode: '319024',
      pairingQrData: 'tslink://pair?dev=PixelTablet',
      pairedAt: 'Hoje, 09:15',
      status: 'paired'
    }
  ]);

  // Generate QR Code dynamically
  const generateNewPairing = async () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPinCode(randomPin);

    const payload = `tslink://pair?pc=DESKTOP-WIN11&pin=${randomPin}&port=45820&token=${Math.random().toString(36).substring(2, 15)}`;
    try {
      const url = await QRCode.toDataURL(payload, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      setQrCodeDataUrl(url);
    } catch (err) {
      console.error('Falha ao gerar QR code:', err);
    }
  };

  useEffect(() => {
    generateNewPairing();
  }, []);

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pinCode);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleApproveDevice = (dev: DevicePairingInfo) => {
    setPendingDevices(prev => prev.filter(d => d.deviceId !== dev.deviceId));
    setPairedDevices(prev => [
      ...prev,
      {
        ...dev,
        status: 'paired',
        pairedAt: 'Agora'
      }
    ]);
  };

  const handleRejectDevice = (devId: string) => {
    setPendingDevices(prev => prev.filter(d => d.deviceId !== devId));
  };

  const handleRevokeDevice = (devId: string) => {
    setPairedDevices(prev => prev.filter(d => d.deviceId !== devId));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-200">
      {/* Intro Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          Estação de Pareamento & Segurança
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Conexão ponto a ponto na rede local sem contas externas ou servidores de terceiros.
          O PC autoriza exclusivamente os dispositivos Android confirmados por você.
        </p>
      </div>

      {/* QR Code & PIN Code Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Código QR de Pareamento Instantâneo */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col items-center text-center">
          <div className="flex items-center justify-between w-full mb-4">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-cyan-400" />
              Escaneamento por QR Code
            </span>
            <button
              onClick={generateNewPairing}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizar
            </button>
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-slate-700/50 my-2">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="QR Code de Pareamento TouchScreen Link"
                className="w-52 h-52 object-contain rounded-lg"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-500 text-xs">
                Gerando QR...
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-3 max-w-xs leading-relaxed">
            Abra o TouchScreen Link no Android e aponte a câmera para este código. 
            O IP, porta e chave criptográfica serão preenchidos automaticamente.
          </p>
        </div>

        {/* Box 2: Código PIN Temporário Manual */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                PIN Temporário de Pareamento
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Válido por 10 minutos
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Caso prefira não usar a câmera, o app Android detecta o PC automaticamente via mDNS e solicitará apenas este PIN de 6 dígitos para o primeiro pareamento:
            </p>

            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex items-center justify-center gap-4 shadow-inner">
              <span className="text-4xl font-mono font-bold tracking-widest text-cyan-400 select-all">
                {pinCode}
              </span>
              <button
                onClick={handleCopyPin}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Copiar código PIN"
              >
                {copiedPin ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>O pareamento precisa ser feito apenas na <b>primeira conexão</b>.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Nas próximas sessões, a conexão ocorre de forma <b>100% automática</b>.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Solicitações de Conexão Pendentes & Dispositivos Autorizados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            Solicitações Pendentes de Conexão
          </h3>

          {pendingDevices.length > 0 ? (
            <div className="space-y-3">
              {pendingDevices.map((dev) => (
                <div
                  key={dev.deviceId}
                  className="bg-slate-950 p-3.5 rounded-lg border border-amber-500/30 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{dev.deviceName}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        IP: {dev.ipAddress} · PIN Digitado: {dev.pairingCode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveDevice(dev)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Autorizar
                    </button>
                    <button
                      onClick={() => handleRejectDevice(dev.deviceId)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                      title="Recusar conexão"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center text-xs text-slate-500">
              Nenhuma solicitação pendente no momento.
            </div>
          )}
        </div>

        {/* Paired Devices */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            Dispositivos Já Autorizados (Reconexão Automática)
          </h3>

          <div className="space-y-2">
            {pairedDevices.map((dev) => (
              <div
                key={dev.deviceId}
                className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-semibold text-slate-200 block">{dev.deviceName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {dev.ipAddress} · Autorizado {dev.pairedAt}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRevokeDevice(dev.deviceId)}
                  className="text-xs text-slate-400 hover:text-red-400 underline decoration-slate-600 hover:decoration-red-400 transition-colors"
                >
                  Revogar Acesso
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security & Firewall Guarantees */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Garantias de Privacidade e Segurança
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <span className="font-semibold text-white block mb-1">1. Sem Servidores Externos</span>
            <p className="text-slate-400 leading-relaxed">
              Todo o tráfego de vídeo e comandos de toque trafega estritamente dentro da sua rede local (Wi-Fi ou USB). Não há servidores intermediários, nuvem ou roteamento externo.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <span className="font-semibold text-white block mb-1">2. Sem Gravação de Tela</span>
            <p className="text-slate-400 leading-relaxed">
              O fluxo de vídeo é codificado e descartado imediatamente após a exibição na tela do Android. Nenhum arquivo de vídeo, imagem ou histórico de toque é salvo no disco.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <span className="font-semibold text-white block mb-1">3. Firewall Automático Limpo</span>
            <p className="text-slate-400 leading-relaxed">
              O instalador Inno Setup cria automaticamente a regra de firewall para a porta <code>45820</code> restrita à rede privada. Nenhum comando de terminal ou configuração manual é exigida do usuário.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Download, 
  Laptop, 
  Smartphone, 
  Terminal, 
  AlertTriangle, 
  ShieldCheck, 
  Flame, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  downloadAndroidProjectZip, 
  downloadWindowsProjectZip, 
  downloadFullSolutionBundleZip 
} from '../utils/zipGenerator';

export const DeploymentGuide: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-200">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          Guia de Instalação, Compilação e Relatório Técnico
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Instruções simplificadas para o usuário final comum e roteiro técnico de compilação para desenvolvedores.
        </p>
      </div>

      {/* Everyday User Installation (No Terminal Required) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Guia Rápido para Usuários Comuns (Sem Linha de Comando)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Step 1 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-sm border border-blue-500/30">
              1
            </div>
            <h4 className="font-bold text-white text-sm">Instalar no Windows</h4>
            <p className="text-slate-400 leading-relaxed">
              Execute o instalador oficial <code>TouchScreenLink-Setup-x64.exe</code>. Clique em <i>Avançar</i> e <i>Concluir</i>.
            </p>
            <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[11px] text-slate-400">
              ✓ O instalador já configura o Firewall do Windows automaticamente.<br/>
              ✓ O ícone aparecerá na bandeja perto do relógio.
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-full bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/30">
              2
            </div>
            <h4 className="font-bold text-white text-sm">Instalar no Android</h4>
            <p className="text-slate-400 leading-relaxed">
              Abra o aplicativo <b>TouchScreen Link</b> no seu celular ou tablet Android conectado à mesma rede Wi-Fi do computador.
            </p>
            <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[11px] text-slate-400">
              ✓ O aplicativo localiza o PC automaticamente.<br/>
              ✓ Não precisa digitar endereço IP nem porta.
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-full bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center text-sm border border-purple-500/30">
              3
            </div>
            <h4 className="font-bold text-white text-sm">Parear e Usar</h4>
            <p className="text-slate-400 leading-relaxed">
              Toque no nome do seu PC na lista e aponte a câmera para o QR Code (ou digite o PIN de 6 dígitos que surge no PC).
            </p>
            <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[11px] text-slate-400">
              ✓ A tela do PC aparece instantaneamente em tela cheia.<br/>
              ✓ Nas próximas vezes, a conexão é 100% automática!
            </div>
          </div>
        </div>
      </div>

      {/* Developer Build Instructions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          Roteiro de Compilação do Código-Fonte (Desenvolvedores)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Windows Compilation */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-blue-400" />
                Compilar Servidor Windows (C# .NET 8)
              </span>
              <button
                onClick={downloadWindowsProjectZip}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium underline"
              >
                Baixar .ZIP
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
              <li>Extraia o arquivo <code>TouchScreenLink-Windows-v1.1.zip</code>.</li>
              <li>Abra o PowerShell na pasta raiz e execute o script automatizado ou use o .NET CLI:</li>
            </ol>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300 space-y-1">
              <div># Opção 1: Compilação e empacotamento completo com 1 comando</div>
              <div>.\build.ps1</div>
              <div className="pt-1 text-slate-400"># Opção 2: CLI padrão do .NET 8 SDK</div>
              <div>dotnet publish TouchScreenLink.Server\TouchScreenLink.Server.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o publish/</div>
            </div>

            <p className="text-slate-400 text-[11px]">
              O binário autônomo <code>TouchScreenLinkServer.exe</code> será criado na pasta <code>publish/</code>.
              Para gerar o instalador executável com regras de firewall automáticas, o script <code>build.ps1</code> executa o <b>Inno Setup 6</b> automaticamente (ou abra <code>TouchScreenLinkSetup.iss</code> no compilador Inno Setup).
            </p>
          </div>

          {/* Android Compilation */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Compilar App Android (Kotlin + Jetpack Compose)
              </span>
              <button
                onClick={downloadAndroidProjectZip}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium underline"
              >
                Baixar .ZIP
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
              <li>Extraia o arquivo <code>TouchScreenLink-Android-v1.1.zip</code>.</li>
              <li>Abra a pasta no <b>Android Studio</b> (Ladybug/Koala) ou gere o APK via terminal:</li>
            </ol>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 space-y-1">
              <div># Linux / macOS:</div>
              <div>chmod +x gradlew && ./gradlew assembleDebug</div>
              <div className="pt-1"># Windows (cmd.exe ou PowerShell):</div>
              <div>gradlew.bat assembleDebug</div>
            </div>

            <p className="text-slate-400 text-[11px]">
              O APK pronto para instalação será gerado em: <code>app/build/outputs/apk/debug/app-debug.apk</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Relatório de Limitações Conhecidas & Transparência Técnica */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Relatório de Limitações Conhecidas (Transparência Técnica)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="font-semibold text-white block">1. Telas de UAC / Logon Seguro do Windows</span>
            <p className="text-slate-400 leading-relaxed">
              Quando surge uma solicitação do Controle de Conta de Usuário (UAC) do Windows em Desktop Seguro (Secure Desktop), o sistema operacional suspende temporariamente a captura para processos não elevados por motivos de segurança do kernel. O instalador configura privilégios para mitigar isso.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="font-semibold text-white block">2. Redes Wi-Fi com Isolamento de Clientes (AP Isolation)</span>
            <p className="text-slate-400 leading-relaxed">
              Em roteadores públicos de hotéis ou aeroportos com "AP Isolation" ativado, os dispositivos não conseguem conversar entre si via LAN. Nesses cenários, a conexão via cabo USB com Vínculo USB (RNDIS) é a solução imediata recomendada.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="font-semibold text-white block">3. Escopo da Versão 1.0 (Espelhamento vs Segundo Monitor)</span>
            <p className="text-slate-400 leading-relaxed">
              Conforme definido no requisito 9 do projeto, a versão 1.0 foca estritamente no espelhamento da tela principal com controle de toque total. O suporte a segundo monitor virtual independente será adicionado na versão 2.0 via driver IddCx.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="font-semibold text-white block">4. Displays com Taxa de Atualização de 120Hz</span>
            <p className="text-slate-400 leading-relaxed">
              Para atingir 120 FPS em tablets com telas de 120Hz (como Galaxy Tab ou Xiaomi Pad), recomenda-se placa de vídeo dedicada (NVIDIA GTX 1060+ ou Intel Iris Xe) e rede Wi-Fi 5GHz/6GHz.
            </p>
          </div>
        </div>
      </div>

      {/* Roadmap para Futuras Atualizações */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          Roteiro de Futuras Atualizações (Versão 2.0)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-cyan-400 block mb-1">Driver IddCx de Monitor Virtual</span>
            <p className="text-slate-400">
              Permitirá estender a área de trabalho do Windows criando uma segunda tela virtual sem precisar de plugs HDMI falsos (dummy plugs).
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-cyan-400 block mb-1">Suporte a Caneta Stylus & Pressão</span>
            <p className="text-slate-400">
              Mapeamento de níveis de pressão de canetas ativas (S-Pen, Apple Pencil, Xiaomi Smart Pen) para o Windows Ink API no PC.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-cyan-400 block mb-1">Áudio do PC no Android</span>
            <p className="text-slate-400">
              Captura WASAPI Loopback do som do Windows e streaming sincronizado via Opus de ultra baixa latência (&lt; 20ms).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

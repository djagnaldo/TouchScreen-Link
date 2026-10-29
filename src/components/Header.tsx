import React from 'react';
import { 
  Tv, 
  Smartphone, 
  Monitor, 
  Download, 
  Zap, 
  ShieldCheck, 
  Wifi, 
  Settings, 
  Sparkles,
  Layers,
  Code2,
  Activity,
  BookOpen
} from 'lucide-react';
import { StreamProfileType } from '../types/touchscreen';
import { STREAM_PROFILES } from '../data/profilesData';

interface HeaderProps {
  activeTab: 'testbench' | 'architecture' | 'code' | 'pairing' | 'benchmark' | 'guide';
  onSelectTab: (tab: 'testbench' | 'architecture' | 'code' | 'pairing' | 'benchmark' | 'guide') => void;
  activeProfile: StreamProfileType;
  onChangeProfile: (p: StreamProfileType) => void;
  onDownloadAll: () => void;
  isDownloading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  activeProfile,
  onChangeProfile,
  onDownloadAll,
  isDownloading
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Smartphone className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                TouchScreen Link
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PC + Android Nativo
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Transforme a tela de celular/tablet Android em monitor de toque com aceleração por hardware
            </p>
          </div>
        </div>

        {/* Profile Selector & Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Profile Selector */}
          <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/80 text-xs">
            <span className="px-2 text-slate-400 font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Perfil:
            </span>
            {(['economy', 'balanced', 'low_latency'] as StreamProfileType[]).map((prof) => {
              const info = STREAM_PROFILES[prof];
              const isActive = activeProfile === prof;
              return (
                <button
                  key={prof}
                  onClick={() => onChangeProfile(prof)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                  title={`${info.name}: ${info.tagline} (${info.targetFps} FPS, ${info.resolution})`}
                >
                  {info.name}
                </button>
              );
            })}
          </div>

          {/* Download Full Bundle */}
          <button
            onClick={onDownloadAll}
            disabled={isDownloading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md shadow-blue-500/25 transition-all disabled:opacity-60 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Gerando Pacote...' : 'Baixar Código (.ZIP)'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
        <nav className="flex space-x-1 sm:space-x-6 overflow-x-auto py-2 scrollbar-none text-xs sm:text-sm">
          <button
            onClick={() => onSelectTab('testbench')}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg font-medium transition-colors ${
              activeTab === 'testbench'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Tv className="w-4 h-4" />
            Bancada de Teste ao Vivo
          </button>

          <button
            onClick={() => onSelectTab('architecture')}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg font-medium transition-colors ${
              activeTab === 'architecture'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            Arquitetura & USB
          </button>

          <button
            onClick={() => onSelectTab('code')}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg font-medium transition-colors ${
              activeTab === 'code'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Código-Fonte Android & Windows
          </button>

          <button
            onClick={() => onSelectTab('pairing')}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg font-medium transition-colors ${
              activeTab === 'pairing'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Pareamento & Segurança
          </button>

          <button
            onClick={() => onSelectTab('benchmark')}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg font-medium transition-colors ${
              activeTab === 'benchmark'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-4 h-4" />
            Medições & Desempenho
          </button>

          <button
            onClick={() => onSelectTab('guide')}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg font-medium transition-colors ${
              activeTab === 'guide'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Guia de Instalação & Uso
          </button>
        </nav>
      </div>
    </header>
  );
};

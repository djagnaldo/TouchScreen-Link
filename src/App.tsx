import React, { useState } from 'react';
import { Header } from './components/Header';
import { InteractiveTestBench } from './components/InteractiveTestBench';
import { ArchitectureView } from './components/ArchitectureView';
import { CodeExplorer } from './components/CodeExplorer';
import { PairingStation } from './components/PairingStation';
import { BenchmarkSuite } from './components/BenchmarkSuite';
import { DeploymentGuide } from './components/DeploymentGuide';
import { StreamProfileType } from './types/touchscreen';
import { downloadFullSolutionBundleZip } from './utils/zipGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'testbench' | 'architecture' | 'code' | 'pairing' | 'benchmark' | 'guide'>('testbench');
  const [activeProfile, setActiveProfile] = useState<StreamProfileType>('balanced');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    try {
      await downloadFullSolutionBundleZip();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeProfile={activeProfile}
        onChangeProfile={setActiveProfile}
        onDownloadAll={handleDownloadAll}
        isDownloading={isDownloading}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'testbench' && (
          <InteractiveTestBench
            activeProfile={activeProfile}
            onChangeProfile={setActiveProfile}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureView />
        )}

        {activeTab === 'code' && (
          <CodeExplorer />
        )}

        {activeTab === 'pairing' && (
          <PairingStation />
        )}

        {activeTab === 'benchmark' && (
          <BenchmarkSuite />
        )}

        {activeTab === 'guide' && (
          <DeploymentGuide />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            <b>TouchScreen Link v1.0.0</b> — Desenvolvido para máximo desempenho, baixa latência e privacidade local total.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Windows 10/11 x64</span>
            <span>•</span>
            <span>Android 8.0+ (Oreo até 15)</span>
            <span>•</span>
            <span>Licença de Código Aberto</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

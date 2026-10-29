import React, { useState } from 'react';
import { 
  FileCode, 
  Download, 
  Copy, 
  Check, 
  Smartphone, 
  Laptop, 
  FolderTree, 
  Search, 
  Terminal,
  ShieldCheck,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { ANDROID_SOURCE_FILES } from '../data/androidFiles';
import { WINDOWS_SOURCE_FILES } from '../data/windowsFiles';
import { ProjectSourceFile } from '../types/touchscreen';
import { 
  downloadAndroidProjectZip, 
  downloadWindowsProjectZip, 
  downloadFullSolutionBundleZip 
} from '../utils/zipGenerator';

export const CodeExplorer: React.FC = () => {
  const [activeProject, setActiveProject] = useState<'android' | 'windows'>('android');
  const [selectedFilePath, setSelectedFilePath] = useState<string>('app/src/main/java/com/touchscreenlink/app/decoder/HardwareVideoDecoder.kt');
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const fileList = activeProject === 'android' ? ANDROID_SOURCE_FILES : WINDOWS_SOURCE_FILES;

  // Filter files by search
  const filteredFiles = fileList.filter(f => 
    f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Active selected file
  const currentFile: ProjectSourceFile = fileList.find(f => f.path === selectedFilePath) || fileList[0];

  const handleCopyCode = () => {
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadAndroidZip = async () => {
    setIsZipping(true);
    try {
      await downloadAndroidProjectZip();
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadWindowsZip = async () => {
    setIsZipping(true);
    try {
      await downloadWindowsProjectZip();
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadFullBundle = async () => {
    setIsZipping(true);
    try {
      await downloadFullSolutionBundleZip();
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-200">
      {/* Top Banner with One-Click Zip Downloads */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-cyan-400" />
            Explorador de Código-Fonte Nativo (Android & Windows)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Código real e documentado, pronto para compilar no Android Studio e Visual Studio 2022 sem dependências obscuras.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadAndroidZip}
            disabled={isZipping}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Baixar Android (.ZIP)
          </button>

          <button
            onClick={handleDownloadWindowsZip}
            disabled={isZipping}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all cursor-pointer"
          >
            <Laptop className="w-3.5 h-3.5" />
            Baixar Windows (.ZIP)
          </button>

          <button
            onClick={handleDownloadFullBundle}
            disabled={isZipping}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar Solução Completa (.ZIP)
          </button>
        </div>
      </div>

      {/* Main Split View: File Tree + Source Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Project Selector & File List (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col h-[650px]">
          {/* Project Switcher */}
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 mb-3">
            <button
              onClick={() => {
                setActiveProject('android');
                setSelectedFilePath(ANDROID_SOURCE_FILES[4].path);
              }}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeProject === 'android'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Android (Kotlin)
            </button>
            <button
              onClick={() => {
                setActiveProject('windows');
                setSelectedFilePath(WINDOWS_SOURCE_FILES[2].path);
              }}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeProject === 'windows'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              Windows (C# .NET 8)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar arquivos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* File Items List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            {filteredFiles.map((file) => {
              const isSelected = file.path === currentFile?.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex flex-col gap-0.5 ${
                    isSelected
                      ? 'bg-slate-800 border border-cyan-500/50 text-white'
                      : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono font-medium truncate text-[11px]">
                      {file.path}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400">
                      {file.language}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 line-clamp-1">
                    {file.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* File Count Footer */}
          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
            <span>{fileList.length} arquivos no projeto</span>
            <span>100% Código Aberto</span>
          </div>
        </div>

        {/* Right Column: Code Viewer & Details (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[650px] shadow-md overflow-hidden">
          {/* Code Viewer Header */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-bold text-white">
                  {currentFile?.path}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {currentFile?.language}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {currentFile?.description}
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Código
                </>
              )}
            </button>
          </div>

          {/* Code Body with Line Numbers */}
          <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
            <pre className="whitespace-pre">
              {currentFile?.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

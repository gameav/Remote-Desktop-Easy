import React, { useState } from 'react';
import { CODE_FILES } from '../data/codeFiles';
import { 
  Copy, 
  Check, 
  FileCode2, 
  Download,
  Terminal,
  Monitor,
  Apple,
  ChevronDown,
  ChevronUp,
  ShieldCheck
} from 'lucide-react';
import { downloadProjectZip } from '../utils/zipGenerator';

export const CodeExplorer: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>('windows_host');
  const [copied, setCopied] = useState<boolean>(false);
  const [showCodeDetails, setShowCodeDetails] = useState<boolean>(false);

  const selectedFile = CODE_FILES.find((f) => f.id === selectedFileId) || CODE_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Zero-Code Download & Setup Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 mb-1">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Zero-Code Setup Assistant</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Download StreamDesk Host App for Your Computer
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              No manual coding or terminal commands required. Download the automated setup bundle for Windows, macOS, or Linux to start streaming your desktop immediately.
            </p>
          </div>

          <button
            onClick={downloadProjectZip}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download All Host Files (.ZIP)</span>
          </button>
        </div>

        {/* 1-Click OS Installers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Windows Installer */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between hover:border-blue-500/50 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-slate-100 font-semibold text-xs">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  <span>Windows 10 / 11</span>
                </div>
                <span className="text-[10px] bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded font-mono border border-blue-500/30">
                  setup_windows.bat
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                1-click batch installer. Automatically checks Python, creates an isolated virtual environment, installs DXGI capture dependencies, and starts host.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Double-click to launch</span>
              <button
                onClick={downloadProjectZip}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
              >
                <span>Download</span>
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* macOS Installer */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between hover:border-blue-500/50 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-slate-100 font-semibold text-xs">
                  <Apple className="w-4 h-4 text-slate-300" />
                  <span>macOS (Apple Silicon & Intel)</span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                  setup_mac.command
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Double-clickable macOS Command file. Handles macOS virtualenv setup, installs PyAV and WebRTC video drivers, and opens browser control.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Double-click in Finder</span>
              <button
                onClick={downloadProjectZip}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
              >
                <span>Download</span>
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Linux Installer */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between hover:border-blue-500/50 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-slate-100 font-semibold text-xs">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Linux (Ubuntu / Debian / Arch)</span>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-mono border border-emerald-800">
                  setup_linux.sh
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Automated shell script for Linux distributions. Sets up X11 frame grabbing and WebRTC RTCDataChannel input routing cleanly.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Run <code className="text-slate-300">bash setup_linux.sh</code></span>
              <button
                onClick={downloadProjectZip}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
              >
                <span>Download</span>
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Step Simple Setup Instructions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
          How to Setup StreamDesk (3 Simple Steps)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center space-x-2 text-blue-400 font-semibold">
              <span className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center text-[11px] border border-blue-500/30">1</span>
              <span>Download & Extract</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Click "Download All Host Files (.ZIP)" above and extract the zip folder on your host computer.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center space-x-2 text-blue-400 font-semibold">
              <span className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center text-[11px] border border-blue-500/30">2</span>
              <span>Double-Click Setup File</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Double-click <code className="text-slate-200 font-mono">setup_windows.bat</code> or <code className="text-slate-200 font-mono">setup_mac.command</code>. It will handle all software dependencies automatically.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
              <span className="w-5 h-5 rounded-full bg-emerald-950 flex items-center justify-center text-[11px] border border-emerald-800">3</span>
              <span>Connect & Control</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Open StreamDesk on your secondary device or phone browser and enter the 6-digit PIN shown on screen to start controlling!
            </p>
          </div>
        </div>
      </div>

      {/* Optional Collapsible Developer Code Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setShowCodeDetails(!showCodeDetails)}
          className="w-full p-4 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <FileCode2 className="w-4 h-4 text-blue-400" />
            <span>Advanced Developer Mode: Inspect Source Code & Automation Scripts</span>
          </div>
          {showCodeDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showCodeDetails && (
          <div className="p-4 border-t border-slate-800 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* File List */}
              <div className="lg:col-span-3 space-y-1.5">
                {CODE_FILES.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                      file.id === selectedFileId
                        ? 'bg-blue-600/20 text-white border-blue-500/40 font-medium'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">{file.name}</div>
                    <div className="text-[10px] text-slate-500">{file.description}</div>
                  </button>
                ))}
              </div>

              {/* Code Previewer */}
              <div className="lg:col-span-9 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col h-96">
                <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">{selectedFile.name}</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <pre className="p-4 text-xs font-mono text-slate-300 overflow-auto flex-1 leading-relaxed">
                  {selectedFile.content}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { 
  Download, 
  Monitor, 
  Apple, 
  Terminal, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  FileCode2, 
  Copy, 
  Check 
} from 'lucide-react';
import { downloadProjectZip } from '../utils/zipGenerator';

export const ParsecDownloads: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyInstallCommand = () => {
    navigator.clipboard.writeText('pip install aiortc av mss pyautogui && python host/windows_host.py');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Downloads Hero Banner */}
      <div className="bg-[#131622] border border-[#232738] rounded-xl p-6 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Download className="w-4 h-4" />
            <span>Official Parsec Host App Installers</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Download Parsec Host Setup for Windows, macOS & Linux
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Download the automated host installer scripts to run Parsec NVENC screen streaming directly on your personal computer.
          </p>
        </div>

        <button
          onClick={downloadProjectZip}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>DOWNLOAD PARSEC HOST APP (.ZIP)</span>
        </button>
      </div>

      {/* OS Installers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Windows */}
        <div className="bg-[#131622] border border-[#232738] hover:border-rose-500/50 rounded-xl p-5 space-y-4 flex flex-col justify-between transition-colors shadow-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded bg-rose-600/20 text-rose-400 border border-rose-500/30">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Parsec for Windows</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Windows 10 / 11 (64-bit)</span>
                </div>
              </div>
              <span className="text-[10px] bg-rose-600/20 text-rose-300 font-mono px-2 py-0.5 rounded border border-rose-500/30">
                .BAT
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Automated Windows batch script (`setup_windows.bat`). Installs DirectX Desktop Duplication (DXGI) and NVENC H.265 encoder drivers.
            </p>
          </div>

          <button
            onClick={downloadProjectZip}
            className="w-full py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download setup_windows.bat</span>
          </button>
        </div>

        {/* macOS */}
        <div className="bg-[#131622] border border-[#232738] hover:border-rose-500/50 rounded-xl p-5 space-y-4 flex flex-col justify-between transition-colors shadow-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded bg-slate-800 text-slate-200 border border-slate-700">
                  <Apple className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Parsec for macOS</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Apple Silicon & Intel</span>
                </div>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                .COMMAND
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Double-clickable macOS Command installer (`setup_mac.command`). Configures Apple Metal framework and CoreGraphics display capture.
            </p>
          </div>

          <button
            onClick={downloadProjectZip}
            className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download setup_mac.command</span>
          </button>
        </div>

        {/* Linux */}
        <div className="bg-[#131622] border border-[#232738] hover:border-rose-500/50 rounded-xl p-5 space-y-4 flex flex-col justify-between transition-colors shadow-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Parsec for Linux</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Ubuntu / Debian / Arch</span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-800">
                .SH
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Linux shell script (`setup_linux.sh`). Sets up X11 / Wayland frame capture and WebRTC RTCDataChannel gamepad input routing.
            </p>
          </div>

          <button
            onClick={downloadProjectZip}
            className="w-full py-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold text-xs border border-emerald-800 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download setup_linux.sh</span>
          </button>
        </div>
      </div>

      {/* Terminal Quick Start */}
      <div className="bg-[#131622] border border-[#232738] rounded-xl p-5 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
            <Terminal className="w-4 h-4 text-rose-400" />
            <span>Manual Command-Line Installation (Developers)</span>
          </div>
          <button
            onClick={handleCopyInstallCommand}
            className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Command!' : 'Copy Command'}</span>
          </button>
        </div>

        <div className="p-3.5 bg-[#0b0c13] rounded-lg font-mono text-xs text-slate-200 border border-[#2b2f45] overflow-x-auto">
          <code>pip install aiortc av mss pyautogui && python host/windows_host.py</code>
        </div>
      </div>
    </div>
  );
};

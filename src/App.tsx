import React, { useState } from 'react';
import { NavigationTab } from './types';
import { Header } from './components/Header';
import { LiveSimulator } from './components/LiveSimulator';
import { CodeExplorer } from './components/CodeExplorer';
import { TailscaleGuide } from './components/TailscaleGuide';
import { OptimizationGuide } from './components/OptimizationGuide';
import { StandaloneClientPreview } from './components/StandaloneClientPreview';
import { 
  Download, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Laptop, 
  Smartphone,
  Flame,
  Activity
} from 'lucide-react';
import { downloadProjectZip } from './utils/zipGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('simulator');

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200 relative overflow-x-hidden">
      {/* Frosted Glass Ambient Backdrop Glow Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-blue-900/25 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-indigo-900/20 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[20%] w-[35%] h-[35%] bg-cyan-900/15 rounded-full blur-[160px]" />
      </div>

      {/* Top Header Navigation with Frosted Glass styling */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isStreaming={true}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'simulator' && <LiveSimulator />}
        {activeTab === 'code' && <CodeExplorer />}
        {activeTab === 'client-preview' && <StandaloneClientPreview />}
        {activeTab === 'tailscale' && <TailscaleGuide />}
        {activeTab === 'optimizations' && <OptimizationGuide />}
      </main>

      {/* Frosted Glass Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-xl py-5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#22c55e]" />
            <span className="text-slate-300 font-semibold tracking-wide text-xs">
              WebRTC Low-Latency Architecture Hub
            </span>
            <span className="text-white/20">|</span>
            <span className="text-slate-400 text-[11px] font-mono">STREAMING: H.264 / WebRTC / OPUS</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-[11px] font-mono text-slate-500 hidden md:inline">ENCRYPTED P2P TUNNEL (TAILSCALE)</span>
            <button
              onClick={downloadProjectZip}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Download Boilerplate (.ZIP)</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

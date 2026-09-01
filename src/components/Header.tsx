import React from 'react';
import { NavigationTab } from '../types';
import { 
  MonitorPlay, 
  Code2, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  Download,
  Flame,
  Activity
} from 'lucide-react';
import { downloadProjectZip } from '../utils/zipGenerator';

interface HeaderProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isStreaming: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, isStreaming }) => {
  const tabs = [
    { id: 'simulator' as NavigationTab, label: 'Live CAD Simulator', icon: MonitorPlay },
    { id: 'code' as NavigationTab, label: 'Code & Architecture', icon: Code2 },
    { id: 'client-preview' as NavigationTab, label: 'iPhone Client UI', icon: Smartphone },
    { id: 'tailscale' as NavigationTab, label: 'Tailscale & Firewall Bypass', icon: ShieldCheck },
    { id: 'optimizations' as NavigationTab, label: 'Low-Latency CAD Tuning', icon: Zap },
  ];

  return (
    <header className="relative z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Flame className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="font-bold text-slate-100 text-sm sm:text-base tracking-tight">
                  WebRTC Remote CAD
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/10 border border-white/20 text-emerald-400 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.25)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#22c55e]" />
                  Live Host
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Windows 10 Host (MSS / aiortc) ⇄ iPhone Safari (HTML5 WebRTC)
              </p>
            </div>
          </div>

          {/* Telemetry Snapshot & Action */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="hidden md:flex items-center gap-5">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Latency</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">14.2ms</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Bitrate</span>
                <span className="text-xs font-mono text-blue-400 font-bold">18.5 Mbps</span>
              </div>
            </div>

            <button
              onClick={downloadProjectZip}
              className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium backdrop-blur-md shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Download Boilerplate (.ZIP)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation with Frosted Glass Pills */}
        <nav className="flex space-x-1.5 overflow-x-auto no-scrollbar pb-2.5 pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white/15 text-white border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.08)] backdrop-blur-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

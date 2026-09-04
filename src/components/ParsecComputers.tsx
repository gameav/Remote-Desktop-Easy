import React, { useState } from 'react';
import { RemoteComputer } from '../types';
import { 
  Monitor, 
  Cpu, 
  Zap, 
  Play, 
  ShieldCheck, 
  Copy, 
  Check, 
  Search, 
  RotateCw, 
  Globe, 
  Smartphone, 
  Tv, 
  X,
  Plus
} from 'lucide-react';

interface ParsecComputersProps {
  computers: RemoteComputer[];
  onConnect: (computer: RemoteComputer) => void;
  onSelectWebViewer?: () => void;
}

export const ParsecComputers: React.FC<ParsecComputersProps> = ({ 
  computers, 
  onConnect,
  onSelectWebViewer 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [peerInput, setPeerInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://pulsegrid.app';
  const thisComputerLink = `${currentOrigin}/?join=3l8x9k`;

  const handleCopyLink = (urlToCopy?: string) => {
    navigator.clipboard.writeText(urlToCopy || thisComputerLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filtered = computers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.peerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Top Header Section matching Image 1 */}
      <div className="space-y-1">
        <h1 className="text-3xl font-light tracking-tight text-white font-sans">
          Computers
        </h1>
        <p className="text-xs text-slate-400">
          Connect to your computer or a friend's computer in low latency desktop mode.
        </p>
      </div>

      {/* Search Bar & Reload matching Image 1 */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#2b2d38]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Hosts and Computers"
            className="w-full bg-[#1b1c22] border border-[#2e303d] rounded-md pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans"
          />
        </div>

        <button 
          onClick={() => setSearchQuery('')}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1 cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Reload</span>
        </button>
      </div>

      {/* Computer Cards Container (Dark Box matching Image 1) */}
      <div className="bg-[#1a1b20] border border-[#292a33] rounded-xl p-6 min-h-[340px] shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((computer) => (
            <div
              key={computer.id}
              className="bg-[#24262f] border border-[#333644] hover:border-rose-500/50 rounded-lg p-5 flex flex-col items-center justify-between text-center space-y-4 shadow-md transition-all group relative overflow-hidden"
            >
              {/* Retro Pixel Art Screen Display matching Image 1 */}
              <div className="w-24 h-20 bg-[#16171d] rounded-lg border-2 border-[#3d4255] flex flex-col items-center justify-center p-2 relative shadow-inner group-hover:scale-105 transition-transform">
                {/* Crown/Pixel top */}
                <div className="absolute -top-2 w-6 h-1.5 bg-rose-500/40 rounded-t" />
                <div className="w-12 h-10 border border-slate-600 rounded flex items-center justify-center bg-[#0d0e12]">
                  <Tv className="w-6 h-6 text-slate-300" />
                </div>
                {/* Screen Base */}
                <div className="w-8 h-1 bg-[#3d4255] mt-1.5 rounded-full" />
              </div>

              {/* Computer Info */}
              <div className="space-y-0.5 w-full">
                <div className="font-bold text-xs text-white tracking-wide truncate">
                  {computer.name}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {computer.isHost ? 'This Computer' : `${computer.os.toUpperCase()} • ${computer.pingMs}ms`}
                </div>
              </div>

              {/* Shareable Link Field matching Image 1 */}
              <div className="w-full bg-[#16171d] border border-[#35394a] rounded px-2 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-300">
                <span className="truncate max-w-[130px]">{computer.shareUrl}</span>
                <button
                  onClick={() => handleCopyLink(computer.shareUrl)}
                  className="text-rose-400 hover:text-rose-300 p-0.5 cursor-pointer"
                  title="Copy share link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Connect Action Button */}
              <button
                onClick={() => onConnect(computer)}
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded transition-all shadow active:scale-95 cursor-pointer uppercase tracking-wider"
              >
                CONNECT
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Two Viewing Options Info Cards (iPhone / iPad + App Code) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* App 6-Digit PIN Option */}
        <div className="bg-[#1a1b20] border border-[#292a33] p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] bg-blue-600/20 text-blue-300 font-mono font-bold px-2 py-0.5 rounded">
              OPTION 1: APP CODE
            </span>
            <div className="text-xs font-bold text-white">6-Digit App Pairing PIN (842-109)</div>
            <div className="text-[11px] text-slate-400">Pair host and client directly inside the PulseGrid app.</div>
          </div>
        </div>

        {/* Web Link Option (iPhone / iPad) */}
        <div className="bg-[#1a1b20] border border-[#292a33] p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] bg-rose-600/20 text-rose-300 font-mono font-bold px-2 py-0.5 rounded">
              OPTION 2: WEB LINK (IPHONE / IPAD)
            </span>
            <div className="text-xs font-bold text-white">Safari Mobile Stream (100% Free)</div>
            <div className="text-[11px] text-slate-400">Stream on iOS devices via Safari without installing anything.</div>
          </div>
          {onSelectWebViewer && (
            <button
              onClick={onSelectWebViewer}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              Open Web View
            </button>
          )}
        </div>
      </div>

      {/* Persistent Bottom Bar matching Image 1 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#16171d] border-t border-[#292b37] px-6 py-3 flex items-center justify-end space-x-3">
        <input
          type="text"
          value={peerInput}
          onChange={(e) => setPeerInput(e.target.value)}
          placeholder="Join with a share link, Peer ID, or 6-digit PIN."
          className="bg-[#21232c] border border-[#343747] text-xs px-4 py-2 rounded text-slate-200 focus:outline-none focus:border-rose-500 w-80 font-mono"
        />
        <button
          onClick={() => {
            if (peerInput) {
              onConnect({
                id: 'peer-custom',
                name: `Peer Session (${peerInput})`,
                os: 'windows',
                gpu: 'NVIDIA RTX 4080 (NVENC)',
                resolution: '1920x1080',
                maxFps: 60,
                status: 'online',
                pingMs: 12,
                peerId: peerInput,
                pairingPin: peerInput,
                shareUrl: `https://pulsegrid.app/join/${peerInput}`,
                isHost: false,
                encoder: 'NVENC (NVIDIA)',
                lastActive: 'Just now'
              });
            }
          }}
          className="px-6 py-2 bg-[#2d303f] hover:bg-rose-600 text-slate-200 hover:text-white font-bold text-xs rounded border border-[#3d4257] hover:border-rose-500 transition-all cursor-pointer uppercase tracking-wider"
        >
          Join
        </button>
      </div>
    </div>
  );
};

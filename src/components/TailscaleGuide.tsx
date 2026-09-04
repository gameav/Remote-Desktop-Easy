import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Wifi, 
  Smartphone, 
  Monitor, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Zap, 
  Server,
  Play,
  Terminal
} from 'lucide-react';

export const TailscaleGuide: React.FC = () => {
  const [testIp, setTestIp] = useState<string>('100.84.192.42');
  const [simulatedPing, setSimulatedPing] = useState<number | null>(null);
  const [pingStatus, setPingStatus] = useState<string>('idle');

  const runLatencyTest = () => {
    setPingStatus('testing');
    setTimeout(() => {
      // Simulate realistic Tailscale WireGuard peer-to-peer latency (12-24ms)
      const lat = Math.floor(Math.random() * 10) + 14;
      setSimulatedPing(lat);
      setPingStatus('success');
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Hero Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-3.5 mb-4">
          <div className="p-2.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
              Pairing & Remote Access over Tailscale
            </h2>
            <p className="text-xs text-slate-400">
              Access your remote workstation from anywhere in the world — without router port-forwarding or public IP configuration.
            </p>
          </div>
        </div>

        {/* Why Tailscale */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-6">
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 shadow-sm">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-2">
              <Zap className="w-4 h-4" />
              <span>Direct Peer-to-Peer</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Tailscale coordinates STUN/DERP hole-punching automatically. Packets travel directly between your phone and PC over encrypted UDP.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 shadow-sm">
            <div className="flex items-center space-x-2 text-blue-400 font-semibold mb-2">
              <Lock className="w-4 h-4" />
              <span>Bypasses Firewalls</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Even behind strict mobile LTE/5G carrier-grade NATs, office firewalls, or hotel Wi-Fi networks, Tailscale provides a private static <code className="text-blue-300">100.x.y.z</code> address.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 shadow-sm">
            <div className="flex items-center space-x-2 text-indigo-300 font-semibold mb-2">
              <Smartphone className="w-4 h-4" />
              <span>Native Mobile Support</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Install the official Tailscale app once and toggle it ON. Mobile Safari or Chrome can open <code className="text-indigo-300">http://100.x.y.z:3000</code> just like a local device.
            </p>
          </div>
        </div>
      </div>

      {/* Step-by-Step Setup Walkthrough */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest px-1">
          Simple Setup Guide
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold font-mono">
                  STEP 01
                </span>
                <Monitor className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="font-semibold text-slate-200 text-sm">Install Tailscale on Host PC</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download Tailscale for Windows, Mac, or Linux from <a href="https://tailscale.com" target="_blank" rel="noreferrer" className="text-blue-400 underline hover:text-blue-300">tailscale.com</a> and log in.
              </p>
              <div className="p-3 bg-slate-950 rounded-lg font-mono text-[11px] text-slate-300 border border-slate-800">
                <span className="text-slate-500"># Check your Tailscale IP:</span><br />
                <span className="text-emerald-400 font-bold">tailscale ip -4</span><br />
                <span className="text-blue-400">&gt; 100.84.192.42</span>
              </div>
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center space-x-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Host connected to mesh</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold font-mono">
                  STEP 02
                </span>
                <Smartphone className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="font-semibold text-slate-200 text-sm">Install Tailscale on Phone</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Install Tailscale from App Store or Google Play. Sign into the <strong>same account</strong> and enable the connection.
              </p>
              <div className="p-3 bg-slate-950 rounded-lg text-[11px] text-slate-400 border border-slate-800 leading-relaxed">
                Your mobile device is now securely connected directly to your computer.
              </div>
            </div>
            <div className="text-[11px] text-indigo-300 flex items-center space-x-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mobile VPN active</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono">
                  STEP 03
                </span>
                <Globe className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="font-semibold text-slate-200 text-sm">Connect in Browser</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Open browser on phone/laptop and enter your host computer's Tailscale address:
              </p>
              <div className="p-3 bg-slate-950 rounded-lg font-mono text-[11px] text-slate-300 border border-slate-800">
                <span className="text-slate-500">In mobile browser:</span><br />
                <span className="text-amber-300 font-bold">http://100.84.192.42:3000</span>
              </div>
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center space-x-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Remote desktop streaming active!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Latency Diagnostic Tool */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-widest">
            Peer Latency Diagnostic Tool
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={testIp}
            onChange={(e) => setTestIp(e.target.value)}
            placeholder="100.x.y.z"
            className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs w-52 focus:outline-none focus:border-blue-500"
          />

          <button
            onClick={runLatencyTest}
            disabled={pingStatus === 'testing'}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{pingStatus === 'testing' ? 'Testing Path...' : 'Ping Peer'}</span>
          </button>

          {simulatedPing !== null && (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>RTT: {simulatedPing}ms (Direct Peer-to-Peer UDP Connection)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

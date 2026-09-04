import React, { useState } from 'react';
import { 
  Smartphone, 
  Tablet, 
  Globe, 
  Zap, 
  Lock, 
  Gamepad2, 
  Sliders, 
  Copy, 
  Check, 
  ExternalLink,
  Play,
  Tv,
  QrCode,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface WebViewerProps {
  onStartWebStream: (pinOrLink: string) => void;
}

export const PulseGridWebViewer: React.FC<WebViewerProps> = ({ onStartWebStream }) => {
  const [pinCode, setPinCode] = useState('842-109');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'iphone' | 'ipad' | 'browser'>('iphone');

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://pulsegrid.app';
  const webLink = `${currentOrigin}/?join=${pinCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(webLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Hero Banner: Dual Connection Options */}
      <div className="bg-[#141620] border border-[#272b3f] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-rose-400" />
              <span>100% Free Cross-Platform Web Client</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Connect via App Code or Web Link on iPhone, iPad & Browsers
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              No App Store install required! Simply enter the 6-digit PIN in the PulseGrid app, or open the instant Web Link on your iPhone, iPad, Mac, or PC browser to start streaming at 60 FPS.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-[#0d0e15] p-2 rounded-xl border border-[#282d42]">
            <button
              onClick={() => setActiveDeviceTab('iphone')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeDeviceTab === 'iphone'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>iPhone</span>
            </button>

            <button
              onClick={() => setActiveDeviceTab('ipad')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeDeviceTab === 'ipad'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tablet className="w-4 h-4" />
              <span>iPad & Tablet</span>
            </button>

            <button
              onClick={() => setActiveDeviceTab('browser')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeDeviceTab === 'browser'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Safari / Chrome</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Viewing Options Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OPTION 1: 6-Digit App Pairing Code */}
        <div className="bg-[#141620] border border-[#272b3f] hover:border-rose-500/50 rounded-2xl p-6 space-y-5 transition-all shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-blue-600/20 text-blue-300 font-mono font-bold text-xs rounded-md border border-blue-500/30">
                OPTION 1
              </span>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Works in PulseGrid App</span>
              </span>
            </div>

            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>6-Digit App Pairing PIN Code</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Enter this secure 6-digit code inside the PulseGrid app on your PC, Mac, Linux, or mobile app to pair host and client instantly.
            </p>

            <div className="p-4 bg-[#0a0b10] rounded-xl border border-[#23273a] text-center space-y-1">
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase block">YOUR PEER PAIRING PIN</span>
              <div className="text-3xl font-black font-mono text-rose-400 tracking-widest">
                {pinCode}
              </div>
            </div>
          </div>

          <button
            onClick={() => onStartWebStream(pinCode)}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
          >
            <Play className="w-4 h-4" />
            <span>Connect using 6-Digit Code ({pinCode})</span>
          </button>
        </div>

        {/* OPTION 2: Instant Web Link for iPhone & iPad */}
        <div className="bg-[#141620] border border-[#272b3f] hover:border-rose-500/50 rounded-2xl p-6 space-y-5 transition-all shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-rose-600/20 text-rose-300 font-mono font-bold text-xs rounded-md border border-rose-500/30">
                OPTION 2 (iPhone & iPad)
              </span>
              <span className="text-[11px] text-rose-400 font-mono flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5" />
                <span>Zero Installation</span>
              </span>
            </div>

            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Direct Safari / Web Share Link</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Open or share this URL directly in Safari on your iPhone, iPad, or browser. Includes WebRTC 60 FPS hardware video decoding & touch gestures.
            </p>

            <div className="p-3 bg-[#0a0b10] rounded-xl border border-[#23273a] flex items-center justify-between space-x-2">
              <div className="font-mono text-xs text-slate-200 truncate select-all">
                {webLink}
              </div>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-[#1f2334] hover:bg-[#2a2f47] text-rose-300 text-xs font-bold transition-all shrink-0 flex items-center space-x-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => onStartWebStream(webLink)}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider border border-slate-700"
          >
            <ExternalLink className="w-4 h-4 text-rose-400" />
            <span>Launch Web Session in Safari / Browser</span>
          </button>
        </div>
      </div>

      {/* iPhone & iPad Simulator Frame Preview */}
      <div className="bg-[#141620] border border-[#272b3f] rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-sm text-white">
              {activeDeviceTab === 'iphone' && 'iPhone Safari Mobile Touch View'}
              {activeDeviceTab === 'ipad' && 'iPadOS Multi-Touch & Apple Pencil View'}
              {activeDeviceTab === 'browser' && 'Cross-Platform Web Browser Canvas'}
            </h3>
          </div>
          <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            100% Free • Unlimited Bandwidth
          </span>
        </div>

        {/* Responsive Mobile Device Canvas Simulator */}
        <div className="w-full max-w-2xl mx-auto aspect-video bg-black rounded-2xl border-4 border-[#2d3248] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-4 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <Tv className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold text-white">PulseGrid WebRTC Stream Engine</div>
            <div className="text-xs text-slate-400 max-w-sm">
              Ready to stream at 1080p60 on {activeDeviceTab === 'iphone' ? 'iPhone' : activeDeviceTab === 'ipad' ? 'iPad' : 'Web Browser'}. Touch trackpad & virtual gamepad controls enabled.
            </div>
          </div>
          <button
            onClick={() => onStartWebStream(pinCode)}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
          >
            Start Stream on {activeDeviceTab.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};

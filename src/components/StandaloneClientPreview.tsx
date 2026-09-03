import React, { useState } from 'react';
import { 
  Smartphone, 
  Rotate3d, 
  Hand, 
  ZoomIn, 
  ZoomOut, 
  CornerUpLeft, 
  Settings,
  Activity,
  Keyboard as KeyboardIcon,
  Sparkles,
  Zap,
  Sliders
} from 'lucide-react';

export const StandaloneClientPreview: React.FC = () => {
  const [deviceView, setDeviceView] = useState<'iphone' | 'desktop'>('iphone');
  const [activeMode, setActiveMode] = useState<'direct' | 'trackpad' | 'desktop_kvm'>('direct');
  const [activeCadTool, setActiveCadTool] = useState<string | null>(null);
  const [showKeyboardDrawer, setShowKeyboardDrawer] = useState<boolean>(false);
  const [modifiers, setModifiers] = useState({ ctrl: false, shift: false, alt: false });
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string>('Connected via WebRTC P2P');
  const [simulatedAbrTier, setSimulatedAbrTier] = useState<string>('Ultra (1080p60)');

  const handleTouch = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTouchPos({ x, y });

    const normX = (x / rect.width).toFixed(3);
    const normY = (y / rect.height).toFixed(3);

    if (activeCadTool === 'orbit') {
      setActionFeedback(`CAD Orbit Drag [${normX}, ${normY}] (MMB Active)`);
    } else if (activeCadTool === 'pan') {
      setActionFeedback(`CAD Pan Drag [${normX}, ${normY}] (Shift+MMB Active)`);
    } else if (activeMode === 'direct') {
      setActionFeedback(`Direct Touch Tap @ [${normX}, ${normY}] (Win32 LeftClick)`);
    } else {
      setActionFeedback(`Virtual Trackpad Rel Vector [${x.toFixed(0)}px, ${y.toFixed(0)}px]`);
    }
  };

  const toggleModifier = (mod: 'ctrl' | 'shift' | 'alt') => {
    setModifiers(prev => {
      const next = { ...prev, [mod]: !prev[mod] };
      setActionFeedback(`Modifier ${mod.toUpperCase()}: ${next[mod] ? 'LATCHED (ACTIVE)' : 'RELEASED'}`);
      return next;
    });
  };

  const sendKey = (keyName: string) => {
    const mods = Object.entries(modifiers).filter(([_, v]) => v).map(([k]) => k.toUpperCase()).join('+');
    const combo = mods ? `${mods}+${keyName}` : keyName;
    setActionFeedback(`Dispatched Key: [${combo}] to Windows Host`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Device Switcher */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-white/10 border border-white/15 text-blue-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-widest">
              Interactive WebRTC Client Preview ({deviceView === 'iphone' ? 'iPhone Safari Touch Mockup' : 'Desktop Browser KVM Mockup'})
            </h2>
            <p className="text-[11px] text-slate-400">
              Zero-install browser client: touch gestures on iOS/Android or Pointer Lock & hardware keyboard capture on Mac/Windows/Linux.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-white/5 p-1 rounded-full border border-white/10 flex backdrop-blur-md">
            <button
              onClick={() => setDeviceView('iphone')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                deviceView === 'iphone' ? 'bg-white/20 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📱 iPhone Safari
            </button>
            <button
              onClick={() => setDeviceView('desktop')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                deviceView === 'desktop' ? 'bg-blue-500/80 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              💻 Desktop Browser (KVM)
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        {/* iPhone Chassis Container with Frosted Highlights */}
        <div className="relative w-full max-w-[390px] h-[780px] bg-black/90 rounded-[48px] border-[6px] border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(59,130,246,0.15)] overflow-hidden flex flex-col justify-between backdrop-blur-2xl">
          {/* Dynamic Island / Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-end px-3 border border-white/10">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-white/10"></div>
          </div>

          {/* Top HUD with ABR Telemetry */}
          <div className="pt-10 px-4 flex items-center justify-between z-30 select-none">
            <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-[11px] font-mono text-emerald-400 flex items-center space-x-1.5 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#22c55e] animate-pulse"></span>
              <span>14.2ms | 60 FPS</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-[10px] font-mono text-blue-300 flex items-center space-x-1 shadow-md">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>ABR: 18 Mbps</span>
            </div>
          </div>

          {/* Interactive Screen Viewport (Simulating remote desktop CAD video stream) */}
          <div 
            onClick={handleTouch}
            className="relative flex-1 my-2 mx-2 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-black border border-white/10 flex items-center justify-center cursor-crosshair overflow-hidden select-none"
          >
            {/* Simulated CAD Canvas Background */}
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Simulated 3D CAD Wireframe Geometry */}
            <div className="relative z-10 text-center space-y-2 p-4">
              <div className="w-28 h-28 mx-auto border border-blue-400/40 rounded-3xl bg-blue-500/10 backdrop-blur-md flex items-center justify-center rotate-12 shadow-[0_0_25px_rgba(59,130,246,0.3)] animate-pulse">
                <Rotate3d className="w-10 h-10 text-blue-400" />
              </div>
              <div className="text-xs font-mono text-blue-300 font-bold tracking-wide">
                Windows 10 Remote CAD
              </div>
              <div className="text-[10px] text-slate-400 max-w-[200px] leading-tight">
                H.264 Hardware Decode &bull; Zero Lag DataChannel
              </div>
            </div>

            {/* Virtual Touch Ripple Marker */}
            {touchPos && (
              <div
                style={{ left: touchPos.x, top: touchPos.y }}
                className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-400 bg-blue-500/30 animate-ping pointer-events-none"
              />
            )}

            {/* Feedback Toast Inside Viewport */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-mono text-slate-200 shadow-xl whitespace-nowrap">
              {actionFeedback}
            </div>

            {/* On-Screen CAD Keyboard Drawer Overlay */}
            {showKeyboardDrawer && (
              <div className="absolute bottom-2 inset-x-2 bg-black/90 backdrop-blur-2xl border border-white/20 rounded-2xl p-2.5 z-40 space-y-2 shadow-2xl animate-in slide-in-from-bottom duration-200">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                    CAD Virtual Keyboard
                  </span>
                  <button
                    onClick={() => setShowKeyboardDrawer(false)}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Modifiers row */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => toggleModifier('ctrl')}
                    className={`py-1.5 rounded-lg text-[10px] font-mono font-bold border ${
                      modifiers.ctrl ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    CTRL {modifiers.ctrl && '✓'}
                  </button>
                  <button
                    onClick={() => toggleModifier('shift')}
                    className={`py-1.5 rounded-lg text-[10px] font-mono font-bold border ${
                      modifiers.shift ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    SHIFT {modifiers.shift && '✓'}
                  </button>
                  <button
                    onClick={() => toggleModifier('alt')}
                    className={`py-1.5 rounded-lg text-[10px] font-mono font-bold border ${
                      modifiers.alt ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    ALT {modifiers.alt && '✓'}
                  </button>
                </div>

                {/* Hotkeys row */}
                <div className="grid grid-cols-5 gap-1">
                  <button onClick={() => sendKey('Escape')} className="py-1.5 bg-white/10 rounded text-[10px] font-mono text-slate-200 hover:bg-white/20">ESC</button>
                  <button onClick={() => sendKey('F')} className="py-1.5 bg-white/10 rounded text-[10px] font-mono text-slate-200 hover:bg-white/20">F</button>
                  <button onClick={() => sendKey('Space')} className="py-1.5 bg-white/10 rounded text-[10px] font-mono text-slate-200 hover:bg-white/20">SPACE</button>
                  <button onClick={() => sendKey('Tab')} className="py-1.5 bg-white/10 rounded text-[10px] font-mono text-slate-200 hover:bg-white/20">TAB</button>
                  <button onClick={() => sendKey('Delete')} className="py-1.5 bg-white/10 rounded text-[10px] font-mono text-red-300 hover:bg-white/20">DEL</button>
                </div>

                {/* Common CAD combos */}
                <div className="grid grid-cols-3 gap-1">
                  <button onClick={() => sendKey('Ctrl+Z')} className="py-1.5 bg-white/10 rounded text-[10px] font-mono text-slate-200 hover:bg-white/20">Undo (Ctrl+Z)</button>
                  <button onClick={() => sendKey('Ctrl+S')} className="py-1.5 bg-white/10 rounded text-[10px] font-mono text-slate-200 hover:bg-white/20">Save (Ctrl+S)</button>
                  <button onClick={() => sendKey('Enter')} className="py-1.5 bg-white/10 rounded text-[10px] font-mono text-emerald-300 hover:bg-white/20">Enter ↵</button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom CAD Floating Action Bar (Frosted Glass Island) */}
          <div className="pb-8 px-3 z-30">
            <div className="p-1.5 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl flex items-center justify-between gap-1">
              <button
                onClick={() => setActiveMode(activeMode === 'direct' ? 'trackpad' : 'direct')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                  activeMode === 'direct' ? 'bg-blue-500/80 text-white border border-blue-400/40 shadow-sm' : 'bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <span>{activeMode === 'direct' ? '👆 Direct' : '🖱️ Trackpad'}</span>
              </button>

              <button
                onClick={() => setShowKeyboardDrawer(!showKeyboardDrawer)}
                className={`p-2 rounded-full text-[11px] font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                  showKeyboardDrawer ? 'bg-indigo-500/80 text-white border border-indigo-400/40 shadow-[0_0_12px_rgba(99,102,241,0.5)]' : 'bg-white/5 text-slate-300 hover:text-white'
                }`}
                title="Toggle CAD Keyboard"
              >
                <KeyboardIcon className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  const next = activeCadTool === 'orbit' ? null : 'orbit';
                  setActiveCadTool(next);
                  setActionFeedback(next ? 'Orbit Mode Enabled (Middle-Mouse Drag)' : 'Orbit Disabled');
                }}
                className={`p-2 rounded-full text-[11px] font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                  activeCadTool === 'orbit' ? 'bg-blue-500/80 text-white border border-blue-400/40 shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 'bg-white/5 text-slate-300 hover:text-white'
                }`}
                title="3D Orbit"
              >
                <Rotate3d className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  const next = activeCadTool === 'pan' ? null : 'pan';
                  setActiveCadTool(next);
                  setActionFeedback(next ? 'Pan Mode Enabled (Shift+MMB Drag)' : 'Pan Disabled');
                }}
                className={`p-2 rounded-full text-[11px] font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                  activeCadTool === 'pan' ? 'bg-blue-500/80 text-white border border-blue-400/40 shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 'bg-white/5 text-slate-300 hover:text-white'
                }`}
                title="CAD Pan"
              >
                <Hand className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setActionFeedback('Zoom In Wheel Event (+120)')}
                className="p-2 rounded-full bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setActionFeedback('Zoom Out Wheel Event (-120)')}
                className="p-2 rounded-full bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Home Indicator Bar */}
            <div className="w-32 h-1 bg-white/20 rounded-full mx-auto mt-3"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

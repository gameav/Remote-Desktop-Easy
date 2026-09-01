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
  MousePointer,
  Sparkles
} from 'lucide-react';

export const StandaloneClientPreview: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'direct' | 'trackpad'>('direct');
  const [activeCadTool, setActiveCadTool] = useState<string | null>(null);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string>('Connected to Windows Host');

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
      setActionFeedback(`CAD Pan Drag [${normX}, ${normY}] (Shift+MMB)`);
    } else if (activeMode === 'direct') {
      setActionFeedback(`Direct Touch Tap @ [${normX}, ${normY}] (Left Click)`);
    } else {
      setActionFeedback(`Virtual Trackpad Rel Vector [${x.toFixed(0)}px, ${y.toFixed(0)}px]`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-white/10 border border-white/15 text-blue-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-widest">
              iPhone Mobile Web Client Live Preview (iOS Safari Mockup)
            </h2>
            <p className="text-[11px] text-slate-400">
              HTML5 WebRTC viewport with hardware-accelerated H.264 video decoding and low-latency gesture controls.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)] flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#22c55e]" />
          <span>Active DataChannel</span>
        </span>
      </div>

      <div className="flex justify-center">
        {/* iPhone Chassis Container with Frosted Highlights */}
        <div className="relative w-full max-w-[390px] h-[780px] bg-black/90 rounded-[48px] border-[6px] border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(59,130,246,0.15)] overflow-hidden flex flex-col justify-between backdrop-blur-2xl">
          {/* Dynamic Island / Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-end px-3 border border-white/10">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-white/10"></div>
          </div>

          {/* Top HUD */}
          <div className="pt-10 px-4 flex items-center justify-between z-30 select-none">
            <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-[11px] font-mono text-emerald-400 flex items-center space-x-1.5 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#22c55e] animate-pulse"></span>
              <span>14.2ms | 60 FPS</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-[11px] font-mono text-slate-300 flex items-center space-x-1 shadow-md">
              <Settings className="w-3 h-3 text-slate-400" />
              <span>Config</span>
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
              <div className="w-32 h-32 mx-auto border border-blue-400/40 rounded-3xl bg-blue-500/10 backdrop-blur-md flex items-center justify-center rotate-12 shadow-[0_0_25px_rgba(59,130,246,0.3)] animate-pulse">
                <Rotate3d className="w-12 h-12 text-blue-400" />
              </div>
              <div className="text-xs font-mono text-blue-300 font-bold tracking-wide">
                Windows 10 CAD Desktop
              </div>
              <div className="text-[10px] text-slate-400 max-w-[200px] leading-tight">
                Tap anywhere to send touch coordinates to Windows host.
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

              <button
                onClick={() => setActionFeedback('Sent [ESC] Key')}
                className="px-2.5 py-1.5 rounded-full bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 text-[10px] font-mono font-bold cursor-pointer"
                title="Escape"
              >
                ESC
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

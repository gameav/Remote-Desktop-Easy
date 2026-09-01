import React from 'react';
import { 
  Zap, 
  Cpu, 
  Layers, 
  Eye, 
  Gauge, 
  Flame, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export const OptimizationGuide: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Overview */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center space-x-3.5 mb-3">
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
              Low-Latency WebRTC & CAD Video Streaming Deep Dive
            </h2>
            <p className="text-xs text-slate-400">
              Technical optimizations for sub-30ms glass-to-glass latency, smooth 3D viewport navigation, and iOS Safari WebRTC quirks.
            </p>
          </div>
        </div>
      </div>

      {/* Optimization Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. iOS Safari WebRTC Quirks */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
            <Cpu className="w-4 h-4" />
            <span>1. iOS Safari Hardware Decoder & H.264 Profiles</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            iOS Safari has strict requirements for low-latency WebRTC hardware acceleration. Unlike Chrome on Desktop, Safari enforces:
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>
              <strong>H.264 Baseline Profile:</strong> Ensure your SDP negotiation specifies <code className="text-blue-300 font-mono">profile-level-id=42e01f</code> or <code className="text-blue-300 font-mono">42001f</code> (Constrained Baseline) to guarantee hardware decode via Apple Neural Engine / VideoToolbox.
            </li>
            <li>
              <strong>Mandatory Video Attributes:</strong> The HTML5 <code className="text-blue-300 font-mono">&lt;video&gt;</code> element <em>must</em> have <code className="text-amber-300 font-mono">playsinline</code>, <code className="text-amber-300 font-mono">muted</code>, and <code className="text-amber-300 font-mono">webkit-playsinline</code> attributes, or iOS will pause streaming or force unwanted fullscreen quicktime players.
            </li>
          </ul>
        </div>

        {/* 2. Screen Capture Pipeline: MSS vs DXGI Desktop Duplication */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <Flame className="w-4 h-4" />
            <span>2. Screen Capture: MSS vs DXGI Desktop Duplication</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In our boilerplate, we use <code className="text-emerald-300 font-mono">mss</code> because it is cross-platform, zero-dependency, and grabs frames in ~4-6ms.
          </p>
          <div className="p-3.5 bg-black/40 backdrop-blur-md rounded-xl text-xs space-y-2 border border-white/10 shadow-sm">
            <div className="text-slate-200 font-semibold">For Maximum Performance (Production Upgrade):</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Upgrade capture to <strong>DirectX 11 Desktop Duplication API (DXGI / d3dshot / BetterCam)</strong>. DXGI captures frames directly in GPU VRAM (&lt;1ms latency), completely bypassing CPU memory copies.
            </p>
          </div>
        </div>

        {/* 3. CAD Gesture & Touch Jitter Mitigation */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center space-x-2 text-indigo-300 font-bold text-sm">
            <Sliders className="w-4 h-4" />
            <span>3. CAD Precision: Dual Input Modes</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            CAD applications (SolidWorks, AutoCAD, Fusion 360, Revit) require millimeter precision that fingers on touchscreens cannot easily achieve.
          </p>
          <div className="grid grid-cols-2 gap-2.5 text-[11px]">
            <div className="p-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-slate-400 shadow-sm">
              <span className="font-semibold text-slate-200 block mb-1">👆 Direct Touch</span>
              Best for selecting menu ribbons, buttons, and placing points directly where you tap.
            </div>
            <div className="p-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-slate-400 shadow-sm">
              <span className="font-semibold text-slate-200 block mb-1">🖱️ CAD Trackpad</span>
              Relative mouse movements with adjustable sensitivity (1.0x-2.5x) for delicate sketch constraints.
            </div>
          </div>
        </div>

        {/* 4. WebRTC Jitter Buffer & Bitrate Tuning */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <Zap className="w-4 h-4" />
            <span>4. WebRTC Jitter Buffer & Zero-Lag Flags</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Standard video players buffer 200-500ms of frames to prevent stuttering. For real-time CAD manipulation, buffering must be disabled:
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>
              <strong>Ordered Data Channels:</strong> Use <code className="text-amber-300 font-mono">ordered: true</code> for mouse movements and clicks so mouse-up events are never processed before mouse-down.
            </li>
            <li>
              <strong>Pacing & PTS:</strong> Use microsecond-resolution Presentation Time Stamps with an exact 90kHz timebase so WebRTC never drops frames due to jitter.
            </li>
          </ul>
        </div>
      </div>

      {/* Windows 10 Host System Settings Checklist */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4 shadow-2xl">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest px-1">
          Windows 10 Workstation Host Optimization Checklist
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start space-x-2.5 p-3.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Disable Sleep & Hibernation:</span>
              <p className="text-slate-400 text-[11px] mt-0.5">Set Windows Power Plan to &quot;High Performance&quot; and disable screen timeout so the host never suspends while you are away.</p>
            </div>
          </div>

          <div className="flex items-start space-x-2.5 p-3.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">HDMI Headless Dummy Plug:</span>
              <p className="text-slate-400 text-[11px] mt-0.5">If your monitor is turned off when away, attach a $5 4K HDMI headless dummy plug to your GPU to keep the hardware display pipeline active.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

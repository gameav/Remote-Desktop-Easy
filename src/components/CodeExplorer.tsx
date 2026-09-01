import React, { useState } from 'react';
import { CODE_FILES } from '../data/codeFiles';
import { 
  Copy, 
  Check, 
  FileCode2, 
  Terminal, 
  Layers, 
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  Download
} from 'lucide-react';
import { downloadProjectZip } from '../utils/zipGenerator';

export const CodeExplorer: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>('windows_host');
  const [copied, setCopied] = useState<boolean>(false);
  
  // Customizer inputs
  const [customFps, setCustomFps] = useState<number>(30);
  const [customPort, setCustomPort] = useState<number>(3000);
  const [tailscaleIp, setTailscaleIp] = useState<string>('100.84.192.42');
  const [customScale, setCustomScale] = useState<number>(1.0);

  const selectedFile = CODE_FILES.find((f) => f.id === selectedFileId) || CODE_FILES[0];

  // Dynamic code injection based on customizer
  let displayCode = selectedFile.content;
  if (selectedFile.id === 'windows_host') {
    displayCode = displayCode.replace('default=30', `default=${customFps}`);
    displayCode = displayCode.replace('default=1.0', `default=${customScale}`);
  } else if (selectedFile.id === 'signaling_node' || selectedFile.id === 'signaling_python') {
    displayCode = displayCode.replace('3000', `${customPort}`);
  } else if (selectedFile.id === 'batch_script') {
    displayCode = displayCode.replace('--fps 30', `--fps ${customFps}`);
    displayCode = displayCode.replace(':3000', `:${customPort}`);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Architecture Sequence Overview */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-2.5 mb-4">
          <div className="p-2 rounded-xl bg-white/10 border border-white/15 text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-bold text-slate-100 uppercase tracking-widest">
            WebRTC Low-Latency Architecture & Connection Lifecycle
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex flex-col justify-between space-y-2 shadow-sm">
            <div>
              <div className="flex items-center space-x-1.5 text-blue-400 font-semibold mb-1">
                <span>1. Capture & Encoding</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                <code className="text-slate-200">mss</code> grabs Windows 10 screen frames directly into memory, wraps with PyAV <code className="text-slate-200">av.VideoFrame</code>, and yields frames to <code className="text-slate-200">aiortc</code> at targeted {customFps} FPS.
              </p>
            </div>
            <div className="text-[10px] font-mono text-slate-500">host/windows_host.py</div>
          </div>

          <div className="p-3.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex flex-col justify-between space-y-2 shadow-sm">
            <div>
              <div className="flex items-center space-x-1.5 text-indigo-300 font-semibold mb-1">
                <span>2. Signaling Exchange</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Host connects to Node/Python WebSocket server, posts SDP Offer. iPhone connects from Safari, receives Offer, and returns SDP Answer.
              </p>
            </div>
            <div className="text-[10px] font-mono text-slate-500">signaling/signaling_server.js</div>
          </div>

          <div className="p-3.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex flex-col justify-between space-y-2 shadow-sm">
            <div>
              <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold mb-1">
                <span>3. Direct P2P Media Stream</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                WebRTC performs ICE candidate punch (or communicates over Tailscale private tunnel). Hardware-accelerated H.264 video streams directly to iPhone &lt;video&gt;.
              </p>
            </div>
            <div className="text-[10px] font-mono text-slate-500">P2P Media Channel (UDP)</div>
          </div>

          <div className="p-3.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex flex-col justify-between space-y-2 shadow-sm">
            <div>
              <div className="flex items-center space-x-1.5 text-amber-300 font-semibold mb-1">
                <span>4. Low-Lag Touch & CAD</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                iPhone touch gestures (direct coordinates, CAD orbit MMB, pan Shift+MMB, zoom wheel) stream back over RTCDataChannel; PyAutoGUI drives Windows cursor.
              </p>
            </div>
            <div className="text-[10px] font-mono text-slate-500">client/index.html</div>
          </div>
        </div>
      </div>

      {/* Interactive Code Configurator */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
          <SlidersHorizontal className="w-4 h-4 text-blue-400" />
          <span>Live Parameter Configurator:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Target FPS:</span>
            <select
              value={customFps}
              onChange={(e) => setCustomFps(parseInt(e.target.value))}
              className="bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-slate-200 text-xs backdrop-blur-md outline-none"
            >
              <option value={30}>30 FPS (Low Bandwidth)</option>
              <option value={60}>60 FPS (Ultra Smooth CAD)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Scale:</span>
            <select
              value={customScale}
              onChange={(e) => setCustomScale(parseFloat(e.target.value))}
              className="bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-slate-200 text-xs backdrop-blur-md outline-none"
            >
              <option value={1.0}>1.0x (Native Resolution)</option>
              <option value={0.75}>0.75x (Scaled 720p)</option>
              <option value={0.5}>0.5x (Scaled 540p)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Signaling Port:</span>
            <input
              type="number"
              value={customPort}
              onChange={(e) => setCustomPort(parseInt(e.target.value) || 3000)}
              className="w-18 bg-black/50 border border-white/15 rounded-lg px-2 py-1 text-slate-200 font-mono text-xs outline-none"
            />
          </div>

          <button
            onClick={downloadProjectZip}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Download All Files (.zip)</span>
          </button>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File Selector Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
            Project Files
          </div>
          {CODE_FILES.map((file) => {
            const isSelected = file.id === selectedFileId;
            return (
              <button
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer backdrop-blur-md ${
                  isSelected
                    ? 'bg-white/15 border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.08)]'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <FileCode2 className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {file.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-black/40 text-slate-400 border border-white/10">
                    {file.language}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {file.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Code Content Viewer */}
        <div className="lg:col-span-9 bg-black/60 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-mono text-slate-100 font-bold">{selectedFile.name}</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">— {selectedFile.description}</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Syntax Highlighted Code Box */}
          <pre className="flex-1 p-5 font-mono text-xs text-slate-200 overflow-x-auto overflow-y-auto max-h-[560px] leading-relaxed select-text no-scrollbar bg-black/40">
            <code>{displayCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

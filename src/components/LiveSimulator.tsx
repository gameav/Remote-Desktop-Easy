import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Rotate3d, 
  Hand, 
  ZoomIn, 
  ZoomOut, 
  MousePointer2, 
  Activity, 
  Terminal, 
  Sliders, 
  CornerUpLeft, 
  Keyboard,
  Info
} from 'lucide-react';
import { StreamMetrics, TouchEventLog } from '../types';

export const LiveSimulator: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [inputMode, setInputMode] = useState<'direct' | 'trackpad'>('direct');
  const [targetFps, setTargetFps] = useState<number>(60);
  const [sensitivity, setSensitivity] = useState<number>(1.2);
  const [activeCadAction, setActiveCadAction] = useState<string | null>(null);
  
  // 3D CAD Model Transform State (simulating a 3D model viewport)
  const [rotX, setRotX] = useState<number>(25);
  const [rotY, setRotY] = useState<number>(-35);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  
  // Virtual Host Cursor Position
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 960, y: 540 });
  const [lastTouch, setLastTouch] = useState<{ x: number; y: number } | null>(null);

  // Metrics
  const [metrics, setMetrics] = useState<StreamMetrics>({
    fps: 60,
    rttMs: 14,
    packetsLost: 0,
    resolution: '1920x1080',
    bitrateKbps: 4200,
    codec: 'H.264 (Constrained Baseline)',
    state: 'connected'
  });

  // Touch/Event Log
  const [logs, setLogs] = useState<TouchEventLog[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<number | null>(null);
  const fpsTimerRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);

  // Helper to add event log
  const logEvent = (type: string, x: number, y: number, details: string) => {
    const newLog: TouchEventLog = {
      id: Math.random().toString(36).substring(2, 8),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + Math.floor(Date.now() % 1000).toString().padStart(3, '0'),
      type,
      x: Math.round(x),
      y: Math.round(y),
      details
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
  };

  // Canvas rendering loop simulating 60fps Windows 10 CAD desktop stream
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localRot = 0;

    const render = () => {
      if (!isStreaming) {
        ctx.fillStyle = '#05070d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#64748b';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STREAM PAUSED (Click Start Stream)', canvas.width / 2, canvas.height / 2);
        return;
      }

      frameCountRef.current++;
      const now = Date.now();
      if (now - fpsTimerRef.current >= 1000) {
        setMetrics(m => ({ ...m, fps: frameCountRef.current }));
        frameCountRef.current = 0;
        fpsTimerRef.current = now;
      }

      // Background - CAD Workspace
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid Lines (CAD Blueprint Style)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw CAD UI Header Simulation (SolidWorks / Fusion360 style)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, 36);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('⚡ Fusion 360 - [Mechanical_Turbine_Housing.step] (60 FPS Native Host)', 16, 22);

      // Draw 3D Isometric CAD Wireframe Object (Turbine / Gear)
      ctx.save();
      ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
      ctx.scale(zoom, zoom);

      // Convert angles to radians
      const radX = (rotX * Math.PI) / 180;
      const radY = ((rotY + localRot) * Math.PI) / 180;

      // Project 3D cube / cylinder wireframe
      const draw3DCADObject = () => {
        const size = 100;
        const vertices = [
          [-size, -size, -size],
          [size, -size, -size],
          [size, size, -size],
          [-size, size, -size],
          [-size, -size, size],
          [size, -size, size],
          [size, size, size],
          [-size, size, size],
          // Internal cylinder points
          [0, -size * 1.5, 0],
          [0, size * 1.5, 0]
        ];

        // 3D rotation projection
        const projected = vertices.map(([vx, vy, vz]) => {
          // Rot Y
          const x1 = vx * Math.cos(radY) + vz * Math.sin(radY);
          const z1 = -vx * Math.sin(radY) + vz * Math.cos(radY);
          // Rot X
          const y2 = vy * Math.cos(radX) - z1 * Math.sin(radX);
          const z2 = vy * Math.sin(radX) + z1 * Math.cos(radX);
          return [x1, y2, z2];
        });

        // Draw edges
        const edges = [
          [0, 1], [1, 2], [2, 3], [3, 0], // back face
          [4, 5], [5, 6], [6, 7], [7, 4], // front face
          [0, 4], [1, 5], [2, 6], [3, 7], // connecting edges
          [8, 0], [8, 1], [8, 4], [8, 5], // top turbine cone
          [9, 2], [9, 3], [9, 6], [9, 7]  // bottom mount
        ];

        // Draw solid subtle faces
        ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.beginPath();
        ctx.moveTo(projected[4][0], projected[4][1]);
        ctx.lineTo(projected[5][0], projected[5][1]);
        ctx.lineTo(projected[6][0], projected[6][1]);
        ctx.lineTo(projected[7][0], projected[7][1]);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        edges.forEach(([i, j]) => {
          ctx.beginPath();
          ctx.moveTo(projected[i][0], projected[i][1]);
          ctx.lineTo(projected[j][0], projected[j][1]);
          ctx.stroke();
        });

        // Center Axis Widget (RGB Gizmo)
        ctx.lineWidth = 3;
        // X Axis (Red)
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(50 * Math.cos(radY), -50 * Math.sin(radX) * Math.sin(radY));
        ctx.stroke();
        // Y Axis (Green)
        ctx.strokeStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -50 * Math.cos(radX));
        ctx.stroke();
        // Z Axis (Blue)
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(50 * Math.sin(radY), 50 * Math.sin(radX) * Math.cos(radY));
        ctx.stroke();
      };

      draw3DCADObject();
      ctx.restore();

      // Draw Virtual Cursor
      ctx.save();
      const scaleFactorX = canvas.width / 1920;
      const scaleFactorY = canvas.height / 1080;
      const curX = cursorPos.x * scaleFactorX;
      const curY = cursorPos.y * scaleFactorY;

      // Draw cursor arrow
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(curX, curY);
      ctx.lineTo(curX, curY + 18);
      ctx.lineTo(curX + 5, curY + 14);
      ctx.lineTo(curX + 10, curY + 22);
      ctx.lineTo(curX + 13, curY + 21);
      ctx.lineTo(curX + 8, curY + 13);
      ctx.lineTo(curX + 15, curY + 13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cursor coordinates badge
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(curX + 16, curY + 10, 80, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px monospace';
      ctx.fillText(`X:${Math.round(cursorPos.x)} Y:${Math.round(cursorPos.y)}`, curX + 20, curY + 22);
      ctx.restore();

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isStreaming, rotX, rotY, panX, panY, zoom, cursorPos]);

  // Touch and Mouse Input Handling on the Simulator Viewport
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1920;
    const y = ((e.clientY - rect.top) / rect.height) * 1080;

    setLastTouch({ x: e.clientX, y: e.clientY });

    if (inputMode === 'direct') {
      setCursorPos({ x, y });
      logEvent('mousedown', x, y, `Left Click @ [${Math.round(x)}, ${Math.round(y)}]`);
    } else {
      logEvent('trackpad_down', x, y, 'Virtual Trackpad contact initiated');
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!lastTouch) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 1920;
    const currentY = ((e.clientY - rect.top) / rect.height) * 1080;

    const dx = e.clientX - lastTouch.x;
    const dy = e.clientY - lastTouch.y;

    if (activeCadAction === 'orbit') {
      // 3D Orbit CAD rotation
      setRotY((prev) => prev + dx * 0.8);
      setRotX((prev) => Math.max(-85, Math.min(85, prev + dy * 0.8)));
      logEvent('cad_orbit', currentX, currentY, `Orbit ΔX:${dx.toFixed(1)} ΔY:${dy.toFixed(1)}`);
    } else if (activeCadAction === 'pan') {
      // CAD Pan translation
      setPanX((prev) => prev + dx * 1.2);
      setPanY((prev) => prev + dy * 1.2);
      logEvent('cad_pan', currentX, currentY, `Pan offset [${panX.toFixed(0)}, ${panY.toFixed(0)}]`);
    } else if (inputMode === 'direct') {
      setCursorPos({ x: currentX, y: currentY });
      logEvent('mousemove', currentX, currentY, `Direct move normalized [${(currentX/1920).toFixed(3)}, ${(currentY/1080).toFixed(3)}]`);
    } else {
      // Trackpad mode relative move
      setCursorPos((prev) => ({
        x: Math.max(0, Math.min(1920, prev.x + dx * sensitivity * 2)),
        y: Math.max(0, Math.min(1080, prev.y + dy * sensitivity * 2)),
      }));
      logEvent('mouserel', cursorPos.x, cursorPos.y, `Rel Δx:${dx.toFixed(1)} Δy:${dy.toFixed(1)} (Sens: ${sensitivity}x)`);
    }

    setLastTouch({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    setLastTouch(null);
    logEvent('mouseup', cursorPos.x, cursorPos.y, 'Pointer released');
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom((prev) => Math.max(0.3, Math.min(4.0, prev + zoomDelta)));
    logEvent('wheel', cursorPos.x, cursorPos.y, `CAD Wheel Zoom (Scale: ${(zoom + zoomDelta).toFixed(2)}x)`);
  };

  const triggerCadAction = (action: string) => {
    if (activeCadAction === action) {
      setActiveCadAction(null);
      logEvent('cad_action_end', cursorPos.x, cursorPos.y, `Exited ${action.toUpperCase()} mode`);
    } else {
      setActiveCadAction(action);
      logEvent('cad_action_start', cursorPos.x, cursorPos.y, `Entered ${action.toUpperCase()} mode (Hold & Drag)`);
    }
  };

  const handleCadZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.3, Math.min(4.0, prev + delta)));
    logEvent('wheel', cursorPos.x, cursorPos.y, `CAD Zoom Step: ${(zoom + delta).toFixed(2)}x`);
  };

  const resetView = () => {
    setRotX(25);
    setRotY(-35);
    setPanX(0);
    setPanY(0);
    setZoom(1.0);
    logEvent('hotkey', 960, 540, 'View reset to Isometric Standard [Home]');
  };

  return (
    <div className="space-y-6">
      {/* Top Stream Status & Controls Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold text-xs transition-all backdrop-blur-md cursor-pointer ${
                isStreaming
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 shadow-[0_0_12px_rgba(34,197,94,0.25)]'
              }`}
            >
              {isStreaming ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isStreaming ? 'Pause Stream' : 'Start Live Stream'}</span>
            </button>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-medium">Input Mode:</span>
              <div className="bg-white/5 p-1 rounded-full border border-white/10 flex backdrop-blur-md">
                <button
                  onClick={() => setInputMode('direct')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    inputMode === 'direct' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Direct Touch
                </button>
                <button
                  onClick={() => setInputMode('trackpad')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    inputMode === 'trackpad' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  CAD Trackpad
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center space-x-2.5 text-xs">
            <div className="px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-slate-300 font-mono flex items-center space-x-1.5 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#22c55e]" />
              <span>RTT: {metrics.rttMs}ms</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-slate-300 font-mono">
              <span className="text-emerald-400 font-bold">{metrics.fps}</span> FPS
            </div>
            <div className="px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-slate-400 font-mono hidden sm:block">
              {metrics.resolution}
            </div>
          </div>
        </div>

        {/* Sensitivity & Target FPS Controller */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col justify-center space-y-2 shadow-xl">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Trackpad Sensitivity</span>
            <span className="text-blue-400 font-mono font-bold">{sensitivity.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={sensitivity}
            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
          />
        </div>
      </div>

      {/* Main Viewport & CAD Action Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 cols: Interactive Canvas & Mobile Touch Area */}
        <div className="lg:col-span-8 space-y-3">
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] touch-none select-none cursor-crosshair group"
          >
            {/* Real 60fps CAD Canvas */}
            <canvas
              ref={canvasRef}
              width={960}
              height={540}
              className="w-full h-full object-contain"
            />

            {/* Active Mode Overlay Badge */}
            {activeCadAction && (
              <div className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-blue-600/80 backdrop-blur-md border border-blue-400/40 text-white text-xs font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center space-x-2 animate-pulse">
                <span>ACTIVE: {activeCadAction.toUpperCase()} MODE (Drag anywhere)</span>
              </div>
            )}

            {/* In-viewport CAD Action Controls (Frosted Glass Island) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 p-1.5 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">
              <button
                onClick={() => triggerCadAction('orbit')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeCadAction === 'orbit'
                    ? 'bg-blue-500/80 text-white border border-blue-400/40 shadow-[0_0_12px_rgba(59,130,246,0.4)] scale-105'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Rotate3d className="w-3.5 h-3.5" />
                <span>Orbit (MMB)</span>
              </button>

              <button
                onClick={() => triggerCadAction('pan')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeCadAction === 'pan'
                    ? 'bg-blue-500/80 text-white border border-blue-400/40 shadow-[0_0_12px_rgba(59,130,246,0.4)] scale-105'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Hand className="w-3.5 h-3.5" />
                <span>Pan (Shift+MMB)</span>
              </button>

              <button
                onClick={() => handleCadZoom(0.2)}
                className="p-2 rounded-full text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleCadZoom(-0.2)}
                className="p-2 rounded-full text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={resetView}
                className="px-3 py-1.5 rounded-full text-slate-300 hover:bg-white/10 hover:text-white text-xs font-medium cursor-pointer"
                title="Reset View to Default"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Quick Instructions & Keymap Note (Frosted Banner) */}
          <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 text-slate-300 text-xs">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200">How to test this live viewport:</span> Drag on the canvas to simulate iPhone touch coordinate transmission. Click <strong>Orbit</strong> or <strong>Pan</strong> to engage CAD 3D navigation (Middle Mouse Button simulation). The DataChannel packet monitor on the right displays the exact real-time payloads sent to the Windows Host.
            </div>
          </div>
        </div>

        {/* Right 4 cols: DataChannel Traffic Monitor & CAD Keymap Quick-Fire */}
        <div className="lg:col-span-4 space-y-4">
          {/* Real-time DataChannel Packet Log */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col h-[320px] shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                  DataChannel Packet Log
                </h3>
              </div>
              <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#22c55e]" />
                <span>Active</span>
              </div>
            </div>

            <div className="flex-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 font-mono text-[11px] overflow-y-auto space-y-2 no-scrollbar">
              {logs.length === 0 ? (
                <div className="text-slate-500 text-center py-10">
                  Touch or drag on the viewport to see real-time WebRTC input packets.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-2 text-slate-300 border-b border-white/5 pb-1.5">
                    <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                    <span className={`font-semibold ${
                      log.type.startsWith('cad') ? 'text-blue-400' :
                      log.type.includes('down') || log.type.includes('click') ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      [{log.type}]
                    </span>
                    <span className="text-slate-400 truncate">{log.details}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick-Fire Windows Hotkey Simulator */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center space-x-2">
              <Keyboard className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                CAD Windows Hotkey Injections
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => logEvent('hotkey', cursorPos.x, cursorPos.y, 'Sent [Escape] - Deselect / Cancel')}
                className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 text-xs font-mono font-medium text-center border border-white/10 transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                ESC
              </button>
              <button
                onClick={() => logEvent('hotkey', cursorPos.x, cursorPos.y, 'Sent [Ctrl + Z] - Undo')}
                className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 text-xs font-mono font-medium text-center border border-white/10 transition-all active:scale-95 cursor-pointer shadow-sm flex items-center justify-center space-x-1"
              >
                <CornerUpLeft className="w-3 h-3 text-blue-400" />
                <span>Ctrl+Z</span>
              </button>
              <button
                onClick={() => logEvent('hotkey', cursorPos.x, cursorPos.y, 'Sent [Ctrl + S] - Save Project')}
                className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 text-xs font-mono font-medium text-center border border-white/10 transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                Ctrl+S
              </button>
              <button
                onClick={() => logEvent('hotkey', cursorPos.x, cursorPos.y, 'Sent [Space] - View Orientation Palette')}
                className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 text-xs font-mono font-medium text-center border border-white/10 transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                Space
              </button>
              <button
                onClick={() => logEvent('hotkey', cursorPos.x, cursorPos.y, 'Sent [F] - Fit to Screen')}
                className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 text-xs font-mono font-medium text-center border border-white/10 transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                Fit (F)
              </button>
              <button
                onClick={() => logEvent('hotkey', cursorPos.x, cursorPos.y, 'Sent [Delete] - Delete entity')}
                className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-red-300 text-xs font-mono font-medium text-center border border-white/10 transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                Del
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

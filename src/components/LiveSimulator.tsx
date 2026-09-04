import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Rotate3d, 
  Hand, 
  ZoomIn, 
  ZoomOut, 
  Terminal, 
  Sliders, 
  CornerUpLeft, 
  Keyboard,
  Info,
  Zap,
  Cpu,
  Wifi,
  ShieldAlert,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { StreamMetrics, TouchEventLog, KeyboardEventLog, NetworkProfile, AbrMetrics } from '../types';

export const LiveSimulator: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [showParsecOverlay, setShowParsecOverlay] = useState<boolean>(false);
  const [inputMode, setInputMode] = useState<'direct' | 'trackpad' | 'desktop_kvm'>('direct');
  const [sensitivity, setSensitivity] = useState<number>(1.2);
  const [activeCadAction, setActiveCadAction] = useState<string | null>(null);
  const [isPointerLockedSim, setIsPointerLockedSim] = useState<boolean>(false);
  const [clipboardText, setClipboardText] = useState<string>('Sample CAD Part Specs');
  
  // Capture Engine Selection
  const [captureBackend, setCaptureBackend] = useState<'dxgi' | 'mss' | 'gdi' | 'pyautogui'>('dxgi');

  // Network & ABR Configuration
  const [networkProfile, setNetworkProfile] = useState<NetworkProfile>('ultra_lan');
  
  // Keyboard State & Modifiers
  const [activeModifiers, setActiveModifiers] = useState({
    ctrl: false,
    shift: false,
    alt: false,
    meta: false
  });
  const [lastKeyPressed, setLastKeyPressed] = useState<string>('None');

  // 3D CAD Model Transform State (simulating a 3D model viewport)
  const [rotX, setRotX] = useState<number>(25);
  const [rotY, setRotY] = useState<number>(-35);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  
  // Virtual Host Cursor Position
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 960, y: 540 });
  const [lastTouch, setLastTouch] = useState<{ x: number; y: number } | null>(null);

  // Compute Capture Time based on selected backend
  const captureLatencyMap = {
    dxgi: 0.8,
    mss: 5.2,
    gdi: 18.5,
    pyautogui: 42.0
  };

  // Compute ABR Parameters based on Network Profile
  const getAbrMetrics = (profile: NetworkProfile, backend: 'dxgi' | 'mss' | 'gdi' | 'pyautogui'): AbrMetrics => {
    const captureMs = captureLatencyMap[backend];
    switch (profile) {
      case 'ultra_lan':
        return {
          profile,
          targetBitrateKbps: 18000,
          currentBitrateKbps: 17850,
          targetFps: 60,
          scaleFactor: 1.0,
          compressionCrf: 20,
          rttMs: 14.5,
          packetLossRate: 0.0,
          networkTier: 'Ultra (1080p60)',
          frameEncodeMs: 2.1,
          frameCaptureMs: captureMs
        };
      case 'wifi_5g':
        return {
          profile,
          targetBitrateKbps: 12000,
          currentBitrateKbps: 11920,
          targetFps: 45,
          scaleFactor: 1.0,
          compressionCrf: 23,
          rttMs: 32.0,
          packetLossRate: 0.2,
          networkTier: 'High (1080p45)',
          frameEncodeMs: 2.5,
          frameCaptureMs: captureMs
        };
      case 'lte_mobile':
        return {
          profile,
          targetBitrateKbps: 6500,
          currentBitrateKbps: 6410,
          targetFps: 30,
          scaleFactor: 0.75,
          compressionCrf: 26,
          rttMs: 68.0,
          packetLossRate: 1.2,
          networkTier: 'Medium (720p30)',
          frameEncodeMs: 3.1,
          frameCaptureMs: captureMs
        };
      case 'congested':
        return {
          profile,
          targetBitrateKbps: 2200,
          currentBitrateKbps: 2150,
          targetFps: 15,
          scaleFactor: 0.50,
          compressionCrf: 30,
          rttMs: 145.0,
          packetLossRate: 5.4,
          networkTier: 'Low (540p15)',
          frameEncodeMs: 4.8,
          frameCaptureMs: captureMs
        };
    }
  };

  const abr = getAbrMetrics(networkProfile, captureBackend);
  const totalEndToEndLatencyMs = (abr.frameCaptureMs + abr.frameEncodeMs + (abr.rttMs / 2) + 3.5).toFixed(1);

  // Touch/Event Log
  const [logs, setLogs] = useState<Array<{ id: string; timestamp: string; type: string; details: string; category: 'touch' | 'keyboard' | 'abr' | 'system' }>>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<number | null>(null);
  const fpsTimerRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);
  const [currentRenderFps, setCurrentRenderFps] = useState<number>(60);

  // Helper to add event log
  const logEvent = (type: string, details: string, category: 'touch' | 'keyboard' | 'abr' | 'system' = 'touch') => {
    const newLog = {
      id: Math.random().toString(36).substring(2, 8),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + Math.floor(Date.now() % 1000).toString().padStart(3, '0'),
      type,
      details,
      category
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 24)]);
  };

  // Keyboard Event Listener to capture actual keystrokes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a form input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      setActiveModifiers({
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey
      });

      setLastKeyPressed(e.key);
      logEvent('keydown', `Key: '${e.key}' | Code: ${e.code} | Modifiers: [Ctrl:${e.ctrlKey} Shift:${e.shiftKey} Alt:${e.altKey}]`, 'keyboard');
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      setActiveModifiers({
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey
      });

      logEvent('keyup', `Key: '${e.key}' released`, 'keyboard');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Canvas rendering loop simulating CAD desktop stream
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
        setCurrentRenderFps(frameCountRef.current);
        frameCountRef.current = 0;
        fpsTimerRef.current = now;
      }

      // Background - CAD Workspace
      ctx.fillStyle = '#0f172a';
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
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, 36);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`⚡ SolidWorks 2025 - [Aerospace_Turbine_Shaft.SLDPRT] | Backend: ${captureBackend.toUpperCase()} | ABR: ${abr.networkTier}`, 16, 22);

      // Draw 3D Isometric CAD Wireframe Object (Turbine / Gear)
      ctx.save();
      ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
      ctx.scale(zoom * abr.scaleFactor, zoom * abr.scaleFactor);

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
          [0, -size * 1.5, 0],
          [0, size * 1.5, 0]
        ];

        const projected = vertices.map(([vx, vy, vz]) => {
          const x1 = vx * Math.cos(radY) + vz * Math.sin(radY);
          const z1 = -vx * Math.sin(radY) + vz * Math.cos(radY);
          const y2 = vy * Math.cos(radX) - z1 * Math.sin(radX);
          const z2 = vy * Math.sin(radX) + z1 * Math.cos(radX);
          return [x1, y2, z2];
        });

        const edges = [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7],
          [8, 0], [8, 1], [8, 4], [8, 5],
          [9, 2], [9, 3], [9, 6], [9, 7]
        ];

        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
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
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(50 * Math.cos(radY), -50 * Math.sin(radX) * Math.sin(radY));
        ctx.stroke();

        ctx.strokeStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -50 * Math.cos(radX));
        ctx.stroke();

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

      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(curX + 16, curY + 10, 85, 18);
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
  }, [isStreaming, rotX, rotY, panX, panY, zoom, cursorPos, captureBackend, abr]);

  // Touch and Mouse Input Handling on the Simulator Viewport
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1920;
    const y = ((e.clientY - rect.top) / rect.height) * 1080;

    setLastTouch({ x: e.clientX, y: e.clientY });

    if (inputMode === 'direct') {
      setCursorPos({ x, y });
      logEvent('mousedown', `Left Click @ [${Math.round(x)}, ${Math.round(y)}]`, 'touch');
    } else {
      logEvent('trackpad_down', 'Virtual Trackpad contact initiated', 'touch');
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
      setRotY((prev) => prev + dx * 0.8);
      setRotX((prev) => Math.max(-85, Math.min(85, prev + dy * 0.8)));
      logEvent('cad_orbit', `Orbit ΔX:${dx.toFixed(1)} ΔY:${dy.toFixed(1)}`, 'touch');
    } else if (activeCadAction === 'pan') {
      setPanX((prev) => prev + dx * 1.2);
      setPanY((prev) => prev + dy * 1.2);
      logEvent('cad_pan', `Pan offset [${panX.toFixed(0)}, ${panY.toFixed(0)}]`, 'touch');
    } else if (inputMode === 'direct') {
      setCursorPos({ x: currentX, y: currentY });
      logEvent('mousemove', `Direct move [${Math.round(currentX)}, ${Math.round(currentY)}]`, 'touch');
    } else {
      setCursorPos((prev) => ({
        x: Math.max(0, Math.min(1920, prev.x + dx * sensitivity * 2)),
        y: Math.max(0, Math.min(1080, prev.y + dy * sensitivity * 2)),
      }));
      logEvent('mouserel', `Rel Δx:${dx.toFixed(1)} Δy:${dy.toFixed(1)} (Sens: ${sensitivity}x)`, 'touch');
    }

    setLastTouch({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    setLastTouch(null);
    logEvent('mouseup', 'Pointer released', 'touch');
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom((prev) => Math.max(0.3, Math.min(4.0, prev + zoomDelta)));
    logEvent('wheel', `CAD Wheel Zoom (Scale: ${(zoom + zoomDelta).toFixed(2)}x)`, 'touch');
  };

  const triggerCadAction = (action: string) => {
    if (activeCadAction === action) {
      setActiveCadAction(null);
      logEvent('cad_action_end', `Exited ${action.toUpperCase()} mode`, 'touch');
    } else {
      setActiveCadAction(action);
      logEvent('cad_action_start', `Entered ${action.toUpperCase()} mode (Middle Mouse Drag)`, 'touch');
    }
  };

  const sendDirectHotkey = (keys: string[]) => {
    logEvent('hotkey', `Dispatched Hotkey: [${keys.join(' + ')}] via Win32 SendInput / pynput`, 'keyboard');
    if (keys.includes('Home') || keys.includes('F')) {
      setRotX(25);
      setRotY(-35);
      setPanX(0);
      setPanY(0);
      setZoom(1.0);
    }
  };

  const toggleSimulatedModifier = (mod: 'ctrl' | 'shift' | 'alt' | 'meta') => {
    setActiveModifiers(prev => {
      const next = { ...prev, [mod]: !prev[mod] };
      logEvent('modifier_sync', `Modifier '${mod.toUpperCase()}' state toggled to: ${next[mod]}`, 'keyboard');
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* My Remote Computers Bar (Chrome Remote Desktop / Moonlight style) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                My Remote Computers
              </h2>
              <p className="text-xs text-slate-400">
                Select a workstation to start an ultra-low latency streaming session.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Enter 6-Digit PIN (e.g. 842-109)"
              className="bg-slate-950 border border-slate-800 text-xs px-3 py-1.5 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 w-52 font-mono"
            />
            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-all">
              Pair Device
            </button>
          </div>
        </div>

        {/* Computers Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 bg-slate-950 border border-blue-500/40 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <div>
                <div className="text-xs font-semibold text-slate-100">CAD Workstation Pro</div>
                <div className="text-[11px] text-slate-400">Windows 11 • RTX 4080 (DXGI)</div>
              </div>
            </div>
            <span className="text-[10px] bg-blue-600/20 text-blue-300 font-medium px-2 py-1 rounded border border-blue-500/30">
              Connected
            </span>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <div>
                <div className="text-xs font-semibold text-slate-100">MacBook Pro M3</div>
                <div className="text-[11px] text-slate-400">macOS Sonoma • CoreGraphics</div>
              </div>
            </div>
            <button className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-2.5 py-1 rounded border border-slate-700">
              Connect
            </button>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div>
                <div className="text-xs font-semibold text-slate-100">Linux Render Node</div>
                <div className="text-[11px] text-slate-400">Ubuntu 24.04 • X11 Stream</div>
              </div>
            </div>
            <button className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-2.5 py-1 rounded border border-slate-700">
              Connect
            </button>
          </div>
        </div>
      </div>

      {/* Stream Controls Toolbar & Input Modes */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
              isStreaming
                ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30'
                : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30'
            }`}
          >
            {isStreaming ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isStreaming ? 'Disconnect Stream' : 'Connect Stream'}</span>
          </button>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400 text-xs mr-1 hidden sm:inline">Input Mode:</span>
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex">
              <button
                onClick={() => { setInputMode('direct'); logEvent('mode_change', 'Switched to Direct Touch 1:1 input mode', 'system'); }}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  inputMode === 'direct' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Touch
              </button>
              <button
                onClick={() => { setInputMode('trackpad'); logEvent('mode_change', 'Switched to Virtual Trackpad mode', 'system'); }}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  inputMode === 'trackpad' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Trackpad
              </button>
              <button
                onClick={() => { setInputMode('desktop_kvm'); logEvent('mode_change', 'Switched to Desktop PC/Mac KVM (Pointer Lock)', 'system'); }}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  inputMode === 'desktop_kvm' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Desktop KVM
              </button>
            </div>
          </div>
        </div>

        {/* Capture Backend Engine Selection */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-medium">Capture Engine:</span>
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex space-x-1">
            <button
              onClick={() => { setCaptureBackend('dxgi'); logEvent('capture_switch', 'Switched to DXGI Desktop Duplication API', 'system'); }}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium ${captureBackend === 'dxgi' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              DXGI (GPU)
            </button>
            <button
              onClick={() => { setCaptureBackend('mss'); logEvent('capture_switch', 'Switched to MSS DIB capture', 'system'); }}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium ${captureBackend === 'mss' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              MSS
            </button>
            <button
              onClick={() => { setCaptureBackend('gdi'); logEvent('capture_switch', 'Switched to Windows GDI BitBlt', 'system'); }}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium ${captureBackend === 'gdi' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              GDI
            </button>
          </div>
        </div>
      </div>

      {/* Adaptive Network Conditioner Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Network Profile & Auto-Bitrate
              </h3>
              <p className="text-[11px] text-slate-400">
                Automatically adjusts stream quality based on network speed.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Preset:</span>
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex">
              {(['ultra_lan', 'wifi_5g', 'lte_mobile', 'congested'] as NetworkProfile[]).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setNetworkProfile(p);
                    logEvent('abr_profile_change', `Simulated network shift to: ${p.toUpperCase()}`, 'abr');
                  }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    networkProfile === p
                      ? 'bg-blue-600 text-white shadow-sm font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p === 'ultra_lan' ? 'Ultra LAN' : p === 'wifi_5g' ? '5G Wi-Fi' : p === 'lte_mobile' ? '4G LTE' : 'Slow Network'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Quality Tier</span>
            <span className="text-xs font-semibold text-blue-300 font-mono">{abr.networkTier}</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Bitrate</span>
            <span className="text-xs font-semibold text-emerald-400 font-mono">{(abr.targetBitrateKbps / 1000).toFixed(1)} Mbps</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Frame Rate</span>
            <span className="text-xs font-semibold text-slate-200 font-mono">{abr.targetFps} FPS</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Resolution</span>
            <span className="text-xs font-semibold text-slate-200 font-mono">{(abr.scaleFactor * 100).toFixed(0)}% (1080p)</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Encoder Quality</span>
            <span className="text-xs font-semibold text-amber-300 font-mono">CRF {abr.compressionCrf}</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Latency</span>
            <span className="text-xs font-semibold text-emerald-300 font-mono">{totalEndToEndLatencyMs} ms</span>
          </div>
        </div>
      </div>

      {/* Main Viewport & CAD Action Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 cols: Interactive Canvas & Mobile Touch Area */}
        <div className="lg:col-span-8 space-y-4">
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

            {/* Parsec Iconic Floating Overlay Button */}
            <div className="absolute top-3 left-3 z-30">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowParsecOverlay(!showParsecOverlay);
                }}
                className="w-10 h-10 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs border border-rose-400/50 shadow-[0_0_20px_rgba(244,63,94,0.6)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
                title="Toggle Parsec Stream Overlay (Ctrl+Alt+I)"
              >
                P
              </button>
            </div>

            {/* Parsec In-Stream Overlay Drawer */}
            {showParsecOverlay && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-x-4 top-16 z-40 bg-[#131622]/95 backdrop-blur-2xl border border-rose-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-fade-in text-slate-100"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#282d42]">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center font-bold text-xs">P</div>
                    <h3 className="font-bold text-sm text-white">PARSEC STREAM OVERLAY & MENU</h3>
                  </div>
                  <button
                    onClick={() => setShowParsecOverlay(false)}
                    className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded"
                  >
                    Close (ESC)
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Performance Badge */}
                  <div className="p-3 bg-[#0b0c13] rounded-lg border border-[#262b3f] space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Stream Health</div>
                    <div className="font-mono text-emerald-400 font-bold">{abr.targetFps} FPS • {totalEndToEndLatencyMs}ms RTT</div>
                    <div className="text-[10px] text-slate-500">NVENC H.265 (4K 120Hz Engine)</div>
                  </div>

                  {/* Immersive Mouse Lock Toggle */}
                  <div className="p-3 bg-[#0b0c13] rounded-lg border border-[#262b3f] space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Immersive Mouse Mode</div>
                    <button
                      onClick={() => setIsPointerLockedSim(!isPointerLockedSim)}
                      className={`w-full py-1.5 rounded font-bold text-[11px] transition-all cursor-pointer ${
                        isPointerLockedSim
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-rose-600 hover:bg-rose-500 text-white'
                      }`}
                    >
                      {isPointerLockedSim ? '✓ Mouse Pointer Locked (Relative)' : 'Lock Mouse for 3D/Games'}
                    </button>
                  </div>

                  {/* Virtual Gamepad Status */}
                  <div className="p-3 bg-[#0b0c13] rounded-lg border border-[#262b3f] space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Virtual Gamepad</div>
                    <div className="text-blue-400 font-semibold text-[11px]">Xbox Wireless Controller (XInput Slot 1)</div>
                    <div className="text-[10px] text-slate-500">Analogs & Triggers Passthrough Active</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#282d42]">
                  <span className="text-[11px] text-slate-400 font-mono">Press Ctrl+Alt+I anytime to toggle overlay</span>
                  <button
                    onClick={() => {
                      setIsStreaming(false);
                      setShowParsecOverlay(false);
                    }}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-md"
                  >
                    Disconnect Stream
                  </button>
                </div>
              </div>
            )}

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
                onClick={() => setZoom((prev) => Math.min(4.0, prev + 0.2))}
                className="p-2 rounded-full text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setZoom((prev) => Math.max(0.3, prev - 0.2))}
                className="p-2 rounded-full text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => sendDirectHotkey(['Home', 'F'])}
                className="px-3 py-1.5 rounded-full text-slate-300 hover:bg-white/10 hover:text-white text-xs font-medium cursor-pointer"
                title="Fit to Screen"
              >
                Fit (F)
              </button>
            </div>
          </div>

          {/* Interactive Keyboard Testing & Modifier State Display */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Keyboard className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Live Keyboard Input & Modifier State Machine
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Last Key: <strong className="text-blue-300">{lastKeyPressed}</strong>
              </span>
            </div>

            {/* Modifier Key Badges (Sync with physical keyboard or on-screen taps) */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => toggleSimulatedModifier('ctrl')}
                className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                  activeModifiers.ctrl
                    ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                }`}
              >
                CTRL {activeModifiers.ctrl && '✓'}
              </button>

              <button
                onClick={() => toggleSimulatedModifier('shift')}
                className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                  activeModifiers.shift
                    ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                }`}
              >
                SHIFT {activeModifiers.shift && '✓'}
              </button>

              <button
                onClick={() => toggleSimulatedModifier('alt')}
                className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                  activeModifiers.alt
                    ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                }`}
              >
                ALT {activeModifiers.alt && '✓'}
              </button>

              <button
                onClick={() => toggleSimulatedModifier('meta')}
                className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                  activeModifiers.meta
                    ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                }`}
              >
                WIN / CMD {activeModifiers.meta && '✓'}
              </button>
            </div>

            {/* Quick Virtual Key Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => sendDirectHotkey(['Escape'])}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 text-xs font-mono border border-white/10 cursor-pointer active:scale-95"
              >
                ESC
              </button>
              <button
                onClick={() => sendDirectHotkey(['Ctrl', 'Z'])}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 text-xs font-mono border border-white/10 cursor-pointer active:scale-95 flex items-center space-x-1"
              >
                <CornerUpLeft className="w-3 h-3 text-blue-400" />
                <span>Ctrl+Z</span>
              </button>
              <button
                onClick={() => sendDirectHotkey(['Ctrl', 'S'])}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 text-xs font-mono border border-white/10 cursor-pointer active:scale-95"
              >
                Ctrl+S
              </button>
              <button
                onClick={() => sendDirectHotkey(['Space'])}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 text-xs font-mono border border-white/10 cursor-pointer active:scale-95"
              >
                Space (Orient)
              </button>
              <button
                onClick={() => sendDirectHotkey(['Tab'])}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 text-xs font-mono border border-white/10 cursor-pointer active:scale-95"
              >
                Tab
              </button>
              <button
                onClick={() => sendDirectHotkey(['Delete'])}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-red-300 text-xs font-mono border border-white/10 cursor-pointer active:scale-95"
              >
                Del
              </button>
              <button
                onClick={() => sendDirectHotkey(['Enter'])}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-emerald-300 text-xs font-mono border border-white/10 cursor-pointer active:scale-95"
              >
                Enter ↵
              </button>
            </div>
            
            <p className="text-[11px] text-slate-400 italic">
              💡 Tip: Press any physical key on your keyboard right now — events are captured and dispatched via WebRTC DataChannel simulation!
            </p>
          </div>
        </div>

        {/* Right 4 cols: Real-Time WebRTC DataChannel & Telemetry Stream */}
        <div className="lg:col-span-4 space-y-4">
          {/* Real-time DataChannel Packet Log */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col h-[520px] shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                  WebRTC DataChannel Stream
                </h3>
              </div>
              <button
                onClick={() => setLogs([])}
                className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 font-mono text-[11px] overflow-y-auto space-y-2 no-scrollbar">
              {logs.length === 0 ? (
                <div className="text-slate-500 text-center py-16 text-xs">
                  Press keys on your keyboard, touch the viewport, or change network profile to inspect WebRTC packets.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-2 text-slate-300 border-b border-white/5 pb-1.5">
                    <span className="text-slate-500 text-[10px] shrink-0">{log.timestamp}</span>
                    <span className={`font-semibold shrink-0 ${
                      log.category === 'keyboard' ? 'text-indigo-400' :
                      log.category === 'abr' ? 'text-amber-400' :
                      log.category === 'system' ? 'text-purple-400' :
                      'text-emerald-400'
                    }`}>
                      [{log.type}]
                    </span>
                    <span className="text-slate-300 break-words leading-tight">{log.details}</span>
                  </div>
                ))
              )}
            </div>

            {/* Quick Summary Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Channel: <strong className="text-emerald-400">input_channel</strong></span>
              <span>Mode: <strong className="text-blue-400">ordered:true</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Platform Workstation Control Matrix */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 tracking-wide">
                🖥️ Universal Cross-Platform Host & Client Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Effortlessly control any computer (Windows, macOS, Linux) from any other computer or mobile browser.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-semibold border border-emerald-500/30">
            Native Zero-Install Client
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Windows Host */}
          <div className="p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300">🪟 Windows 10 / 11 Host</span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">&lt;1ms DXGI GPU</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Captures DirectX 11 GPU surface with hardware Direct3D duplication & Win32 SendInput.
            </p>
            <div className="bg-black/60 p-2 rounded-lg font-mono text-[11px] text-blue-200 border border-white/5 select-all">
              run_host.bat
            </div>
          </div>

          {/* macOS Host */}
          <div className="p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300">🍎 Apple macOS Host</span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">M1/M2/M3/M4 & Intel</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Uses macOS CoreGraphics screen grabber, VideoToolbox H.264, and PyAutoGUI input injection.
            </p>
            <div className="bg-black/60 p-2 rounded-lg font-mono text-[11px] text-indigo-200 border border-white/5 select-all">
              ./run_host.sh
            </div>
          </div>

          {/* Linux Host */}
          <div className="p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">🐧 Linux (Ubuntu / Arch) Host</span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">X11 & Wayland</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Standard X11 memory buffer streamer with automated virtualenv & dependency bootstrap.
            </p>
            <div className="bg-black/60 p-2 rounded-lg font-mono text-[11px] text-amber-200 border border-white/5 select-all">
              ./run_host.sh --fps 60
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

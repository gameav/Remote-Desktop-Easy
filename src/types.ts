export type NavigationTab = 
  | 'simulator' 
  | 'code' 
  | 'tailscale' 
  | 'optimizations' 
  | 'client-preview';

export interface CodeFileItem {
  id: string;
  name: string;
  language: string;
  category: 'host' | 'signaling' | 'client' | 'script';
  description: string;
  content: string;
}

export type NetworkProfile = 'ultra_lan' | 'wifi_5g' | 'lte_mobile' | 'congested';

export interface AbrMetrics {
  profile: NetworkProfile;
  targetBitrateKbps: number;
  currentBitrateKbps: number;
  targetFps: number;
  scaleFactor: number;
  compressionCrf: number;
  rttMs: number;
  packetLossRate: number;
  networkTier: 'Ultra (1080p60)' | 'High (1080p45)' | 'Medium (720p30)' | 'Low (540p15)';
  frameEncodeMs: number;
  frameCaptureMs: number;
}

export interface StreamMetrics {
  fps: number;
  rttMs: number;
  packetsLost: number;
  resolution: string;
  bitrateKbps: number;
  codec: string;
  state: 'disconnected' | 'connecting' | 'connected';
  abrTier?: string;
  captureBackend?: 'DXGI Desktop Duplication' | 'MSS DIB' | 'Windows GDI' | 'PyAutoGUI';
}

export interface TouchEventLog {
  id: string;
  timestamp: string;
  type: string;
  x: number;
  y: number;
  details: string;
}

export interface KeyboardEventLog {
  id: string;
  timestamp: string;
  type: 'keydown' | 'keyup' | 'keypress' | 'hotkey';
  key: string;
  code: string;
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
  };
  details: string;
}

export interface CadToolAction {
  id: string;
  label: string;
  icon: string;
  actionType: string;
  shortcut: string;
  description: string;
}

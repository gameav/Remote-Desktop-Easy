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

export interface StreamMetrics {
  fps: number;
  rttMs: number;
  packetsLost: number;
  resolution: string;
  bitrateKbps: number;
  codec: string;
  state: 'disconnected' | 'connecting' | 'connected';
}

export interface TouchEventLog {
  id: string;
  timestamp: string;
  type: string;
  x: number;
  y: number;
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

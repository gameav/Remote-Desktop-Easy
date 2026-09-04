export type SidebarView = 
  | 'computers' 
  | 'settings' 
  | 'arcade'
  | 'stream' 
  | 'downloads'
  | 'web_client';

export type SettingsSubTab = 
  | 'client' 
  | 'host' 
  | 'approved_apps' 
  | 'network' 
  | 'hotkeys' 
  | 'gamepad' 
  | 'experimental' 
  | 'account';

export type ConnectMethod = 'app_pin' | 'web_link';

export interface RemoteComputer {
  id: string;
  name: string;
  os: 'windows' | 'mac' | 'linux';
  gpu: string;
  resolution: string;
  maxFps: number;
  status: 'online' | 'offline' | 'busy';
  pingMs: number;
  peerId: string;
  pairingPin: string;
  shareUrl: string;
  isHost: boolean;
  encoder: 'NVENC (NVIDIA)' | 'AMF (AMD)' | 'QuickSync (Intel)' | 'Metal (Apple)' | 'Software (CPU)';
  avatarUrl?: string;
  lastActive: string;
}

export interface FriendUser {
  id: string;
  username: string;
  tag: string;
  status: 'online' | 'in_game' | 'offline';
  gamePlaying?: string;
  avatar: string;
}

export interface ArcadeLobby {
  id: string;
  title: string;
  game: string;
  hostUser: string;
  playersCount: number;
  maxPlayers: number;
  pingMs: number;
  tags: string[];
  coverImage: string;
  hasControllersAvailable: boolean;
  requiredController: string;
}

export interface PulseGridSettings {
  // Host
  hostingEnabled: boolean;
  hostResolution: string;
  hostFps: number;
  hostBitrateMbps: number;
  encoderType: 'nvenc' | 'amf' | 'quicksync' | 'metal' | 'software';
  virtualDisplay: boolean;
  audioPassthrough: boolean;
  // Client
  decoderType: 'hardware' | 'software';
  vsync: boolean;
  immersiveMouseMode: 'relative' | 'absolute';
  overlayHotkey: string;
  bandwidthLimitMbps: number;
  enhancedPen: boolean;
  overlay: boolean;
  overlayWarnings: boolean;
  hidCompatibility: boolean;
  // Network
  upnpEnabled: boolean;
  stunServer: string;
  tailscaleEnabled: boolean;
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
  captureBackend?: string;
}

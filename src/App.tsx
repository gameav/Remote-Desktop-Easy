import React, { useState, useEffect } from 'react';
import { SidebarView, RemoteComputer, ArcadeLobby, AuthUser } from './types';
import { decryptVault } from './lib/security';
import { Header } from './components/Header';
import { ParsecComputers } from './components/ParsecComputers';
import { ParsecArcade } from './components/ParsecArcade';
import { LiveSimulator } from './components/LiveSimulator';
import { ParsecSettings } from './components/ParsecSettings';
import { ParsecDownloads } from './components/ParsecDownloads';
import { PulseGridWebViewer } from './components/PulseGridWebViewer';
import { AuthScreen } from './components/AuthScreen';

export default function App() {
  const [activeView, setActiveView] = useState<SidebarView>('computers');
  const [selectedComputer, setSelectedComputer] = useState<RemoteComputer | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('pulsegrid_user');
      if (!saved) return null;
      if (saved.startsWith('PG_VAULT_ENC_v1:')) {
        return decryptVault<AuthUser>(saved);
      }
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('pulsegrid_user');
    setCurrentUser(null);
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://pulsegrid.app';

  const initialComputers: RemoteComputer[] = [
    {
      id: 'desktop-ikqdnup',
      name: `${currentUser?.username?.toUpperCase() || 'MY'}-WORKSTATION`,
      os: 'windows',
      gpu: 'NVIDIA RTX 4090 (24GB VRAM)',
      resolution: '3840x2160',
      maxFps: 120,
      status: 'online',
      pingMs: 8,
      peerId: '3l8x9k',
      pairingPin: '842-109',
      shareUrl: `${currentOrigin}/?join=3l8x9k`,
      isHost: true,
      encoder: 'NVENC (NVIDIA)',
      lastActive: 'Active Now'
    },
    {
      id: 'mac-pro-m3',
      name: 'MACBOOK-PRO-M3-MAX',
      os: 'mac',
      gpu: 'Apple M3 Max GPU (40-Core)',
      resolution: '3024x1964',
      maxFps: 60,
      status: 'online',
      pingMs: 14,
      peerId: '512-990',
      pairingPin: '512-990',
      shareUrl: `${currentOrigin}/?join=512990`,
      isHost: false,
      encoder: 'Metal (Apple)',
      lastActive: 'Active Now'
    },
    {
      id: 'linux-render-node',
      name: 'LINUX-RENDER-WORKSTATION',
      os: 'linux',
      gpu: 'AMD Radeon RX 7900 XTX',
      resolution: '2560x1440',
      maxFps: 60,
      status: 'online',
      pingMs: 22,
      peerId: '773-102',
      pairingPin: '773-102',
      shareUrl: `${currentOrigin}/?join=773102`,
      isHost: false,
      encoder: 'AMF (AMD)',
      lastActive: 'Active Now'
    }
  ];

  // Detect ?join= or ?pin= parameters in URL for direct link sharing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const joinCode = params.get('join') || params.get('pin') || params.get('share') || params.get('g');
      if (joinCode) {
        if (!currentUser) {
          const autoGuest: AuthUser = {
            username: 'GuestLinkUser',
            tag: Math.floor(10000000 + Math.random() * 90000000).toString(),
            email: 'guest@pulsegrid.app',
            isGuest: true
          };
          setCurrentUser(autoGuest);
        }
        handleStartWebStream(joinCode);
      }
    }
  }, []);

  const handleConnect = (computer: RemoteComputer) => {
    setSelectedComputer(computer);
    setActiveView('stream');
  };

  const handleJoinArcade = (lobby: ArcadeLobby) => {
    setSelectedComputer({
      id: lobby.id,
      name: `${lobby.game} (${lobby.title})`,
      os: 'windows',
      gpu: 'NVIDIA RTX 4090 (Arcade Host)',
      resolution: '1920x1080',
      maxFps: 60,
      status: 'online',
      pingMs: lobby.pingMs,
      peerId: 'ARCADE-LOBBY-60FPS',
      pairingPin: '990-112',
      shareUrl: `${currentOrigin}/?join=arcade`,
      isHost: false,
      encoder: 'NVENC (NVIDIA)',
      lastActive: 'Just now'
    });
    setActiveView('stream');
  };

  const handleStartWebStream = (pinOrLink: string) => {
    setSelectedComputer({
      id: 'web-session',
      name: `Safari Session (${pinOrLink})`,
      os: 'windows',
      gpu: 'NVIDIA RTX 4090 (WebRTC Host)',
      resolution: '1920x1080',
      maxFps: 60,
      status: 'online',
      pingMs: 12,
      peerId: pinOrLink,
      pairingPin: pinOrLink,
      shareUrl: pinOrLink.startsWith('http') ? pinOrLink : `${currentOrigin}/?join=${pinOrLink}`,
      isHost: false,
      encoder: 'NVENC (NVIDIA)',
      lastActive: 'Just now'
    });
    setActiveView('stream');
  };

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <Header activeView={activeView} setActiveView={setActiveView} currentUser={currentUser} onLogout={handleLogout}>
      {activeView === 'computers' && (
        <ParsecComputers
          computers={initialComputers}
          onConnect={handleConnect}
          onSelectWebViewer={() => setActiveView('web_client')}
        />
      )}

      {activeView === 'settings' && (
        <ParsecSettings currentUser={currentUser} onLogout={handleLogout} />
      )}

      {activeView === 'web_client' && (
        <PulseGridWebViewer
          onStartWebStream={handleStartWebStream}
        />
      )}

      {activeView === 'arcade' && (
        <ParsecArcade
          onJoinLobby={handleJoinArcade}
        />
      )}

      {activeView === 'stream' && (
        <LiveSimulator />
      )}

      {activeView === 'downloads' && (
        <ParsecDownloads />
      )}
    </Header>
  );
}

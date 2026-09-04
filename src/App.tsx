import React, { useState } from 'react';
import { SidebarView, RemoteComputer, ArcadeLobby } from './types';
import { Header } from './components/Header';
import { ParsecComputers } from './components/ParsecComputers';
import { ParsecArcade } from './components/ParsecArcade';
import { LiveSimulator } from './components/LiveSimulator';
import { ParsecSettings } from './components/ParsecSettings';
import { ParsecDownloads } from './components/ParsecDownloads';
import { PulseGridWebViewer } from './components/PulseGridWebViewer';

export default function App() {
  const [activeView, setActiveView] = useState<SidebarView>('computers');
  const [selectedComputer, setSelectedComputer] = useState<RemoteComputer | null>(null);

  const initialComputers: RemoteComputer[] = [
    {
      id: 'desktop-ikqdnup',
      name: 'DESKTOP-IKQDNUP',
      os: 'windows',
      gpu: 'NVIDIA RTX 4090 (24GB VRAM)',
      resolution: '3840x2160',
      maxFps: 120,
      status: 'online',
      pingMs: 8,
      peerId: '3l8x9k',
      pairingPin: '842-109',
      shareUrl: 'https://pulsegrid.app/g/3l8x9k',
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
      shareUrl: 'https://pulsegrid.app/g/512990',
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
      shareUrl: 'https://pulsegrid.app/g/773102',
      isHost: false,
      encoder: 'AMF (AMD)',
      lastActive: 'Active Now'
    }
  ];

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
      shareUrl: 'https://pulsegrid.app/g/arcade',
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
      shareUrl: pinOrLink.startsWith('http') ? pinOrLink : `https://pulsegrid.app/join/${pinOrLink}`,
      isHost: false,
      encoder: 'NVENC (NVIDIA)',
      lastActive: 'Just now'
    });
    setActiveView('stream');
  };

  return (
    <Header activeView={activeView} setActiveView={setActiveView}>
      {activeView === 'computers' && (
        <ParsecComputers
          computers={initialComputers}
          onConnect={handleConnect}
          onSelectWebViewer={() => setActiveView('web_client')}
        />
      )}

      {activeView === 'settings' && (
        <ParsecSettings />
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

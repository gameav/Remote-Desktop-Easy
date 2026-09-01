# WebRTC Low-Latency Remote Desktop for iPhone CAD & Windows 10 Host

An ultra-low-latency, self-hosted WebRTC remote desktop architecture engineered specifically for CAD, 3D modeling, and full Windows workstation access from an iPhone browser (Safari/Chrome) with **no iOS app required**.

---

## 🏗️ Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      Windows 10 Host Workstation                       │
│  • Screen Capture: DXGI Desktop Duplication (D3D11) & MSS DIB Fallback │
│  • Media Engine: aiortc + PyAV (H.264 Baseline / High Profile, VP8)    │
│  • Adaptive Bitrate (ABR): Real-time RTT, loss, and encoder scaler     │
│  • Input Simulation: Win32 SendInput / pynput / PyAutoGUI              │
└───────────▲────────────────────────────────┬───────────────────────────┘
            │                                │
            │ WebRTC DataChannel (Input)     │ WebRTC Video Stream (UDP)
            │ (Touch, CAD Orbit/Pan/Zoom,    │ (Hardware H.264, sub-25ms)
            │  Keydown/Keyup, Modifiers)     │
            │                                ▼
┌───────────┴────────────────────────────────────────────────────────────┐
│                  iPhone Mobile Client (Safari / Chrome)                │
│  • HTML5 <video> with playsinline, webkit-playsinline & muted          │
│  • Dual-mode gesture engine (Direct 1:1 Touch & Precision Trackpad)    │
│  • Floating CAD Action Bar (Orbit MMB, Pan Shift+MMB, Zoom +/-)        │
│  • Virtual CAD Keyboard & Soft-Modifier Drawer (Ctrl, Shift, Alt, Hot) │
└────────────────────────────────────────────────────────────────────────┘
            ▲                                ▲
            │                                │
            └────────► Signaling Server ◄────┘
               (Node.js WS or Python FastAPI)
```

---

## 🌟 Comprehensive Setup Breakdown — What This System Has:

### 1. Windows 10 Host Streamer (`/host/windows_host.py`)
- **Dual Capture Backends**:
  - **DXGI Desktop Duplication API**: Sub-1ms frame grab time via Direct3D 11 GPU pipeline (`bettercam`).
  - **MSS DIB Memory Section**: Lightweight fallback with zero external driver dependencies.
- **Adaptive Bitrate (ABR) Engine**:
  - Dynamically monitors round-trip time (RTT) and packet loss rate.
  - Automatically scales between 4 performance tiers:
    - **Ultra Tier**: 1080p @ 60 FPS (18 Mbps, CRF 20)
    - **High Tier**: 1080p @ 45 FPS (12 Mbps, CRF 23)
    - **Medium Tier**: 720p @ 30 FPS (6.5 Mbps, CRF 26, 0.75x scale)
    - **Low Tier**: 540p @ 15 FPS (2.2 Mbps, CRF 30, 0.50x scale)
- **Comprehensive Input Simulator**:
  - **Mouse**: Absolute/normalized pointer positioning, relative trackpad with inertia, left/right/middle click down/up, mouse wheel scrolling.
  - **CAD Macros**: Middle-mouse drag (Orbit 3D), Shift + Middle-mouse drag (Pan 3D), Ctrl + Wheel (Zoom).
  - **Full Keyboard Engine**: Real-time `keydown`, `keyup`, and `keypress` events, with active modifier synchronization (`Ctrl`, `Shift`, `Alt`, `Windows/Cmd`) to prevent stuck keys.

### 2. High-Performance Signaling Server (`/server.ts` & `/signaling/signaling_server.js`)
- **WebSocket Protocol**: `/ws` for sub-millisecond SDP offer/answer relay and bidirectional ICE candidate exchange.
- **REST Fallback API**: `/api/signal/:roomId/offer` and `/api/signal/:roomId/answer` for environments with strict WebSocket proxies.
- **Room Multi-Tenancy**: Isolated peer pairing based on unique `roomId` (default `cad_session`).
- **Integrated Web Server**: Automatically serves the iPhone web client and live telemetry dashboard.

### 3. iPhone Mobile Web Client (`/client/index.html` & React Interactive Hub)
- **Zero App Store Installation**: Runs natively in Mobile Safari, Chrome, and iOS PWA (Add to Home Screen) mode.
- **P2P Video Pipeline**: Hardware-accelerated H.264 video decoding with `playsinline` and `webkit-playsinline`.
- **CAD Floating Tool Bar**: Instant buttons for Orbit, Pan, Zoom, and Mode toggling.
- **Virtual CAD Keyboard Drawer**: Fast access to `ESC`, `F` (Fit screen), `Tab`, `DEL`, `Space`, sticky `Ctrl`/`Shift`/`Alt` modifiers, and CAD hotkey combos (`Ctrl+Z`, `Ctrl+S`).
- **Telemetry HUD**: Real-time display of WebRTC connection state, RTT latency, framerate, and current ABR tier.

### 4. Automated GitHub Actions Release Pipeline (`/.github/workflows/release.yml`)
- **Automated CI/CD**: On every push to `main`/`master`, GitHub Actions automatically:
  - Validates and compiles the TypeScript code and client build.
  - Packages 3 ready-to-run release ZIP archives:
    1. `webrtc-remote-desktop-full.zip` (Complete bundle)
    2. `windows-host-streamer.zip` (Windows host runtime + one-click `.bat`)
    3. `web-client-signaling.zip` (Signaling server + web client)
  - Publishes a new GitHub Release with timestamped semantic version tags (`release-v1.0.YYYYMMDD...`).

---

## 📁 Repository File Structure

- `/.github/workflows/release.yml` — Automated GitHub Actions CI/CD release workflow.
- `/host/windows_host.py` — High-performance Python screen grabber, ABR controller, and WebRTC peer connection handler.
- `/host/requirements.txt` — Minimal Python pip dependencies (`aiortc`, `bettercam`, `mss`, `pynput`, `pyautogui`).
- `/host/run_host.bat` — One-click Windows startup script with auto virtual environment installer.
- `/signaling/signaling_server.js` — Lightweight Node.js Express + WebSocket signaling server.
- `/signaling/signaling_server.py` — Pure Python WebSocket signaling server (Zero Node.js alternative).
- `/client/index.html` — Single-file standalone iPhone web client with dark-mode OLED styling and CAD touch bar.
- `/server.ts` — Full-stack Express + Vite + WebSocket development and production hub.

---

## 🚀 Quickstart Guide

### Step 1: Start the Signaling Server
On your Windows host (or a cloud VPS / Raspberry Pi):
```bash
npm install
npm run dev
# OR using standalone signaling server:
cd signaling && npm install && node signaling_server.js 3000
# OR if using pure Python:
# pip install websockets && python signaling/signaling_server.py --port 3000
```

### Step 2: Start the Windows 10 Host Streamer
```bat
cd host
run_host.bat
```
Or manually:
```bash
pip install -r requirements.txt
python windows_host.py --signaling http://localhost:3000 --fps 60 --backend auto
```

### Step 3: Access from iPhone Safari
1. Open iPhone Safari.
2. Navigate to your PC's IP or Tailscale address: `http://100.x.y.z:3000` (or `http://100.x.y.z:3000/client` for raw client).
3. Tap the Share button and select **"Add to Home Screen"** to launch as a borderless, full-screen web app.
4. Interact using Direct Touch, Trackpad, or the CAD 3D Action Bar.

---

## 🛡️ Remote Access Across Firewalls (Tailscale Setup)

When away from home (on cellular 5G, hotel Wi-Fi, or office networks), traditional port-forwarding is blocked by Carrier-Grade NAT (CGNAT).

1. Install **Tailscale** on Windows 10: [tailscale.com](https://tailscale.com)
2. Install **Tailscale** on your iPhone from the iOS App Store.
3. Sign into both devices with the same account.
4. Open iPhone Safari and browse to your PC's Tailscale IP: `http://100.x.y.z:3000`.
5. Tailscale automatically establishes a direct, encrypted WireGuard UDP peer-to-peer connection with zero port forwarding required.

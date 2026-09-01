# WebRTC Low-Latency Remote Desktop for iPhone CAD & Windows 10 Host

An ultra-low-latency, self-hosted WebRTC remote desktop architecture engineered specifically for CAD, 3D modeling, and full Windows workstation access from an iPhone browser (Safari/Chrome) with **no iOS app required**.

---

## 🏗️ Architecture Overview

```text
┌────────────────────────────────────────────────────────┐
│               Windows 10 Host Workstation               │
│  • Screen Capture: MSS (Direct3D memory buffer)        │
│  • Media Engine: aiortc + PyAV (H.264 Baseline / VP8)  │
│  • Input Simulation: PyAutoGUI / Win32 SendInput       │
└───────────▲────────────────────────────────┬───────────┘
            │                                │
            │ WebRTC DataChannel (Input)     │ WebRTC Video Stream (UDP)
            │ (Touch, Clicks, CAD Orbit/Pan) │ (Sub-30ms glass-to-glass)
            │                                ▼
┌───────────┴────────────────────────────────────────────┐
│              iPhone Mobile Client (Safari/Chrome)       │
│  • HTML5 <video> with playsinline & webkit-playsinline │
│  • Dual-mode gesture engine (Direct Touch & Trackpad)  │
│  • Floating CAD Action Bar (Orbit MMB, Pan, Zoom, ESC) │
└────────────────────────────────────────────────────────┘
            ▲                                ▲
            │                                │
            └────────► Signaling Server ◄────┘
               (Node.js WS or Python FastAPI)
```

---

## 📁 Repository File Structure

- `/host/windows_host.py` — High-performance Python screen grabber and WebRTC peer connection handler.
- `/host/requirements.txt` — Minimal Python pip dependencies.
- `/host/run_host.bat` — One-click Windows startup script with auto virtual environment installer.
- `/signaling/signaling_server.js` — Lightweight Node.js Express + WebSocket signaling server.
- `/signaling/signaling_server.py` — Pure Python WebSocket signaling server (Zero Node.js alternative).
- `/client/index.html` — Single-file standalone iPhone web client with dark-mode OLED styling and CAD touch bar.

---

## 🚀 Quickstart Guide

### Step 1: Start the Signaling Server
On your Windows host (or a cloud relay / Raspberry Pi):
```bash
cd signaling
npm install
node signaling_server.js 3000
# OR if using pure Python:
# pip install websockets
# python signaling_server.py --port 3000
```

### Step 2: Start the Windows 10 Host Streamer
```bat
cd host
run_host.bat
```
Or manually:
```bash
pip install -r requirements.txt
python windows_host.py --signaling http://localhost:3000 --fps 30 --mode ws
```

### Step 3: Access from iPhone Safari
1. Open iPhone Safari.
2. Navigate to your PC's IP or Tailscale address: `http://100.x.y.z:3000`
3. Tap the Share button and select **"Add to Home Screen"** to launch as a borderless, full-screen web app.
4. Interact using Direct Touch or the CAD 3D Action Bar.

---

## 🛡️ Remote Access Across Firewalls (Tailscale Setup)

When away from home (on cellular 5G, hotel Wi-Fi, or office networks), traditional port-forwarding is blocked by Carrier-Grade NAT (CGNAT).

1. Install **Tailscale** on Windows 10: [tailscale.com](https://tailscale.com)
2. Install **Tailscale** on your iPhone from the iOS App Store.
3. Sign into both devices with the same account.
4. Open iPhone Safari and browse to your PC's Tailscale IP: `http://100.x.y.z:3000`.
5. Tailscale automatically establishes a direct, encrypted WireGuard UDP peer-to-peer connection with zero port forwarding required.

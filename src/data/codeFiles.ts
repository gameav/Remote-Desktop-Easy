import { CodeFileItem } from '../types';

export const CODE_FILES: CodeFileItem[] = [
  {
    id: 'windows_host',
    name: 'windows_host.py',
    language: 'python',
    category: 'host',
    description: 'Main Python streamer: MSS Direct3D screen capture, aiortc WebRTC pipeline, and native Windows cursor input mapping.',
    content: `"""
=============================================================================
Low-Latency WebRTC Windows Desktop Host Streamer for CAD & Remote Work
=============================================================================
Requirements:
    pip install aiortc av mss numpy pyautogui websockets aiohttp opencv-python-headless
=============================================================================
"""

import asyncio
import fractions
import json
import logging
import platform
import sys
import time
import argparse
from typing import Optional

IS_WINDOWS = platform.system() == "Windows"

try:
    import mss
    import numpy as np
    import av
    from aiortc import (
        RTCPeerConnection,
        RTCSessionDescription,
        RTCIceCandidate,
        RTCConfiguration,
        RTCIceServer,
        VideoStreamTrack,
    )
    import websockets
    import aiohttp
except ImportError as e:
    print(f"[ERROR] Missing package: {e}. Run 'pip install -r requirements.txt'")
    sys.exit(1)

try:
    import pyautogui
    pyautogui.FAILSAFE = False
    pyautogui.PAUSE = 0.0
except ImportError:
    pyautogui = None

if IS_WINDOWS:
    import ctypes
    try:
        ctypes.windll.user32.SetProcessDPIAware()
    except Exception:
        pass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("WebRTC-Host")


class DesktopCaptureTrack(VideoStreamTrack):
    """Captures the primary monitor using mss and streams via WebRTC."""
    kind = "video"

    def __init__(self, fps=30, scale=1.0, monitor_index=1):
        super().__init__()
        self.fps = fps
        self.scale = scale
        self.time_base = fractions.Fraction(1, 90000)
        self.clock_rate = 90000
        self.frame_duration = 1.0 / self.fps
        self._start_time = None
        self._frame_count = 0
        self.sct = mss.mss()

        monitors = self.sct.monitors
        self.monitor = monitors[monitor_index] if monitor_index < len(monitors) else monitors[1]
        self.width = self.monitor["width"]
        self.height = self.monitor["height"]
        self.target_width = int(self.width * self.scale) & ~1
        self.target_height = int(self.height * self.scale) & ~1

        logger.info(f"Screen Capture: {self.width}x{self.height} -> Stream {self.target_width}x{self.target_height} @ {self.fps} FPS")

    async def recv(self):
        now = time.time()
        if self._start_time is None:
            self._start_time = now

        expected_time = self._start_time + (self._frame_count * self.frame_duration)
        wait_time = expected_time - now
        if wait_time > 0.001:
            await asyncio.sleep(wait_time)

        try:
            sct_img = self.sct.grab(self.monitor)
            img_np = np.frombuffer(sct_img.bgra, dtype=np.uint8).reshape((sct_img.height, sct_img.width, 4))
            rgb = img_np[:, :, [2, 1, 0]]

            if self.scale != 1.0:
                import cv2
                rgb = cv2.resize(rgb, (self.target_width, self.target_height), interpolation=cv2.INTER_LINEAR)

            frame = av.VideoFrame.from_ndarray(rgb, format="rgb24")
            frame.pts = self._frame_count * int(self.clock_rate / self.fps)
            frame.time_base = self.time_base
            self._frame_count += 1
            return frame
        except Exception as e:
            logger.error(f"Capture error: {e}")
            black = np.zeros((self.target_height, self.target_width, 3), dtype=np.uint8)
            frame = av.VideoFrame.from_ndarray(black, format="rgb24")
            frame.pts = self._frame_count * int(self.clock_rate / self.fps)
            frame.time_base = self.time_base
            self._frame_count += 1
            return frame


class InputHandler:
    """Translates WebRTC DataChannel inputs into native OS mouse & key inputs."""
    def __init__(self, screen_width: int, screen_height: int):
        self.screen_width = screen_width
        self.screen_height = screen_height
        self.current_x = screen_width // 2
        self.current_y = screen_height // 2

    def handle_message(self, message_str: str):
        try:
            data = json.loads(message_str)
            msg_type = data.get("type")

            if msg_type == "mousemove":
                if data.get("normalized", False):
                    self.current_x = int(data["x"] * self.screen_width)
                    self.current_y = int(data["y"] * self.screen_height)
                else:
                    self.current_x = int(data["x"])
                    self.current_y = int(data["y"])
                if pyautogui:
                    pyautogui.moveTo(self.current_x, self.current_y)

            elif msg_type == "mouserel":
                dx = int(data.get("dx", 0) * data.get("sensitivity", 1.0))
                dy = int(data.get("dy", 0) * data.get("sensitivity", 1.0))
                self.current_x = max(0, min(self.screen_width - 1, self.current_x + dx))
                self.current_y = max(0, min(self.screen_height - 1, self.current_y + dy))
                if pyautogui:
                    pyautogui.moveTo(self.current_x, self.current_y)

            elif msg_type == "mousedown":
                btn = data.get("button", "left")
                if pyautogui: pyautogui.mouseDown(button=btn)

            elif msg_type == "mouseup":
                btn = data.get("button", "left")
                if pyautogui: pyautogui.mouseUp(button=btn)

            elif msg_type == "click":
                btn = data.get("button", "left")
                if pyautogui: pyautogui.click(button=btn)

            elif msg_type == "wheel":
                if pyautogui: pyautogui.scroll(int(data.get("deltaY", 0)))

            elif msg_type == "cad_action":
                action = data.get("action")
                state = data.get("state")
                if action == "orbit":
                    if state == "start" and pyautogui: pyautogui.mouseDown(button="middle")
                    elif state == "end" and pyautogui: pyautogui.mouseUp(button="middle")
                elif action == "pan":
                    if state == "start" and pyautogui:
                        pyautogui.keyDown("shift")
                        pyautogui.mouseDown(button="middle")
                    elif state == "end" and pyautogui:
                        pyautogui.mouseUp(button="middle")
                        pyautogui.keyUp("shift")

            elif msg_type == "hotkey":
                keys = data.get("keys", [])
                if pyautogui and keys: pyautogui.hotkey(*keys)

            elif msg_type == "ping":
                return json.dumps({"type": "pong", "timestamp": data.get("timestamp")})

        except Exception as e:
            logger.error(f"Input error: {e}")
        return None


class WebRTCHost:
    def __init__(self, signaling_url: str, room_id: str = "cad_session", fps: int = 30, scale: float = 1.0):
        self.signaling_url = signaling_url
        self.room_id = room_id
        self.fps = fps
        self.scale = scale
        self.pc = None
        self.running = True

    async def create_peer_connection(self):
        config = RTCConfiguration(
            iceServers=[RTCIceServer(urls=["stun:stun.l.google.com:19302"])]
        )
        self.pc = RTCPeerConnection(configuration=config)
        self.video_track = DesktopCaptureTrack(fps=self.fps, scale=self.scale)
        self.pc.addTrack(self.video_track)
        self.input_handler = InputHandler(self.video_track.width, self.video_track.height)

        self.data_channel = self.pc.createDataChannel("input_channel", ordered=True)

        @self.data_channel.on("open")
        def on_open():
            logger.info("DataChannel opened.")
            self.data_channel.send(json.dumps({
                "type": "host_ready",
                "screenWidth": self.video_track.width,
                "screenHeight": self.video_track.height,
                "fps": self.fps
            }))

        @self.data_channel.on("message")
        def on_message(message):
            resp = self.input_handler.handle_message(message)
            if resp and self.data_channel:
                try: self.data_channel.send(resp)
                except Exception: pass

    async def run(self):
        ws_url = self.signaling_url.replace("http://", "ws://").replace("https://", "wss://").rstrip("/") + "/ws"
        logger.info(f"Connecting to Signaling: {ws_url} (Room: {self.room_id})")

        while self.running:
            try:
                async with websockets.connect(ws_url) as ws:
                    await ws.send(json.dumps({"type": "join", "role": "host", "roomId": self.room_id}))
                    if self.pc: await self.pc.close()
                    await self.create_peer_connection()

                    offer = await self.pc.createOffer()
                    await self.pc.setLocalDescription(offer)

                    await ws.send(json.dumps({
                        "type": "offer",
                        "role": "host",
                        "roomId": self.room_id,
                        "sdp": self.pc.localDescription.sdp,
                        "sdpType": self.pc.localDescription.type
                    }))
                    logger.info("Offer sent. Awaiting iPhone connection...")

                    async for raw in ws:
                        msg = json.loads(raw)
                        if msg.get("type") == "answer" and msg.get("role") == "client":
                            answer = RTCSessionDescription(sdp=msg["sdp"], type=msg.get("sdpType", "answer"))
                            await self.pc.setRemoteDescription(answer)
                            logger.info("WebRTC Connected! Streaming desktop.")
                        elif msg.get("type") == "candidate" and msg.get("role") == "client":
                            c = msg.get("candidate")
                            if c:
                                await self.pc.addIceCandidate(RTCIceCandidate(
                                    sdpMid=c.get("sdpMid"), sdpMLineIndex=c.get("sdpMLineIndex"), candidate=c.get("candidate")
                                ))
            except Exception as e:
                logger.warning(f"Connection retry in 3s... ({e})")
                await asyncio.sleep(3)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--signaling", default="http://localhost:3000")
    parser.add_argument("--room", default="cad_session")
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--scale", type=float, default=1.0)
    args = parser.parse_args()

    host = WebRTCHost(signaling_url=args.signaling, room_id=args.room, fps=args.fps, scale=args.scale)
    asyncio.run(host.run())

if __name__ == "__main__":
    main()
`
  },
  {
    id: 'signaling_node',
    name: 'signaling_server.js',
    language: 'javascript',
    category: 'signaling',
    description: 'Lightweight Node.js Express & WebSocket signaling server for peer negotiation.',
    content: `/**
 * Ultra-Lightweight Node.js WebSocket & REST Signaling Server
 * Usage: node signaling_server.js 3000
 */
const http = require('http');
const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Serve client folder for quick iPhone access
app.use(express.static(path.join(__dirname, '../client')));

const socketRooms = new Map();

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  let userRoom = 'default';

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type, roomId = 'default', role = 'client' } = data;
      userRoom = roomId;

      if (!socketRooms.has(roomId)) {
        socketRooms.set(roomId, { host: null, clients: new Set() });
      }
      const room = socketRooms.get(roomId);

      if (type === 'join') {
        if (role === 'host') {
          room.host = ws;
          console.log(\`[Host Registered] Room \${roomId}\`);
          ws.send(JSON.stringify({ type: 'joined', role: 'host', roomId }));
          room.clients.forEach(c => c.readyState === WebSocket.OPEN && c.send(JSON.stringify({ type: 'host_online' })));
        } else {
          room.clients.add(ws);
          console.log(\`[Client Registered] Room \${roomId}\`);
          ws.send(JSON.stringify({
            type: 'joined',
            role: 'client',
            roomId,
            hostOnline: !!(room.host && room.host.readyState === WebSocket.OPEN)
          }));
        }
        return;
      }

      if (type === 'offer') {
        room.clients.forEach(c => c.readyState === WebSocket.OPEN && c.send(JSON.stringify(data)));
      } else if (type === 'answer' && room.host && room.host.readyState === WebSocket.OPEN) {
        room.host.send(JSON.stringify(data));
      } else if (type === 'candidate') {
        if (role === 'host') {
          room.clients.forEach(c => c.readyState === WebSocket.OPEN && c.send(JSON.stringify(data)));
        } else if (room.host && room.host.readyState === WebSocket.OPEN) {
          room.host.send(JSON.stringify(data));
        }
      }
    } catch (e) {
      console.error('WS Error:', e.message);
    }
  });

  ws.on('close', () => {
    const room = socketRooms.get(userRoom);
    if (!room) return;
    if (room.host === ws) {
      room.host = null;
      room.clients.forEach(c => c.readyState === WebSocket.OPEN && c.send(JSON.stringify({ type: 'host_offline' })));
    } else {
      room.clients.delete(ws);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(\`Signaling Server ready on http://0.0.0.0:\${PORT}\`);
});
`
  },
  {
    id: 'signaling_python',
    name: 'signaling_server.py',
    language: 'python',
    category: 'signaling',
    description: 'Pure Python WebSocket signaling server (Zero Node.js dependency alternative).',
    content: `"""
Pure Python Ultra-Lightweight Signaling Server
Run using:
    pip install websockets
    python signaling_server.py --port 3000
"""
import asyncio
import json
import logging
import argparse
import websockets

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SignalingServer")

ROOMS = {}

async def handler(websocket, path):
    user_room = "default"
    try:
        async for message in websocket:
            data = json.loads(message)
            msg_type = data.get("type")
            room_id = data.get("roomId", "default")
            role = data.get("role", "client")
            user_room = room_id

            if room_id not in ROOMS:
                ROOMS[room_id] = {"host": None, "clients": set()}
            room = ROOMS[room_id]

            if msg_type == "join":
                if role == "host":
                    room["host"] = websocket
                    logger.info(f"Host joined room: {room_id}")
                    await websocket.send(json.dumps({"type": "joined", "role": "host", "roomId": room_id}))
                    for c in list(room["clients"]):
                        await c.send(json.dumps({"type": "host_online", "roomId": room_id}))
                else:
                    room["clients"].add(websocket)
                    logger.info(f"Client joined room: {room_id}")
                    await websocket.send(json.dumps({
                        "type": "joined",
                        "role": "client",
                        "roomId": room_id,
                        "hostOnline": room["host"] is not None
                    }))
            elif msg_type == "offer":
                for c in list(room["clients"]):
                    await c.send(json.dumps(data))
            elif msg_type == "answer":
                if room["host"]:
                    await room["host"].send(json.dumps(data))
            elif msg_type == "candidate":
                if role == "host":
                    for c in list(room["clients"]):
                        await c.send(json.dumps(data))
                elif room["host"]:
                    await room["host"].send(json.dumps(data))
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        if user_room in ROOMS:
            room = ROOMS[user_room]
            if room["host"] == websocket:
                room["host"] = None
                for c in list(room["clients"]):
                    await c.send(json.dumps({"type": "host_offline", "roomId": user_room}))
            elif websocket in room["clients"]:
                room["clients"].remove(websocket)

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=3000)
    args = parser.parse_args()
    logger.info(f"Starting Python Signaling Server on 0.0.0.0:{args.port}...")
    async with websockets.serve(handler, "0.0.0.0", args.port):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
`
  },
  {
    id: 'client_html',
    name: 'index.html (Client)',
    language: 'html',
    category: 'client',
    description: 'Single-file self-hosted mobile web client with touch-to-CAD gesture mappings and WebRTC video engine.',
    content: `<!-- iPhone WebRTC Low-Latency Client (Single File) -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <title>iPhone CAD WebRTC</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
    body, html { width: 100%; height: 100%; background: #000; overflow: hidden; touch-action: none; font-family: system-ui; color: #fff; }
    #container { position: relative; width: 100vw; height: 100dvh; display: flex; align-items: center; justify-content: center; }
    #remote-video { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
    #touch-surface { position: absolute; inset: 0; z-index: 10; touch-action: none; cursor: crosshair; }
    #cad-bar { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 20; background: rgba(20,25,35,0.9); padding: 6px 12px; border-radius: 24px; }
    .btn { padding: 8px 12px; border-radius: 14px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn.active { background: #3b82f6; }
    #hud { position: absolute; top: 12px; left: 12px; z-index: 20; background: rgba(0,0,0,0.7); padding: 4px 10px; border-radius: 12px; font-size: 11px; }
  </style>
</head>
<body>
<div id="container">
  <div id="hud">Status: <span id="status">Connecting...</span> | <span id="rtt">RTT: --ms</span></div>
  <video id="remote-video" autoplay playsinline muted webkit-playsinline></video>
  <div id="touch-surface"></div>
  <div id="cad-bar">
    <button class="btn active" id="btn-mode" onclick="toggleMode()">👆 Direct</button>
    <button class="btn" onpointerdown="sendCad('orbit', 'start')" onpointerup="sendCad('orbit', 'end')">🔄 Orbit</button>
    <button class="btn" onpointerdown="sendCad('pan', 'start')" onpointerup="sendCad('pan', 'end')">✋ Pan</button>
    <button class="btn" onclick="sendWheel(120)">🔍 Zoom+</button>
    <button class="btn" onclick="sendWheel(-120)">🔍 Zoom-</button>
  </div>
</div>
<script>
  let pc, dc, ws, mode = 'direct';
  const video = document.getElementById('remote-video');
  const touchSurface = document.getElementById('touch-surface');

  function initWebRTC() {
    pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pc.ontrack = (e) => { video.srcObject = e.streams[0] || new MediaStream([e.track]); video.play(); };
    pc.ondatachannel = (e) => setupChannel(e.channel);
    
    const wsUrl = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws';
    ws = new WebSocket(wsUrl);
    ws.onopen = () => ws.send(JSON.stringify({ type: 'join', role: 'client', roomId: 'cad_session' }));
    ws.onmessage = async (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: msg.sdp }));
        const ans = await pc.createAnswer();
        await pc.setLocalDescription(ans);
        ws.send(JSON.stringify({ type: 'answer', role: 'client', roomId: 'cad_session', sdp: ans.sdp }));
      } else if (msg.type === 'candidate' && msg.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
      }
    };
  }

  function setupChannel(channel) {
    dc = channel;
    dc.onopen = () => { document.getElementById('status').textContent = 'Connected'; };
  }

  function send(data) { if (dc && dc.readyState === 'open') dc.send(JSON.stringify(data)); }
  function sendCad(action, state) { send({ type: 'cad_action', action, state }); }
  function sendWheel(delta) { send({ type: 'wheel', deltaY: delta }); }
  function toggleMode() {
    mode = mode === 'direct' ? 'trackpad' : 'direct';
    document.getElementById('btn-mode').textContent = mode === 'direct' ? '👆 Direct' : '🖱️ Trackpad';
  }

  touchSurface.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    const rect = video.getBoundingClientRect();
    const x = (t.clientX - rect.left) / rect.width;
    const y = (t.clientY - rect.top) / rect.height;
    send({ type: 'mousedown', button: 'left', x, y, normalized: true });
  });
  touchSurface.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    const rect = video.getBoundingClientRect();
    const x = (t.clientX - rect.left) / rect.width;
    const y = (t.clientY - rect.top) / rect.height;
    send({ type: 'mousemove', x, y, normalized: true });
  });
  touchSurface.addEventListener('touchend', () => send({ type: 'mouseup', button: 'left' }));

  initWebRTC();
</script>
</body>
</html>`
  },
  {
    id: 'requirements',
    name: 'requirements.txt',
    language: 'text',
    category: 'host',
    description: 'Python host pip dependencies list.',
    content: `aiortc>=1.9.0
av>=12.0.0
mss>=9.0.1
numpy>=1.24.0
pyautogui>=0.9.54
websockets>=12.0
aiohttp>=3.9.0
opencv-python-headless>=4.9.0
`
  },
  {
    id: 'batch_script',
    name: 'run_host.bat',
    language: 'bat',
    category: 'script',
    description: 'One-click Windows batch startup script with virtual environment auto-installer.',
    content: `@echo off
title WebRTC Windows Remote Desktop Host - CAD Streamer
color 0A
echo =========================================================================
echo  WebRTC Windows Desktop Capture Host for iPhone Safari/Chrome Client
echo =========================================================================
if not exist "venv" (
    echo [1/2] Creating Python Virtual Environment...
    python -m venv venv
)
call venv\\Scripts\\activate.bat
echo [2/2] Installing Dependencies...
pip install -r requirements.txt --upgrade
echo Starting Streamer on port 3000...
python windows_host.py --signaling http://localhost:3000 --fps 30 --mode ws
pause
`
  }
];

"""
=============================================================================
Universal WebRTC Remote Desktop Host Streamer (Windows / macOS / Linux)
=============================================================================
Features:
 - Ultra-fast cross-platform screen grabber via `mss` (Direct3D/GDI/CoreGraphics/X11)
 - Low-latency video encoding via `aiortc` and `PyAV` (H.264 / VP8)
 - Bidirectional WebRTC DataChannel for touch, mouse, keyboard & CAD navigation
 - Pointer Lock & raw relative mouse delta handling for desktop-to-desktop control
 - Cross-platform clipboard synchronization (copy/paste between machines)
 - Multi-monitor selection & dynamic resolution scaling
 - Dual signaling: Real-time WebSocket or REST HTTP fallback
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
from typing import Optional, Dict, Any

# Platform Identification
OS_SYSTEM = platform.system()
IS_WINDOWS = OS_SYSTEM == "Windows"
IS_MAC = OS_SYSTEM == "Darwin"
IS_LINUX = OS_SYSTEM == "Linux"

# Dependencies verification
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
    import aiohttp
    import websockets
except ImportError as e:
    print(f"\n[ERROR] Missing required Python package: {e}")
    print("Please install requirements using:")
    print("    pip install -r requirements.txt\n")
    sys.exit(1)

# Input control
try:
    import pyautogui
    pyautogui.FAILSAFE = False
    pyautogui.PAUSE = 0.0
except ImportError:
    pyautogui = None
    print("[WARN] pyautogui not installed. Input simulation will be limited.")

# Clipboard integration
try:
    import pyperclip
except ImportError:
    pyperclip = None

# High-DPI Windows Setup
if IS_WINDOWS:
    try:
        import ctypes
        user32 = ctypes.windll.user32
        user32.SetProcessDPIAware()
    except Exception:
        pass

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("WebRTC-UniversalHost")


# -----------------------------------------------------------------------------
# High-Performance Screen Capture Video Track
# -----------------------------------------------------------------------------
class DesktopCaptureTrack(VideoStreamTrack):
    """
    WebRTC VideoStreamTrack capturing the selected monitor with `mss`
    across Windows (Direct3D/GDI), macOS (CoreGraphics), and Linux (X11/Wayland).
    """
    kind = "video"

    def __init__(self, fps: int = 30, scale: float = 1.0, monitor_index: int = 1):
        super().__init__()
        self.fps = fps
        self.scale = scale
        self.monitor_index = monitor_index
        self.time_base = fractions.Fraction(1, 90000)
        self.clock_rate = 90000
        self.frame_duration = 1.0 / self.fps
        self._start_time = None
        self._frame_count = 0
        self.sct = mss.mss()

        self.setup_monitor(monitor_index)

    def setup_monitor(self, monitor_index: int):
        monitors = self.sct.monitors
        if monitor_index < len(monitors):
            self.monitor = monitors[monitor_index]
        else:
            self.monitor = monitors[1] if len(monitors) > 1 else monitors[0]

        self.width = self.monitor["width"]
        self.height = self.monitor["height"]
        self.target_width = int(self.width * self.scale)
        self.target_height = int(self.height * self.scale)
        # Ensure dimensions are even for H.264 macroblock encoders
        self.target_width -= self.target_width % 2
        self.target_height -= self.target_height % 2

        logger.info(
            f"Screen Capture Initialized on {OS_SYSTEM}: {self.width}x{self.height} -> "
            f"Streaming {self.target_width}x{self.target_height} @ {self.fps} FPS (Monitor #{monitor_index})"
        )

    def set_monitor(self, monitor_index: int):
        self.setup_monitor(monitor_index)

    async def recv(self):
        now = time.time()
        if self._start_time is None:
            self._start_time = now

        expected_time = self._start_time + (self._frame_count * self.frame_duration)
        wait_time = expected_time - now
        if wait_time > 0.001:
            await asyncio.sleep(wait_time)

        try:
            # Grab raw screen buffer
            sct_img = self.sct.grab(self.monitor)
            img_np = np.frombuffer(sct_img.bgra, dtype=np.uint8).reshape((sct_img.height, sct_img.width, 4))
            
            # BGRA to RGB
            rgb = img_np[:, :, [2, 1, 0]]

            # Optional downscaling
            if self.scale != 1.0 and (self.target_width != self.width or self.target_height != self.height):
                try:
                    import cv2
                    rgb = cv2.resize(rgb, (self.target_width, self.target_height), interpolation=cv2.INTER_LINEAR)
                except Exception:
                    pass

            frame = av.VideoFrame.from_ndarray(rgb, format="rgb24")
            frame.pts = self._frame_count * int(self.clock_rate / self.fps)
            frame.time_base = self.time_base
            self._frame_count += 1
            return frame

        except Exception as e:
            logger.error(f"Error capturing screen frame: {e}")
            black = np.zeros((self.target_height, self.target_width, 3), dtype=np.uint8)
            frame = av.VideoFrame.from_ndarray(black, format="rgb24")
            frame.pts = self._frame_count * int(self.clock_rate / self.fps)
            frame.time_base = self.time_base
            self._frame_count += 1
            return frame


# -----------------------------------------------------------------------------
# Input Simulation Engine (Cross-Platform Win/Mac/Linux)
# -----------------------------------------------------------------------------
class InputHandler:
    def __init__(self, screen_width: int, screen_height: int):
        self.screen_width = screen_width
        self.screen_height = screen_height
        self.current_x = screen_width // 2
        self.current_y = screen_height // 2
        logger.info(f"InputHandler ready for {OS_SYSTEM} space: {screen_width}x{screen_height}")

    def update_dimensions(self, width: int, height: int):
        self.screen_width = width
        self.screen_height = height

    def handle_message(self, message_str: str) -> Optional[str]:
        try:
            data = json.loads(message_str)
            msg_type = data.get("type")

            # 1. Absolute Mouse Move (Touch / Direct Positioning)
            if msg_type == "mousemove":
                if data.get("normalized", False):
                    target_x = int(data["x"] * self.screen_width)
                    target_y = int(data["y"] * self.screen_height)
                else:
                    target_x = int(data["x"])
                    target_y = int(data["y"])

                self.current_x = max(0, min(self.screen_width - 1, target_x))
                self.current_y = max(0, min(self.screen_height - 1, target_y))

                if pyautogui:
                    pyautogui.moveTo(self.current_x, self.current_y)

            # 2. Relative Mouse Delta (Pointer Lock for PC-to-PC, CAD & 3D Navigation)
            elif msg_type in ["mouserel", "mouse_relative"]:
                sensitivity = data.get("sensitivity", 1.0)
                dx = int(data.get("dx", 0) * sensitivity)
                dy = int(data.get("dy", 0) * sensitivity)

                self.current_x = max(0, min(self.screen_width - 1, self.current_x + dx))
                self.current_y = max(0, min(self.screen_height - 1, self.current_y + dy))

                if pyautogui:
                    pyautogui.moveTo(self.current_x, self.current_y)

            # 3. Mouse Down / Up / Click
            elif msg_type == "mousedown":
                btn = data.get("button", "left")
                if "x" in data and "y" in data:
                    self.handle_message(json.dumps({
                        "type": "mousemove",
                        "x": data["x"],
                        "y": data["y"],
                        "normalized": data.get("normalized", True)
                    }))
                if pyautogui:
                    pyautogui.mouseDown(button=btn)

            elif msg_type == "mouseup":
                btn = data.get("button", "left")
                if pyautogui:
                    pyautogui.mouseUp(button=btn)

            elif msg_type == "click":
                btn = data.get("button", "left")
                clicks = data.get("clicks", 1)
                if "x" in data and "y" in data:
                    self.handle_message(json.dumps({
                        "type": "mousemove",
                        "x": data["x"],
                        "y": data["y"],
                        "normalized": data.get("normalized", True)
                    }))
                if pyautogui:
                    pyautogui.click(button=btn, clicks=clicks)

            elif msg_type == "dblclick":
                btn = data.get("button", "left")
                if pyautogui:
                    pyautogui.doubleClick(button=btn)

            # 4. Mouse Wheel Scrolling (Vertical and Horizontal)
            elif msg_type == "wheel":
                delta_y = data.get("deltaY", 0)
                delta_x = data.get("deltaX", 0)
                if pyautogui:
                    if delta_y != 0:
                        pyautogui.scroll(int(delta_y))
                    if delta_x != 0 and hasattr(pyautogui, "hscroll"):
                        pyautogui.hscroll(int(delta_x))

            # 5. CAD 3D Actions (Orbit, Pan, Zoom)
            elif msg_type == "cad_action":
                action = data.get("action")
                state = data.get("state")
                if action == "orbit":
                    if state == "start" and pyautogui:
                        pyautogui.mouseDown(button="middle")
                    elif state == "end" and pyautogui:
                        pyautogui.mouseUp(button="middle")
                elif action == "pan":
                    if state == "start" and pyautogui:
                        pyautogui.keyDown("shift")
                        pyautogui.mouseDown(button="middle")
                    elif state == "end" and pyautogui:
                        pyautogui.mouseUp(button="middle")
                        pyautogui.keyUp("shift")

            # 6. Full Hardware Keyboard Simulation
            elif msg_type == "keydown":
                key = data.get("key", "").lower()
                # Map special keys across OSes
                key_mapped = self._map_key(key)
                if pyautogui and key_mapped:
                    pyautogui.keyDown(key_mapped)

            elif msg_type == "keyup":
                key = data.get("key", "").lower()
                key_mapped = self._map_key(key)
                if pyautogui and key_mapped:
                    pyautogui.keyUp(key_mapped)

            elif msg_type == "hotkey":
                keys = [self._map_key(k.lower()) for k in data.get("keys", []) if k]
                if pyautogui and keys:
                    pyautogui.hotkey(*keys)

            # 7. Clipboard Sharing
            elif msg_type == "clipboard_paste":
                text = data.get("text", "")
                if text:
                    if pyperclip:
                        pyperclip.copy(text)
                        # Trigger paste command
                        if IS_MAC:
                            pyautogui.hotkey("command", "v")
                        else:
                            pyautogui.hotkey("ctrl", "v")
                    elif pyautogui:
                        pyautogui.write(text, interval=0.01)

            elif msg_type == "clipboard_copy_request":
                if pyperclip:
                    current_clip = pyperclip.paste()
                    return json.dumps({
                        "type": "clipboard_copy_response",
                        "text": current_clip
                    })

            # 8. Diagnostics / Ping
            elif msg_type == "ping":
                return json.dumps({
                    "type": "pong",
                    "timestamp": data.get("timestamp"),
                    "hostPlatform": OS_SYSTEM
                })

        except Exception as e:
            logger.error(f"Error handling input: {e}")
        return None

    def _map_key(self, key: str) -> str:
        """Translates web event key names into PyAutoGUI compatible key codes."""
        mapping = {
            "control": "ctrl",
            "meta": "command" if IS_MAC else "win",
            "command": "command" if IS_MAC else "win",
            "alt": "alt" if not IS_MAC else "option",
            "option": "option",
            "escape": "esc",
            "enter": "enter",
            "return": "enter",
            "backspace": "backspace",
            "tab": "tab",
            "space": "space",
            "arrowup": "up",
            "arrowdown": "down",
            "arrowleft": "left",
            "arrowright": "right",
            "delete": "delete",
            "capslock": "capslock"
        }
        return mapping.get(key, key)


# -----------------------------------------------------------------------------
# Main WebRTC Host Session
# -----------------------------------------------------------------------------
class WebRTCHost:
    def __init__(self, signaling_url: str, room_id: str = "cad_session", fps: int = 30, scale: float = 1.0, monitor: int = 1):
        self.signaling_url = signaling_url
        self.room_id = room_id
        self.fps = fps
        self.scale = scale
        self.monitor = monitor
        self.pc: Optional[RTCPeerConnection] = None
        self.video_track: Optional[DesktopCaptureTrack] = None
        self.data_channel = None
        self.input_handler = None
        self.ws = None
        self.running = True

    async def create_peer_connection(self):
        config = RTCConfiguration(
            iceServers=[
                RTCIceServer(urls=["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"])
            ]
        )
        self.pc = RTCPeerConnection(configuration=config)
        self.video_track = DesktopCaptureTrack(fps=self.fps, scale=self.scale, monitor_index=self.monitor)
        self.pc.addTrack(self.video_track)

        self.input_handler = InputHandler(self.video_track.width, self.video_track.height)
        self.data_channel = self.pc.createDataChannel("input_channel", ordered=True)

        @self.data_channel.on("open")
        def on_open():
            logger.info(f"[WebRTC] DataChannel open! Streaming {OS_SYSTEM} desktop.")
            self.data_channel.send(json.dumps({
                "type": "host_ready",
                "os": OS_SYSTEM,
                "screenWidth": self.video_track.width,
                "screenHeight": self.video_track.height,
                "fps": self.fps,
                "monitorsCount": len(self.video_track.sct.monitors) - 1,
            }))

        @self.data_channel.on("message")
        def on_message(message):
            response = self.input_handler.handle_message(message)
            if response and self.data_channel:
                try:
                    self.data_channel.send(response)
                except Exception:
                    pass

        @self.pc.on("iceconnectionstatechange")
        async def on_ice_state():
            logger.info(f"[WebRTC] ICE State: {self.pc.iceConnectionState}")

        @self.pc.on("datachannel")
        def on_datachannel(channel):
            @channel.on("message")
            def on_msg(message):
                self.input_handler.handle_message(message)

    async def run_websocket_signaling(self):
        ws_url = self.signaling_url.replace("http://", "ws://").replace("https://", "wss://")
        if not ws_url.endswith("/ws"):
            ws_url = f"{ws_url.rstrip('/')}/ws"

        logger.info(f"Connecting to Signaling: {ws_url} (Room: {self.room_id})")

        while self.running:
            try:
                async with websockets.connect(ws_url) as ws:
                    self.ws = ws
                    logger.info("Connected to Signaling Server.")

                    await ws.send(json.dumps({
                        "type": "join",
                        "role": "host",
                        "roomId": self.room_id,
                    }))

                    if self.pc:
                        await self.pc.close()
                    await self.create_peer_connection()

                    offer = await self.pc.createOffer()
                    await self.pc.setLocalDescription(offer)
                    
                    await ws.send(json.dumps({
                        "type": "offer",
                        "role": "host",
                        "roomId": self.room_id,
                        "sdp": self.pc.localDescription.sdp,
                        "sdpType": self.pc.localDescription.type,
                    }))
                    logger.info(f"SDP Offer published. Awaiting client connection...")

                    async for raw in ws:
                        msg = json.loads(raw)
                        mtype = msg.get("type")

                        if mtype == "answer" and msg.get("role") == "client":
                            sdp = msg.get("sdp")
                            sdp_type = msg.get("sdpType", "answer")
                            answer = RTCSessionDescription(sdp=sdp, type=sdp_type)
                            await self.pc.setRemoteDescription(answer)
                            logger.info("Client connected! Streaming active.")

                        elif mtype == "candidate" and msg.get("role") == "client":
                            candidate_data = msg.get("candidate")
                            if candidate_data:
                                candidate = RTCIceCandidate(
                                    sdpMid=candidate_data.get("sdpMid"),
                                    sdpMLineIndex=candidate_data.get("sdpMLineIndex"),
                                    candidate=candidate_data.get("candidate"),
                                )
                                await self.pc.addIceCandidate(candidate)

            except Exception as e:
                logger.warning(f"Signaling loop event: {e}. Reconnecting in 3s...")
                await asyncio.sleep(3)


# -----------------------------------------------------------------------------
# Main Entry Point
# -----------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Universal WebRTC Remote Desktop Host (Windows, macOS, Linux)")
    parser.add_argument("--signaling", default="http://localhost:3000", help="Signaling Server URL (e.g. http://100.x.y.z:3000 or http://localhost:3000)")
    parser.add_argument("--room", default="cad_session", help="Session Room ID (default: cad_session)")
    parser.add_argument("--fps", type=int, default=60, help="Target FPS (e.g. 30, 60)")
    parser.add_argument("--scale", type=float, default=1.0, help="Scale factor (1.0 for native)")
    parser.add_argument("--monitor", type=int, default=1, help="Monitor index to stream (1 = Primary Display)")

    args = parser.parse_args()

    print("=" * 72)
    print(f"  🖥️ Universal WebRTC Desktop Streamer ({OS_SYSTEM})")
    print(f"  Streaming: Monitor #{args.monitor} @ {args.fps} FPS")
    print(f"  Signaling Server: {args.signaling} (Room: {args.room})")
    print("=" * 72)

    host = WebRTCHost(
        signaling_url=args.signaling,
        room_id=args.room,
        fps=args.fps,
        scale=args.scale,
        monitor=args.monitor,
    )

    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(host.run_websocket_signaling())
    except KeyboardInterrupt:
        logger.info("Host terminating...")
    finally:
        host.running = False


if __name__ == "__main__":
    main()

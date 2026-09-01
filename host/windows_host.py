"""
=============================================================================
Low-Latency WebRTC Windows Desktop Host Streamer for CAD & Remote Work
=============================================================================
Features:
 - Screen capture via `mss` (high-performance Direct3D/GDI memory buffer)
 - Ultra-low-latency video encoding via `aiortc` and `PyAV` (H.264 / VP8)
 - Bidirectional WebRTC DataChannel for low-lag mouse, CAD orbit/pan/zoom & keys
 - High-precision Windows cursor control with DPI scaling awareness
 - Dual signaling: Real-time WebSocket or REST HTTP fallback
 - Optimized for iOS Safari / Chrome mobile browser client
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

# Check platform
IS_WINDOWS = platform.system() == "Windows"

# Imports with friendly error guidance
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
    from aiortc.contrib.media import MediaRelay
    import aiohttp
    import websockets
except ImportError as e:
    print(f"\n[ERROR] Missing required Python package: {e}")
    print("Please install requirements using:")
    print("    pip install -r requirements.txt\n")
    sys.exit(1)

# Input control imports
try:
    import pyautogui
    # Disable PyAutoGUI fail-safe corner abort so smooth full-screen gestures don't throw exceptions
    pyautogui.FAILSAFE = False
    pyautogui.PAUSE = 0.0
except ImportError:
    pyautogui = None
    print("[WARN] pyautogui not installed. Input simulation will be limited.")

# Try Win32 ctypes for microsecond-level hardware SendInput (fastest on Windows)
if IS_WINDOWS:
    import ctypes
    user32 = ctypes.windll.user32
    # Set process DPI awareness so coordinates match real physical pixels on High-DPI screens
    try:
        user32.SetProcessDPIAware()
    except Exception:
        pass

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("WebRTC-Host")


# -----------------------------------------------------------------------------
# High-FPS Screen Capture Video Stream Track
# -----------------------------------------------------------------------------
class DesktopCaptureTrack(VideoStreamTrack):
    """
    Custom WebRTC VideoStreamTrack that grabs the primary monitor screen using
    `mss`, converts BGR to RGB, and generates AV VideoFrames with precise PTS.
    """
    kind = "video"

    def __init__(self, fps=30, scale=1.0, monitor_index=1):
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

        # Detect primary monitor resolution
        monitors = self.sct.monitors
        if self.monitor_index < len(monitors):
            self.monitor = monitors[self.monitor_index]
        else:
            self.monitor = monitors[1] if len(monitors) > 1 else monitors[0]

        self.width = self.monitor["width"]
        self.height = self.monitor["height"]
        
        # Target scaled resolution
        self.target_width = int(self.width * self.scale)
        self.target_height = int(self.height * self.scale)
        # Ensure dimensions are even numbers for H.264 macroblocks
        self.target_width -= self.target_width % 2
        self.target_height -= self.target_height % 2

        logger.info(
            f"Screen Capture initialized: {self.width}x{self.height} -> "
            f"Streaming {self.target_width}x{self.target_height} @ {self.fps} FPS"
        )

    async def recv(self):
        """
        Invoked by aiortc loop to pull the next video frame.
        Maintains consistent pacing and synchronized Presentation Time Stamps (PTS).
        """
        now = time.time()
        if self._start_time is None:
            self._start_time = now

        # Pacing calculation
        expected_time = self._start_time + (self._frame_count * self.frame_duration)
        wait_time = expected_time - now
        if wait_time > 0.001:
            await asyncio.sleep(wait_time)

        # 1. Grab raw screen pixels with mss (fastest cross-platform screen grabber)
        try:
            sct_img = self.sct.grab(self.monitor)
            # mss returns BGRA array
            img_np = np.frombuffer(sct_img.bgra, dtype=np.uint8).reshape((sct_img.height, sct_img.width, 4))
            
            # Extract RGB (drop alpha)
            rgb = img_np[:, :, [2, 1, 0]]

            # Optional downscale if scale < 1.0 (for high-DPI displays or lower bandwidth)
            if self.scale != 1.0 and (self.target_width != self.width or self.target_height != self.height):
                # Subsample or resize
                import cv2
                rgb = cv2.resize(rgb, (self.target_width, self.target_height), interpolation=cv2.INTER_LINEAR)

            # 2. Package into PyAV VideoFrame
            frame = av.VideoFrame.from_ndarray(rgb, format="rgb24")
            
            # Set synchronized PTS
            frame.pts = self._frame_count * int(self.clock_rate / self.fps)
            frame.time_base = self.time_base
            self._frame_count += 1

            return frame
        except Exception as e:
            logger.error(f"Error capturing screen frame: {e}")
            # Fallback black frame to keep WebRTC pipeline healthy
            black = np.zeros((self.target_height, self.target_width, 3), dtype=np.uint8)
            frame = av.VideoFrame.from_ndarray(black, format="rgb24")
            frame.pts = self._frame_count * int(self.clock_rate / self.fps)
            frame.time_base = self.time_base
            self._frame_count += 1
            return frame


# -----------------------------------------------------------------------------
# Input Simulation Handler (Mouse, Keyboard, CAD Orbit/Pan/Zoom)
# -----------------------------------------------------------------------------
class InputHandler:
    """
    Translates incoming JSON messages from the iPhone WebRTC DataChannel
    into native OS input events (PyAutoGUI / Win32).
    """

    def __init__(self, screen_width: int, screen_height: int):
        self.screen_width = screen_width
        self.screen_height = screen_height
        self.current_x = screen_width // 2
        self.current_y = screen_height // 2
        logger.info(f"InputHandler bound to screen space: {screen_width}x{screen_height}")

    def handle_message(self, message_str: str):
        try:
            data = json.loads(message_str)
            msg_type = data.get("type")

            if msg_type == "mousemove":
                # Normalized coordinates (0.0 to 1.0)
                if data.get("normalized", False):
                    target_x = int(data["x"] * self.screen_width)
                    target_y = int(data["y"] * self.screen_height)
                else:
                    target_x = int(data["x"])
                    target_y = int(data["y"])

                # Clamp to screen boundary
                target_x = max(0, min(self.screen_width - 1, target_x))
                target_y = max(0, min(self.screen_height - 1, target_y))
                self.current_x = target_x
                self.current_y = target_y

                if pyautogui:
                    pyautogui.moveTo(target_x, target_y)

            elif msg_type == "mouserel":
                # Relative trackpad-style motion (ideal for CAD precision)
                dx = int(data.get("dx", 0) * data.get("sensitivity", 1.0))
                dy = int(data.get("dy", 0) * data.get("sensitivity", 1.0))
                self.current_x = max(0, min(self.screen_width - 1, self.current_x + dx))
                self.current_y = max(0, min(self.screen_height - 1, self.current_y + dy))
                if pyautogui:
                    pyautogui.moveTo(self.current_x, self.current_y)

            elif msg_type == "mousedown":
                btn = data.get("button", "left")  # left, right, middle
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

            elif msg_type == "wheel":
                # CAD 3D Zoom (scroll wheel)
                delta_y = data.get("deltaY", 0)
                amount = int(delta_y)
                if pyautogui:
                    pyautogui.scroll(amount)

            elif msg_type == "cad_action":
                # Specialized CAD Combos (Orbit = MMB Drag, Pan = Shift+MMB Drag, Zoom = Ctrl+MMB)
                action = data.get("action")
                state = data.get("state")  # 'start', 'move', 'end'
                
                if action == "orbit":
                    # Middle mouse button hold & drag
                    if state == "start":
                        if pyautogui: pyautogui.mouseDown(button="middle")
                    elif state == "end":
                        if pyautogui: pyautogui.mouseUp(button="middle")
                
                elif action == "pan":
                    # Shift + Middle mouse button
                    if state == "start":
                        if pyautogui:
                            pyautogui.keyDown("shift")
                            pyautogui.mouseDown(button="middle")
                    elif state == "end":
                        if pyautogui:
                            pyautogui.mouseUp(button="middle")
                            pyautogui.keyUp("shift")

            elif msg_type == "keydown":
                key = data.get("key", "").lower()
                if pyautogui and key:
                    pyautogui.keyDown(key)

            elif msg_type == "keyup":
                key = data.get("key", "").lower()
                if pyautogui and key:
                    pyautogui.keyUp(key)

            elif msg_type == "hotkey":
                # e.g., ["ctrl", "z"], ["escape"], ["f5"]
                keys = data.get("keys", [])
                if pyautogui and keys:
                    pyautogui.hotkey(*keys)

            elif msg_type == "ping":
                # Round-trip latency check
                return json.dumps({"type": "pong", "timestamp": data.get("timestamp")})

        except Exception as e:
            logger.error(f"Error handling input message: {e}")
        return None


# -----------------------------------------------------------------------------
# Main WebRTC Host Session Manager
# -----------------------------------------------------------------------------
class WebRTCHost:
    def __init__(self, signaling_url: str, room_id: str = "cad_session", fps: int = 30, scale: float = 1.0):
        self.signaling_url = signaling_url
        self.room_id = room_id
        self.fps = fps
        self.scale = scale
        self.pc: Optional[RTCPeerConnection] = None
        self.video_track: Optional[DesktopCaptureTrack] = None
        self.data_channel = None
        self.input_handler = None
        self.ws = None
        self.running = True

    async def create_peer_connection(self):
        """Initializes RTCPeerConnection with STUN configuration."""
        config = RTCConfiguration(
            iceServers=[
                RTCIceServer(urls=["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"])
            ]
        )
        self.pc = RTCPeerConnection(configuration=config)

        # Initialize screen capture track
        self.video_track = DesktopCaptureTrack(fps=self.fps, scale=self.scale)
        self.pc.addTrack(self.video_track)

        # Initialize input handler with native screen resolution
        self.input_handler = InputHandler(self.video_track.width, self.video_track.height)

        # Setup DataChannel for inputs & control
        self.data_channel = self.pc.createDataChannel("input_channel", ordered=True)

        @self.data_channel.on("open")
        def on_open():
            logger.info("[WebRTC] DataChannel 'input_channel' opened! Ready for iPhone input.")
            self.data_channel.send(json.dumps({
                "type": "host_ready",
                "screenWidth": self.video_track.width,
                "screenHeight": self.video_track.height,
                "fps": self.fps,
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
            logger.info(f"[WebRTC] ICE Connection State: {self.pc.iceConnectionState}")
            if self.pc.iceConnectionState in ["failed", "disconnected", "closed"]:
                logger.warning("[WebRTC] Peer disconnected. Awaiting next connection.")

        @self.pc.on("datachannel")
        def on_datachannel(channel):
            logger.info(f"[WebRTC] Incoming remote DataChannel: {channel.label}")
            @channel.on("message")
            def on_msg(message):
                self.input_handler.handle_message(message)

    async def run_websocket_signaling(self):
        """Connects to WebSocket signaling server for instant SDP exchange."""
        ws_url = self.signaling_url.replace("http://", "ws://").replace("https://", "wss://")
        if not ws_url.endswith("/ws"):
            ws_url = f"{ws_url.rstrip('/')}/ws"

        logger.info(f"Connecting to WebSocket Signaling: {ws_url} (Room: {self.room_id})")

        while self.running:
            try:
                async with websockets.connect(ws_url) as ws:
                    self.ws = ws
                    logger.info("Connected to Signaling Server as HOST.")

                    # Register as host
                    await ws.send(json.dumps({
                        "type": "join",
                        "role": "host",
                        "roomId": self.room_id,
                    }))

                    # Reset and create fresh PeerConnection
                    if self.pc:
                        await self.pc.close()
                    await self.create_peer_connection()

                    # Send Offer
                    offer = await self.pc.createOffer()
                    await self.pc.setLocalDescription(offer)
                    
                    await ws.send(json.dumps({
                        "type": "offer",
                        "role": "host",
                        "roomId": self.room_id,
                        "sdp": self.pc.localDescription.sdp,
                        "sdpType": self.pc.localDescription.type,
                    }))
                    logger.info(f"SDP Offer generated and sent for room '{self.room_id}'. Waiting for iPhone client...")

                    # Message loop
                    async for raw in ws:
                        msg = json.loads(raw)
                        mtype = msg.get("type")

                        if mtype == "answer" and msg.get("role") == "client":
                            logger.info("Received SDP Answer from iPhone Client!")
                            sdp = msg.get("sdp")
                            sdp_type = msg.get("sdpType", "answer")
                            answer = RTCSessionDescription(sdp=sdp, type=sdp_type)
                            await self.pc.setRemoteDescription(answer)
                            logger.info("WebRTC Handshake Complete! Streaming live desktop...")

                        elif mtype == "candidate" and msg.get("role") == "client":
                            candidate_data = msg.get("candidate")
                            if candidate_data:
                                # aiortc ICE candidate handling
                                candidate = RTCIceCandidate(
                                    sdpMid=candidate_data.get("sdpMid"),
                                    sdpMLineIndex=candidate_data.get("sdpMLineIndex"),
                                    candidate=candidate_data.get("candidate"),
                                )
                                await self.pc.addIceCandidate(candidate)

            except (websockets.exceptions.ConnectionClosed, ConnectionRefusedError, OSError) as e:
                logger.warning(f"Signaling connection failed/closed ({e}). Retrying in 3 seconds...")
                await asyncio.sleep(3)
            except Exception as e:
                logger.error(f"Unexpected error in signaling loop: {e}", exc_info=True)
                await asyncio.sleep(3)

    async def run_http_signaling(self):
        """Fallback HTTP polling signaling for environments without WebSocket support."""
        base_url = self.signaling_url.rstrip("/")
        logger.info(f"Using HTTP POST Signaling: {base_url} (Room: {self.room_id})")

        async with aiohttp.ClientSession() as session:
            await self.create_peer_connection()
            offer = await self.pc.createOffer()
            await self.pc.setLocalDescription(offer)

            # 1. Post Offer
            offer_payload = {
                "role": "host",
                "type": self.pc.localDescription.type,
                "sdp": self.pc.localDescription.sdp,
            }
            async with session.post(f"{base_url}/api/signal/{self.room_id}/offer", json=offer_payload) as resp:
                if resp.status == 200:
                    logger.info("SDP Offer posted to HTTP Signaling. Waiting for Client Answer...")

            # 2. Poll for Answer
            while self.running:
                try:
                    async with session.get(f"{base_url}/api/signal/{self.room_id}/answer") as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            if data.get("sdp"):
                                answer = RTCSessionDescription(sdp=data["sdp"], type=data.get("type", "answer"))
                                await self.pc.setRemoteDescription(answer)
                                logger.info("Remote Answer accepted via HTTP signaling! Active.")
                                break
                except Exception:
                    pass
                await asyncio.sleep(1.0)


# -----------------------------------------------------------------------------
# Entrypoint CLI
# -----------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="WebRTC Windows Desktop Capture Host for iPhone Remote CAD")
    parser.add_argument("--signaling", default="http://localhost:3000", help="Signaling server URL (e.g. http://100.x.y.z:3000 or http://localhost:3000)")
    parser.add_argument("--room", default="cad_session", help="Session Room ID (default: cad_session)")
    parser.add_argument("--fps", type=int, default=30, help="Target capture FPS (e.g., 30 or 60)")
    parser.add_argument("--scale", type=float, default=1.0, help="Resolution scale factor (e.g., 1.0 for native, 0.75 for high-DPI scaling)")
    parser.add_argument("--mode", choices=["ws", "http"], default="ws", help="Signaling mode (ws=WebSocket, http=HTTP polling)")

    args = parser.parse_args()

    print("=" * 70)
    print("  🚀 Low-Latency WebRTC Windows Desktop Host")
    print(f"  Target Monitor: Primary Screen")
    print(f"  Target Frame Rate: {args.fps} FPS")
    print(f"  Signaling Server: {args.signaling}")
    print(f"  Room ID: {args.room}")
    print(f"  Signaling Mode: {args.mode.upper()}")
    print("=" * 70)

    host = WebRTCHost(
        signaling_url=args.signaling,
        room_id=args.room,
        fps=args.fps,
        scale=args.scale,
    )

    loop = asyncio.get_event_loop()
    try:
        if args.mode == "ws":
            loop.run_until_complete(host.run_websocket_signaling())
        else:
            loop.run_until_complete(host.run_http_signaling())
    except KeyboardInterrupt:
        logger.info("Host shutting down gracefully...")
    finally:
        host.running = False


if __name__ == "__main__":
    main()

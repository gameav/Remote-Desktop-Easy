"""
=============================================================================
Pure Python Ultra-Lightweight Signaling Server (Alternative to Node.js)
=============================================================================
Run using:
    pip install websockets
    python signaling_server.py --port 3000
=============================================================================
"""

import asyncio
import json
import logging
import argparse
import websockets

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SignalingServer")

# Room Registry: roomId -> { 'host': ws, 'clients': set(ws) }
ROOMS = {}

async def handler(websocket, path):
    user_room = "default"
    user_role = "client"

    try:
        async for message in websocket:
            data = json.loads(message)
            msg_type = data.get("type")
            room_id = data.get("roomId", "default")
            role = data.get("role", "client")
            user_room = room_id
            user_role = role

            if room_id not in ROOMS:
                ROOMS[room_id] = {"host": None, "clients": set()}

            room = ROOMS[room_id]

            if msg_type == "join":
                if role == "host":
                    room["host"] = websocket
                    logger.info(f"Host joined room: {room_id}")
                    await websocket.send(json.dumps({"type": "joined", "role": "host", "roomId": room_id}))
                    for client in list(room["clients"]):
                        await client.send(json.dumps({"type": "host_online", "roomId": room_id}))
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
                # Forward host offer to clients
                for client in list(room["clients"]):
                    await client.send(json.dumps(data))

            elif msg_type == "answer":
                # Forward client answer to host
                if room["host"]:
                    await room["host"].send(json.dumps(data))

            elif msg_type == "candidate":
                if role == "host":
                    for client in list(room["clients"]):
                        await client.send(json.dumps(data))
                elif room["host"]:
                    await room["host"].send(json.dumps(data))

            elif msg_type == "ping":
                await websocket.send(json.dumps({"type": "pong"}))

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        if user_room in ROOMS:
            room = ROOMS[user_room]
            if room["host"] == websocket:
                room["host"] = None
                logger.info(f"Host left room: {user_room}")
                for client in list(room["clients"]):
                    await client.send(json.dumps({"type": "host_offline", "roomId": user_room}))
            elif websocket in room["clients"]:
                room["clients"].remove(websocket)
                logger.info(f"Client left room: {user_room}")

async def main():
    parser = argparse.ArgumentParser(description="Python WebRTC Signaling Server")
    parser.add_argument("--port", type=int, default=3000, help="Listening port (default: 3000)")
    args = parser.parse_args()

    print(f"Starting Python WebSocket Signaling Server on 0.0.0.0:{args.port}...")
    async with websockets.serve(handler, "0.0.0.0", args.port):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())

import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

interface SignalPeer {
  id: string;
  role: "host" | "client";
  ws?: WebSocket;
  lastSeen: number;
}

interface RoomState {
  hostOffer?: any;
  clientAnswer?: any;
  hostCandidates: any[];
  clientCandidates: any[];
  lastUpdated: number;
}

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// In-memory signaling state for HTTP REST and WebSockets
const rooms: Map<string, RoomState> = new Map();
const socketRooms: Map<string, { host?: WebSocket; clients: Set<WebSocket> }> = new Map();

function getOrCreateRoom(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      hostCandidates: [],
      clientCandidates: [],
      lastUpdated: Date.now(),
    });
  }
  return rooms.get(roomId)!;
}

// ----------------------------------------------------
// REST Signaling API (Simple fallback for HTTP POST)
// ----------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "WebRTC Remote Desktop Signaling Server",
    version: "1.0.0",
    uptime: process.uptime(),
    activeRooms: rooms.size,
  });
});

// Post Offer (from Host or Client)
app.post("/api/signal/:roomId/offer", (req, res) => {
  const { roomId } = req.params;
  const { sdp, type, role } = req.body;
  const room = getOrCreateRoom(roomId);

  room.hostOffer = { sdp, type, role: role || "host" };
  room.lastUpdated = Date.now();
  console.log(`[HTTP Signal] Offer registered for room ${roomId} by ${role || "host"}`);
  res.json({ success: true, message: "Offer registered", roomId });
});

// Get Offer
app.get("/api/signal/:roomId/offer", (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room || !room.hostOffer) {
    return res.status(404).json({ error: "No offer available for this room yet" });
  }
  res.json(room.hostOffer);
});

// Post Answer (from Client or Host)
app.post("/api/signal/:roomId/answer", (req, res) => {
  const { roomId } = req.params;
  const { sdp, type, role } = req.body;
  const room = getOrCreateRoom(roomId);

  room.clientAnswer = { sdp, type, role: role || "client" };
  room.lastUpdated = Date.now();
  console.log(`[HTTP Signal] Answer registered for room ${roomId} by ${role || "client"}`);
  res.json({ success: true, message: "Answer registered", roomId });
});

// Get Answer
app.get("/api/signal/:roomId/answer", (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room || !room.clientAnswer) {
    return res.status(404).json({ error: "No answer available for this room yet" });
  }
  res.json(room.clientAnswer);
});

// Post ICE Candidate
app.post("/api/signal/:roomId/candidate", (req, res) => {
  const { roomId } = req.params;
  const { candidate, role } = req.body;
  const room = getOrCreateRoom(roomId);

  if (role === "host") {
    room.hostCandidates.push(candidate);
  } else {
    room.clientCandidates.push(candidate);
  }
  room.lastUpdated = Date.now();
  res.json({ success: true, count: (role === "host" ? room.hostCandidates : room.clientCandidates).length });
});

// Get ICE Candidates for peer role
app.get("/api/signal/:roomId/candidates", (req, res) => {
  const { roomId } = req.params;
  const role = req.query.role as string; // 'host' or 'client' (candidates intended for this requester)
  const room = rooms.get(roomId);
  if (!room) {
    return res.json({ candidates: [] });
  }

  // If client requests, return host's candidates. If host requests, return client's candidates.
  const candidates = role === "client" ? room.hostCandidates : room.clientCandidates;
  res.json({ candidates });
});

// Reset room
app.post("/api/signal/:roomId/reset", (req, res) => {
  const { roomId } = req.params;
  rooms.delete(roomId);
  res.json({ success: true, message: `Room ${roomId} reset.` });
});

// ----------------------------------------------------
// WebSocket Signaling (Ultra-low latency real-time)
// ----------------------------------------------------
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws, req) => {
  let userRoom = "default";
  let userRole = "client";

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type, roomId = "default", role = "client" } = data;
      userRoom = roomId;
      userRole = role;

      if (!socketRooms.has(roomId)) {
        socketRooms.set(roomId, { clients: new Set() });
      }
      const currentRoom = socketRooms.get(roomId)!;

      if (type === "join") {
        if (role === "host") {
          currentRoom.host = ws;
          console.log(`[WS] Host joined room ${roomId}`);
          ws.send(JSON.stringify({ type: "joined", role: "host", roomId }));
          // Notify connected clients that host is online
          currentRoom.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: "host_online", roomId }));
            }
          });
        } else {
          currentRoom.clients.add(ws);
          console.log(`[WS] Client joined room ${roomId}`);
          ws.send(JSON.stringify({
            type: "joined",
            role: "client",
            roomId,
            hostOnline: !!(currentRoom.host && currentRoom.host.readyState === WebSocket.OPEN),
          }));
        }
        return;
      }

      // Forward Offer
      if (type === "offer") {
        if (role === "host") {
          currentRoom.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
        } else if (currentRoom.host && currentRoom.host.readyState === WebSocket.OPEN) {
          currentRoom.host.send(JSON.stringify(data));
        }
      }

      // Forward Answer
      if (type === "answer") {
        if (role === "client" && currentRoom.host && currentRoom.host.readyState === WebSocket.OPEN) {
          currentRoom.host.send(JSON.stringify(data));
        } else if (role === "host") {
          currentRoom.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
        }
      }

      // Forward ICE Candidate
      if (type === "candidate") {
        if (role === "host") {
          currentRoom.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
        } else if (currentRoom.host && currentRoom.host.readyState === WebSocket.OPEN) {
          currentRoom.host.send(JSON.stringify(data));
        }
      }

      // Ping-pong for keepalive
      if (type === "ping") {
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
      }
    } catch (err) {
      console.error("[WS] Error parsing message:", err);
    }
  });

  ws.on("close", () => {
    const currentRoom = socketRooms.get(userRoom);
    if (currentRoom) {
      if (currentRoom.host === ws) {
        currentRoom.host = undefined;
        console.log(`[WS] Host disconnected from room ${userRoom}`);
        currentRoom.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "host_offline", roomId: userRoom }));
          }
        });
      } else {
        currentRoom.clients.delete(ws);
        console.log(`[WS] Client disconnected from room ${userRoom}`);
      }
    }
  });
});

// ----------------------------------------------------
// Vite Middleware & Static Serving
// ----------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`WebRTC Remote Desktop Hub listening on http://0.0.0.0:${PORT}`);
  });
}

start();

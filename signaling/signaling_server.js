/**
 * Ultra-Lightweight Node.js WebSocket & REST Signaling Server
 * Coordinates SDP Offers, Answers, and ICE Candidates between
 * Windows Host Streamer and iPhone Safari/Chrome Client.
 *
 * Usage:
 *   node signaling_server.js [PORT]
 */

const http = require('http');
const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || process.argv[2] || 3000;

app.use(express.json({ limit: '10mb' }));

// Enable CORS so iPhone web client can connect from any network interface
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve client directory statically for convenience
app.use(express.static(path.join(__dirname, '../client')));

// In-Memory signaling room store
const rooms = new Map();
const socketRooms = new Map();

function getRoom(id) {
  if (!rooms.has(id)) {
    rooms.set(id, { hostOffer: null, clientAnswer: null, hostCandidates: [], clientCandidates: [] });
  }
  return rooms.get(id);
}

// REST Signaling Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), activeRooms: rooms.size });
});

app.post('/api/signal/:roomId/offer', (req, res) => {
  const room = getRoom(req.params.roomId);
  room.hostOffer = req.body;
  res.json({ success: true, message: 'Offer stored' });
});

app.get('/api/signal/:roomId/offer', (req, res) => {
  const room = getRoom(req.params.roomId);
  if (!room.hostOffer) return res.status(404).json({ error: 'No offer available' });
  res.json(room.hostOffer);
});

app.post('/api/signal/:roomId/answer', (req, res) => {
  const room = getRoom(req.params.roomId);
  room.clientAnswer = req.body;
  res.json({ success: true, message: 'Answer stored' });
});

app.get('/api/signal/:roomId/answer', (req, res) => {
  const room = getRoom(req.params.roomId);
  if (!room.clientAnswer) return res.status(404).json({ error: 'No answer available' });
  res.json(room.clientAnswer);
});

// WebSocket Signaling Server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  let joinedRoom = 'default';
  let clientRole = 'client';

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type, roomId = 'default', role = 'client' } = data;
      joinedRoom = roomId;
      clientRole = role;

      if (!socketRooms.has(roomId)) {
        socketRooms.set(roomId, { host: null, clients: new Set() });
      }
      const room = socketRooms.get(roomId);

      if (type === 'join') {
        if (role === 'host') {
          room.host = ws;
          console.log(`[Host Connected] Room: ${roomId}`);
          ws.send(JSON.stringify({ type: 'joined', role: 'host', roomId }));
          room.clients.forEach((c) => {
            if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify({ type: 'host_online' }));
          });
        } else {
          room.clients.add(ws);
          console.log(`[Client Connected] Room: ${roomId}`);
          ws.send(JSON.stringify({
            type: 'joined',
            role: 'client',
            roomId,
            hostOnline: !!(room.host && room.host.readyState === WebSocket.OPEN),
          }));
        }
        return;
      }

      // Relays
      if (type === 'offer') {
        room.clients.forEach((c) => {
          if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify(data));
        });
      } else if (type === 'answer' && room.host && room.host.readyState === WebSocket.OPEN) {
        room.host.send(JSON.stringify(data));
      } else if (type === 'candidate') {
        if (role === 'host') {
          room.clients.forEach((c) => {
            if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify(data));
          });
        } else if (room.host && room.host.readyState === WebSocket.OPEN) {
          room.host.send(JSON.stringify(data));
        }
      }
    } catch (err) {
      console.error('[Signaling Error]', err.message);
    }
  });

  ws.on('close', () => {
    const room = socketRooms.get(joinedRoom);
    if (!room) return;
    if (room.host === ws) {
      room.host = null;
      console.log(`[Host Disconnected] Room: ${joinedRoom}`);
      room.clients.forEach((c) => {
        if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify({ type: 'host_offline' }));
      });
    } else {
      room.clients.delete(ws);
      console.log(`[Client Disconnected] Room: ${joinedRoom}`);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  WebRTC Signaling Server Active`);
  console.log(`  Local HTTP / WS: http://localhost:${PORT}`);
  console.log(`  WebSocket Endpoint: ws://localhost:${PORT}/ws`);
  console.log(`=======================================================`);
});

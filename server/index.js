import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GameState } from './game-state.js';
import { WebSocketHandler } from './websocket-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files from public directory
app.use(express.static(join(__dirname, '..', 'public')));

// Initialize game state
const gameState = new GameState();

// Initialize WebSocket handler
const wsHandler = new WebSocketHandler(wss, gameState);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', connections: wsHandler.getConnectionCount() });
});

// Game state endpoint (for debugging)
app.get('/api/state', (req, res) => {
  res.json(gameState.getFullState());
});

// Reset game endpoint
app.post('/api/reset', (req, res) => {
  gameState.reset();
  wsHandler.broadcast({ type: 'GAME_RESET' });
  res.json({ status: 'reset' });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║     Tomtens Försvunna Minnen - Game Server Started        ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Server running at: http://localhost:${PORT}                 ║
║                                                           ║
║  Open in browser:                                         ║
║    - TV Display:     http://localhost:${PORT}?mode=tv        ║
║    - Tablet Control: http://localhost:${PORT}?mode=tablet    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export { app, server, wss, gameState };

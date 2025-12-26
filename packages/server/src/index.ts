import 'dotenv/config';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import socketio from 'fastify-socket.io';
import { authRoutes } from './routes/auth.js';
import { sessionRoutes } from './routes/sessions.js';
import { friendRoutes } from './routes/friends.js';
import { notificationRoutes } from './routes/notifications.js';
import { setupSocketHandlers } from './sockets/chat.js';
import { setSocketIO } from './sockets/socketManager.js';
import { startSessionCleanup } from './services/sessionCleanup.js';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Register plugins
await fastify.register(cookie);
await fastify.register(cors, {
  origin: [
    process.env.LANDING_URL || 'http://localhost:4321',
    process.env.APP_URL || 'http://localhost:5173',
  ],
  credentials: true,
});

// Register Socket.io
await fastify.register(socketio, {
  cors: {
    origin: [
      process.env.LANDING_URL || 'http://localhost:4321',
      process.env.APP_URL || 'http://localhost:5173',
    ],
    credentials: true,
  },
});

// Register routes
await fastify.register(authRoutes);
await fastify.register(sessionRoutes);
await fastify.register(friendRoutes);
await fastify.register(notificationRoutes);

// Health check endpoint
fastify.get('/health', async () => {
  console.log('[TEST] Health check endpoint hit at:', new Date().toISOString());
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    // Setup Socket.io handlers and store instance for route access
    const io = (fastify as any).io;
    setupSocketHandlers(io);
    setSocketIO(io);

    // Start session cleanup cron job
    startSessionCleanup();

    console.log(`\nFellowsip Server running on http://localhost:${port}`);
    console.log(`Socket.io ready for connections`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

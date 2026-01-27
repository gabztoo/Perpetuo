import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './modules/auth/routes';
import { workspaceRoutes } from './modules/workspaces/routes';
import { providerRoutes } from './modules/providers/routes';
import { apiKeyRoutes } from './modules/gateway/api-keys';
import { gatewayRoutes } from './modules/gateway/routes';
import { logsRoutes } from './modules/logs/routes';
import { usageRoutes } from './modules/usage/routes';

const PORT = parseInt(process.env.PORT || '3000');
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Fastify
const app = fastify({
  logger: NODE_ENV === 'development',
  disableRequestLogging: NODE_ENV === 'production',
  requestIdHeader: 'x-request-id',
});

// Register plugins
app.register(cors, {
  origin: FRONTEND_URL.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

app.register(jwt, {
  secret: JWT_SECRET,
  sign: {
    expiresIn: '30d',
  },
});

// Health check
app.get('/health', async (request, reply) => {
  return reply.send({
    status: 'ok',
    service: 'perpetuo-backend',
    timestamp: new Date().toISOString(),
  });
});

// Register routes
// No auth required
await app.register((app) => authRoutes(app, prisma));
await app.register((app) => gatewayRoutes(app, prisma));

// Auth required (SaaS API)
await app.register((app) => workspaceRoutes(app, prisma));
await app.register((app) => providerRoutes(app, prisma));
await app.register((app) => apiKeyRoutes(app, prisma));
await app.register((app) => logsRoutes(app, prisma));
await app.register((app) => usageRoutes(app, prisma));

// Start server
async function start() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected');

    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`
╔════════════════════════════════════════════╗
║     🚀 PERPETUO BACKEND STARTED 🚀         ║
╠════════════════════════════════════════════╣
║ Environment: ${NODE_ENV.padEnd(30)} ║
║ Port: ${String(PORT).padEnd(38)} ║
║ Gateway: POST /v1/chat/completions       ║
║ Dashboard: http://localhost:${String(3001).padEnd(28)} ║
╚════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
});

// Start
start();

export default app;

import fastify from 'fastify';
import { register } from '@perpetuo/observability';
import { chatRoutes } from './routes/chat';
import { adminRoutes } from './routes/admin';
import { logger } from '@perpetuo/observability';
import { loadConfig } from './config';
import { RedisCache, QuotaManager, ResilienceManager } from '@perpetuo/cache';
import { AuthMiddleware } from './middleware/auth';
import { EventManager } from '@perpetuo/events'; // Ensure this line exists and is clean

const config = loadConfig();

// Services
const redis = new RedisCache(process.env.REDIS_URL || 'redis://localhost:6379');
const quotaManager = new QuotaManager(redis);
const resilienceManager = new ResilienceManager(redis);
const authMiddleware = new AuthMiddleware(config);
const eventManager = new EventManager(); // Default sinks based on ENV

const app = fastify({
    logger: logger as any, // Cast to any to avoid Fastify/Pino version type mismatch
    requestIdHeader: 'x-request-id',
    disableRequestLogging: true // We log manually
});

// Middleware for metrics
app.get('/metrics', async (req, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
});

app.get('/healthz', async () => 'OK');

// Routes
app.register(chatRoutes, { authMiddleware, quotaManager, eventManager, resilienceManager });
app.register(adminRoutes, { authMiddleware, resilienceManager });

export { app };

if (require.main === module) {
    app.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server listening at ${address}`);
    });
}

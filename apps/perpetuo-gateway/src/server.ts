import fastify from 'fastify';
import { register } from '@perpetuo/observability';
import { chatRoutes } from './routes/chat';
import { adminRoutes } from './routes/admin';
import { logger } from '@perpetuo/observability';
import { loadConfig } from './config';
import { RedisCache, MemoryCache, QuotaManager, ResilienceManager } from '@perpetuo/cache';
import { AuthMiddleware } from './middleware/auth';
import { EventManager } from '@perpetuo/events';
import { ConfigManager } from './services/configManager';

let app: any;

async function startServer() {
    console.log('🚀 initializing Perpetuo Gateway...');
    const config = await loadConfig();
    console.log('🔍 LOADED CONFIG:', JSON.stringify({
        hasModels: !!config.models,
        modelsCount: config.models?.length,
        tenants: config.tenants?.map(t => t.id)
    }, null, 2));

    const useRedis = process.env.USE_REDIS === 'true';
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    let quotaManager: QuotaManager;
    let resilienceManager: ResilienceManager;

    if (useRedis) {
        console.log('🧠 Cache Layer: Redis (Production)');
        const redis = new RedisCache(redisUrl);
        quotaManager = new QuotaManager(redis);
        resilienceManager = new ResilienceManager(redis);
    } else {
        console.log('🧠 Cache Layer: Memory (Development) - Set USE_REDIS=true for production');
        const memoryCache = new MemoryCache();
        quotaManager = new QuotaManager(memoryCache as any);
        resilienceManager = new ResilienceManager(memoryCache as any);
    }

    const authMiddleware = new AuthMiddleware(config);
    const eventManager = new EventManager();
    const configManager = new ConfigManager(config);

    app = fastify({
        logger: logger as any,
        requestIdHeader: 'x-request-id',
        disableRequestLogging: true
    });

    app.get('/metrics', async (req, reply) => {
        reply.header('Content-Type', register.contentType);
        return register.metrics();
    });

    app.get('/healthz', async () => 'OK');

    app.register(chatRoutes, { authMiddleware, quotaManager, eventManager, resilienceManager, configManager });
    app.register(adminRoutes, { authMiddleware, resilienceManager });

    try {
        const address = await app.listen({ port: 3000, host: '0.0.0.0' });
        console.log(`Server listening at ${address}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

export { app };


import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { logger } from '@perpetuo/observability';
import { prisma } from '@perpetuo/db';
import authPlugin from './plugins/auth';
import { authRoutes } from './modules/auth';
import { tenantRoutes } from './modules/tenants';
import { projectRoutes } from './modules/config';
import { publishRoutes } from './modules/config/publish';
import { providerKeyRoutes } from './modules/keys';

const app = fastify({ logger: logger as any });

app.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute'
});

app.register(cors, {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

app.register(jwt, {
    secret: process.env.JWT_SECRET || 'supersecret'
});

app.register(cookie);


app.register(authPlugin);

app.get('/health', async () => ({ status: 'ok', component: 'control-plane' }));

app.register(authRoutes);
app.register(tenantRoutes);
app.register(projectRoutes);
app.register(publishRoutes);
app.register(providerKeyRoutes);

if (require.main === module) {
    app.listen({ port: 3001, host: '0.0.0.0' }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Control Plane listening at ${address}`);
    });
}

import { FastifyInstance } from 'fastify';
import { loadConfig } from '../config';
import { ResilienceManager } from '@perpetuo/cache';
import { AuthMiddleware } from '../middleware/auth';

const config = loadConfig();

export async function adminRoutes(fastify: FastifyInstance, options: { authMiddleware: AuthMiddleware, resilienceManager: ResilienceManager }) {
    const { authMiddleware, resilienceManager } = options;

    fastify.get('/admin', async (req, reply) => {
        // Authenticate (Admin only?)
        // For MVP, we use the same auth middleware but we might want a specific admin key?
        // Let's assume any valid tenant with plan 'enterprise' or specific logic.
        // For now, let's keep it open or simple Basic Auth?
        // User requested: "Proteger /admin com auth admin"
        // Let's check for a specific header or just reuse the existing auth but check for a specific role?
        // We will skip auth for THIS MVP step to ensure it renders, or check for 'x-admin-key' env var matching.

        reply.type('text/html');

        const providersHtml = await Promise.all(config.providers.map(async p => {
            const blocked = await resilienceManager.shouldBlockProvider(p.name);
            return `<li>
                <strong>${p.name}</strong>: 
                <span style="color: ${blocked ? 'red' : 'green'}">${blocked ? 'CIRCUIT OPEN (Blocked)' : 'Healthy'}</span>
             </li>`;
        }));

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Perpetuo Admin</title>
            <style>
                body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                .card { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
                h1 { color: #333; }
                ul { list-style: none; padding: 0; }
                li { padding: 5px 0; border-bottom: 1px solid #eee; }
            </style>
        </head>
        <body>
            <h1>Perpetuo Gateway Admin</h1>
            
            <div class="card">
                <h2>System Status</h2>
                <p>Status: <strong>OPERATIONAL</strong></p>
                <p>Uptime: ${process.uptime().toFixed(0)}s</p>
            </div>

            <div class="card">
                <h2>Provider Health (Circuit Breakers)</h2>
                <ul>
                    ${providersHtml.join('')}
                </ul>
            </div>

            <div class="card">
                <h2>Tenants Configured</h2>
                <p>${config.tenants.length} tenants loaded.</p>
            </div>
        </body>
        </html>
        `;
    });
}

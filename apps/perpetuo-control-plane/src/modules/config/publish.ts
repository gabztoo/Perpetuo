import { FastifyInstance } from 'fastify';
import { prisma } from '@perpetuo/db';

export async function publishRoutes(fastify: FastifyInstance) {
    // This is an INTERNAL API called by the Gateway.
    // It should be secured by an Admin Token or specific internal secret.
    // For MVP, checking a shared secret env var.

    fastify.addHook('onRequest', async (req, reply) => {
        const authHeader = req.headers['authorization'];
        // Gateway will send "Bearer <ADMIN_INTERNAL_TOKEN>"
        const internalToken = process.env.ADMIN_INTERNAL_TOKEN || 'dev-internal-secret';
        if (authHeader !== `Bearer ${internalToken}`) {
            // allow bypass if it's not the internal route? No, this plugin is for publish routes only.
            // However, if we put this hook on the plugin, we must ensure only publish routes are here.
            return reply.code(401).send({ error: 'Unauthorized Gateway Access' });
        }
    });

    fastify.get('/internal/config/:tenantId', async (req, reply) => {
        const { tenantId } = req.params as { tenantId: string };

        // 1. Fetch Tenant basic info (limits/plans could be here)
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                providers: { where: { status: 'ACTIVE' } }
            }
        });

        if (!tenant) return reply.code(404).send({ error: 'Tenant not found' });

        // 2. Fetch Projects -> Routes -> Policies
        const projects = await prisma.project.findMany({
            where: { tenantId },
            include: {
                routes: {
                    include: {
                        policy: {
                            include: { rules: { orderBy: { priority: 'asc' } } }
                        }
                    }
                }
            }
        });

        // 3. Assemble JSON config for Gateway
        // We map our DB structure to the simple JSON the Gateway expects/needs.
        // Or we pass the raw structure and let Gateway parse.
        // Let's optimize for Gateway:

        const routesConfig: any[] = [];
        const policiesConfig: any[] = [];

        for (const proj of projects) {
            for (const route of proj.routes) {
                // Flatten route key: "chatbot", "doc_qa", etc.
                // We add it to the list.
                routesConfig.push({
                    id: route.id,
                    key: route.key,
                    projectId: proj.id,
                    policyId: route.policy?.id
                });

                if (route.policy) {
                    policiesConfig.push({
                        id: route.policy.id,
                        mode: route.policy.mode,
                        rules: route.policy.rules.map(r => ({
                            match: r.matchJson,
                            action: r.actionJson
                        }))
                    });
                }
            }
        }

        const configPayload = {
            tenantId: tenant.id,
            planId: tenant.planId,
            // limits: ... (would come from Plan entity, hardcoded or json in Tenant)
            providers: tenant.providers.map(p => ({
                name: p.provider,
                ciphertext: p.keyCiphertext, // Gateway will decrypt
                // settings...
            })),
            routes: routesConfig,
            policies: policiesConfig
        };

        return configPayload;
    });
}

import { FastifyInstance } from 'fastify';
import { prisma } from '@perpetuo/db';
import { CreateProjectSchema, RouteSchema, UpdatePolicySchema } from '@perpetuo/shared';

export async function projectRoutes(fastify: FastifyInstance) {
    fastify.addHook('preValidation', fastify.authenticate);

    // --- Projects ---
    fastify.get('/projects', async (req, reply) => {
        const { tenantId } = req.query as { tenantId: string };
        if (!tenantId) return reply.code(400).send({ error: 'tenantId required' });
        // verify access (implied)

        return await prisma.project.findMany({ where: { tenantId } });
    });

    fastify.post('/projects', async (req, reply) => {
        const { tenantId } = req.query as { tenantId: string };
        const body = CreateProjectSchema.parse(req.body);

        const project = await prisma.project.create({
            data: {
                tenantId,
                name: body.name
            }
        });
        return project;
    });

    // --- Routes ---
    fastify.get('/projects/:projectId/routes', async (req, reply) => {
        const { projectId } = req.params as { projectId: string };
        return await prisma.route.findMany({
            where: { projectId },
            include: { policy: true }
        });
    });

    fastify.post('/projects/:projectId/routes', async (req, reply) => {
        const { projectId } = req.params as { projectId: string };
        const body = RouteSchema.parse(req.body);

        const route = await prisma.route.create({
            data: {
                projectId,
                key: body.key,
                displayName: body.displayName
            }
        });
        return route;
    });

    // --- Policy ---
    fastify.put('/routes/:routeId/policy', async (req, reply) => {
        const { routeId } = req.params as { routeId: string };
        const body = UpdatePolicySchema.parse(req.body);

        // Transaction to update policy and rules
        const updatedPolicy = await prisma.$transaction(async (tx) => {
            // Upsert policy
            const policy = await tx.policy.upsert({
                where: { routeId },
                create: { routeId, mode: body.mode },
                update: { mode: body.mode }
            });

            // Delete old rules
            await tx.policyRule.deleteMany({ where: { policyId: policy.id } });

            // Insert new rules
            if (body.rules && body.rules.length > 0) {
                await tx.policyRule.createMany({
                    data: body.rules.map(r => ({
                        policyId: policy.id,
                        priority: r.priority,
                        matchJson: r.matchJson,
                        actionJson: r.actionJson
                    }))
                });
            }

            return policy;
        });

        return updatedPolicy;
    });
}

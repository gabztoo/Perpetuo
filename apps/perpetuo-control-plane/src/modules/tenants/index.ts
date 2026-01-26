import { FastifyInstance } from 'fastify';
import { prisma } from '@perpetuo/db';
import { z } from 'zod';

export async function tenantRoutes(fastify: FastifyInstance) {
    fastify.addHook('preValidation', fastify.authenticate);

    fastify.get('/tenants/current', async (req, reply) => {
        const user = req.user as any;
        // In a real app we might verify "current" tenant from header x-tenant-id matches user access
        // For MVP, just list all tenants the user belongs to
        const tenants = await prisma.tenantUser.findMany({
            where: { userId: user.id },
            include: { tenant: true }
        });
        return tenants;
    });

    fastify.get('/users', async (req, reply) => {
        // Assume context: tenantId from header or query
        const { tenantId } = req.query as { tenantId: string };
        if (!tenantId) return reply.code(400).send({ error: 'tenantId required' });

        const user = req.user as any;
        // Check access
        const membership = await prisma.tenantUser.findUnique({
            where: { tenantId_userId: { tenantId, userId: user.id } }
        });

        if (!membership) return reply.code(403).send({ error: 'Access denied' });

        const users = await prisma.tenantUser.findMany({
            where: { tenantId },
            include: { user: { select: { id: true, name: true, email: true } } }
        });
        return users;
    });
}

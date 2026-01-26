import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@perpetuo/db';
import { CreateUserSchema, LoginSchema } from '@perpetuo/shared';

export async function authRoutes(fastify: FastifyInstance) {

    fastify.post('/auth/signup', async (req, reply) => {
        const { email, password, name } = CreateUserSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return reply.code(409).send({ error: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Create User and Default Tenant
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: { email, name, passwordHash }
            });

            const tenant = await tx.tenant.create({
                data: {
                    name: `${name}'s Workspace`,
                    slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + user.id.slice(0, 4),
                }
            });

            await tx.tenantUser.create({
                data: {
                    userId: user.id,
                    tenantId: tenant.id,
                    role: 'OWNER'
                }
            });

            return { user, tenant };
        });

        const token = fastify.jwt.sign({ id: result.user.id, email: result.user.email });

        // Set cookie
        reply.setCookie('token', token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return { user: { id: result.user.id, email: result.user.email, name: result.user.name }, tenant: result.tenant };
    });

    fastify.post('/auth/login', {
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '1 minute'
            }
        }
    }, async (req, reply) => {
        const { email, password } = LoginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            return reply.code(401).send({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return reply.code(401).send({ error: 'Invalid credentials' });
        }

        const token = fastify.jwt.sign({ id: user.id, email: user.email });

        reply.setCookie('token', token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7
        });

        return { status: 'ok', user: { id: user.id, email: user.email, name: user.name } };
    });

    fastify.post('/auth/logout', async (req, reply) => {
        reply.clearCookie('token');
        return { status: 'ok' };
    });

    fastify.get('/me', { preValidation: [fastify.authenticate] }, async (req, reply) => {
        const user = req.user!;
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { tenants: { include: { tenant: true } } }
        });
        return dbUser;
    });
}

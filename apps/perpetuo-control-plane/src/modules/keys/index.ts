import { FastifyInstance } from 'fastify';
import { prisma } from '@perpetuo/db';
import crypto from 'crypto';
import { z } from 'zod';

const CreateKeySchema = z.object({
    provider: z.string(),
    name: z.string(),
    key: z.string()
});

export async function providerKeyRoutes(fastify: FastifyInstance) {
    fastify.addHook('preValidation', fastify.authenticate);

    // Encryption (AES-256-GCM)
    const algorithm = 'aes-256-gcm';
    const masterKey = Buffer.from(process.env.PERPETUO_KMS_MASTER_KEY || 'dev-master-key-32-bytes-long-string!!', 'utf-8');

    function encrypt(text: string) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(algorithm, masterKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return iv.toString('hex') + ':' + authTag + ':' + encrypted;
    }

    fastify.get('/provider-keys', async (req, reply) => {
        const { tenantId } = req.query as { tenantId: string };
        if (!tenantId) return reply.code(400).send({ error: 'tenantId required' });

        return await prisma.providerKey.findMany({
            where: { tenantId },
            select: {
                id: true,
                provider: true,
                name: true,
                status: true,
                keyLast4: true,
                createdAt: true,
                rotatedAt: true
            }
        });
    });

    fastify.post('/provider-keys', async (req, reply) => {
        const { tenantId } = req.query as { tenantId: string };
        const body = CreateKeySchema.parse(req.body);

        const encrypted = encrypt(body.key);
        const last4 = body.key.slice(-4);

        const key = await prisma.providerKey.create({
            data: {
                tenantId,
                provider: body.provider,
                name: body.name,
                keyCiphertext: encrypted,
                keyLast4: last4,
                status: 'ACTIVE'
            }
        });

        return { id: key.id, status: 'created', provider: key.provider, last4: key.keyLast4 };
    });
}

import { FastifyReply, FastifyRequest } from 'fastify';
import { APIResponse } from './types';

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  status: number = 200
) {
  return reply.status(status).send({
    success: true,
    data,
  } as APIResponse<T>);
}

export function sendError(
  reply: FastifyReply,
  error: string,
  status: number = 400
) {
  return reply.status(status).send({
    success: false,
    error,
  } as APIResponse);
}

// Middleware para validação de JWT (SaaS API)
export function createJWTSchema(jwtSecret: string) {
  return {
    async onRequest(request: FastifyRequest, reply: FastifyReply) {
      try {
        // Skip health check
        if (request.url === '/health') return;

        // Skip auth routes
        if (request.url.startsWith('/auth/')) return;

        // Skip gateway /v1 routes (uses API key auth instead)
        if (request.url.startsWith('/v1/')) return;

        await request.jwtVerify();
      } catch (err) {
        return reply
          .status(401)
          .send({ success: false, error: 'Unauthorized' });
      }
    },
  };
}

// Middleware para autenticação por API Key (Gateway)
export async function validateAPIKey(
  key: string,
  prisma: any
): Promise<{ workspace_id: string } | null> {
  const apiKey = await prisma.aPIKey.findUnique({
    where: { key },
    include: { workspace: true },
  });

  if (!apiKey || !apiKey.active || apiKey.revoked_at) {
    return null;
  }

  // Update last_used
  await prisma.aPIKey.update({
    where: { id: apiKey.id },
    data: { last_used: new Date() },
  });

  return { workspace_id: apiKey.workspace_id };
}

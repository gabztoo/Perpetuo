import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../shared/http';
import { generateAPIKey, hashAPIKey } from '../shared/crypto';

const CreateAPIKeySchema = z.object({
  name: z.string().min(1),
});

export async function apiKeyRoutes(app: FastifyInstance, prisma: PrismaClient) {
  // List API keys for workspace
  app.get<{ Params: { workspaceId: string } }>(
    '/workspaces/:workspaceId/api-keys',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const workspace = await prisma.workspace.findUnique({
          where: { id: request.params.workspaceId },
        });

        if (!workspace || workspace.user_id !== request.user.sub) {
          return sendError(reply, 'Workspace not found', 404);
        }

        const keys = await prisma.aPIKey.findMany({
          where: { workspace_id: request.params.workspaceId },
          select: {
            id: true,
            name: true,
            key_hash: true, // Do NOT expose the key itself, only hash
            active: true,
            last_used: true,
            created_at: true,
            revoked_at: true,
          },
        });

        return sendSuccess(reply, keys);
      } catch (error) {
        return sendError(reply, 'Unauthorized', 401);
      }
    }
  );

  // Create API key
  app.post<{
    Params: { workspaceId: string };
    Body: z.infer<typeof CreateAPIKeySchema>;
  }>(
    '/workspaces/:workspaceId/api-keys',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const body = CreateAPIKeySchema.parse(request.body);

        const workspace = await prisma.workspace.findUnique({
          where: { id: request.params.workspaceId },
        });

        if (!workspace || workspace.user_id !== request.user.sub) {
          return sendError(reply, 'Workspace not found', 404);
        }

        // Generate the key
        const plainKey = generateAPIKey();
        const keyHash = hashAPIKey(plainKey);

        const apiKey = await prisma.aPIKey.create({
          data: {
            workspace_id: request.params.workspaceId,
            user_id: request.user.sub,
            key_hash: keyHash,
            name: body.name,
          },
          select: {
            id: true,
            name: true,
            active: true,
            created_at: true,
          },
        });

        // Return the plain key ONLY on creation (never stored as plaintext)
        return sendSuccess(reply, {
          ...apiKey,
          key: plainKey, // Show only once!
          warning: 'Save this key immediately. You will not see it again.',
        }, 201);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendError(reply, 'Invalid input', 400);
        }
        return sendError(reply, 'Failed to create API key', 500);
      }
    }
  );

  // Revoke API key
  app.post<{ Params: { workspaceId: string; keyId: string } }>(
    '/workspaces/:workspaceId/api-keys/:keyId/revoke',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const workspace = await prisma.workspace.findUnique({
          where: { id: request.params.workspaceId },
        });

        if (!workspace || workspace.user_id !== request.user.sub) {
          return sendError(reply, 'Workspace not found', 404);
        }

        const key = await prisma.aPIKey.findUnique({
          where: { id: request.params.keyId },
        });

        if (!key || key.workspace_id !== request.params.workspaceId) {
          return sendError(reply, 'API key not found', 404);
        }

        const updated = await prisma.aPIKey.update({
          where: { id: request.params.keyId },
          data: { revoked_at: new Date(), active: false },
          select: {
            id: true,
            name: true,
            active: true,
            revoked_at: true,
          },
        });

        return sendSuccess(reply, updated);
      } catch (error) {
        return sendError(reply, 'Failed to revoke API key', 500);
      }
    }
  );

  // Delete API key
  app.delete<{ Params: { workspaceId: string; keyId: string } }>(
    '/workspaces/:workspaceId/api-keys/:keyId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const workspace = await prisma.workspace.findUnique({
          where: { id: request.params.workspaceId },
        });

        if (!workspace || workspace.user_id !== request.user.sub) {
          return sendError(reply, 'Workspace not found', 404);
        }

        const key = await prisma.aPIKey.findUnique({
          where: { id: request.params.keyId },
        });

        if (!key || key.workspace_id !== request.params.workspaceId) {
          return sendError(reply, 'API key not found', 404);
        }

        await prisma.aPIKey.delete({
          where: { id: request.params.keyId },
        });

        return sendSuccess(reply, { deleted: true });
      } catch (error) {
        return sendError(reply, 'Failed to delete API key', 500);
      }
    }
  );
}

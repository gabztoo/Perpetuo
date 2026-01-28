import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../shared/http';
import { encryptKey, decryptKey } from '../../shared/crypto';
import { SUPPORTED_PROVIDERS } from '../../shared/types';

const AddProviderKeySchema = z.object({
  provider: z.enum([...SUPPORTED_PROVIDERS] as [string, ...string[]]),
  api_key: z.string().min(1),
  priority: z.number().int().min(1).default(1),
});

const UpdateProviderKeySchema = z.object({
  api_key: z.string().min(1).optional(),
  priority: z.number().int().min(1).optional(),
  enabled: z.boolean().optional(),
});

export async function providerRoutes(app: FastifyInstance, prisma: PrismaClient) {
  // List provider keys for workspace
  app.get<{ Params: { workspaceId: string } }>(
    '/workspaces/:workspaceId/providers',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        // Check ownership
        const workspace = await prisma.workspace.findUnique({
          where: { id: request.params.workspaceId },
        });

        if (!workspace || workspace.user_id !== request.user.sub) {
          return sendError(reply, 'Workspace not found', 404);
        }

        const keys = await prisma.providerKey.findMany({
          where: { workspace_id: request.params.workspaceId },
          select: {
            id: true,
            provider: true,
            priority: true,
            enabled: true,
            created_at: true,
            updated_at: true,
            // Don't return decrypted keys here
          },
        });

        return sendSuccess(reply, keys);
      } catch (error) {
        return sendError(reply, 'Unauthorized', 401);
      }
    }
  );

  // Add provider key
  app.post<{
    Params: { workspaceId: string };
    Body: z.infer<typeof AddProviderKeySchema>;
  }>(
    '/workspaces/:workspaceId/providers',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const body = AddProviderKeySchema.parse(request.body);

        // Check ownership
        const workspace = await prisma.workspace.findUnique({
          where: { id: request.params.workspaceId },
        });

        if (!workspace || workspace.user_id !== request.user.sub) {
          return sendError(reply, 'Workspace not found', 404);
        }

        // Check if provider already exists for this workspace
        const existing = await prisma.providerKey.findFirst({
          where: {
            workspace_id: request.params.workspaceId,
            provider: body.provider,
          },
        });

        if (existing) {
          return sendError(
            reply,
            `Provider ${body.provider} already configured for this workspace`,
            409
          );
        }

        const encryptedKey = encryptKey(body.api_key);
        const key = await prisma.providerKey.create({
          data: {
            workspace_id: request.params.workspaceId,
            user_id: request.user.sub,
            provider: body.provider,
            api_key: encryptedKey,
            priority: body.priority,
          },
          select: {
            id: true,
            provider: true,
            priority: true,
            enabled: true,
            created_at: true,
          },
        });

        return sendSuccess(reply, key, 201);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendError(reply, 'Invalid input', 400);
        }
        console.error('Add provider error:', error);
        return sendError(reply, 'Failed to add provider', 500);
      }
    }
  );

  // Update provider key
  app.put<{
    Params: { workspaceId: string; providerId: string };
    Body: z.infer<typeof UpdateProviderKeySchema>;
  }>(
    '/workspaces/:workspaceId/providers/:providerId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const body = UpdateProviderKeySchema.parse(request.body);

        // Check ownership
        const workspace = await prisma.workspace.findUnique({
          where: { id: request.params.workspaceId },
        });

        if (!workspace || workspace.user_id !== request.user.sub) {
          return sendError(reply, 'Workspace not found', 404);
        }

        const key = await prisma.providerKey.findUnique({
          where: { id: request.params.providerId },
        });

        if (!key || key.workspace_id !== request.params.workspaceId) {
          return sendError(reply, 'Provider key not found', 404);
        }

        const updateData: any = {};
        if (body.api_key) {
          updateData.api_key = encryptKey(body.api_key);
        }
        if (body.priority !== undefined) {
          updateData.priority = body.priority;
        }
        if (body.enabled !== undefined) {
          updateData.enabled = body.enabled;
        }

        const updated = await prisma.providerKey.update({
          where: { id: request.params.providerId },
          data: updateData,
          select: {
            id: true,
            provider: true,
            priority: true,
            enabled: true,
            updated_at: true,
          },
        });

        return sendSuccess(reply, updated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendError(reply, 'Invalid input', 400);
        }
        return sendError(reply, 'Failed to update provider', 500);
      }
    }
  );

  // Delete provider key
  app.delete<{ Params: { workspaceId: string; providerId: string } }>(
    '/workspaces/:workspaceId/providers/:providerId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const workspace = await prisma.workspace.findUnique({
          where: { id: request.params.workspaceId },
        });

        if (!workspace || workspace.user_id !== request.user.sub) {
          return sendError(reply, 'Workspace not found', 404);
        }

        const key = await prisma.providerKey.findUnique({
          where: { id: request.params.providerId },
        });

        if (!key || key.workspace_id !== request.params.workspaceId) {
          return sendError(reply, 'Provider key not found', 404);
        }

        await prisma.providerKey.delete({
          where: { id: request.params.providerId },
        });

        return sendSuccess(reply, { deleted: true });
      } catch (error) {
        return sendError(reply, 'Failed to delete provider', 500);
      }
    }
  );
}

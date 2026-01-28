import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../shared/http';

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1),
});

export async function workspaceRoutes(app: FastifyInstance, prisma: PrismaClient) {
  // List workspaces (only for current user)
  app.get(
    '/workspaces',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const workspaces = await prisma.workspace.findMany({
          where: { user_id: request.user.sub },
        });

        return sendSuccess(reply, workspaces);
      } catch (error) {
        return sendError(reply, 'Unauthorized', 401);
      }
    }
  );

  // Get workspace details
  app.get<{ Params: { id: string } }>(
    '/workspaces/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const workspace = await prisma.workspace.findUnique({
          where: { id: request.params.id },
        });

        if (!workspace || workspace.user_id !== request.user.sub) {
          return sendError(reply, 'Workspace not found', 404);
        }

        return sendSuccess(reply, workspace);
      } catch (error) {
        return sendError(reply, 'Unauthorized', 401);
      }
    }
  );

  // Create workspace
  app.post<{ Body: z.infer<typeof CreateWorkspaceSchema> }>(
    '/workspaces',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const body = CreateWorkspaceSchema.parse(request.body);

        const workspace = await prisma.workspace.create({
          data: {
            name: body.name,
            user_id: request.user.sub,
          },
        });

        return sendSuccess(reply, workspace, 201);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendError(reply, 'Invalid input', 400);
        }
        return sendError(reply, 'Failed to create workspace', 500);
      }
    }
  );

  // Update workspace
  app.put<{ Params: { id: string }; Body: z.infer<typeof CreateWorkspaceSchema> }>(
    '/workspaces/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const body = CreateWorkspaceSchema.parse(request.body);

        const workspace = await prisma.workspace.findUnique({
          where: { id: request.params.id },
        });

        if (!workspace || workspace.user_id !== request.user.sub) {
          return sendError(reply, 'Workspace not found', 404);
        }

        const updated = await prisma.workspace.update({
          where: { id: request.params.id },
          data: { name: body.name },
        });

        return sendSuccess(reply, updated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendError(reply, 'Invalid input', 400);
        }
        return sendError(reply, 'Failed to update workspace', 500);
      }
    }
  );
}

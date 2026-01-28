import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../shared/http';

export async function logsRoutes(app: FastifyInstance, prisma: PrismaClient) {
  // List logs for workspace (read-only, paginated)
  app.get<{
    Params: { workspaceId: string };
    Querystring: { page?: string; limit?: string; provider?: string };
  }>(
    '/workspaces/:workspaceId/logs',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const workspace = await prisma.workspace.findUnique({
          where: { id: request.params.workspaceId },
        });

        if (!workspace || workspace.user_id !== request.user.sub) {
          return sendError(reply, 'Workspace not found', 404);
        }

        const page = Math.max(1, parseInt(request.query.page || '1', 10));
        const limit = Math.min(100, parseInt(request.query.limit || '50', 10));
        const skip = (page - 1) * limit;

        const where: any = { workspace_id: request.params.workspaceId };
        if (request.query.provider) {
          where.provider_used = request.query.provider;
        }

        const [logs, total] = await Promise.all([
          prisma.requestLog.findMany({
            where,
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
            select: {
              id: true,
              provider_used: true,
              model: true,
              status_code: true,
              input_tokens: true,
              output_tokens: true,
              duration_ms: true,
              error_message: true,
              created_at: true,
            },
          }),
          prisma.requestLog.count({ where }),
        ]);

        return sendSuccess(reply, {
          items: logs,
          total,
          page,
          limit,
        });
      } catch (error) {
        return sendError(reply, 'Unauthorized', 401);
      }
    }
  );
}

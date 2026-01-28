import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../shared/http';

export async function usageRoutes(app: FastifyInstance, prisma: PrismaClient) {
  // Get usage summary for workspace
  app.get<{ Params: { workspaceId: string } }>(
    '/workspaces/:workspaceId/usage',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const workspace = await prisma.workspace.findUnique({
          where: { id: request.params.workspaceId },
        });

        if (!workspace || workspace.user_id !== request.user.sub) {
          return sendError(reply, 'Workspace not found', 404);
        }

        const usage = await prisma.usageCounter.findUnique({
          where: { workspace_id: request.params.workspaceId },
        });

        if (!usage) {
          return sendSuccess(reply, {
            workspace_id: request.params.workspaceId,
            total_requests: 0,
            total_input_tokens: 0,
            total_output_tokens: 0,
            period_start: new Date(),
          });
        }

        return sendSuccess(reply, usage);
      } catch (error) {
        return sendError(reply, 'Unauthorized', 401);
      }
    }
  );

  // Get usage breakdown by provider
  app.get<{
    Params: { workspaceId: string };
    Querystring: { days?: string };
  }>(
    '/workspaces/:workspaceId/usage/by-provider',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const workspace = await prisma.workspace.findUnique({
          where: { id: request.params.workspaceId },
        });

        if (!workspace || workspace.user_id !== request.user.sub) {
          return sendError(reply, 'Workspace not found', 404);
        }

        const days = parseInt(request.query.days || '7', 10);
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        // Raw query to aggregate by provider
        const result = await prisma.$queryRaw<
          Array<{
            provider_used: string;
            total_requests: BigInt;
            total_input_tokens: BigInt;
            total_output_tokens: BigInt;
          }>
        >`
          SELECT
            provider_used,
            COUNT(*) as total_requests,
            COALESCE(SUM(input_tokens), 0) as total_input_tokens,
            COALESCE(SUM(output_tokens), 0) as total_output_tokens
          FROM "RequestLog"
          WHERE workspace_id = ${request.params.workspaceId}
            AND created_at >= ${since}
          GROUP BY provider_used
          ORDER BY total_requests DESC
        `;

        const formatted = result.map((row) => ({
          provider: row.provider_used,
          total_requests: Number(row.total_requests),
          total_input_tokens: Number(row.total_input_tokens),
          total_output_tokens: Number(row.total_output_tokens),
        }));

        return sendSuccess(reply, {
          period_days: days,
          by_provider: formatted,
        });
      } catch (error) {
        console.error('Usage by provider error:', error);
        return sendError(reply, 'Failed to fetch usage', 500);
      }
    }
  );
}

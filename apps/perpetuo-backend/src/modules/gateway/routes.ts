import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { sendError } from '../shared/http';
import { validateAPIKey } from '../shared/http';
import { decryptKey } from '../shared/crypto';
import {
    ErrorClassifier,
    ModelAliasResolver,
    StrategyResolver,
    ProviderSelector,
    type PerpetuoConfig,
} from '@perpetuo/core';

// Minimal OpenAI-compatible request type
interface ChatCompletionRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  [key: string]: any; // Allow other fields
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// GATEWAY: OpenAI-compatible endpoint
export async function gatewayRoutes(app: FastifyInstance, prisma: PrismaClient) {
  // Initialize resolvers
  const errorClassifier = new ErrorClassifier();
  
  app.post<{ Body: ChatCompletionRequest }>(
    '/v1/chat/completions',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();
      let workspaceId: string | undefined;
      let providersAttempted: string[] = [];
      let lastError: any = null;
      let fallbackUsed = false;

      try {
        // 1. Validate API key from header
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          return sendError(reply, 'Missing or invalid Authorization header', 401);
        }

        const apiKey = authHeader.replace('Bearer ', '');
        const auth = await validateAPIKey(apiKey, prisma);

        if (!auth) {
          return sendError(reply, 'Invalid or revoked API key', 401);
        }

        workspaceId = auth.workspace_id;

        // 2. Validate request body
        const body = request.body;
        if (!body.model || !Array.isArray(body.messages) || body.messages.length === 0) {
          return sendError(reply, 'Invalid request: model and messages are required', 400);
        }

        // 3. Get provider keys for workspace, sorted by priority
        const providerKeys = await prisma.providerKey.findMany({
          where: {
            workspace_id: workspaceId,
            enabled: true,
          },
          orderBy: { priority: 'asc' },
        });

        if (providerKeys.length === 0) {
          return sendError(reply, 'No providers configured for this workspace', 400);
        }

        // 4. Try each provider in priority order (fallback)
        let response: ChatCompletionResponse | null = null;

        for (const providerKey of providerKeys) {
          providersAttempted.push(providerKey.provider);
          
          try {
            const decryptedKey = decryptKey(providerKey.api_key);
            response = await callProvider(
              providerKey.provider,
              decryptedKey,
              body,
              request
            );

            if (response) {
              // Success - log and return
              const duration = Date.now() - startTime;
              
              // Log request with decision info
              await prisma.requestLog.create({
                data: {
                  workspace_id: workspaceId,
                  api_key_id: '', // TODO: extract from token
                  provider_used: providerKey.provider,
                  model: body.model,
                  status_code: 200,
                  input_tokens: response.usage.prompt_tokens,
                  output_tokens: response.usage.completion_tokens,
                  duration_ms: duration,
                  user_id: '', // TODO: extract from workspace owner
                  // NEW: Decision log fields
                  fallback_used: fallbackUsed,
                  providers_attempted: providersAttempted.join(','),
                },
              });

              // Update usage counter
              await updateUsageCounter(prisma, workspaceId, response.usage);

              return reply.status(200).send(response);
            }
          } catch (error: any) {
            // CLASSIFY ERROR
            const classification = errorClassifier.classify(error);

            console.log(
              `Provider ${providerKey.provider} failed (${classification.reason}):`,
              error.message
            );

            lastError = error;

            // ABORT if fatal error
            if (!classification.retryable) {
              console.error(
                `Fatal error from ${providerKey.provider}: ${classification.reason}`
              );

              const duration = Date.now() - startTime;
              await prisma.requestLog.create({
                data: {
                  workspace_id: workspaceId,
                  api_key_id: '',
                  provider_used: providerKey.provider,
                  model: body.model,
                  status_code: classification.statusCode || 502,
                  error_message: classification.explanation,
                  duration_ms: duration,
                  user_id: '',
                  fallback_used: fallbackUsed,
                  providers_attempted: providersAttempted.join(','),
                },
              });

              return sendError(
                reply,
                classification.explanation,
                classification.statusCode === 401 ? 401 : 502
              );
            }

            // RETRY: Continue to next provider (retryable error)
            if (providersAttempted.length > 1) {
              fallbackUsed = true;
            }
          }
        }

        // All providers failed
        const duration = Date.now() - startTime;
        await prisma.requestLog.create({
          data: {
            workspace_id: workspaceId,
            api_key_id: '',
            provider_used: providersAttempted.join(','),
            model: body.model,
            status_code: 503,
            error_message: lastError?.message || 'All providers failed',
            duration_ms: duration,
            user_id: '',
            fallback_used: fallbackUsed,
            providers_attempted: providersAttempted.join(','),
          },
        });

        return sendError(
          reply,
          `All providers failed: ${lastError?.message || 'Unknown error'}`,
          503
        );
      } catch (error: any) {
        console.error('Gateway error:', error);
        return sendError(reply, error.message || 'Internal server error', 500);
      }
    }
  );
}

// Provider implementation
async function callProvider(
  provider: string,
  apiKey: string,
  request: ChatCompletionRequest,
  fastifyRequest: FastifyRequest
): Promise<ChatCompletionResponse | null> {
  // IMPORTANT: This is a simplified implementation.
  // In production, you'd need provider-specific adapters.
  
  if (provider === 'openai') {
    return await callOpenAI(apiKey, request);
  }
  // Add more providers as needed
  
  throw new Error(`Provider ${provider} not yet implemented`);
}

async function callOpenAI(
  apiKey: string,
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    request,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  return response.data as ChatCompletionResponse;
}

// Update usage counter synchronously
async function updateUsageCounter(
  prisma: PrismaClient,
  workspaceId: string,
  usage: { prompt_tokens: number; completion_tokens: number }
) {
  try {
    const existing = await prisma.usageCounter.findUnique({
      where: { workspace_id: workspaceId },
    });

    if (existing) {
      await prisma.usageCounter.update({
        where: { workspace_id: workspaceId },
        data: {
          total_requests: { increment: 1 },
          total_input_tokens: { increment: usage.prompt_tokens },
          total_output_tokens: { increment: usage.completion_tokens },
        },
      });
    } else {
      await prisma.usageCounter.create({
        data: {
          workspace_id: workspaceId,
          total_requests: 1,
          total_input_tokens: usage.prompt_tokens,
          total_output_tokens: usage.completion_tokens,
        },
      });
    }
  } catch (error) {
    // Non-blocking error
    console.error('Failed to update usage counter:', error);
  }
}

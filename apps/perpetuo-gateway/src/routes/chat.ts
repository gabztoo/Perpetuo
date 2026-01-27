import { FastifyInstance } from 'fastify';
import { DecisionEngine, ChatParams, ProviderConfig, ChatResponse, TenantConfig } from '@perpetuo/core';
import { getProvider } from '@perpetuo/providers';
import { logger, requestCounter, latencyHistogram, fallbackCounter } from '@perpetuo/observability';
import { loadConfig } from '../config';
import { QuotaManager, ResilienceManager } from '@perpetuo/cache';
import { AuthMiddleware } from '../middleware/auth';
import { EventManager } from '@perpetuo/events';
import crypto from 'crypto';
import { calculateCost } from '@perpetuo/shared';

import { ConfigManager } from '../services/configManager';

const TIMEOUT_MS = 30000; // 30s hard timeout per provider

// Production provider configs
const PROVIDER_CONFIGS: Record<string, { name: string; baseUrl: string; enabled: boolean }> = {
    groq: { name: 'groq', baseUrl: 'https://api.groq.com/openai/v1', enabled: true },
    gemini: { name: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', enabled: true },
    openrouter: { name: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1', enabled: true },
    openai: { name: 'openai', baseUrl: 'https://api.openai.com/v1', enabled: true }
};

// Default fallback chain for production
const DEFAULT_FALLBACK_CHAIN = [
    { name: 'groq', provider: 'groq' },
    { name: 'gemini', provider: 'gemini' },
    { name: 'openrouter', provider: 'openrouter' },
    { name: 'openai', provider: 'openai' }
];

export async function chatRoutes(fastify: FastifyInstance, options: { authMiddleware: AuthMiddleware, quotaManager: QuotaManager, eventManager: EventManager, resilienceManager: ResilienceManager, configManager: ConfigManager }) {
    const { authMiddleware, quotaManager, eventManager, resilienceManager, configManager } = options;

    // Support /v1/chat/completions AND /r/:routeKey/v1/chat/completions
    const handler = async (req: any, reply: any) => {
        const requestId = (req.id as string) || crypto.randomUUID();
        const body = req.body;
        const idempotencyKey = req.headers['x-idempotency-key'];

        // 0. Idempotency Check
        if (idempotencyKey) {
            const cached = await resilienceManager.getIdempotencyResult(idempotencyKey);
            if (cached) {
                eventManager.emit({ id: crypto.randomUUID(), type: 'request_succeeded', tenantId: 'unknown', requestId, timestamp: Date.now(), meta: { recovered: true } });
                return reply.send(cached);
            }
        }

        // 0. Authentication & Tenant Resolution
        try {
            await authMiddleware.handle(req, reply);
        } catch (e: any) {
            return reply.code(e.statusCode || 401).send({
                error: process.env.NODE_ENV === 'production' ? 'Authorization failed' : e.message
            });
        }

        const tenant = req.tenant!;
        const tenantId = tenant.id;

        // Fetch Dynamic Config
        const remoteConfig = await configManager.getTenantConfig(tenantId);
        const routeKey = req.params.routeKey || req.headers['x-perpetuo-route'] || 'default';

        eventManager.emit({
            id: crypto.randomUUID(),
            type: 'request_received',
            tenantId,
            requestId,
            timestamp: Date.now(),
            meta: { model: body.model, route: routeKey }
        });

        // 1. Quotas (Rate Limit & Budget)
        if (tenant.limits && tenant.limits.rateLimitMin) {
            const { blocked } = await quotaManager.checkRateLimit(tenantId, tenant.limits.rateLimitMin);
            if (blocked) {
                eventManager.emit({ id: crypto.randomUUID(), type: 'quota_blocked', tenantId, requestId, timestamp: Date.now(), meta: { reason: 'rate_limit' } });
                return reply.code(429).send({ error: { type: 'rate_limit_exceeded', message: 'Too many requests' } });
            }
        }

        if (tenant.limits && tenant.limits.budgetDay) {
            const { blocked } = await quotaManager.checkBudget(tenantId, tenant.limits.budgetDay);
            if (blocked) {
                eventManager.emit({ id: crypto.randomUUID(), type: 'quota_blocked', tenantId, requestId, timestamp: Date.now(), meta: { reason: 'budget' } });
                return reply.code(403).send({ error: { type: 'quota_exceeded', message: 'Daily budget exceeded' } });
            }
        }

        // 2. Decision Engine - Build fallback chain
        let chain = [...DEFAULT_FALLBACK_CHAIN];

        try {
            if (remoteConfig) {
                const route = remoteConfig.routes.find((r: any) => r.key === routeKey);
                if (route && route.policyId) {
                    const policy = remoteConfig.policies.find((p: any) => p.id === route.policyId);
                    if (policy && policy.rules[0]) {
                        chain = policy.rules[0].action.modelOrder.map((m: string) => ({
                            name: m,
                            provider: m.includes(':') ? m.split(':')[0] : (remoteConfig.providers.find((p: any) => m.includes(p.name))?.name || 'openai')
                        }));
                    }
                }
            }

            eventManager.emit({ id: crypto.randomUUID(), type: 'decision_made', tenantId, requestId, timestamp: Date.now(), meta: { chain: chain.map((m: any) => m.name), route: routeKey } });
        } catch (e: any) {
            return reply.code(400).send({ error: { type: 'invalid_request', message: e.message } });
        }

        // 3. Execution Loop
        let lastError: any = null;
        const totalStartTime = Date.now();

        logger.info({ requestId, chain: chain.map(m => m.name) }, 'Starting provider chain execution');

        for (let i = 0; i < chain.length; i++) {
            const model = chain[i];

            const providerConfig = PROVIDER_CONFIGS[model.provider];
            if (!providerConfig || !providerConfig.enabled) {
                logger.warn({ requestId, provider: model.provider }, 'Provider not configured or disabled');
                continue;
            }

            const provider = getProvider(model.provider);
            const apiKeyHeader = `x-provider-key-${model.provider}`;
            const apiKey = req.headers[apiKeyHeader] as string;

            if (!apiKey) {
                logger.warn({ requestId, provider: model.provider }, 'Missing API Key');
                continue;
            }

            try {
                eventManager.emit({ id: crypto.randomUUID(), type: 'provider_attempt', tenantId, requestId, timestamp: Date.now(), meta: { provider: model.provider, model: model.name } });

                const attemptStart = Date.now();

                // EXECUTION with TIMEOUT
                const response = await Promise.race([
                    provider.invoke(body, providerConfig, { apiKey, requestId, tenantId }),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('Provider timeout')), TIMEOUT_MS)
                    )
                ]);

                const duration = Date.now() - attemptStart;

                // Success Logging
                logger.info({ requestId, tenantId, model: model.name, provider: model.provider, duration, status: 'success' }, 'Chat completion success');

                // Usage Tracking
                const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
                const totalCost = calculateCost(model.name, usage.prompt_tokens, usage.completion_tokens);

                // Fire & forget
                quotaManager.recordUsage(tenantId, totalCost, usage.total_tokens).catch(err => {
                    logger.error({ err }, 'Failed to record usage');
                });

                requestCounter.labels(tenantId, '/v1/chat/completions', model.name, model.provider, '200').inc();
                latencyHistogram.labels(tenantId, '/v1/chat/completions', model.name, model.provider).observe(duration);

                eventManager.emit({ id: crypto.randomUUID(), type: 'request_succeeded', tenantId, requestId, timestamp: Date.now(), meta: { provider: model.provider, duration } });

                if (idempotencyKey) {
                    await resilienceManager.saveIdempotencyResult(idempotencyKey, response);
                }
                await resilienceManager.recordSuccess(model.provider);

                return reply.send(response);

            } catch (e: any) {
                const duration = Date.now() - totalStartTime;
                logger.error({ requestId, provider: model.provider, error: e.message }, 'Provider failed');

                requestCounter.labels(tenantId, '/v1/chat/completions', model.name, model.provider, String(e.statusCode || 500)).inc();
                eventManager.emit({ id: crypto.randomUUID(), type: 'provider_failure', tenantId, requestId, timestamp: Date.now(), meta: { provider: model.provider, error: e.message } });

                await resilienceManager.recordFailure(model.provider);
                lastError = e;
            }
        }

        // All failed
        return reply.code(502).send({
            error: {
                type: 'provider_error',
                message: 'All providers failed',
                lastError: lastError ? lastError.message : 'No available providers'
            }
        });
    };

    ['/v1/chat/completions', '/r/:routeKey/v1/chat/completions'].forEach(path => {
        fastify.post(path, handler);
    });
}

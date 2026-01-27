import { FastifyInstance } from 'fastify';
import {
    DecisionEngine,
    ChatParams,
    ProviderConfig,
    ChatResponse,
    TenantConfig,
    ModelAliasResolver,
    StrategyResolver,
    ProviderSelector,
    ErrorClassifier,
} from '@perpetuo/core';
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

// Default fallback chain for production (ONLY USED IF NO CONFIG)
const DEFAULT_FALLBACK_CHAIN = [
    { name: 'groq', provider: 'groq' },
    { name: 'gemini', provider: 'gemini' },
    { name: 'openrouter', provider: 'openrouter' },
    { name: 'openai', provider: 'openai' }
];

export async function chatRoutes(fastify: FastifyInstance, options: { authMiddleware: AuthMiddleware, quotaManager: QuotaManager, eventManager: EventManager, resilienceManager: ResilienceManager, configManager: ConfigManager }) {
    const { authMiddleware, quotaManager, eventManager, resilienceManager, configManager } = options;

    // Initialize resolvers
    const config = await loadConfig();
    const aliasResolver = new ModelAliasResolver(config);
    const strategyResolver = new StrategyResolver();
    const providerSelector = new ProviderSelector();
    const errorClassifier = new ErrorClassifier();

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

        // 1. Authentication & Tenant Resolution
        try {
            await authMiddleware.handle(req, reply);
        } catch (e: any) {
            return reply.code(e.statusCode || 401).send({
                error: process.env.NODE_ENV === 'production' ? 'Authorization failed' : e.message
            });
        }

        const tenant = req.tenant!;
        const tenantId = tenant.id;

        // Fetch tenant-specific config
        const remoteConfig = await configManager.getTenantConfig(tenantId);
        const strategyHeader = req.headers['x-perpetuo-route'] as string | undefined;

        eventManager.emit({
            id: crypto.randomUUID(),
            type: 'request_received',
            tenantId,
            requestId,
            timestamp: Date.now(),
            meta: { model: body.model, strategy: strategyHeader }
        });

        // 2. Quotas (Rate Limit & Budget)
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

        // 3. RESOLVE: Model Alias
        // Client sends "gpt-4" or "perpetuo/chat-fast" → we interpret it
        const modelAlias = body.model || 'default';
        const aliasResolution = aliasResolver.resolve(modelAlias);

        eventManager.emit({
            id: crypto.randomUUID(),
            type: 'alias_resolved',
            tenantId,
            requestId,
            timestamp: Date.now(),
            meta: {
                requested_alias: aliasResolution.requestedAlias,
                intent: aliasResolution.intent,
                tier: aliasResolution.tier,
            }
        });

        // 4. RESOLVE: Strategy
        // Check header or workspace default
        const workspaceStrategy = (remoteConfig as any)?.defaultStrategy as any || 'default';
        const strategyResolution = strategyResolver.resolve(strategyHeader, workspaceStrategy);

        eventManager.emit({
            id: crypto.randomUUID(),
            type: 'strategy_resolved',
            tenantId,
            requestId,
            timestamp: Date.now(),
            meta: {
                strategy: strategyResolution.strategy,
                source: strategyResolution.source,
            }
        });

        // 5. SELECT: Build provider chain based on strategy
        // Get eligible providers (those with BYOK keys configured)
        let chain: any[] = DEFAULT_FALLBACK_CHAIN;

        try {
            if (remoteConfig && (remoteConfig as any).providers && (remoteConfig as any).models) {
                const providers = (remoteConfig as any).providers as ProviderConfig[];
                const models = (remoteConfig as any).models as any[];

                // Select providers in order based on strategy
                const selectedProviders = providerSelector.selectAndOrder(
                    providers,
                    models,
                    strategyResolution.strategy
                );

                // Map to chain format
                chain = selectedProviders.map((p: ProviderConfig) => ({
                    name: modelAlias,
                    provider: p.name,
                }));

                if (chain.length === 0) {
                    chain = DEFAULT_FALLBACK_CHAIN;
                }
            }

            eventManager.emit({
                id: crypto.randomUUID(),
                type: 'chain_built',
                tenantId,
                requestId,
                timestamp: Date.now(),
                meta: {
                    chain: chain.map((m: any) => m.provider),
                    strategy: strategyResolution.strategy,
                }
            });
        } catch (e: any) {
            logger.error({ requestId, error: e.message }, 'Failed to build provider chain');
            return reply.code(500).send({ error: { type: 'internal_error', message: 'Failed to build provider chain' } });
        }

        // 6. EXECUTION: Try providers in order with fallback
        let lastError: any = null;
        const totalStartTime = Date.now();
        const providersAttempted: string[] = [];
        let fallbackUsed = false;

        logger.info({ requestId, chain: chain.map(m => m.provider), strategy: strategyResolution.strategy }, 'Starting provider chain execution');

        for (let i = 0; i < chain.length; i++) {
            const chainItem = chain[i];
            const providerName = chainItem.provider;

            const providerConfig = PROVIDER_CONFIGS[providerName];
            if (!providerConfig || !providerConfig.enabled) {
                logger.warn({ requestId, provider: providerName }, 'Provider not configured or disabled');
                continue;
            }

            providersAttempted.push(providerName);

            // Get BYOK from request (client provides via header)
            const apiKeyHeader = `x-provider-key-${providerName}`;
            const apiKey = req.headers[apiKeyHeader] as string;

            if (!apiKey) {
                logger.warn({ requestId, provider: providerName }, 'Missing API key for provider');
                continue;
            }

            try {
                eventManager.emit({
                    id: crypto.randomUUID(),
                    type: 'provider_attempt',
                    tenantId,
                    requestId,
                    timestamp: Date.now(),
                    meta: { provider: providerName, model: modelAlias }
                });

                const attemptStart = Date.now();
                const provider = getProvider(providerName);

                // EXECUTION with TIMEOUT
                const response = await Promise.race([
                    provider.invoke(body, providerConfig, { apiKey, requestId, tenantId }),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('Provider timeout')), TIMEOUT_MS)
                    )
                ]);

                const duration = Date.now() - attemptStart;

                // SUCCESS
                logger.info({
                    requestId,
                    tenantId,
                    model: modelAlias,
                    provider: providerName,
                    duration,
                    status: 'success'
                }, 'Chat completion success');

                // Usage Tracking
                const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
                const totalCost = calculateCost(modelAlias, usage.prompt_tokens, usage.completion_tokens);

                quotaManager.recordUsage(tenantId, totalCost, usage.total_tokens).catch(err => {
                    logger.error({ err }, 'Failed to record usage');
                });

                // Metrics
                requestCounter.labels(tenantId, '/v1/chat/completions', modelAlias, providerName, '200').inc();
                latencyHistogram.labels(tenantId, '/v1/chat/completions', modelAlias, providerName).observe(duration);

                // Log decision
                eventManager.emit({
                    id: crypto.randomUUID(),
                    type: 'request_succeeded',
                    tenantId,
                    requestId,
                    timestamp: Date.now(),
                    meta: {
                        provider_used: providerName,
                        fallback_used: fallbackUsed,
                        latency_ms: duration,
                        providers_attempted: providersAttempted,
                        strategy: strategyResolution.strategy,
                    }
                });

                if (idempotencyKey) {
                    await resilienceManager.saveIdempotencyResult(idempotencyKey, response);
                }
                await resilienceManager.recordSuccess(providerName);

                return reply.send(response);

            } catch (e: any) {
                // CLASSIFY ERROR
                const classification = errorClassifier.classify(e);

                logger.warn({
                    requestId,
                    provider: providerName,
                    error: e.message,
                    retryable: classification.retryable,
                    reason: classification.reason,
                }, 'Provider failed');

                requestCounter.labels(tenantId, '/v1/chat/completions', modelAlias, providerName, String(e.statusCode || 500)).inc();

                eventManager.emit({
                    id: crypto.randomUUID(),
                    type: 'provider_failure',
                    tenantId,
                    requestId,
                    timestamp: Date.now(),
                    meta: {
                        provider: providerName,
                        error: e.message,
                        retryable: classification.retryable,
                        reason: classification.reason,
                    }
                });

                await resilienceManager.recordFailure(providerName);
                lastError = e;

                // ABORT if fatal error
                if (!classification.retryable) {
                    logger.error({
                        requestId,
                        provider: providerName,
                        reason: classification.reason,
                    }, 'Fatal error, aborting chain');

                    return reply.code(classification.statusCode === 401 ? 401 : 502).send({
                        error: {
                            type: 'provider_error',
                            message: classification.explanation,
                            provider: providerName,
                        }
                    });
                }

                // RETRY: Continue to next provider
                if (i > 0) {
                    fallbackUsed = true;
                }
            }
        }

        // ALL FAILED
        const duration = Date.now() - totalStartTime;
        logger.error({
            requestId,
            providers_attempted: providersAttempted,
            duration,
        }, 'All providers failed');

        eventManager.emit({
            id: crypto.randomUUID(),
            type: 'request_failed',
            tenantId,
            requestId,
            timestamp: Date.now(),
            meta: {
                providers_attempted: providersAttempted,
                latency_ms: duration,
                reason: lastError?.message,
            }
        });

        return reply.code(502).send({
            error: {
                type: 'provider_error',
                message: 'All providers failed',
                providers_attempted: providersAttempted,
                lastError: lastError ? lastError.message : 'No available providers'
            }
        });
    };

    ['/v1/chat/completions', '/r/:routeKey/v1/chat/completions'].forEach(path => {
        fastify.post(path, handler);
    });
}

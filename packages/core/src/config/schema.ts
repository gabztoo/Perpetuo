import { z } from 'zod';

export const ModelConfigSchema = z.object({
    name: z.string(),
    provider: z.string(),
    costPer1kInput: z.number().default(0),
    costPer1kOutput: z.number().default(0),
    maxTokens: z.number().optional(),
    tags: z.array(z.string()).optional(),
});

export const ProviderConfigSchema = z.object({
    name: z.string(),
    baseUrl: z.string().optional(),
    apiKeyEnvVar: z.string().optional(),
    timeoutMs: z.number().default(10000),
    enabled: z.boolean().default(true),
});

export const FallbackPolicySchema = z.object({
    strategy: z.literal('deterministic'),
    order: z.array(z.string()).default([]),
    retry: z.object({
        on: z.array(z.number()).default([429, 500, 502, 503, 504]),
        backoffMs: z.number().default(1000),
        maxAttempts: z.number().default(3),
    }),
});

export const LimitsSchema = z.object({
    rateLimitMin: z.number().optional(),
    budgetDay: z.number().optional(),
});

export const TenantConfigSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    plan: z.enum(['free', 'pro', 'enterprise']),
    limits: LimitsSchema,
    apiKeys: z.array(z.string()),
});

export const PerpetuoConfigSchema = z.object({
    tenants: z.array(TenantConfigSchema).default([]),
    providers: z.array(ProviderConfigSchema),
    models: z.array(ModelConfigSchema),
    policies: z.object({
        defaultRouting: z.array(z.string()),
        fallback: FallbackPolicySchema,
    }),
});

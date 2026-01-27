import { PerpetuoConfig, PerpetuoConfigSchema } from '@perpetuo/core';
import { prisma } from '@perpetuo/db';

let configCache: PerpetuoConfig | null = null;
let lastFetch = 0;
const CACHE_TTL_MS = 60 * 1000;

export async function loadConfig(): Promise<PerpetuoConfig> {
    const now = Date.now();
    if (configCache && (now - lastFetch < CACHE_TTL_MS)) {
        return configCache;
    }

    try {
        console.log('🔌 Connecting to DB to load config...');
        await prisma.$connect();
        return await loadConfigFromDB();
    } catch (e) {
        console.error('❌ DB Connect Failed:', e);
        throw new Error('Database connection required. Set DATABASE_URL environment variable.');
    }
}

async function loadConfigFromDB(): Promise<PerpetuoConfig> {
    // Load tenants with their providers from database
    const tenants = await prisma.tenant.findMany({
        include: { providers: true }
    });

    const config: PerpetuoConfig = {
        providers: [
            { name: 'openai', baseUrl: 'https://api.openai.com/v1', enabled: true },
            { name: 'groq', baseUrl: 'https://api.groq.com/openai/v1', enabled: true },
            { name: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', enabled: true },
            { name: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1', enabled: true }
        ],
        models: [
            { name: 'groq', provider: 'groq', costPer1kInput: 0.0001, costPer1kOutput: 0.0002 } as any,
            { name: 'gemini', provider: 'gemini', costPer1kInput: 0.0001, costPer1kOutput: 0.0002 } as any,
            { name: 'openrouter', provider: 'openrouter', costPer1kInput: 0.001, costPer1kOutput: 0.002 } as any,
            { name: 'openai', provider: 'openai', costPer1kInput: 0.003, costPer1kOutput: 0.006 } as any
        ],
        policies: {
            defaultRouting: ['groq', 'gemini', 'openrouter', 'openai'],
            rules: [],
            fallback: { strategy: 'deterministic', order: ['groq', 'gemini', 'openrouter', 'openai'], maxAttempts: 3 },
            caching: { enabled: false }
        },
        tenants: tenants.map(t => ({
            id: t.id,
            name: t.name,
            apiKeys: [], // API keys from ApiToken table
            providers: t.providers.filter(p => p.status === 'ACTIVE').map(p => p.provider),
            limits: { rateLimitMin: 1000, budgetDay: 1000 }
        }))
    };

    configCache = config;
    lastFetch = Date.now();
    return config;
}

export async function getTenantConfig(tenantId: string) {
    console.log(`🔎 Looking up config for tenant: ${tenantId}`);

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                providers: true,
                projects: {
                    include: {
                        routes: {
                            include: {
                                policy: {
                                    include: { rules: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (tenant) {
            return {
                id: tenant.id,
                name: tenant.name,
                providers: tenant.providers
                    .filter(p => p.status === 'ACTIVE')
                    .map(p => ({
                        name: p.provider,
                        keyCiphertext: p.keyCiphertext,
                        enabled: true
                    })),
                limits: { rateLimitMin: 1000, budgetDay: 1000 },
                routes: tenant.projects.flatMap(proj =>
                    proj.routes.map(r => ({
                        key: r.key,
                        displayName: r.displayName,
                        policyId: r.policy?.id
                    }))
                ),
                policies: tenant.projects.flatMap(proj =>
                    proj.routes
                        .filter(r => r.policy)
                        .map(r => ({
                            id: r.policy!.id,
                            mode: r.policy!.mode,
                            rules: r.policy!.rules.map(rule => ({
                                priority: rule.priority,
                                match: rule.matchJson,
                                action: rule.actionJson
                            }))
                        }))
                )
            };
        }
    } catch (e) {
        console.error('❌ DB Lookup Failed for tenant:', tenantId, e);
    }

    return null;
}


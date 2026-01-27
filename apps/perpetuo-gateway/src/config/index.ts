import { PerpetuoConfig, PerpetuoConfigSchema } from '@perpetuo/core';
import { prisma } from '@perpetuo/db';

// Cache in-memory par simples (Production should use Redis or SWR)
let configCache: PerpetuoConfig | null = null;
let lastFetch = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export async function loadConfig(): Promise<PerpetuoConfig> {
    const now = Date.now();
    if (configCache && (now - lastFetch < CACHE_TTL_MS)) {
        return configCache;
    }

    // Fetch from DB
    // Aqui mapeamos as tabelas do Prisma para o objeto de config esperado pelo ConfigSchema
    const tenants = await prisma.tenant.findMany({
        include: { providers: true, projects: { include: { routes: { include: { policy: { include: { rules: true } } } } } } }
    });

    // Transform DB to Config Struct (Simplified for MVP)
    // Na prática, o Gateway opera "per request" buscando o tenant, mas aqui vamos carregar tudo para cachear
    // Ou melhor: O Gateway deve buscar o Tenant especifico no request, nao carregar tudo na memoria.

    // Changing strategy: loadConfig returns a "ConfigProvider" interface, not just a static object.

    // For now, to keep compatible with existing code that might expect a static object, 
    // we will stick to the previous file's contract if possible, BUT looking at previous file it returned "PerpetuoConfig".

    // Let's Mock a basic config for now that allows dynamic lookup later, 
    // OR we change the architecture to "Pull Tenant Config on Request".

    // Given the constraints, let's keep the YAML loader for "Global settings" 
    // and assume the Decision Engine will fetch Policy from DB per request.

    // Wait, the "Decision Engine" needs policies.
    // If the user wants "Control via Web", the Policy Engine MUST look up the DB.

    // I will rewrite this to be a hybrid:
    // Global defaults from YAML (or env).
    // But exposing a `getConfigForTenant(tenantId)` function is better.

    // Let's implement a simple "DynamicConfig" class.
    return {
        providers: [], // Global providers (defaults)
        policies: {
            defaultRouting: ['openai', 'mock'],
            rules: []
        }
    };
}

// New Dynamic Accessor
export async function getTenantConfig(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }, // In real app, resolved via API Key lookup usually
        include: {
            providers: true
        }
    });

    if (!tenant) return null;

    return {
        id: tenant.id,
        name: tenant.name,
        providers: tenant.providers.map(p => ({
            name: p.provider,
            apiKey: p.keyCiphertext, // Decrypt in real app
            enabled: p.status === 'ACTIVE'
        }))
    };
}

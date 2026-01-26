import { loadConfig } from '../config';
import { PerpetuoConfig } from '@perpetuo/core';
import axios from 'axios';
import { logger } from '@perpetuo/observability';

interface RemoteConfigPayload {
    tenantId: string;
    routes: any[]; // Consider strict typing using Zod or Shared types later
    policies: any[];
    providers: any[];
}

interface CachedConfig {
    ts: number;
    data: any;
}

const CONFIG_TTL_MS = 60000; // 1 Minute Cache

export class ConfigManager {
    private localConfig: PerpetuoConfig;
    private tenantConfigs: Map<string, CachedConfig> = new Map();
    private controlPlaneUrl: string;
    private internalToken: string;

    constructor() {
        this.localConfig = loadConfig();
        this.controlPlaneUrl = process.env.CONTROL_PLANE_URL || 'http://localhost:3001';
        this.internalToken = process.env.ADMIN_INTERNAL_TOKEN || 'dev-internal-secret';
    }

    getLocalConfig() {
        return this.localConfig;
    }

    async getTenantConfig(tenantId: string): Promise<any> {
        // 1. Check Cache
        if (this.tenantConfigs.has(tenantId)) {
            const cached = this.tenantConfigs.get(tenantId)!;
            if (Date.now() - cached.ts < CONFIG_TTL_MS) {
                return cached.data;
            }
        }

        // 2. Fetch Fresh
        try {
            const url = `${this.controlPlaneUrl}/internal/config/${tenantId}`;
            const res = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${this.internalToken}` },
                timeout: 2000 // Fast fail
            });

            // 3. Update Cache
            this.tenantConfigs.set(tenantId, { ts: Date.now(), data: res.data });
            logger.info({ tenantId }, 'Refreshed remote config cache');
            return res.data;
        } catch (err: any) {
            // 4. Stale-While-Revalidate Fallback
            if (this.tenantConfigs.has(tenantId)) {
                logger.warn({ tenantId, err: err.message }, 'Remote config fetch failed, serving STALE cache');
                return this.tenantConfigs.get(tenantId)!.data;
            }

            logger.error({ tenantId, err: err.message }, 'Failed to fetch remote config and no stale cache available');
            return null;
        }
    }
}

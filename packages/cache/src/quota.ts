import { RedisCache } from './index';

export class QuotaManager {
    constructor(private redis: RedisCache) { }

    /**
     * Check if request should be blocked by Rate Limit
     * Returns: { blocked: boolean, current: number, limit: number, retryAfter?: number }
     */
    async checkRateLimit(tenantId: string, limitPerMin: number): Promise<{ blocked: boolean; current: number }> {
        if (!limitPerMin || limitPerMin <= 0) return { blocked: false, current: 0 };

        // Simple fixed window for MVP (key = tenant:ratelimit:minute_timestamp)
        // Better production approach: Sliding Window Log or Token Bucket. 
        // Here we use a key that expires every minute.
        const minute = Math.floor(Date.now() / 60000);
        const key = `perpetuo:ratelimit:${tenantId}:${minute}`;

        // Increment
        const current = await this.redis.client.incr(key);

        // Set expiry if new key (first request in this window)
        if (current === 1) {
            await this.redis.client.expire(key, 65); // 65s safety
        }

        return {
            blocked: current > limitPerMin,
            current
        };
    }

    /**
     * Check Daily Budget
     * Returns: { blocked: boolean, usage: number }
     */
    async checkBudget(tenantId: string, budgetDaily: number): Promise<{ blocked: boolean }> {
        if (!budgetDaily || budgetDaily <= 0) return { blocked: false };

        const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const key = `perpetuo:usage:cost:${tenantId}:${day}`;

        const currentCostStr = await this.redis.client.get(key);
        const currentCost = parseFloat(currentCostStr || '0');

        if (currentCost >= budgetDaily) {
            return { blocked: true };
        }

        return { blocked: false };
    }

    /**
     * Increment usage stats (async)
     */
    async recordUsage(tenantId: string, cost: number, tokens: number) {
        const day = new Date().toISOString().slice(0, 10);
        const costKey = `perpetuo:usage:cost:${tenantId}:${day}`;
        const tokenKey = `perpetuo:usage:tokens:${tenantId}:${day}`;

        // Pipeline for efficiency
        const pipe = this.redis.client.pipeline();
        pipe.incrbyfloat(costKey, cost);
        pipe.expire(costKey, 86400 * 2); // Keep for 48h active, persist elsewhere for long term
        pipe.incrby(tokenKey, tokens);
        pipe.expire(tokenKey, 86400 * 2);
        await pipe.exec();
    }
}

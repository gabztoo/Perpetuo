import { RedisCache } from './index';

export class ResilienceManager {
    constructor(private redis: RedisCache) { }

    /**
     * Circuit Breaker State
     * Key: perpetuo:cb:{providerName} -> 'open' | 'half-open' | 'closed' (default)
     * Failure Count Key: perpetuo:cb:{providerName}:failures
     */
    async shouldBlockProvider(providerName: string): Promise<boolean> {
        const state = await this.redis.get(`perpetuo:cb:${providerName}`);
        return state === 'open';
    }

    async recordFailure(providerName: string, threshold = 5, timeoutSeconds = 30) {
        const key = `perpetuo:cb:${providerName}:failures`;
        const count = await this.redis.client.incr(key);

        if (count === 1) {
            await this.redis.client.expire(key, 60); // Window 60s
        }

        if (count >= threshold) {
            await this.openCircuit(providerName, timeoutSeconds);
        }
    }

    async recordSuccess(providerName: string) {
        // If half-open, close it?
        // For MVP: just clearing failure count if we want, or just let TTL expire.
        // Usually CB resets on success if half-open.
        const state = await this.redis.get(`perpetuo:cb:${providerName}`);
        if (state === 'half-open') {
            await this.closeCircuit(providerName);
        }
    }

    async openCircuit(providerName: string, timeoutSeconds: number) {
        await this.redis.set(`perpetuo:cb:${providerName}`, 'open', timeoutSeconds);
        // After timeout, it naturally expires to null (closed) or we can set 'half-open' logic?
        // Simple MVP: Expiry = Closed.
        // Better: Expiry = we allow 1 request? 
        // Let's stick to Expiry = Closed for V1 simplicity unless explicitly asked for half-open.
    }

    async closeCircuit(providerName: string) {
        await this.redis.client.del(`perpetuo:cb:${providerName}`);
        await this.redis.client.del(`perpetuo:cb:${providerName}:failures`);
    }

    // Idempotency
    async getIdempotencyResult(key: string): Promise<any | null> {
        return await this.redis.get(`perpetuo:idempotency:${key}`);
    }

    async saveIdempotencyResult(key: string, result: any, ttlSeconds = 86400) {
        await this.redis.set(`perpetuo:idempotency:${key}`, result, ttlSeconds);
    }
}

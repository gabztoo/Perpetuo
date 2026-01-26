import Redis from 'ioredis';

export interface CacheEntry {
    val: any;
    ttl: number; // Expiry timestamp
}

export interface Cache {
    get(key: string): Promise<any | null>;
    set(key: string, value: any, ttlSeconds: number): Promise<void>;
    name: string;
}

export class MemoryCache implements Cache {
    name = 'memory';
    private store = new Map<string, CacheEntry>();

    async get(key: string): Promise<any | null> {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.ttl) {
            this.store.delete(key);
            return null;
        }
        return entry.val;
    }

    async set(key: string, value: any, ttlSeconds: number): Promise<void> {
        this.store.set(key, {
            val: value,
            ttl: Date.now() + ttlSeconds * 1000,
        });
    }
}

export class RedisCache implements Cache {
    name = 'redis';
    public client: Redis;

    constructor(connectionString: string) {
        this.client = new Redis(connectionString);
    }

    async get(key: string): Promise<any | null> {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set(key: string, value: any, ttlSeconds: number): Promise<void> {
        await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    }
}

export * from './quota';
export * from './resilience';

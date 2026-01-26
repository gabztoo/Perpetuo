import pino from 'pino';
import client from 'prom-client';

// --- Logger ---

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
        level: (label) => {
            // Return level as string instead of default number
            return { level: label };
        },
    },
    // Redact sensitive keys in logs
    redact: ['payload.messages', 'payload.user', 'req.headers.authorization', 'req.headers["x-provider-key"]'],
});

// --- Metrics ---

// Create a Registry
export const register = new client.Registry();

// Add default metrics (cpu, memory, etc.)
client.collectDefaultMetrics({ register, prefix: 'perpetuo_' });

// Custom Metrics
export const requestCounter = new client.Counter({
    name: 'perpetuo_requests_total',
    help: 'Total number of requests',
    labelNames: ['tenant', 'route', 'model', 'provider', 'status'],
    registers: [register],
});

export const latencyHistogram = new client.Histogram({
    name: 'perpetuo_latency_ms',
    help: 'Request latency in milliseconds',
    labelNames: ['tenant', 'route', 'model', 'provider'],
    buckets: [100, 500, 1000, 2000, 5000, 10000],
    registers: [register],
});

export const fallbackCounter = new client.Counter({
    name: 'perpetuo_fallbacks_total',
    help: 'Total number of fallbacks triggered',
    labelNames: ['tenant', 'route', 'from_model', 'to_model', 'reason'],
    registers: [register],
});

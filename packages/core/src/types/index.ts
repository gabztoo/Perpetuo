import { z } from 'zod';

// --- Domain Entites ---

export type ProviderName = 'openai' | 'gemini' | 'groq' | 'openrouter' | string;

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string;
    name?: string;
}

export interface ChatParams {
    model?: string; // Requested model (optional config)
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    user?: string;
    // Extra fields for policy
    [key: string]: any;
}

export interface ChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: {
        index: number;
        message: ChatMessage;
        finish_reason: string;
    }[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// --- Policy & Config ---

export interface ModelConfig {
    name: string;
    provider: ProviderName;
    costPer1kInput: number;
    costPer1kOutput: number;
    maxTokens?: number;
    tags?: string[];
}

export interface ProviderConfig {
    name: ProviderName;
    baseUrl?: string;
    apiKeyEnvVar?: string; // Name of env var to look for if not BYOK
    timeoutMs?: number;
    enabled: boolean;
}

export interface TenantConfig {
    id: string;
    name?: string;
    plan: 'free' | 'pro' | 'enterprise';
    limits: {
        rateLimitMin?: number;
        budgetDay?: number;
    };
    apiKeys: string[];
}

export interface PerpetuoConfig {
    tenants: TenantConfig[];
    providers: ProviderConfig[];
    models: ModelConfig[];
    policies: {
        defaultRouting: string[]; // List of model names
        fallback: {
            strategy: 'deterministic';
            order: string[]; // Default fallback order if no rule matches
            retry: {
                on: number[]; // Status codes
                backoffMs: number;
                maxAttempts: number;
            };
        };
    };
}

// --- Internal ---

export interface NormalizedRequest {
    tenantId: string;
    payload: ChatParams;
    providerKeys: Record<string, string>; // BYOK
}

export interface Decision {
    primaryModel: ModelConfig;
    fallbacks: ModelConfig[];
    traceId: string;
}

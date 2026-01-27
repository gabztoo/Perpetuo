import { z } from "zod";

// --- Types (Mirrors OpenAI partly for familiarity) ---

export interface ClientOptions {
    apiKey?: string; // Not used directly by Perpetuo Gateway mostly, but standard
    baseURL?: string; // Defaults to http://localhost:3000/v1
    tenantId: string; // Required for Perpetuo
    providerKeys?: Record<string, string>; // BYOK: { 'openai': 'sk-...', 'antrhopic': 'sk-...' }
}

export interface ChatCompletionMessageParam {
    role: "system" | "user" | "assistant";
    content: string;
    name?: string;
}

export interface ChatCompletionCreateParams {
    messages: ChatCompletionMessageParam[];
    model?: string; // Optional, defaults to policy
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: "text" | "json_object" };
}

export interface ChatCompletion {
    id: string;
    choices: Array<{
        index: number;
        message: {
            role: "assistant";
            content: string | null;
        };
        finish_reason: string;
    }>;
    model: string; // The actual model used
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// --- The Implementation ---

export class PerpetuoClient {
    private baseURL: string;
    private headers: Record<string, string>;

    public chat: ChatResource;

    constructor(opts: ClientOptions) {
        this.baseURL = (opts.baseURL || "http://localhost:3000/v1").replace(/\/$/, "");

        this.headers = {
            "Content-Type": "application/json",
            "x-tenant-id": opts.tenantId,
        };

        if (opts.providerKeys) {
            for (const [provider, key] of Object.entries(opts.providerKeys)) {
                this.headers[`x-provider-key-${provider.toLowerCase()}`] = key;
            }
        }

        this.chat = new ChatResource(this);
    }

    // Internal fetch wrapper
    public async post<T>(path: string, body: any): Promise<T> {
        const response = await fetch(`${this.baseURL}${path}`, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            let details = "";
            try {
                const json = await response.json();
                details = JSON.stringify(json);
            } catch {
                details = await response.text();
            }
            throw new Error(`Perpetuo Error ${response.status}: ${details}`);
        }

        return response.json() as Promise<T>;
    }
}

class ChatResource {
    private client: PerpetuoClient;
    public completions: CompletionsResource;

    constructor(client: PerpetuoClient) {
        this.client = client;
        this.completions = new CompletionsResource(client);
    }
}

class CompletionsResource {
    private client: PerpetuoClient;

    constructor(client: PerpetuoClient) {
        this.client = client;
    }

    public async create(params: ChatCompletionCreateParams): Promise<ChatCompletion> {
        return this.client.post<ChatCompletion>("/chat/completions", params);
    }
}

// Export default alias for easy import
export const Perpetuo = PerpetuoClient;

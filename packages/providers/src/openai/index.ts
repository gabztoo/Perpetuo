import { fetch } from 'undici';
import { ChatParams, ChatResponse, ProviderConfig } from '@perpetuo/core';
import { IChatProvider, ProviderContext } from '../types';

export class OpenAIProvider implements IChatProvider {
    name = 'openai';

    async invoke(params: ChatParams, config: ProviderConfig, context: ProviderContext): Promise<ChatResponse> {
        const baseUrl = config.baseUrl || 'https://api.openai.com/v1';

        // Construct headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.apiKey}`,
        };

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(params),
            // Use signal for timeout if needed, but undici has timeout options too.
            // Simplest is let Gateway handle overall timeout via AbortController usually,
            // but here we can rely on config.timeoutMs
        });

        if (!response.ok) {
            const errorText = await response.text();
            // Throw with status to help fallback logic
            const err: any = new Error(`OpenAI Provider Error: ${response.status} - ${errorText}`);
            err.statusCode = response.status;
            throw err;
        }

        const data = (await response.json()) as any;

        // Transform if needed (OpenAI fits standard, but we ensure type safety)
        return data as ChatResponse;
    }
}

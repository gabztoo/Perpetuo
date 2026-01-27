import { fetch } from 'undici';
import { ChatParams, ChatResponse, ProviderConfig } from '@perpetuo/core';
import { IChatProvider, ProviderContext } from '../types';

export class OpenRouterProvider implements IChatProvider {
    name = 'openrouter';

    async invoke(params: ChatParams, config: ProviderConfig, context: ProviderContext): Promise<ChatResponse> {
        // OpenRouter uses OpenAI-compatible API
        const baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.apiKey}`,
            'HTTP-Referer': 'https://perpetuo.io',
            'X-Title': 'Perpetuo Gateway'
        };

        // Always use OpenRouter-specific model
        const body = {
            ...params,
            model: 'openai/gpt-3.5-turbo'
        };

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            const err: any = new Error(`OpenRouter Provider Error: ${response.status} - ${errorText}`);
            err.statusCode = response.status;
            throw err;
        }

        const data = (await response.json()) as any;
        return data as ChatResponse;
    }
}

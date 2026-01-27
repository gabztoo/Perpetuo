import { fetch } from 'undici';
import { ChatParams, ChatResponse, ProviderConfig } from '@perpetuo/core';
import { IChatProvider, ProviderContext } from '../types';

export class GroqProvider implements IChatProvider {
    name = 'groq';

    async invoke(params: ChatParams, config: ProviderConfig, context: ProviderContext): Promise<ChatResponse> {
        // Groq uses OpenAI-compatible API
        const baseUrl = config.baseUrl || 'https://api.groq.com/openai/v1';

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.apiKey}`,
        };

        // Always use Groq-specific model (ignore params.model which might be 'router-reliable')
        const body = {
            ...params,
            model: 'llama3-8b-8192'
        };

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            const err: any = new Error(`Groq Provider Error: ${response.status} - ${errorText}`);
            err.statusCode = response.status;
            throw err;
        }

        const data = (await response.json()) as any;
        return data as ChatResponse;
    }
}

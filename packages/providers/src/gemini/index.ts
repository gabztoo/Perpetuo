import { fetch } from 'undici';
import { ChatParams, ChatResponse, ProviderConfig } from '@perpetuo/core';
import { IChatProvider, ProviderContext } from '../types';

export class GeminiProvider implements IChatProvider {
    name = 'gemini';

    async invoke(params: ChatParams, config: ProviderConfig, context: ProviderContext): Promise<ChatResponse> {
        // Always use Gemini-specific model
        const baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        const model = 'gemini-1.5-flash';

        // Convert OpenAI messages to Gemini format
        const geminiContents = params.messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const geminiBody = {
            contents: geminiContents,
            generationConfig: {
                temperature: params.temperature || 0.7,
                maxOutputTokens: params.max_tokens || 1024,
            }
        };

        const response = await fetch(`${baseUrl}/models/${model}:generateContent?key=${context.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            const err: any = new Error(`Gemini Provider Error: ${response.status} - ${errorText}`);
            err.statusCode = response.status;
            throw err;
        }

        const data = (await response.json()) as any;

        // Convert Gemini response to OpenAI format
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return {
            id: 'gemini-' + Date.now(),
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [{
                index: 0,
                message: { role: 'assistant', content },
                finish_reason: 'stop'
            }],
            usage: {
                prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
                completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
                total_tokens: data.usageMetadata?.totalTokenCount || 0
            }
        };
    }
}

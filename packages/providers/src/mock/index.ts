import { ChatParams, ChatResponse, ProviderConfig } from '@perpetuo/core';
import { IChatProvider, ProviderContext } from '../types';

export class MockProvider implements IChatProvider {
    name = 'mock';

    async invoke(params: ChatParams, config: ProviderConfig, context: ProviderContext): Promise<ChatResponse> {
        // Check for special failure triggers in prompt
        // e.g. "fail-429" in content triggers a 429 error
        const content = params.messages[0]?.content || '';

        if (content.includes('fail-429')) {
            const err: any = new Error('Mock Rate Limit');
            err.statusCode = 429;
            throw err;
        }

        if (content.includes('fail-500')) {
            const err: any = new Error('Mock Internal Server Error');
            err.statusCode = 500;
            throw err;
        }

        if (content.includes('timeout')) {
            await new Promise(r => setTimeout(r, (config.timeoutMs || 2000) + 100)); // Sleep longer than timeout
            // This might not actually throw if called directly, but caller will timeout
        }

        return {
            id: 'mock-' + Date.now(),
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: params.model || 'mock-model',
            choices: [
                {
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: `Mock response to: ${content}`,
                    },
                    finish_reason: 'stop',
                },
            ],
            usage: {
                prompt_tokens: 10,
                completion_tokens: 10,
                total_tokens: 20,
            },
        };
    }
}

export * from './types';
export * from './openai';
export * from './mock';

import { OpenAIProvider } from './openai';
import { MockProvider } from './mock';
import { IChatProvider } from './types';

// Registry
export const providers: Record<string, IChatProvider> = {
    openai: new OpenAIProvider(),
    mock: new MockProvider(),
};

export function getProvider(name: string): IChatProvider {
    const p = providers[name];
    if (!p) throw new Error(`Provider ${name} not implemented`);
    return p;
}

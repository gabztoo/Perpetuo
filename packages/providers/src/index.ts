export * from './types';
export * from './openai';
export * from './groq';
export * from './gemini';
export * from './openrouter';

import { OpenAIProvider } from './openai';
import { GroqProvider } from './groq';
import { GeminiProvider } from './gemini';
import { OpenRouterProvider } from './openrouter';
import { IChatProvider } from './types';

// Registry - Production providers only
export const providers: Record<string, IChatProvider> = {
    openai: new OpenAIProvider(),
    groq: new GroqProvider(),
    gemini: new GeminiProvider(),
    openrouter: new OpenRouterProvider(),
};

export function getProvider(name: string): IChatProvider {
    const p = providers[name];
    if (!p) throw new Error(`Provider ${name} not implemented. Available: ${Object.keys(providers).join(', ')}`);
    return p;
}


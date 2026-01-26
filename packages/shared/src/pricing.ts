
export interface ModelPricing {
    input: number;  // Cost per 1k input tokens
    output: number; // Cost per 1k output tokens
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
    // OpenAI
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },

    // Anthropic
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },

    // Google
    'gemini-1.0-pro': { input: 0.0005, output: 0.0015 },

    // Fallback/Default
    'default': { input: 0.001, output: 0.002 }
};

export function getModelPricing(modelId: string): ModelPricing {
    // Exact match
    if (MODEL_PRICING[modelId]) return MODEL_PRICING[modelId];

    // Fuzzy / Prefix match
    for (const key of Object.keys(MODEL_PRICING)) {
        if (modelId.startsWith(key)) return MODEL_PRICING[key];
    }

    return MODEL_PRICING['default'];
}

export function calculateCost(modelId: string, promptTokens: number, completionTokens: number): number {
    const pricing = getModelPricing(modelId);

    // Use high precision integers (multiplying by 1e9 to handle small fractional costs safely)
    const SCALER = 1e9;

    const inputCostScaled = (promptTokens / 1000) * (pricing.input * SCALER);
    const outputCostScaled = (completionTokens / 1000) * (pricing.output * SCALER);

    // Return to standard float for storage, but rounded to 9 decimal places
    return Math.round(inputCostScaled + outputCostScaled) / SCALER;
}

import { PerpetuoConfig, ModelConfig } from '../types';

export class DecisionEngine {
    constructor(private config: PerpetuoConfig) { }

    public selectModels(payload: any): ModelConfig[] {
        const requestedModelName = payload.model;
        const models = this.config.models;
        const fallbackOrder = this.config.policies.fallback.order;
        const defaultRouting = this.config.policies.defaultRouting;

        let primaryModel: ModelConfig | undefined;

        // 1. Try to match requested model
        if (requestedModelName) {
            primaryModel = models.find((m) => m.name === requestedModelName);
        }

        // 2. If no valid primary found (or not requested), use default routing [0]
        if (!primaryModel && defaultRouting.length > 0) {
            const defaultName = defaultRouting[0];
            primaryModel = models.find((m) => m.name === defaultName);
        }

        // 3. If still no model, basic error or fail safe (shouldn't happen with valid config)
        if (!primaryModel) {
            throw new Error(`No model found matching request '${requestedModelName}' and no default routing available.`);
        }

        // 4. Build chain: Primary + Fallbacks
        // Use fallback order from policy, but exclude the primary model
        const chain: ModelConfig[] = [primaryModel];

        for (const name of fallbackOrder) {
            if (name !== primaryModel.name) {
                const fallbackModel = models.find((m) => m.name === name);
                if (fallbackModel) {
                    chain.push(fallbackModel);
                }
            }
        }

        return chain;
    }

    public getModelConfig(name: string): ModelConfig | undefined {
        return this.config.models.find((m) => m.name === name);
    }
}

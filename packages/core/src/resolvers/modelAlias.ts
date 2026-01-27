/**
 * ModelAliasResolver
 * 
 * Interpreta aliases lógicos de modelo para configuração real
 * O cliente NUNCA envia provider diretamente
 * 
 * Exemplos:
 * - "gpt-4" → { intent: "chat", tier: "default", preferredModels: ["openai", ...] }
 * - "perpetuo/chat-fast" → { intent: "chat", tier: "fast", preferredModels: [...] }
 * - "gpt-4" → resolve para ModelConfig por policy de workspace
 */

import { ModelConfig, PerpetuoConfig } from '../types';

export interface AliasResolution {
    requestedAlias: string;
    intent: 'chat' | 'embedding' | 'completion'; // Tipo de tarefa
    tier: 'default' | 'fast' | 'cheap' | 'quality'; // Nível de recurso
    explanation: string; // Por quê essa interpretação
}

export class ModelAliasResolver {
    constructor(private config: PerpetuoConfig) {}

    /**
     * Resolve um alias de modelo para a configuração real
     * Nunca retorna provider — apenas intent + tier
     * O provider é decidido depois pelo ProviderSelector
     */
    resolve(requestedAlias: string): AliasResolution {
        // 1. Tenta match exato em models configurados
        const exactMatch = this.config.models.find((m) => m.name === requestedAlias);
        if (exactMatch) {
            return {
                requestedAlias,
                intent: this.inferIntent(exactMatch.name),
                tier: this.inferTier(exactMatch.name),
                explanation: `Exact match to configured model: ${exactMatch.name}`,
            };
        }

        // 2. Tenta interpretação semântica de alias Perpetuo
        if (requestedAlias.startsWith('perpetuo/')) {
            return this.resolvePerpetuo(requestedAlias);
        }

        // 3. Tenta interpretação de prefixo comum (gpt-, claude-, etc)
        const semanticMatch = this.resolveByPattern(requestedAlias);
        if (semanticMatch) {
            return semanticMatch;
        }

        // 4. Fallback: usa default do workspace
        return {
            requestedAlias,
            intent: 'chat',
            tier: 'default',
            explanation: `Alias "${requestedAlias}" not recognized, using default workspace routing`,
        };
    }

    /**
     * Resolve "perpetuo/chat-fast", "perpetuo/embedding-cheap", etc
     */
    private resolvePerpetuo(alias: string): AliasResolution {
        const parts = alias.split('/')[1]?.split('-') || [];
        const intent = this.parseIntent(parts[0]) || 'chat';
        const tier = this.parseTier(parts[1]) || 'default';

        return {
            requestedAlias: alias,
            intent,
            tier,
            explanation: `Perpetuo semantic alias: intent=${intent}, tier=${tier}`,
        };
    }

    /**
     * Resolve patterns como "gpt-4", "claude-3-opus", "gemini-pro"
     */
    private resolveByPattern(alias: string): AliasResolution | null {
        // Nota: Apenas interpretamos intent + tier aqui
        // Provider será decidido por StrategyResolver + ProviderSelector

        if (alias.toLowerCase().includes('embedding')) {
            return {
                requestedAlias: alias,
                intent: 'embedding',
                tier: 'default',
                explanation: `Pattern match: embedding model detected`,
            };
        }

        if (alias.toLowerCase().includes('turbo')) {
            return {
                requestedAlias: alias,
                intent: 'chat',
                tier: 'fast',
                explanation: `Pattern match: turbo = fast tier`,
            };
        }

        // Padrão default para chat models
        return {
            requestedAlias: alias,
            intent: 'chat',
            tier: 'default',
            explanation: `Pattern match: assumed chat model at default tier`,
        };
    }

    private parseIntent(
        str: string | undefined
    ): 'chat' | 'embedding' | 'completion' {
        if (!str) return 'chat';
        if (str.includes('embed')) return 'embedding';
        if (str.includes('completion')) return 'completion';
        return 'chat';
    }

    private parseTier(str: string | undefined): 'default' | 'fast' | 'cheap' | 'quality' {
        if (!str) return 'default';
        if (str.includes('fast')) return 'fast';
        if (str.includes('cheap')) return 'cheap';
        if (str.includes('quality')) return 'quality';
        return 'default';
    }

    private inferIntent(modelName: string): 'chat' | 'embedding' | 'completion' {
        if (modelName.includes('embedding')) return 'embedding';
        if (modelName.includes('completion')) return 'completion';
        return 'chat';
    }

    private inferTier(modelName: string): 'default' | 'fast' | 'cheap' | 'quality' {
        if (modelName.includes('turbo') || modelName.includes('fast') || modelName.includes('3.5'))
            return 'fast';
        if (modelName.includes('cheap') || modelName.includes('mini') || modelName.includes('small'))
            return 'cheap';
        if (modelName.includes('quality') || modelName.includes('advanced') || modelName.includes('4-turbo'))
            return 'quality';
        return 'default';
    }
}

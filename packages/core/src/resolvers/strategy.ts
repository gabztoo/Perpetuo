/**
 * StrategyResolver
 * 
 * Define COMO ordenar os providers elegíveis
 * 
 * Fontes de estratégia (ordem de prioridade):
 * 1. Header opcional: X-Perpetuo-Route (fastest | cheapest | reliable | default)
 * 2. Default do workspace (dashboard)
 * 3. Fallback: "default"
 * 
 * Saída: strategy que será usada pelo ProviderSelector
 */

import { TenantConfig } from '../types';

export type Strategy = 'default' | 'fastest' | 'cheapest' | 'reliable';

export interface StrategyResolution {
    strategy: Strategy;
    source: 'header' | 'workspace' | 'fallback';
    explanation: string;
}

export class StrategyResolver {
    /**
     * Resolve a estratégia para este request
     */
    resolve(
        headerValue: string | undefined,
        workspaceStrategy: Strategy | undefined
    ): StrategyResolution {
        // 1. Prioridade: Header
        if (headerValue && this.isValidStrategy(headerValue)) {
            return {
                strategy: headerValue as Strategy,
                source: 'header',
                explanation: `Strategy from header X-Perpetuo-Route: ${headerValue}`,
            };
        }

        // 2. Prioridade: Workspace default
        if (workspaceStrategy && this.isValidStrategy(workspaceStrategy)) {
            return {
                strategy: workspaceStrategy,
                source: 'workspace',
                explanation: `Strategy from workspace config: ${workspaceStrategy}`,
            };
        }

        // 3. Fallback
        return {
            strategy: 'default',
            source: 'fallback',
            explanation: 'Using default strategy (deterministic order)',
        };
    }

    private isValidStrategy(value: string | Strategy): value is Strategy {
        return ['default', 'fastest', 'cheapest', 'reliable'].includes(value);
    }
}

/**
 * ProviderSelector
 * 
 * Ordena providers elegíveis baseado em:
 * 1. Estratégia escolhida (fastest, cheapest, reliable, default)
 * 2. Métricas recentes (se existirem)
 * 3. Prioridade manual como fallback
 * 
 * Saída: lista ordenada de providers para tentar
 */

import { ModelConfig, ProviderConfig } from '../types';
import { Strategy } from '../resolvers/strategy';

export interface ProviderMetrics {
    providerName: string;
    avgLatencyMs: number;
    lastHourErrorRate: number;
    costPer1kTokens: number;
    lastSuccessAt: number; // timestamp
}

export class ProviderSelector {
    /**
     * Seleciona e ordena providers elegíveis baseado em estratégia
     */
    selectAndOrder(
        eligibleProviders: ProviderConfig[],
        models: ModelConfig[],
        strategy: Strategy,
        metrics?: Map<string, ProviderMetrics>
    ): ProviderConfig[] {
        if (eligibleProviders.length === 0) {
            return [];
        }

        // Se só há um, não ordena
        if (eligibleProviders.length === 1) {
            return eligibleProviders;
        }

        switch (strategy) {
            case 'fastest':
                return this.orderBySpeed(eligibleProviders, metrics);

            case 'cheapest':
                return this.orderByCost(eligibleProviders, models);

            case 'reliable':
                return this.orderByReliability(eligibleProviders, metrics);

            case 'default':
            default:
                return this.orderByPriority(eligibleProviders);
        }
    }

    /**
     * Ordena por latência (menor primeiro)
     */
    private orderBySpeed(
        providers: ProviderConfig[],
        metrics?: Map<string, ProviderMetrics>
    ): ProviderConfig[] {
        if (!metrics || metrics.size === 0) {
            // Fallback: ordem de config
            return providers;
        }

        const sorted = [...providers].sort((a, b) => {
            const metricsA = metrics.get(a.name) || {
                avgLatencyMs: Infinity,
                lastSuccessAt: 0,
            };
            const metricsB = metrics.get(b.name) || {
                avgLatencyMs: Infinity,
                lastSuccessAt: 0,
            };

            // Prefere mais recente
            if (metricsA.lastSuccessAt !== metricsB.lastSuccessAt) {
                return metricsB.lastSuccessAt - metricsA.lastSuccessAt;
            }

            // Depois latência
            return metricsA.avgLatencyMs - metricsB.avgLatencyMs;
        });

        return sorted;
    }

    /**
     * Ordena por custo (menor primeiro)
     */
    private orderByCost(
        providers: ProviderConfig[],
        models: ModelConfig[]
    ): ProviderConfig[] {
        const costMap = new Map<string, number>();

        // Calcula custo médio por provider
        for (const provider of providers) {
            const modelsForProvider = models.filter((m) => m.provider === provider.name);
            if (modelsForProvider.length === 0) {
                costMap.set(provider.name, Infinity);
                continue;
            }

            const avgCost =
                modelsForProvider.reduce((sum, m) => {
                    return sum + m.costPer1kInput + m.costPer1kOutput;
                }, 0) / modelsForProvider.length;

            costMap.set(provider.name, avgCost);
        }

        const sorted = [...providers].sort((a, b) => {
            const costA = costMap.get(a.name) || Infinity;
            const costB = costMap.get(b.name) || Infinity;
            return costA - costB;
        });

        return sorted;
    }

    /**
     * Ordena por confiabilidade (erro mais baixo)
     */
    private orderByReliability(
        providers: ProviderConfig[],
        metrics?: Map<string, ProviderMetrics>
    ): ProviderConfig[] {
        if (!metrics || metrics.size === 0) {
            // Fallback: ordem de config
            return providers;
        }

        const sorted = [...providers].sort((a, b) => {
            const metricsA = metrics.get(a.name) || {
                lastHourErrorRate: 1.0, // 100% erro = pior
            };
            const metricsB = metrics.get(b.name) || {
                lastHourErrorRate: 1.0,
            };

            // Menor taxa de erro primeiro
            return metricsA.lastHourErrorRate - metricsB.lastHourErrorRate;
        });

        return sorted;
    }

    /**
     * Ordena por prioridade manual (padrão)
     * Mantém ordem original ou usa índice como prioridade
     */
    private orderByPriority(providers: ProviderConfig[]): ProviderConfig[] {
        // Mantém ordem original (já ordenada por prioridade no banco)
        return providers;
    }
}

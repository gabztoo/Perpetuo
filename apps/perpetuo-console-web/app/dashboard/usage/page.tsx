"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ensureWorkspaceId } from "@/lib/workspace";

interface UsageSummary {
    total_requests: number;
    total_input_tokens: number;
    total_output_tokens: number;
    period_start?: string;
}

interface ProviderUsageItem {
    tokens: number;
    cost?: number;
}

export default function UsagePage() {
    const [summary, setSummary] = useState<UsageSummary | null>(null);
    const [providerUsage, setProviderUsage] = useState<Record<string, ProviderUsageItem>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsage();
    }, []);

    const fetchUsage = async () => {
        try {
            setLoading(true);
            setError(null);
            const workspaceId = await ensureWorkspaceId();
            if (!workspaceId) {
                setError('Workspace não encontrado.');
                setSummary(null);
                return;
            }

            const [summaryResponse, providerResponse] = await Promise.all([
                api.get(`/workspaces/${workspaceId}/usage`),
                api.get(`/workspaces/${workspaceId}/usage/by-provider?days=7`),
            ]);

            const summaryPayload = summaryResponse.data?.data ?? summaryResponse.data;
            const providerPayload = providerResponse.data?.data ?? providerResponse.data;

            setSummary(summaryPayload);
            setProviderUsage(providerPayload || {});
        } catch (e) {
            console.error(e);
            setError('Falha ao carregar usage.');
        } finally {
            setLoading(false);
        }
    };

    const totalTokens = summary ? summary.total_input_tokens + summary.total_output_tokens : 0;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Usage</h2>
                <p className="text-muted-foreground">Consumo de tokens e requisições por workspace.</p>
            </div>

            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="p-6">Carregando...</div>
            ) : summary ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="p-4 border rounded">
                        <p className="text-xs text-muted-foreground">Total requests</p>
                        <p className="text-2xl font-bold">{summary.total_requests}</p>
                    </div>
                    <div className="p-4 border rounded">
                        <p className="text-xs text-muted-foreground">Input tokens</p>
                        <p className="text-2xl font-bold">{summary.total_input_tokens}</p>
                    </div>
                    <div className="p-4 border rounded">
                        <p className="text-xs text-muted-foreground">Output tokens</p>
                        <p className="text-2xl font-bold">{summary.total_output_tokens}</p>
                    </div>
                    <div className="p-4 border rounded">
                        <p className="text-xs text-muted-foreground">Total tokens</p>
                        <p className="text-2xl font-bold">{totalTokens}</p>
                    </div>
                </div>
            ) : (
                <div className="p-6 border rounded text-muted-foreground">Sem dados de usage.</div>
            )}

            <div className="space-y-3">
                <h3 className="text-lg font-semibold">Por provider (últimos 7 dias)</h3>
                {Object.keys(providerUsage).length === 0 ? (
                    <div className="p-6 border rounded text-muted-foreground">Nenhum dado por provider.</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(providerUsage).map(([provider, usage]) => (
                            <div key={provider} className="p-4 border rounded">
                                <p className="text-sm font-semibold">{provider}</p>
                                <p className="text-sm text-muted-foreground">Tokens: {usage.tokens}</p>
                                <p className="text-sm text-muted-foreground">Custo: {usage.cost !== undefined ? `$${usage.cost.toFixed(2)}` : '—'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
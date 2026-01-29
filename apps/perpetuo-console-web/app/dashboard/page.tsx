"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Activity, KeyRound, Server, Sigma } from "lucide-react";
import { ensureWorkspaceId } from "@/lib/workspace";

interface DashboardStats {
    totalRequests: number;
    totalTokens: number;
    providers: number;
    apiKeys: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const workspaceId = await ensureWorkspaceId();
            if (!workspaceId) {
                setError('Workspace não encontrado.');
                return;
            }

            const [usageResponse, providersResponse, apiKeysResponse] = await Promise.all([
                api.get(`/workspaces/${workspaceId}/usage`),
                api.get(`/workspaces/${workspaceId}/providers`),
                api.get(`/workspaces/${workspaceId}/api-keys`),
            ]);

            const usagePayload = usageResponse.data?.data ?? usageResponse.data;
            const providersPayload = providersResponse.data?.data ?? providersResponse.data;
            const apiKeysPayload = apiKeysResponse.data?.data ?? apiKeysResponse.data;

            const totalRequests = Number(usagePayload?.total_requests ?? 0);
            const totalTokens = Number(usagePayload?.total_input_tokens ?? 0) + Number(usagePayload?.total_output_tokens ?? 0);
            const providers = Array.isArray(providersPayload) ? providersPayload.length : 0;
            const apiKeys = Array.isArray(apiKeysPayload) ? apiKeysPayload.length : 0;

            setStats({
                totalRequests,
                totalTokens,
                providers,
                apiKeys,
            });
        } catch (e) {
            console.error('Failed to fetch dashboard stats:', e);
            setError('Falha ao carregar estatísticas. Verifique a conexão com o backend.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center p-8">Carregando...</div>;

    if (error) return (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
        </div>
    );

    if (!stats) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Requisições processadas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                        <Sigma className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Input + output</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Providers</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.providers}</div>
                        <p className="text-xs text-muted-foreground">Providers configurados</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">API Keys</CardTitle>
                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.apiKeys}</div>
                        <p className="text-xs text-muted-foreground">Tokens ativos e revogados</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Atividade Recente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Gráfico disponível quando métricas estiverem configuradas</p>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Routes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Configure rotas no Control Plane para visualizar</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


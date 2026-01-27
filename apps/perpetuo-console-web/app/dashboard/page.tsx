"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Activity, DollarSign } from "lucide-react";

interface DashboardStats {
    requests: number;
    errors: number;
    cost: number;
    activeKeys: number;
    errorRate: string;
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
            // Fetch real stats from Control Plane API
            const [keysResponse] = await Promise.all([
                api.get('/provider-keys?tenantId=gasto-recorrente').catch(() => ({ data: [] }))
            ]);

            const activeKeys = Array.isArray(keysResponse.data)
                ? keysResponse.data.filter((k: any) => k.status === 'ACTIVE').length
                : 0;

            // Stats will be populated from real metrics once available
            setStats({
                requests: 0,
                errors: 0,
                cost: 0,
                activeKeys,
                errorRate: '0%'
            });
        } catch (e) {
            console.error('Failed to fetch dashboard stats:', e);
            setError('Falha ao carregar estatísticas. Verifique a conexão com o Control Plane.');
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
                        <div className="text-2xl font-bold">{stats.requests.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Requisições processadas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Errors</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.errors}</div>
                        <p className="text-xs text-muted-foreground text-red-500">{stats.errorRate} Error Rate</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.cost.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Custo estimado hoje</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
                        <Key className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeKeys}</div>
                        <p className="text-xs text-muted-foreground">Provider keys ativas</p>
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

// Icon Stub
function ShieldAlert(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
        </svg>
    )
}

function Key(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="7.5" cy="15.5" r="5.5" />
            <path d="m21 2-9.6 9.6" />
            <path d="m15.5 7.5 3 3L22 7l-3-3" />
        </svg>
    )
}

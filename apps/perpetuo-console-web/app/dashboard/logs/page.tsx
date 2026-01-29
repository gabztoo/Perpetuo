"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ensureWorkspaceId } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RequestLogItem {
    id: string;
    provider_used: string;
    model: string;
    status_code: number;
    input_tokens: number;
    output_tokens: number;
    duration_ms: number;
    error_message?: string;
    created_at: string;
}

interface PaginatedLogs {
    items: RequestLogItem[];
    total: number;
    page: number;
    limit: number;
}

export default function LogsPage() {
    const [logs, setLogs] = useState<RequestLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);
    const [provider, setProvider] = useState("");

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const workspaceId = await ensureWorkspaceId();
            if (!workspaceId) {
                setError('Workspace não encontrado.');
                setLogs([]);
                return;
            }

            const queryProvider = provider.trim();
            const query = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (queryProvider) query.set('provider', queryProvider);

            const response = await api.get(`/workspaces/${workspaceId}/logs?${query.toString()}`);
            const payload = response.data?.data ?? response.data;
            const paginated = payload as PaginatedLogs;

            setLogs(Array.isArray(paginated?.items) ? paginated.items : []);
            setTotal(Number(paginated?.total ?? 0));
        } catch (e) {
            console.error(e);
            setError('Falha ao carregar logs.');
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Logs</h2>
                <p className="text-muted-foreground">Histórico de requisições processadas pelo gateway.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                <Input
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="Filtrar por provider (ex: openai)"
                    className="max-w-sm"
                />
                <Button onClick={() => { setPage(1); fetchLogs(); }} disabled={loading}>
                    Aplicar filtro
                </Button>
            </div>

            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="p-6">Carregando...</div>
            ) : logs.length === 0 ? (
                <div className="p-6 border rounded text-muted-foreground">Nenhum log encontrado.</div>
            ) : (
                <div className="rounded-md border border-slate-200 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 p-3 bg-slate-50 text-xs font-semibold text-slate-500">
                        <div>Data</div>
                        <div>Provider</div>
                        <div>Model</div>
                        <div>Status</div>
                        <div>Tokens</div>
                        <div>Duração</div>
                        <div>Erro</div>
                    </div>
                    {logs.map((log) => (
                        <div key={log.id} className="grid grid-cols-1 lg:grid-cols-7 gap-4 p-4 border-t text-sm">
                            <div>{new Date(log.created_at).toLocaleString('pt-BR')}</div>
                            <div className="font-medium">{log.provider_used}</div>
                            <div>{log.model}</div>
                            <div className={log.status_code >= 400 ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                                {log.status_code}
                            </div>
                            <div>{log.input_tokens + log.output_tokens}</div>
                            <div>{log.duration_ms} ms</div>
                            <div className="text-xs text-slate-500 break-words">{log.error_message || '—'}</div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
                    Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                </span>
                <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>
                    Próxima
                </Button>
            </div>
        </div>
    );
}
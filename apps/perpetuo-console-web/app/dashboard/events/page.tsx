"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, RefreshCw } from "lucide-react";

interface PerpetuoEvent {
    id: string;
    type: string;
    tenantId: string;
    timestamp: number;
    meta: Record<string, any>;
}

export default function EventsPage() {
    const [events, setEvents] = useState<PerpetuoEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch real events from Control Plane API
            const response = await api.get('/events?tenantId=gasto-recorrente&limit=50');

            if (Array.isArray(response.data)) {
                setEvents(response.data);
            } else {
                setEvents([]);
            }
        } catch (e: any) {
            console.error('Failed to fetch events:', e);
            setError('Falha ao carregar eventos. Endpoint não disponível ou sem dados.');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Events & Logs</h2>
                <button
                    onClick={fetchEvents}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </button>
            </div>

            {error && (
                <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                    {error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Activity className="mr-2 h-5 w-5" /> Eventos Recentes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center p-8">Carregando...</div>
                    ) : events.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            Nenhum evento encontrado. Os eventos serão exibidos conforme requisições são processadas pelo Gateway.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {events.map((evt) => (
                                <div key={evt.id} className="flex flex-col border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-sm">{evt.type}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(evt.timestamp).toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500 font-mono whitespace-pre-wrap">
                                        {JSON.stringify(evt.meta, null, 2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

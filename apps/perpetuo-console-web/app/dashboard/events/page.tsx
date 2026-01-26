"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            // Fetch internal events or exposed events from CP
            // Assuming CP has an endpoint or we mock it for now.
            // In V1 we had GET /internal/events on Gateway.
            // In V2, Control Plane should proxy or read from DB event log.
            // Let's assume we read from a mocked endpoint or partial implementation.

            // Mock data for UI demonstration if endpoint not ready
            const mockEvents = [
                { id: "evt_1", type: "request_received", timestamp: Date.now() - 1000, meta: { model: "gpt-4" } },
                { id: "evt_2", type: "decision_made", timestamp: Date.now() - 800, meta: { chain: ["openai", "anthropic"] } },
                { id: "evt_3", type: "provider_call", timestamp: Date.now() - 500, meta: { provider: "openai", latency: 240 } },
            ];
            setEvents(mockEvents);
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Events & Logs</h2>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Activity className="mr-2 h-5 w-5" /> Recent Events
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {events.map((evt) => (
                            <div key={evt.id} className="flex flex-col border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-sm">{evt.type}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(evt.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <div className="mt-1 text-xs text-slate-500 font-mono">
                                    {JSON.stringify(evt.meta, null, 2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

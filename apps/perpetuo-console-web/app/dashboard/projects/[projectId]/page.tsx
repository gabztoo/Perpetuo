"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";

export default function ProjectRoutesPage() {
    const params = useParams();
    const projectId = params.projectId;
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (projectId) fetchRoutes();
    }, [projectId]);

    const fetchRoutes = async () => {
        try {
            const res = await api.get(`/projects/${projectId}/routes`);
            setRoutes(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        const key = prompt("Route Key (e.g., 'chatbot', 'doc-qa'):");
        if (!key) return;
        try {
            await api.post(`/projects/${projectId}/routes`, { key, displayName: key });
            fetchRoutes();
        } catch (e) {
            alert("Failed to create route");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/dashboard/projects">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">Routes</h2>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> New Route
                </Button>
            </div>

            <div className="grid gap-4">
                {routes.map((route) => (
                    <Card key={route.id} className="flex flex-row items-center justify-between p-6">
                        <div>
                            <CardTitle className="text-lg">{route.key}</CardTitle>
                            <CardDescription>
                                {route.policy ? `Mode: ${route.policy.mode}` : "No policy configured"}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Link href={`/dashboard/routes/${route.id}`}>
                                <Button variant="outline">Configure Policy</Button>
                            </Link>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

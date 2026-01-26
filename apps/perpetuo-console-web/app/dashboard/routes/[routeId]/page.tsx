"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function RouteEditorPage() {
    const params = useParams();
    const router = useRouter();
    const routeId = params.routeId;

    // Simple state for MVP
    const [mode, setMode] = useState("CUSTOM");
    const [modelOrder, setModelOrder] = useState("openai:gpt-4, anthropic:claude-3-opus");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const models = modelOrder.split(",").map(s => s.trim()).filter(Boolean);

            await api.put(`/routes/${routeId}/policy`, {
                mode,
                rules: [
                    {
                        priority: 1,
                        matchJson: {}, // Match all
                        actionJson: {
                            modelOrder: models,
                            fallbackDepth: models.length
                        }
                    }
                ]
            });
            alert("Policy Saved!");
        } catch (e) {
            console.error(e);
            alert("Failed to save");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
                <h2 className="text-3xl font-bold tracking-tight">Configure Route</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Policy Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Mode</label>
                        <select
                            className="w-full p-2 border rounded-md bg-transparent"
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                        >
                            <option value="CUSTOM">Custom</option>
                            <option value="RELIABLE">Reliable (Low Error)</option>
                            <option value="CHEAPEST">Cheapest</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Model Chain (comma separated)</label>
                        <textarea
                            className="w-full p-2 border rounded-md bg-transparent h-24"
                            value={modelOrder}
                            onChange={(e) => setModelOrder(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Example: <code>openai:gpt-4, anthropic:claude-3-opus, openai:gpt-3.5-turbo</code>
                        </p>
                    </div>

                    <Button onClick={handleSave} disabled={loading}>
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? "Saving..." : "Save Policy"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

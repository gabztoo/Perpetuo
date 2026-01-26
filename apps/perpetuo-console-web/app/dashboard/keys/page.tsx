"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Key, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const PROVIDERS = [
    { id: "openai", name: "OpenAI (GPT)", icon: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" },
    { id: "gemini", name: "Google (Gemini)", icon: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" },
    { id: "anthropic", name: "Anthropic (Claude)", icon: "https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg" },
    { id: "deepseek", name: "DeepSeek", icon: "" },
    { id: "mistral", name: "Mistral AI", icon: "" },
    { id: "groq", name: "Groq", icon: "" },
    { id: "huggingface", name: "Hugging Face", icon: "" },
];

export default function KeysPage() {
    const [keys, setKeys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form State
    const [selectedProvider, setSelectedProvider] = useState<string>("");
    const [keyName, setKeyName] = useState("");
    const [keyValue, setKeyValue] = useState("");
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        try {
            const tenantsRes = await api.get('/tenants/current');
            if (tenantsRes.data.length > 0) {
                const tenantId = tenantsRes.data[0].tenantId;
                const res = await api.get(`/provider-keys?tenantId=${tenantId}`);
                setKeys(res.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = (providerId: string) => {
        setSelectedProvider(providerId);
        setKeyName("");
        setKeyValue("");
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!keyValue) return;
        setSubmitLoading(true);
        try {
            const tenantsRes = await api.get('/tenants/current');
            const tenantId = tenantsRes.data[0].tenantId;

            await api.post(`/provider-keys?tenantId=${tenantId}`, {
                provider: selectedProvider,
                name: keyName || selectedProvider,
                key: keyValue
            });

            setIsDialogOpen(false);
            fetchKeys();
        } catch (e) {
            console.error(e);
            alert("Failed to create key");
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    const existingProviders = new Set(keys.map(k => k.provider));

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Bring Your Own Key (BYOK)</h2>
                <p className="text-muted-foreground">Use your own provider API keys to access AI Gateway.</p>
            </div>

            <div className="rounded-md border border-slate-200">
                {PROVIDERS.map((provider) => {
                    const isConfigured = existingProviders.has(provider.id);
                    const existingKey = keys.find(k => k.provider === provider.id);

                    return (
                        <div key={provider.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-slate-50 transition">
                            <div className="flex items-center space-x-4">
                                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                    {/* Simplified Icon */}
                                    <span className="font-bold text-xs">{provider.name.substring(0, 2).toUpperCase()}</span>
                                </div>
                                <div>
                                    <p className="font-medium">{provider.name}</p>
                                    {isConfigured ? (
                                        <p className="text-xs text-green-600 font-medium flex items-center">
                                            ● Active (ending in {existingKey.keyLast4})
                                        </p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">Not configured</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                {isConfigured ? (
                                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => {/* TODO: Delete */ }}>
                                        Remove
                                    </Button>
                                ) : (
                                    <Button size="sm" onClick={() => handleAddClick(provider.id)}>
                                        Add
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add {PROVIDERS.find(p => p.id === selectedProvider)?.name} Key</DialogTitle>
                        <DialogDescription>
                            Enter your API key below. It will be encrypted and stored securely.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                                placeholder="Optional name"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="key" className="text-right">
                                API Key
                            </Label>
                            <Input
                                id="key"
                                type="password"
                                value={keyValue}
                                onChange={(e) => setKeyValue(e.target.value)}
                                placeholder="sk-..."
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleSubmit} disabled={submitLoading}>
                            {submitLoading ? "Saving..." : "Save Key"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

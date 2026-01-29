"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ensureWorkspaceId } from "@/lib/workspace";

const PROVIDERS = [
    { id: "openai", name: "OpenAI" },
    { id: "anthropic", name: "Anthropic" },
    { id: "google", name: "Google" },
    { id: "cohere", name: "Cohere" },
    { id: "mistral", name: "Mistral" },
];

interface ProviderKey {
    id: string;
    provider: string;
    priority: number;
    enabled: boolean;
    created_at?: string;
    updated_at?: string;
}

export default function KeysPage() {
    const [keys, setKeys] = useState<ProviderKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [selectedProvider, setSelectedProvider] = useState<string>("");
    const [keyValue, setKeyValue] = useState("");
    const [priority, setPriority] = useState<number>(1);
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        try {
            setLoading(true);
            setError(null);
            const workspaceId = await ensureWorkspaceId();
            if (!workspaceId) {
                setError('Workspace não encontrado.');
                setKeys([]);
                return;
            }
            const res = await api.get(`/workspaces/${workspaceId}/providers`);
            const payload = res.data?.data ?? res.data;
            setKeys(Array.isArray(payload) ? payload : []);
        } catch (e) {
            console.error(e);
            setError('Falha ao carregar providers.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = (providerId: string) => {
        setSelectedProvider(providerId);
        setKeyValue("");
        setPriority(1);
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!keyValue) return;
        setSubmitLoading(true);
        try {
            const workspaceId = await ensureWorkspaceId();
            if (!workspaceId) {
                setError('Workspace não encontrado.');
                return;
            }

            await api.post(`/workspaces/${workspaceId}/providers`, {
                provider: selectedProvider,
                api_key: keyValue,
                priority: priority || 1
            });

            setIsDialogOpen(false);
            fetchKeys();
        } catch (e) {
            console.error(e);
            alert("Falha ao salvar provider key");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleRemove = async (providerId: string) => {
        try {
            const workspaceId = await ensureWorkspaceId();
            if (!workspaceId) {
                setError('Workspace não encontrado.');
                return;
            }
            await api.delete(`/workspaces/${workspaceId}/providers/${providerId}`);
            fetchKeys();
        } catch (e) {
            console.error(e);
            alert('Falha ao remover provider key');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    const existingProviders = new Set(keys.map(k => k.provider));

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Providers (BYOK)</h2>
                <p className="text-muted-foreground">Adicione chaves de provedores para uso no Gateway.</p>
            </div>

            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="rounded-md border border-slate-200">
                {PROVIDERS.map((provider) => {
                    const isConfigured = existingProviders.has(provider.id);
                    const existingKey = keys.find(k => k.provider === provider.id);
                    const existingKeyId = existingKey?.id;

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
                                            ● {existingKey?.enabled ? 'Ativo' : 'Desativado'} • prioridade {existingKey?.priority}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">Not configured</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                {isConfigured ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => existingKeyId && handleRemove(existingKeyId)}
                                    >
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
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="priority" className="text-right">
                                Priority
                            </Label>
                            <Input
                                id="priority"
                                type="number"
                                min={1}
                                value={priority}
                                onChange={(e) => setPriority(Number(e.target.value) || 1)}
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

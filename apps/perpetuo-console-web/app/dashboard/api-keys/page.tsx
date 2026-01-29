"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ensureWorkspaceId } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyItem {
    id: string;
    name: string;
    key_hash?: string;
    active: boolean;
    created_at?: string;
    last_used?: string;
    revoked_at?: string;
}

interface CreatedKey {
    id: string;
    name: string;
    key: string;
    warning?: string;
}

export default function ApiKeysPage() {
    const [keys, setKeys] = useState<ApiKeyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [keyName, setKeyName] = useState("");
    const [submitLoading, setSubmitLoading] = useState(false);
    const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null);

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
            const response = await api.get(`/workspaces/${workspaceId}/api-keys`);
            const payload = response.data?.data ?? response.data;
            setKeys(Array.isArray(payload) ? payload : []);
        } catch (e) {
            console.error(e);
            setError('Falha ao carregar API keys.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!keyName) return;
        setSubmitLoading(true);
        try {
            const workspaceId = await ensureWorkspaceId();
            if (!workspaceId) {
                setError('Workspace não encontrado.');
                return;
            }
            const response = await api.post(`/workspaces/${workspaceId}/api-keys`, { name: keyName });
            const payload = response.data?.data ?? response.data;
            setCreatedKey(payload);
            setIsDialogOpen(false);
            setKeyName("");
            fetchKeys();
        } catch (e) {
            console.error(e);
            alert('Falha ao criar API key');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleRevoke = async (keyId: string) => {
        try {
            const workspaceId = await ensureWorkspaceId();
            if (!workspaceId) {
                setError('Workspace não encontrado.');
                return;
            }
            await api.post(`/workspaces/${workspaceId}/api-keys/${keyId}/revoke`);
            fetchKeys();
        } catch (e) {
            console.error(e);
            alert('Falha ao revogar API key');
        }
    };

    const handleDelete = async (keyId: string) => {
        try {
            const workspaceId = await ensureWorkspaceId();
            if (!workspaceId) {
                setError('Workspace não encontrado.');
                return;
            }
            await api.delete(`/workspaces/${workspaceId}/api-keys/${keyId}`);
            fetchKeys();
        } catch (e) {
            console.error(e);
            alert('Falha ao excluir API key');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">API Keys</h2>
                    <p className="text-muted-foreground">Gere e revogue tokens PERPETUO_KEY.</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>Nova API Key</Button>
            </div>

            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {createdKey && (
                <div className="p-4 border border-emerald-200 bg-emerald-50 rounded">
                    <p className="font-semibold text-emerald-800">Chave criada</p>
                    <p className="text-sm text-emerald-700">{createdKey.warning || 'Salve esta chave agora. Ela não será exibida novamente.'}</p>
                    <div className="mt-2 rounded bg-white border border-emerald-200 p-2 text-sm font-mono break-all">
                        {createdKey.key}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="p-6">Carregando...</div>
            ) : keys.length === 0 ? (
                <div className="p-6 border rounded text-muted-foreground">Nenhuma API key criada.</div>
            ) : (
                <div className="rounded-md border border-slate-200">
                    {keys.map((key) => (
                        <div key={key.id} className="flex items-center justify-between p-4 border-b last:border-0">
                            <div>
                                <p className="font-medium">{key.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {key.active ? 'Ativa' : 'Revogada'} • hash {key.key_hash ? key.key_hash.slice(-6) : '—'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Criada: {key.created_at ? new Date(key.created_at).toLocaleString('pt-BR') : '—'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {key.active ? (
                                    <Button variant="outline" size="sm" onClick={() => handleRevoke(key.id)}>
                                        Revogar
                                    </Button>
                                ) : null}
                                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(key.id)}>
                                    Excluir
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova API Key</DialogTitle>
                        <DialogDescription>
                            Gere uma nova PERPETUO_KEY para chamadas ao gateway.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nome
                            </Label>
                            <Input
                                id="name"
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                                placeholder="Ex: Produção"
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleCreate} disabled={submitLoading}>
                            {submitLoading ? 'Criando...' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
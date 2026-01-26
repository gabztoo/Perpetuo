"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            // Need tenantId. For MVP, assuming backend uses 'current' or we fetch user's tenants first.
            // Simplified: Control plane /projects endpoint should infer tenant from user or we pick first one?
            // Let's assume we hardcode tenant fetching or the user context has it.
            // For now, let's fetch /tenants/current then /projects?tenantId=...
            const tenantsRes = await api.get('/tenants/current');
            if (tenantsRes.data.length > 0) {
                const tenantId = tenantsRes.data[0].tenantId;
                const res = await api.get(`/projects?tenantId=${tenantId}`);
                setProjects(res.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        const name = prompt("Project Name:");
        if (!name) return;
        try {
            const tenantsRes = await api.get('/tenants/current');
            const tenantId = tenantsRes.data[0].tenantId;
            await api.post(`/projects?tenantId=${tenantId}`, { name });
            fetchProjects();
        } catch (e) {
            alert("Failed to create");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <Link href={`/dashboard/projects/${project.id}`} key={project.id}>
                        <Card className="hover:bg-slate-50 transition cursor-pointer">
                            <CardHeader>
                                <CardTitle>{project.name}</CardTitle>
                                <CardDescription>ID: {project.id}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Click to manage routes</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}

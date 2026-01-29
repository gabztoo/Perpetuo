"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Settings,
    Activity,
    Key,
    BarChart3,
    Server,
    LogOut
} from "lucide-react";
import { useRouter } from "next/navigation";
import { setStoredToken, setStoredWorkspaceId } from "@/lib/storage";

const mainRoutes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-sky-500",
    },
    {
        label: "Providers",
        icon: Server,
        href: "/dashboard/providers",
        color: "text-violet-500",
    },
    {
        label: "API Keys",
        icon: Key,
        href: "/dashboard/api-keys",
        color: "text-pink-700",
    },
    {
        label: "Logs",
        icon: Activity,
        href: "/dashboard/logs",
        color: "text-orange-700",
    },
    {
        label: "Usage",
        icon: BarChart3,
        href: "/dashboard/usage",
        color: "text-emerald-600",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/dashboard/settings",
    },
];

const docRoutes = [
    { name: "Getting Started", href: "/docs/getting-started" },
    { name: "LLM Gateways", href: "/docs/llm-gateways" },
    { name: "Analytics & Monitoring", href: "/docs/analytics-monitoring" },
    { name: "API Reference", href: "/docs/api-reference" },
];

export const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            setStoredToken(undefined);
            setStoredWorkspaceId(undefined);
            router.push('/login');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
            <div className="px-3 py-2 flex-1">
                <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                    <h1 className="text-2xl font-bold">Perpetuo</h1>
                </Link>
                <div className="space-y-1">
                    {mainRoutes.map((route) => (
                        <Link
                            href={route.href}
                            key={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
                <div className="mt-6">
                    <p className="px-3 text-xs uppercase tracking-wide text-zinc-500">Documentation</p>
                    <div className="mt-2 space-y-1">
                        {docRoutes.map((doc) => (
                            <Link
                                href={doc.href}
                                key={doc.href}
                                className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-zinc-400"
                            >
                                {doc.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <div className="px-3 py-2">
                <div
                    onClick={handleLogout}
                    className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-zinc-400"
                >
                    <div className="flex items-center flex-1">
                        <LogOut className="h-5 w-5 mr-3 text-red-500" />
                        Logout
                    </div>
                </div>
            </div>
        </div>
    );
};

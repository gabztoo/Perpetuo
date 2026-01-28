'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Book, Zap, BarChart3, Code } from 'lucide-react';

interface DocsLayoutProps {
  children: ReactNode;
  tableOfContents?: { title: string; id: string }[];
}

const docPages = [
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
    icon: Book,
  },
  {
    title: 'LLM Gateways',
    href: '/docs/llm-gateways',
    icon: Zap,
  },
  {
    title: 'Analytics & Monitoring',
    href: '/docs/analytics-monitoring',
    icon: BarChart3,
  },
  {
    title: 'API Reference',
    href: '/docs/api-reference',
    icon: Code,
  },
];

export const DocsLayout = ({ children, tableOfContents }: DocsLayoutProps) => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0A0E1A]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-brand-500">PERPETUO</h1>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm text-slate-400 hover:text-white transition">
              Home
            </Link>
            <Link href="/docs/getting-started" className="text-sm text-brand-400 hover:text-brand-300 transition">
              Docs
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg transition"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 min-h-screen sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Documentation
            </h2>
            <nav className="space-y-1">
              {docPages.map((page) => {
                const Icon = page.icon;
                const isActive = pathname === page.href;
                return (
                  <Link
                    key={page.href}
                    href={page.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                      isActive
                        ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{page.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl px-12 py-12">{children}</main>

        {/* Table of Contents */}
        {tableOfContents && tableOfContents.length > 0 && (
          <aside className="w-64 border-l border-white/5 min-h-screen sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                On this page
              </h2>
              <nav className="space-y-2">
                {tableOfContents.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-slate-400 hover:text-brand-400 transition"
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

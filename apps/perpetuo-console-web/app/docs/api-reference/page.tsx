'use client';

import React from 'react';
import { DocsLayout } from '@/components/docs/DocsLayout';
import { Code, Lock, Zap, Settings, Key, FileText } from 'lucide-react';

const tableOfContents = [
  { title: 'Authentication', id: 'authentication' },
  { title: 'Gateway', id: 'gateway' },
  { title: 'Workspaces', id: 'workspaces' },
  { title: 'Providers', id: 'providers' },
  { title: 'Logs', id: 'logs' },
];

const APIReferencePage = () => {
  return (
    <DocsLayout tableOfContents={tableOfContents}>
      <div className="prose prose-invert prose-brand max-w-none">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Code size={12} />
            API Reference
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">API Reference</h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Comprehensive guide to all PERPETUO API endpoints with request/response examples.
          </p>
        </div>

        {/* Authentication */}
        <section id="authentication" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Lock size={24} className="text-brand-500" />
            Authentication
          </h2>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs font-semibold">POST</div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">/auth/signup</h3>
                <p className="text-slate-400 text-sm">Create a new account and workspace</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-2">Request:</p>
                <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-4">
                  <pre className="text-sm text-slate-300 overflow-x-auto">
                    <code>{`{
  "email": "your@email.com",
  "password": "secure-password-123",
  "name": "Your Name"
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gateway */}
        <section id="gateway" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap size={24} className="text-brand-500" />
            Gateway
          </h2>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs font-semibold">POST</div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">/v1/chat/completions</h3>
                <p className="text-slate-400 text-sm">OpenAI-compatible chat completions endpoint</p>
              </div>
            </div>
          </div>
        </section>

        {/* More sections... */}
      </div>
    </DocsLayout>
  );
};

export default APIReferencePage;
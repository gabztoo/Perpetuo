'use client';

import React from 'react';
import { DocsLayout } from '@/components/docs/DocsLayout';
import { CheckCircle2, Rocket, Key, Zap } from 'lucide-react';

const tableOfContents = [
  { title: 'Quick Start', id: 'quick-start' },
  { title: 'Step 1: Sign Up', id: 'step-1' },
  { title: 'Step 2: Add Provider Keys', id: 'step-2' },
  { title: 'Step 3: Make Your First Request', id: 'step-3' },
  { title: 'Next Steps', id: 'next-steps' },
];

const GettingStartedPage = () => {
  return (
    <DocsLayout tableOfContents={tableOfContents}>
      <div className="prose prose-invert prose-brand max-w-none">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Rocket size={12} />
            Getting Started
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Welcome to PERPETUO</h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Get started with PERPETUO in minutes. This guide will walk you through the setup process
            and help you make your first API request.
          </p>
        </div>

        {/* Quick Start */}
        <section id="quick-start" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap size={24} className="text-brand-500" />
            Quick Start
          </h2>
          <p className="text-slate-300 mb-6">
            PERPETUO is an AI Gateway that provides a unified API for multiple LLM providers with
            automatic fallback, cost optimization, and detailed analytics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-brand-400 font-semibold mb-2">⚡ Unified API</div>
              <p className="text-sm text-slate-400">One API for OpenAI, Anthropic, Groq, and more</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-brand-400 font-semibold mb-2">🔄 Auto Fallback</div>
              <p className="text-sm text-slate-400">Automatic failover when providers are down</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-brand-400 font-semibold mb-2">💰 Cost Optimization</div>
              <p className="text-sm text-slate-400">Route to cheapest or fastest provider</p>
            </div>
          </div>
        </section>

        {/* Step 1 */}
        <section id="step-1" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-4">Step 1: Sign Up</h2>
          <p className="text-slate-300 mb-4">Create your PERPETUO account to get started:</p>
          <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-6 mb-4">
            <pre className="text-sm text-slate-300 overflow-x-auto">
              <code>{`curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "secure-password-123",
    "name": "Your Name"
  }'`}</code>
            </pre>
          </div>
          <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-4">
            <p className="text-sm text-brand-300">
              <strong>💡 Tip:</strong> Save the <code className="bg-white/10 px-2 py-1 rounded">api_key</code> from the response - you'll need it for making requests!
            </p>
          </div>
        </section>

        {/* Step 2 */}
        <section id="step-2" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Key size={24} className="text-brand-500" />
            Step 2: Add Provider Keys (BYOK)
          </h2>
          <p className="text-slate-300 mb-4">
            Add your own API keys for LLM providers. PERPETUO supports:
          </p>
          <ul className="space-y-2 mb-6">
            {['OpenAI (GPT-4, GPT-3.5)', 'Anthropic (Claude)', 'Groq', 'Google AI', 'Cohere'].map((provider) => (
              <li key={provider} className="flex items-start gap-2 text-slate-300">
                <CheckCircle2 size={20} className="text-brand-500 flex-shrink-0 mt-0.5" />
                {provider}
              </li>
            ))}
          </ul>
          <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-6">
            <pre className="text-sm text-slate-300 overflow-x-auto">
              <code>{`curl -X POST http://localhost:3000/workspaces/ws_123/providers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "api_key": "sk-your-openai-key",
    "priority": 1
  }'`}</code>
            </pre>
          </div>
        </section>

        {/* Step 3 */}
        <section id="step-3" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-4">Step 3: Make Your First Request</h2>
          <p className="text-slate-300 mb-4">
            Use the OpenAI-compatible <code className="bg-white/10 px-2 py-1 rounded text-brand-300">/v1/chat/completions</code> endpoint:
          </p>
          <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-6 mb-4">
            <pre className="text-sm text-slate-300 overflow-x-auto">
              <code>{`curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer pk_xxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'`}</code>
            </pre>
          </div>
          <p className="text-slate-400 text-sm mb-4">Response:</p>
          <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-6">
            <pre className="text-sm text-slate-300 overflow-x-auto">
              <code>{`{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "model": "gpt-4",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "I'm doing well, thank you!"
    }
  }]
}`}</code>
            </pre>
          </div>
        </section>

        {/* Next Steps */}
        <section id="next-steps" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-4">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/docs/llm-gateways"
              className="block bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-6 transition group"
            >
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-400 transition">
                LLM Gateways Guide →
              </h3>
              <p className="text-sm text-slate-400">
                Learn about routing strategies, fallback logic, and provider configuration
              </p>
            </a>
            <a
              href="/docs/analytics-monitoring"
              className="block bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-6 transition group"
            >
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-400 transition">
                Analytics & Monitoring →
              </h3>
              <p className="text-sm text-slate-400">
                Track usage, costs, and provider performance
              </p>
            </a>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
};

export default GettingStartedPage;
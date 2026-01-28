'use client';

import React from 'react';
import { DocsLayout } from '@/components/docs/DocsLayout';
import { Zap, CheckCircle2, Server, TrendingUp, Shield } from 'lucide-react';

const tableOfContents = [
  { title: 'Overview', id: 'overview' },
  { title: 'Supported Providers', id: 'providers' },
  { title: 'Configuration', id: 'configuration' },
  { title: 'Routing Strategies', id: 'routing' },
  { title: 'Fallback Logic', id: 'fallback' },
  { title: 'Troubleshooting', id: 'troubleshooting' },
];

const LLMGatewaysPage = () => {
  return (
    <DocsLayout tableOfContents={tableOfContents}>
      <div className="prose prose-invert prose-brand max-w-none">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Zap size={12} />
            LLM Gateway
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">LLM Gateways Guide</h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Learn how to configure and use Language Model Gateways in PERPETUO with automatic fallback and intelligent routing.
          </p>
        </div>

        {/* Overview */}
        <section id="overview" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-4">📖 Overview</h2>
          <p className="text-slate-300 mb-6">
            PERPETUO supports multiple Language Model Providers (LLMs) through a unified gateway. This allows you to:
          </p>
          <ul className="space-y-3 mb-6">
            {[
              'Use OpenAI, Anthropic, Groq, and more with a single API',
              'Configure BYOK (Bring Your Own Key) for each provider',
              'Automatically fallback to alternative providers in case of errors',
              'Optimize requests based on cost, latency, or reliability',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-slate-300">
                <CheckCircle2 size={20} className="text-brand-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Supported Providers */}
        <section id="providers" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Server size={24} className="text-brand-500" />
            Supported Providers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'OpenAI', models: ['gpt-4', 'gpt-3.5-turbo'], endpoint: 'api.openai.com' },
              { name: 'Anthropic', models: ['claude-v1', 'claude-v2'], endpoint: 'api.anthropic.com' },
              { name: 'Groq', models: ['groq-fast', 'groq-reliable'], endpoint: 'api.groq.com' },
            ].map((provider) => (
              <div key={provider.name} className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">{provider.name}</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-500">Models:</span>
                    <div className="text-brand-400 font-mono text-xs mt-1">
                      {provider.models.map((m) => (
                        <div key={m} className="bg-white/5 px-2 py-1 rounded inline-block mr-1 mb-1">
                          {m}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Endpoint:</span>
                    <div className="text-slate-300 font-mono text-xs mt-1">{provider.endpoint}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Configuration */}
        <section id="configuration" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-4">🛠️ Configuration</h2>
          
          <h3 className="text-xl font-semibold text-white mb-3 mt-6">1. Add Provider Keys</h3>
          <p className="text-slate-300 mb-4">
            Use the <code className="bg-white/10 px-2 py-1 rounded text-brand-300">/workspaces/:workspaceId/providers</code> endpoint:
          </p>
          <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-6 mb-6">
            <pre className="text-sm text-slate-300 overflow-x-auto">
              <code>{`curl -X POST http://localhost:3000/workspaces/ws_123/providers \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "openai",
    "api_key": "sk-your-openai-key",
    "priority": 1
  }'`}</code>
            </pre>
          </div>

          <h3 className="text-xl font-semibold text-white mb-3">2. Configure Priorities</h3>
          <p className="text-slate-300 mb-4">Set the <code className="bg-white/10 px-2 py-1 rounded text-brand-300">priority</code> field to determine fallback order:</p>
          <ul className="space-y-2 mb-6">
            {[
              { level: '1', desc: 'Highest priority (first choice)' },
              { level: '2', desc: 'Secondary fallback' },
              { level: '3', desc: 'Lowest priority (last resort)' },
            ].map((item) => (
              <li key={item.level} className="flex items-center gap-3 text-slate-300">
                <span className="bg-brand-500/20 text-brand-300 px-2 py-1 rounded font-mono text-sm">{item.level}</span>
                <span>{item.desc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Routing Strategies */}
        <section id="routing" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={24} className="text-brand-500" />
            Routing Strategies
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: 'Fastest',
                icon: '⚡',
                desc: 'Prioritizes providers with the lowest latency',
                useCase: 'Real-time applications',
              },
              {
                name: 'Cheapest',
                icon: '💰',
                desc: 'Prioritizes providers with the lowest cost per token',
                useCase: 'Cost-sensitive workloads',
              },
              {
                name: 'Reliable',
                icon: '🛡️',
                desc: 'Prioritizes providers with the lowest error rates',
                useCase: 'Mission-critical applications',
              },
              {
                name: 'Default',
                icon: '⚙️',
                desc: 'Uses the workspace-configured priority',
                useCase: 'General-purpose',
              },
            ].map((strategy) => (
              <div key={strategy.name} className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{strategy.icon}</span>
                  <h3 className="text-lg font-semibold text-white">{strategy.name}</h3>
                </div>
                <p className="text-slate-300 text-sm mb-2">{strategy.desc}</p>
                <p className="text-slate-500 text-xs">
                  <strong>Use case:</strong> {strategy.useCase}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Fallback Logic */}
        <section id="fallback" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Shield size={24} className="text-brand-500" />
            Fallback Logic
          </h2>
          <p className="text-slate-300 mb-6">
            If a provider fails (e.g., timeout, 5xx error), PERPETUO automatically retries with the next provider in the priority list.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Error Classifications:</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs font-semibold">RETRYABLE</span>
                  <span className="text-slate-300 text-sm">Try next provider</span>
                </div>
                <ul className="text-sm text-slate-400 ml-4 space-y-1">
                  <li>• 429 (Rate Limited)</li>
                  <li>• 5xx (Server errors)</li>
                  <li>• Timeout</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs font-semibold">FATAL</span>
                  <span className="text-slate-300 text-sm">Abort request</span>
                </div>
                <ul className="text-sm text-slate-400 ml-4 space-y-1">
                  <li>• 401 (Unauthorized)</li>
                  <li>• 403 (Forbidden)</li>
                  <li>• Invalid request format</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section id="troubleshooting" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-4">🆘 Troubleshooting</h2>
          <div className="space-y-4">
            {[
              {
                issue: 'Invalid API Key',
                solutions: ['Ensure the key is correct and active', "Test the key directly with the provider's API"],
              },
              {
                issue: 'Provider Timeout',
                solutions: ['Check network connectivity', 'Increase the timeout value in your request'],
              },
              {
                issue: 'High Costs',
                solutions: ['Use the cheapest strategy', 'Monitor usage regularly'],
              },
            ].map((item) => (
              <div key={item.issue} className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">{item.issue}</h3>
                <ul className="space-y-2">
                  {item.solutions.map((solution) => (
                    <li key={solution} className="flex items-start gap-2 text-slate-300 text-sm">
                      <CheckCircle2 size={16} className="text-brand-500 flex-shrink-0 mt-0.5" />
                      {solution}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DocsLayout>
  );
};

export default LLMGatewaysPage;
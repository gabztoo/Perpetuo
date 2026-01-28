'use client';

import React from 'react';
import { DocsLayout } from '@/components/docs/DocsLayout';
import { BarChart3, Activity, TrendingUp, AlertCircle } from 'lucide-react';

const tableOfContents = [
  { title: 'Overview', id: 'overview' },
  { title: 'Usage Analytics', id: 'usage' },
  { title: 'Request Logs', id: 'logs' },
  { title: 'Provider Performance', id: 'performance' },
  { title: 'Troubleshooting', id: 'troubleshooting' },
];

const AnalyticsMonitoringPage = () => {
  return (
    <DocsLayout tableOfContents={tableOfContents}>
      <div className="prose prose-invert prose-brand max-w-none">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <BarChart3 size={12} />
            Analytics
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Analytics & Monitoring</h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Track and optimize your usage of PERPETUO AI Gateway with built-in analytics and monitoring tools.
          </p>
        </div>

        {/* Overview */}
        <section id="overview" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-4">📖 Overview</h2>
          <p className="text-slate-300 mb-6">
            PERPETUO provides built-in analytics and monitoring tools to help you:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: '📈', title: 'Track Usage', desc: 'Monitor token usage and costs' },
              { icon: '📊', title: 'Request Logs', desc: 'Analyze individual requests' },
              { icon: '⚡', title: 'Performance', desc: 'Monitor provider latency' },
              { icon: '🔍', title: 'Error Detection', desc: 'Detect and troubleshoot issues' },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{item.icon}</span>
                  <h3 className="text-white font-semibold">{item.title}</h3>
                </div>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Usage Analytics */}
        <section id="usage" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Activity size={24} className="text-brand-500" />
            Usage Analytics
          </h2>
          
          <h3 className="text-xl font-semibold text-white mb-3">1. Total Usage</h3>
          <p className="text-slate-300 mb-4">
            Get an overview of your token consumption and costs:
          </p>
          <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-6 mb-4">
            <pre className="text-sm text-slate-300 overflow-x-auto">
              <code>{`curl http://localhost:3000/workspaces/ws_123/usage \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}</code>
            </pre>
          </div>
          <p className="text-slate-400 text-sm mb-2">Response:</p>
          <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-6 mb-6">
            <pre className="text-sm text-slate-300 overflow-x-auto">
              <code>{`{
  "total_tokens": 123456,
  "total_cost": 45.67,
  "by_provider": {
    "openai": { "tokens": 100000, "cost": 40.00 },
    "anthropic": { "tokens": 23456, "cost": 5.67 }
  }
}`}</code>
            </pre>
          </div>

          <h3 className="text-xl font-semibold text-white mb-3">2. Usage by Provider</h3>
          <p className="text-slate-300 mb-4">Break down usage by provider over time:</p>
          <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-6">
            <pre className="text-sm text-slate-300 overflow-x-auto">
              <code>{`curl http://localhost:3000/workspaces/ws_123/usage/by-provider?days=7 \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}</code>
            </pre>
          </div>
        </section>

        {/* Request Logs */}
        <section id="logs" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-4">📂 Request Logs</h2>
          
          <h3 className="text-xl font-semibold text-white mb-3">1. View Logs</h3>
          <p className="text-slate-300 mb-4">Access recent requests with pagination:</p>
          <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-6 mb-4">
            <pre className="text-sm text-slate-300 overflow-x-auto">
              <code>{`curl http://localhost:3000/workspaces/ws_123/logs?page=1&limit=50 \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}</code>
            </pre>
          </div>
          <p className="text-slate-400 text-sm mb-2">Response:</p>
          <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-6 mb-6">
            <pre className="text-sm text-slate-300 overflow-x-auto">
              <code>{`{
  "logs": [
    {
      "request_id": "req_123",
      "model": "gpt-4",
      "provider": "openai",
      "tokens": 1000,
      "cost": 0.06,
      "status": 200,
      "latency_ms": 345,
      "created_at": "2026-01-28T14:00:00Z"
    }
  ]
}`}</code>
            </pre>
          </div>

          <h3 className="text-xl font-semibold text-white mb-3">2. Filter Logs</h3>
          <p className="text-slate-300 mb-4">Filter by provider, status, or date range:</p>
          <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-6">
            <pre className="text-sm text-slate-300 overflow-x-auto">
              <code>{`curl http://localhost:3000/workspaces/ws_123/logs?provider=openai&status=200 \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}</code>
            </pre>
          </div>
        </section>

        {/* Provider Performance */}
        <section id="performance" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={24} className="text-brand-500" />
            Provider Performance
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Latency Metrics</h3>
              <p className="text-slate-300 text-sm mb-4">Monitor average latency per provider:</p>
              <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-4">
                <pre className="text-xs text-slate-300 overflow-x-auto">
                  <code>{`GET /workspaces/:id/performance/latency`}</code>
                </pre>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Error Rates</h3>
              <p className="text-slate-300 text-sm mb-4">Monitor error rates per provider:</p>
              <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-4">
                <pre className="text-xs text-slate-300 overflow-x-auto">
                  <code>{`GET /workspaces/:id/performance/errors`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section id="troubleshooting" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle size={24} className="text-brand-500" />
            Troubleshooting
          </h2>
          <div className="space-y-4">
            {[
              {
                issue: 'High Latency',
                color: 'yellow',
                solutions: ['Check provider performance metrics', 'Use the fastest strategy'],
              },
              {
                issue: 'High Costs',
                color: 'orange',
                solutions: ['Use the cheapest strategy', 'Monitor usage regularly', 'Set usage quotas'],
              },
              {
                issue: 'Frequent Errors',
                color: 'red',
                solutions: ['Check error logs for details', 'Use the reliable strategy', 'Verify API keys are valid'],
              },
            ].map((item) => (
              <div key={item.issue} className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`bg-${item.color}-500/20 text-${item.color}-300 px-2 py-1 rounded text-xs font-semibold`}>
                    {item.issue.toUpperCase()}
                  </span>
                </div>
                <ul className="space-y-2">
                  {item.solutions.map((solution) => (
                    <li key={solution} className="flex items-start gap-2 text-slate-300 text-sm">
                      <span className="text-brand-500">•</span>
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

export default AnalyticsMonitoringPage;
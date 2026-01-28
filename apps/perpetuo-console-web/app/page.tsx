"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import SocialProof from '@/components/landing/SocialProof';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import UseCases from '@/components/landing/UseCases';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';

// Translation Dictionary (Copied from Landing Page)
const translations = {
    en: {
        header: {
            features: "Features",
            howItWorks: "How it works",
            pricing: "Pricing",
            docs: "Docs",
            login: "Log in",
            getKey: "Get API Key"
        },
        hero: {
            badge: "NOW IN PUBLIC BETA",
            title: "Stop production outages.",
            titleHighlight: "Even when OpenAI, Anthropic, or Google fail.",
            subtitle: "When one provider fails, another takes over automatically. Your users won't even notice.",
            ctaPrimary: "Start Free with 1 Key",
            ctaSecondary: "View Docs (SDKs)",
            ctaMicrocopy: "No card required • BYOK • Integration in minutes",
            badges: ["SOC2 Ready", "GDPR Compliant", "Zero-Log Policy"],
            diagram: {
                app: "Your App",
                gateway: "GATEWAY",
                fail: "FAIL",
                recovered: "Recovered",
                microcopy: "When one provider fails, your users never notice."
            },
            benefits: [
                {
                    title: "99.99% Uptime",
                    desc: "Automatic failover between providers. If OpenAI goes down, we route to Anthropic instantly."
                },
                {
                    title: "Enterprise Security",
                    desc: "Encrypted keys, RBAC, audit logs, and PII redaction. SOC2 ready infrastructure."
                },
                {
                    title: "Global Edge Network",
                    desc: "< 10ms gateway overhead. Smart routing and caching at the edge closer to your users."
                }
            ]
        },
        socialProof: {
            trusted: "Trusted by production teams",
            desc: "Used in real-world workloads across fintech, SaaS, and AI products.",
            metrics: [
                { val: "24ms", label: "median gateway overhead" },
                { val: "35%", label: "lower token costs with smart routing" },
                { val: "0%", label: "downtime across all routed requests (YTD)" }
            ]
        },
        howItWorks: {
            title: "Integrate in minutes",
            subtitle: "A drop-in replacement for OpenAI SDKs. No refactor. No vendor lock-in.",
            steps: [
                { title: "1. Connect Providers", desc: "Add your API keys for OpenAI, Anthropic, Google, and others in the secure Perpetuo vault." },
                { title: "2. Define Policies", desc: "Set rules like \"Use cheapest model for background tasks\" or \"Fallback to Claude if GPT-4 errors out\"." },
                { title: "3. Route & Relax", desc: "Point your code to Perpetuo. We handle load balancing, retries, and logging automatically." }
            ]
        },
        features: {
            title: "Why Perpetuo vs. Direct Integration?",
            subtitle: "Direct integrations break in production. Perpetuo is built for when things go wrong.",
            list: [
                { title: 'Reliability', items: ['Automatic Provider Failover', 'Smart Retries & Backoff', 'Circuit Breakers'] },
                { title: 'Cost Control', items: ['Route by lowest price', 'Global Caching (Semantic)', 'Rate Limits & Budgets'] },
                { title: 'Observability', items: ['Unified Latency Dashboard', 'Token Usage Tracking', 'Error Tracing'] }
            ],
            extra: [
                { title: "Edge Optimized", desc: "Requests routed to nearest region for minimal latency." },
                { title: "PII Redaction", desc: "Automatically detect and mask sensitive data before it leaves your network." }
            ]
        },
        useCases: {
            title: "Built for mission-critical workloads",
            cases: [
                { title: "AI Agents & Chatbots", desc: "Keep customer-facing agents responding 24/7, even during provider outages and rate limits." },
                { title: "Dev Tools & IDEs", desc: "Use the fastest model when speed matters, and automatically switch to the cheapest when it doesn't." },
                { title: "Data Extraction Pipelines", desc: "Process millions of documents without interruption, using cheap models by default and expensive ones only when necessary." },
                { title: "SaaS Platforms", desc: "Manage thousands of customer keys with isolation, audit logs, and billing per workspace." }
            ]
        },
        pricing: {
            title: "Simple, transparent pricing",
            subtitle: "No token markup. No lock-in. You keep full control of your costs.",
            plans: [
                { name: "Developer", price: "$0", unit: "/mo", btn: "Start Free", features: ["Up to 10k requests/mo", "3 Providers", "Basic Request Observability"] },
                { name: "Startup", price: "$49", unit: "/mo", btn: "Get Started", features: ["Up to 1M requests/mo", "Unlimited Providers", "Configurable Failover & Fallback", "User Management"], popular: "POPULAR" },
                { name: "Enterprise", price: "Custom", unit: "", btn: "Contact Sales", features: ["Unlimited Volume", "Dedicated Support", "SSO & Audit Logs", "Custom SLAs"] }
            ]
        },
        faq: {
            title: "Frequently Asked Questions",
            items: [
                { q: "Does Perpetuo add latency?", a: "Perpetuo is built on Rust and deployed to the edge. The average overhead is less than 8ms, which is negligible compared to LLM generation time." },
                { q: "Do you store my prompts?", a: "No. Perpetuo is a pass-through gateway. By default, we do not store prompts or responses." },
                { q: "How does failover work?", a: "We actively monitor provider health. If a request returns a 5xx error or times out, we instantly retry with the next provider in your defined fallback list." },
                { q: "Can I use my own API keys?", a: "Yes. You bring your own keys (BYOK). We store them in an encrypted vault. You pay the providers directly, so there is no markup on token costs." }
            ]
        },
        cta: {
            title: "Stop production outages. Cut costs.",
            subtitle: "Join 500+ engineering teams who can't afford to go offline.",
            btnPrimary: "Get API Key",
            btnSecondary: "Book Demo (Enterprise)"
        },
        footer: {
            tagline: "The reliability layer every LLM stack needs.",
            cols: [
                { title: "Product", links: ["Features", "Integrations", "Pricing", "Changelog"] },
                { title: "Resources", links: ["Documentation", "API Reference", "Status", "Community"] },
                { title: "Legal", links: ["Privacy", "Terms", "Security"] }
            ],
            copyright: "© 2024 Perpetuo AI. All rights reserved."
        }
    },
    pt: {
        header: {
            features: "Recursos",
            howItWorks: "Como funciona",
            pricing: "Preços",
            docs: "Docs",
            login: "Entrar",
            getKey: "Obter Chave API"
        },
        hero: {
            badge: "AGORA EM BETA PÚBLICO",
            title: "Pare quedas em produção.",
            titleHighlight: "Mesmo se OpenAI, Anthropic ou Google caírem.",
            subtitle: "Quando um provedor falha, outro assume automaticamente. Seus usuários nem percebem.",
            ctaPrimary: "Começar grátis com 1 chave API",
            ctaSecondary: "Ver Docs (SDKs & exemplos)",
            ctaMicrocopy: "Sem cartão • BYOK • Integração em minutos",
            badges: ["Pronto para SOC2", "Compatível com LGPD/GDPR", "Política Zero-Log"],
            diagram: {
                app: "Seu App",
                gateway: "GATEWAY",
                fail: "FALHA",
                recovered: "Recuperado",
                microcopy: "Quando um provedor falha, seus usuários nem percebem."
            },
            benefits: [
                {
                    title: "99.99% de Uptime",
                    desc: "Alternância automática entre provedores. Se a OpenAI cair, roteamos para a Anthropic instantaneamente."
                },
                {
                    title: "Segurança Empresarial",
                    desc: "Chaves criptografadas, RBAC, logs de auditoria e redação de PII. Infraestrutura pronta para SOC2."
                },
                {
                    title: "Edge Network Global",
                    desc: "< 10ms de latência no gateway. Roteamento inteligente e cache na borda, mais próximo dos seus usuários."
                }
            ]
        },
        socialProof: {
            trusted: "Confiado por times em produção",
            desc: "Usado em cargas reais de fintechs, SaaS e produtos de IA.",
            metrics: [
                { val: "24ms", label: "latência média do gateway" },
                { val: "35%", label: "redução de custos com tokens" },
                { val: "0%", label: "downtime (acumulado no ano)" }
            ]
        },
        howItWorks: {
            title: "Integre em minutos",
            subtitle: "Substituição direta para SDKs da OpenAI. Sem refatoração. Sem vendor lock-in.",
            steps: [
                { title: "1. Conecte Provedores", desc: "Adicione suas chaves da OpenAI, Anthropic, Google e outras no cofre seguro da Perpetuo." },
                { title: "2. Defina Políticas", desc: "Crie regras como \"Usar modelo mais barato para background jobs\" ou \"Fallback para Claude se o GPT-4 der erro\"." },
                { title: "3. Roteie & Relaxe", desc: "Aponte seu código para a Perpetuo. Nós cuidamos do balanceamento de carga, retentativas e logs automaticamente." }
            ]
        },
        features: {
            title: "Por que Perpetuo vs. Integração Direta?",
            subtitle: "Integrações diretas quebram em produção. A Perpetuo é feita para quando as coisas dão errado.",
            list: [
                { title: 'Confiabilidade', items: ['Failover Automático de Provedor', 'Retentativas Inteligentes & Backoff', 'Circuit Breakers'] },
                { title: 'Controle de Custos', items: ['Rotear pelo menor preço', 'Cache Global (Semântico)', 'Limites de Taxa & Orçamentos'] },
                { title: 'Observabilidade', items: ['Dashboard Unificado de Latência', 'Rastreamento de Uso de Tokens', 'Rastreamento de Erros'] }
            ],
            extra: [
                { title: "Otimizado para Edge", desc: "Requisições roteadas para a região mais próxima para latência mínima." },
                { title: "Redação de PII", desc: "Detecte e mascare dados sensíveis automaticamente antes que saiam da sua rede." }
            ]
        },
        useCases: {
            title: "Construído para cargas críticas",
            cases: [
                { title: "Agentes de IA & Chatbots", desc: "Mantenha agentes e chatbots respondendo 24/7, mesmo com quedas e rate limits." },
                { title: "Ferramentas Dev & IDEs", desc: "Use o modelo mais rápido quando importa velocidade e troque automaticamente para o mais barato quando não importa." },
                { title: "Pipelines de Extração de Dados", desc: "Processe milhões de documentos sem interrupções, usando modelos baratos por padrão e caros só quando necessário." },
                { title: "Plataformas SaaS", desc: "Gerencie milhares de chaves de clientes com isolamento, auditoria e cobrança por workspace." }
            ]
        },
        pricing: {
            title: "Preço simples e transparente",
            subtitle: "Sem markup em tokens. Sem lock-in. Você mantém controle total dos custos.",
            plans: [
                { name: "Developer", price: "$0", unit: "/mês", btn: "Começar Grátis", features: ["Até 10k requisições/mês", "3 Provedores", "Observabilidade básica de requisições"] },
                { name: "Startup", price: "$49", unit: "/mês", btn: "Começar Agora", features: ["Até 1M requisições/mês", "Provedores Ilimitados", "Failover e fallback configuráveis", "Gestão de Usuários"], popular: "POPULAR" },
                { name: "Enterprise", price: "Sob Medida", unit: "", btn: "Falar com Vendas", features: ["Volume Ilimitado", "Suporte Dedicado", "SSO & Logs de Auditoria", "SLAs Personalizados"] }
            ]
        },
        faq: {
            title: "Perguntas Frequentes",
            items: [
                { q: "A Perpetuo adiciona latência?", a: "A Perpetuo é construída em Rust e implantada no edge. O overhead médio é inferior a 8ms, o que é insignificante comparado ao tempo de geração do LLM." },
                { q: "Vocês armazenam meus prompts?", a: "Não. O Perpetuo é um gateway de passagem. Por padrão, não armazenamos prompts nem respostas." },
                { q: "Como funciona o failover?", a: "Monitoramos ativamente a saúde dos provedores. Se uma requisição retornar erro 5xx ou timeout, tentamos instantaneamente com o próximo provedor na sua lista de fallback." },
                { q: "Posso usar minhas próprias chaves?", a: "Sim. Você traz suas chaves (BYOK). Nós as armazenamos em um cofre criptografado. Você paga os provedores diretamente, sem markup nos custos de token." }
            ]
        },
        cta: {
            title: "Pare quedas em produção. Corte custos automaticamente.",
            subtitle: "Usado por times que não podem ficar offline.",
            btnPrimary: "Obter Chave API",
            btnSecondary: "Agendar Demo (Enterprise)"
        },
        footer: {
            tagline: "A camada de confiabilidade que toda stack de LLM precisa.",
            cols: [
                { title: "Produto", links: ["Recursos", "Integrações", "Preços", "Changelog"] },
                { title: "Recursos", links: ["Documentação", "Referência da API", "Status", "Comunidade"] },
                { title: "Legal", links: ["Privacidade", "Termos", "Segurança"] }
            ],
            copyright: "© 2024 Perpetuo AI. Todos os direitos reservados."
        }
    }
};

export default function Home() {
    const [lang, setLang] = useState<'en' | 'pt'>('pt');
    const t = translations[lang];

    const toggleLanguage = () => {
        setLang(prev => prev === 'en' ? 'pt' : 'en');
    };

    return (
        <div className="min-h-screen bg-dark-950 font-sans selection:bg-brand-500/30 selection:text-brand-100">
            <Header content={t.header} currentLang={lang} onToggleLang={toggleLanguage} />
            <main>
                <Hero content={t.hero} />
                <SocialProof content={t.socialProof} />
                <HowItWorks content={t.howItWorks} />
                <Features content={t.features} />
                <UseCases content={t.useCases} />
                <Pricing content={t.pricing} />
                <FAQ content={t.faq} />

                <section className="py-24 px-6 text-center relative overflow-hidden">
                    {/* Glow effect for CTA */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-500/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative max-w-3xl mx-auto glass-card rounded-2xl p-12 border border-brand-500/20 shadow-2xl">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{t.cta.title}</h2>
                        <p className="text-slate-400 mb-8 text-lg">{t.cta.subtitle}</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/signup">
                                <button className="px-8 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                    {t.cta.btnPrimary}
                                </button>
                            </Link>
                            <button className="px-8 py-3.5 bg-transparent border border-white/10 hover:bg-white/5 text-white font-medium rounded-lg transition-colors">
                                {t.cta.btnSecondary}
                            </button>
                        </div>
                    </div>
                </section>
            </main>
            <Footer content={t.footer} />
        </div>
    );
}

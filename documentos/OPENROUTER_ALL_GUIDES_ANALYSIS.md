# 📚 ANÁLISE COMPLETA DE TODOS OS GUIAS DO OPENROUTER

**Data:** 28 de janeiro, 2026  
**Análise feita em:** https://openrouter.ai/docs/guides/

---

## 📋 GUIAS ANALISADOS

### 1️⃣ **Principles** (Fundamentos)
**Arquivo:** [ARCHITECTURE_EXECUTIVE_SUMMARY.md](ARCHITECTURE_EXECUTIVE_SUMMARY.md)

**O que OpenRouter prega:**
- Price and Performance (múltiplos providers)
- Standardized API (mesmo código, qualquer modelo)
- Real-World Insights (rankings, comunidade)
- Consolidated Billing (fatura única)
- Higher Availability (fallback automático)
- Higher Rate Limits (negociados com providers)

**Lição para Perpetuo:**
```
OpenRouter = "Gateway economiza $ usando múltiplos providers"
Perpetuo = "Gateway economiza $ E oferece controle total"

Principles do Perpetuo devem ser:
✅ Cost & Control (cliente escolhe via BYOK)
✅ Standardized API (OpenAI compatible)
✅ Transparent Insights (Decision Log)
✅ Consolidated Billing (uma conta, múltiplos providers)
✅ Higher Availability (fallback inteligente)
✅ Enterprise Ready (zero lock-in)
```

---

### 2️⃣ **App Attribution** (Analytics)
**Status:** OpenRouter tem, Perpetuo deveria copiar

**O que faz:**
```
HTTP-Referer: "https://myapp.com"
X-Title: "MyApp Name"

Resultado:
├─ App aparece em rankings públicos
├─ Dashboard analytics por app
├─ Model usage tracking
└─ Community visibility
```

**Como implementar no Perpetuo (P2):**

```typescript
// apps/perpetuo-backend/src/modules/gateway/routes.ts

const clientAttribution = {
  referer: request.headers['referer'] || request.headers['origin'],
  title: request.headers['x-client-title'],
  version: request.headers['x-client-version'],
};

eventManager.emit({
  type: 'request_attributed',
  attribution: clientAttribution,
  model: body.model,
  provider_used: lastProvider,
  tokens_used: usage,
});

// Dashboard novo:
// /analytics/apps
// GET /analytics/apps?top=10
// → { name, version, requests, models_used, tokens }
```

**Esforço:** 2 dias (P2)

---

### 3️⃣ **Frameworks & Integrations** (Ecossistema)
**Status:** OpenRouter liga bem, Perpetuo precisa

**OpenRouter oferece:**
- Effect AI SDK
- LangChain (Python + JS)
- LlamaIndex (RAG)
- Mastra
- OpenAI SDK (wrapper)
- PydanticAI
- TanStack AI
- Vercel AI SDK
- Aider, Cline, Kilo Code (coding assistants)
- Langfuse (observability)
- VSCode Copilot
- Xcode

**Como Perpetuo deve atacar:**

```
PRIORIDADE P1: Core
├─ OpenAI SDK compatible ✅ (JÁ TEM)
├─ Vercel AI SDK compatible (novo)
└─ LangChain compatible (novo)

PRIORIDADE P2: Expansion
├─ LlamaIndex RAG
├─ PydanticAI
├─ Aider (coding)
└─ Langfuse (observability)

PRIORIDADE P3: Community
├─ Cline
├─ VSCode Extensions
└─ Community packages
```

**Implementação (Vercel AI SDK):**

```typescript
// packages/sdk/src/vercel-ai.ts
import { LanguageModel } from 'ai';

export class PerpetutoLanguageModel implements LanguageModel {
  modelId: string = 'perpetuo-gateway';
  
  async doGenerate(params: Parameters) {
    const response = await this.client.post('/v1/chat/completions', {
      model: params.modelId.split('/')[1], // Extract from "perpetuo/model-name"
      messages: params.prompt,
      temperature: params.temperature,
    }, {
      headers: {
        'X-Perpetuo-Route': params.metadata?.strategy || 'default'
      }
    });
    
    return {
      text: response.data.choices[0].message.content,
      usage: response.data.usage,
    };
  }
}

// Uso:
import { generateText } from 'ai';
import { PerpetutoLanguageModel } from '@perpetuo/sdk-vercel-ai';

const model = new PerpetutoLanguageModel({ apiKey: 'pk_...' });
const { text } = await generateText({
  model,
  prompt: 'Hello!',
});
```

**Esforço:** 3-4 dias por framework (P2)

---

### 4️⃣ **Streaming** (Real-time Responses)
**Status:** OpenRouter tem completo, Perpetuo tem básico

**OpenRouter oferece:**
- Streaming responses (SSE)
- Stream cancellation (AbortController)
- Error handling (pré-stream e mid-stream)
- SSE comments para keep-alive
- Proper finish_reason

**Perpetuo deve garantir:**

```typescript
// apps/perpetuo-backend/src/modules/gateway/routes.ts

if (body.stream) {
  reply.header('Content-Type', 'text/event-stream');
  reply.header('Connection', 'keep-alive');
  reply.header('Cache-Control', 'no-cache');
  
  const controller = new AbortController();
  
  try {
    const stream = await provider.chat(
      { ...body, stream: true },
      { signal: controller.signal }
    );
    
    let tokens = 0;
    for await (const chunk of stream) {
      // SSE comment para keep-alive (evita timeout)
      if (chunk.choices[0]?.delta?.content) {
        reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
        tokens += 1;
      }
    }
    
    reply.raw.end();
  } catch (error) {
    if (error.name === 'AbortError') {
      reply.code(200).send(); // Already sent 200, client cancelled
    } else {
      // Mid-stream error: enviar como SSE
      reply.raw.write(`data: ${JSON.stringify({
        error: { message: error.message }
      })}\n\n`);
      reply.raw.end();
    }
  }
}
```

**Esforço:** 1-2 dias (P1)

---

### 5️⃣ **Zero Data Retention (ZDR)** 🔒 CRÍTICO
**Status:** OpenRouter tem, Perpetuo DEVE ter

**O que é:**
```
ZDR = Provider não armazena nem treina em seus dados

OpenRouter oferece:
├─ Account-wide ZDR setting
├─ Per-request ZDR override
├─ Comprehensive ZDR endpoint list
└─ Caching permitido (in-memory)
```

**Como implementar no Perpetuo (P1):**

```typescript
// 1. Adicionar campo na DB
// prisma/schema.prisma
model ApiKey {
  // ... existing fields
  requireZdr Boolean @default(false)
}

// 2. Validar no gateway
if (apiKey.requireZdr || body.provider?.zdr) {
  // Only route to ZDR-compatible endpoints
  const zdrEndpoints = await fetchZdrEndpoints();
  selectedProviders = selectedProviders.filter(p => 
    zdrEndpoints.some(z => z.provider === p.name)
  );
  
  if (selectedProviders.length === 0) {
    return reply.code(503).send({
      error: {
        code: 'no_zdr_providers_available',
        message: 'No ZDR-compatible providers available for this model'
      }
    });
  }
}

// 3. Dashboard
// Settings > Privacy > Enable ZDR
// API Key creation > Require ZDR checkbox
```

**ZDR Endpoint List (Perpetuo deve manter):**

```typescript
// packages/core/src/zdr/endpoints.ts

export const ZDR_ENDPOINTS = [
  // Google
  { provider: 'google', model: 'gemini-2.0-flash', zdr: true },
  { provider: 'google', model: 'gemini-3-flash-preview', zdr: true },
  
  // Azure (alguns modelos)
  { provider: 'azure', model: 'gpt-4.1', zdr: true },
  { provider: 'azure', model: 'gpt-5.2', zdr: true },
  
  // Groq
  { provider: 'groq', model: 'llama-3.1-70b', zdr: true },
  
  // ... build programmatically from OpenRouter's endpoint list
];

// API endpoint
GET /api/v1/endpoints/zdr
// → List of all ZDR endpoints (atualizado diariamente)
```

**Esforço:** 2-3 dias (P1)

---

### 6️⃣ **Guardrails** (Access Control) 🔐 CRÍTICO
**Status:** OpenRouter tem, Perpetuo DEVE ter

**O que faz:**
```
Guardrails = Regras de acesso por usuário/chave

Controles:
├─ Budget limit ($X/dia, semana, mês)
├─ Model allowlist (quais modelos podem usar)
├─ Provider allowlist (quais providers podem usar)
└─ Zero Data Retention enforcement
```

**Como implementar no Perpetuo (P1):**

```typescript
// 1. DB Schema
// prisma/schema.prisma
model Guardrail {
  id String @id @default(cuid())
  workspaceId String
  name String
  budgetLimit Decimal?
  budgetPeriod String? // daily | weekly | monthly
  modelAllowlist String[]
  providerAllowlist String[]
  requireZdr Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ApiKey {
  // ... existing
  guardrailId String?
  guardrail Guardrail?
}

model User {
  // ... existing
  guardrailId String?
  guardrail Guardrail?
}

// 2. Budget tracking
model GuardrailUsage {
  id String @id @default(cuid())
  guardrailId String
  period String // 2025-01-28 (date)
  costUsd Decimal @default(0)
  requestCount Int @default(0)
}

// 3. Validação no gateway
const guardrail = await getGuardrailForKey(apiKey);

if (guardrail?.modelAllowlist.length > 0) {
  if (!guardrail.modelAllowlist.includes(body.model)) {
    return reply.code(403).send({
      error: { message: 'Model not allowed by guardrail' }
    });
  }
}

if (guardrail?.budgetLimit) {
  const periodKey = getPeriodKey(guardrail.budgetPeriod);
  const usage = await getGuardrailUsage(guardrail.id, periodKey);
  const cost = calculateCost(tokens, model);
  
  if (usage.costUsd + cost > guardrail.budgetLimit) {
    return reply.code(429).send({
      error: { message: 'Guardrail budget exceeded' }
    });
  }
}

// 4. Dashboard UI
// Workspace Settings > Guardrails
// ├─ Create guardrail
// ├─ List guardrails
// ├─ Assign to member
// └─ Assign to API key
```

**Esforço:** 3-4 dias (P1)

---

### 7️⃣ **Presets** (Configuration Management)
**Status:** OpenRouter tem, Perpetuo PODE ter (opcional)

**O que faz:**
```
Presets = Configuração nomeada reutilizável

Exemplo:
├─ email-copywriter
│  ├─ model: gpt-4-turbo
│  ├─ temperature: 0.8
│  ├─ system: "You are a marketing copywriter..."
│  └─ provider: openai only
│
├─ code-reviewer
│  ├─ model: claude-opus
│  ├─ temperature: 0
│  ├─ system: "Review code for bugs..."
│  └─ provider: anthropic | groq
```

**Referência no API:**
```
# Method 1: Direct
POST /v1/chat/completions
{ "model": "@preset/email-copywriter", ... }

# Method 2: Field
POST /v1/chat/completions
{ "model": "gpt-4", "preset": "email-copywriter", ... }

# Method 3: Combined
POST /v1/chat/completions
{ "model": "gpt-4@preset/email-copywriter", ... }
```

**Implementação Perpetuo (P2):**

```typescript
// packages/core/src/presets/engine.ts
export class PresetResolver {
  async resolvePreset(modelName: string): Promise<ResolvedPreset> {
    // Parse: "gpt-4@preset/email-copywriter" ou "@preset/email-copywriter"
    const match = modelName.match(/^(?:(.+)@)?@preset\/(.+)$/);
    
    if (!match) return null;
    
    const [, overrideModel, presetName] = match;
    const preset = await db.preset.findUnique({ where: { name: presetName } });
    
    return {
      model: overrideModel || preset.model,
      temperature: preset.temperature,
      system: preset.system,
      providers: preset.providerAllowlist,
      strategy: preset.strategy,
    };
  }
}

// Gateway usage
const preset = await presetResolver.resolvePreset(body.model);
if (preset) {
  body.model = preset.model;
  body.temperature = body.temperature ?? preset.temperature;
  body.system_prompt = body.system_prompt ?? preset.system;
  // ... etc
}
```

**Esforço:** 2-3 dias (P2, opcional)

---

### 8️⃣ **FAQ** (Common Questions)
**Cobertura importante:**

| Topic | OpenRouter Responde | Perpetuo Deveria |
|-------|---|---|
| Getting started | ✅ | ✅ |
| Pricing/Fees | ✅ | ✅ (com BYOK diferente) |
| Models & Providers | ✅ | ✅ (dinâmico) |
| API Technical Specs | ✅ | ✅ |
| Privacy & Data Logging | ✅ | ✅ (ZDR) |
| Credit & Billing | ✅ | ⏳ (token counting) |
| Account Management | ✅ | ✅ |
| Rate Limiting | ✅ | ✅ (per IP + per key) |
| Streaming | ✅ | ✅ |
| Error Codes | ✅ | ✅ |

**Perpetuo FAQ que OpenRouter não tem:**

```
Q: Posso usar minhas próprias chaves API?
A: Sim, traz sua OpenAI key, Groq key, etc. Perpetuo as gerencia.

Q: O que acontece se uma provider cai?
A: Fallback automático para a próxima seguindo sua estratégia.

Q: Posso saber qual provider foi usado?
A: Sim, retornamos decision log completo.

Q: Sou preso a Perpetuo?
A: Não, saia quando quiser - suas chaves saem com você.

Q: Como funciona ZDR com BYOK?
A: Se sua chave exigir ZDR, apenas providers ZDR-compatíveis são usados.
```

---

## 🎯 MAPA DE IMPLEMENTAÇÃO PARA PERPETUO

### P1 (1-2 semanas) - CRÍTICO
- [x] Streaming robusto (pré + mid-stream errors)
- [ ] Zero Data Retention (ZDR)
- [ ] Guardrails (budget + allowlists)
- [ ] Decision Log persistido em DB
- [ ] Métricas coletadas (latência, erro, custo)

### P2 (2-3 semanas) - IMPORTANTE
- [ ] App Attribution (analytics)
- [ ] SDK @perpetuo/sdk (node + python)
- [ ] Swagger/OpenAPI spec
- [ ] Request Builder UI
- [ ] Presets (opcional)
- [ ] Framework integrations (Vercel AI, LangChain)

### P3 (1+ mês) - DIFERENCIAÇÃO
- [ ] Enterprise RBAC
- [ ] SLA tracking
- [ ] Webhooks (fallback events, provider down)
- [ ] Cost analytics dashboard
- [ ] Community showcase

---

## 📊 COMPARAÇÃO FINAL: OpenRouter vs Perpetuo

```
                    OpenRouter      Perpetuo (Hoje)    Perpetuo (Roadmap)
─────────────────────────────────────────────────────────────────────────
Streaming              ✅ Advanced     ✅ Basic          ✅ Advanced (P1)
App Attribution        ✅ Complete    ❌ Não            ✅ Complete (P2)
Framework Support      ✅ 15+         ❌ Não            ✅ 5+ (P2)
Zero Data Retention    ✅ Yes         ❌ Não            ✅ Yes (P1)
Guardrails             ✅ Advanced    ❌ Não            ✅ Advanced (P1)
Presets                ✅ Yes         ❌ Não            ✅ Yes (P2)
───────────────────────────────────────────────────────────────────────────
BYOK Support           ❌ Não         ✅ Sim            ✅ Sim
Transparent Routing    ❌ Não         ✅ Sim            ✅ Sim
Decision Audit Log     ❌ Não         ✅ Sim            ✅ Sim
Per-Request Strategy   ❌ Não         ✅ Sim            ✅ Sim
Zero Vendor Lock-in    ❌ Alto        ✅ Zero           ✅ Zero
───────────────────────────────────────────────────────────────────────────
OVERALL SCORE          8/10           6/10               9/10
```

---

## 💡 Insights Finais

### O que OpenRouter Faz Bem
1. ✅ **Comunidade & Ecosystem** - 15+ integrações oficiais
2. ✅ **Observability** - App rankings + analytics
3. ✅ **Advanced Features** - ZDR, Guardrails, Presets
4. ✅ **Error Handling** - Streaming errors bem documentados
5. ✅ **Documentation** - Completa e clara

### O que Perpetuo Pode Fazer Melhor
1. ✅ **BYOK** - Cliente controla chaves
2. ✅ **Transparency** - Decision log completo
3. ✅ **Control** - Estratégias por request
4. ✅ **Lock-in** - Zero vendor tie-in
5. ✅ **Enterprise** - Guardrails + ZDR (com BYOK)

### Próximos 90 Dias
```
Semana 1-2:  P1 Crítico (ZDR, Guardrails, Streaming)
Semana 3-4:  P2 Importante (SDK, Swagger, Attribution)
Semana 5-6:  Framework integrations (Vercel, LangChain)
Semana 7-8:  Polish + docs + marketing
Semana 9-10: Community outreach + feedback
```

---

**Status:** 🟢 **ROADMAP COMPLETO**

Após implementar este roadmap, Perpetuo será **superior** a OpenRouter em tudo que importa para empresas (controle, transparência, segurança) enquanto mantém paridade em features opcionais.


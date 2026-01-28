# 🎯 AÇÃO IMEDIATA: O Que Implementar Primeiro (Baseado em OpenRouter)

**Prioridade:** Manter Perpetuo **acima** de OpenRouter em tudo que importa  
**Timeline:** 90 dias

---

## 📌 TOP 3 IMPLEMENTAÇÕES (Próximos 14 dias)

### #1 ZERO DATA RETENTION (ZDR) - CRÍTICO 🔒

**Por quê:** Clientes enterprise exigem isso. OpenRouter tem.

**O que fazer:**

```typescript
// 1. Database migration
ALTER TABLE api_keys ADD COLUMN require_zdr BOOLEAN DEFAULT FALSE;
ALTER TABLE guardrails ADD COLUMN require_zdr BOOLEAN DEFAULT FALSE;

// 2. Create ZDR endpoint list (copiar de OpenRouter)
// packages/core/src/zdr/endpoints.ts
export const ZDR_ENDPOINTS = [
  // Atualizar diariamente de: https://openrouter.ai/api/v1/endpoints/zdr
];

// 3. Gateway validation
if (apiKey.require_zdr || body.provider?.zdr) {
  const availableProviders = selectedProviders.filter(p =>
    ZDR_ENDPOINTS.some(e => e.provider === p.name)
  );
  
  if (availableProviders.length === 0) {
    throw new Error('No ZDR-compatible providers available');
  }
}

// 4. Dashboard UI
// API Key creation:
//   ☐ Require Zero Data Retention
```

**Timeline:** 2 dias  
**Esforço:** Baixo (copiar de OpenRouter + validação)  
**Value:** 🔴 CRÍTICO - Diferencial enterprise

---

### #2 GUARDRAILS (Budget + Allowlists) - CRÍTICO 🛡️

**Por quê:** Organizações precisam controlar gastos de membros

**O que fazer:**

```typescript
// 1. Database
model Guardrail {
  id String @id
  workspaceId String
  name String
  
  budgetLimit Decimal? // $
  budgetPeriod String? // daily | weekly | monthly
  
  modelAllowlist String[] // ["gpt-4", "claude-opus"]
  providerAllowlist String[] // ["openai", "anthropic"]
  requireZdr Boolean
  
  createdAt DateTime
  updatedAt DateTime
}

// 2. API Endpoints
POST /workspaces/:id/guardrails
GET /workspaces/:id/guardrails
PUT /workspaces/:id/guardrails/:guardrailId
DELETE /workspaces/:id/guardrails/:guardrailId

// 3. Assign to member or API key
POST /workspaces/:id/members/:memberId/guardrail
{ "guardrailId": "gr_xxx" }

// 4. Gateway enforcement
const guardrail = await getGuardrailForKey(apiKey);

if (guardrail?.modelAllowlist?.length > 0) {
  if (!guardrail.modelAllowlist.includes(body.model)) {
    throw new Error(403, 'Model not allowed');
  }
}

if (guardrail?.budgetLimit) {
  const usage = await getGuardrailUsage(guardrail.id);
  const cost = calculateCost(tokens, model);
  
  if (usage.costUsd + cost > guardrail.budgetLimit) {
    throw new Error(429, 'Budget exceeded');
  }
}

// 5. Dashboard
// Workspace Settings > Guardrails
//   Create > Name, Budget, Models, Providers, ZDR
//   Assign > to member or to API key
```

**Timeline:** 3 dias  
**Esforço:** Médio (DB + endpoints + enforcement)  
**Value:** 🔴 CRÍTICO - Vender enterprise

---

### #3 STREAMING ROBUSTO (Error Handling) - IMPORTANTE ⚡

**Por quê:** Mid-stream errors quebram UX. OpenRouter trata bem.

**O que fazer:**

```typescript
// 1. Pre-stream errors (antes de enviar 200)
try {
  // Validate, auth, quota
  const chatResponse = await provider.chat(
    { ...body, stream: true }
  );
  // Se aqui quebrar, retorn normal JSON error
} catch (error) {
  if (error instanceof ValidationError) {
    return reply.code(400).send({ error: {...} });
  }
  // ... etc
}

// 2. Mid-stream errors (após enviar 200)
reply.raw.on('error', () => controller.abort());

try {
  for await (const chunk of chatResponse) {
    if (chunk.error) {
      // Enviar erro como SSE event
      reply.raw.write(`data: ${JSON.stringify({
        error: chunk.error,
        choices: [{ finish_reason: 'error' }]
      })}\n\n`);
      break;
    }
    
    reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }
} catch (error) {
  if (error.name !== 'AbortError') {
    reply.raw.write(`data: ${JSON.stringify({
      error: { message: error.message },
      choices: [{ finish_reason: 'error' }]
    })}\n\n`);
  }
}

// 3. Tests
describe('Streaming', () => {
  it('should handle pre-stream errors', async () => {
    // No stream sent
  });
  
  it('should handle mid-stream errors', async () => {
    // Partial stream + error event
  });
  
  it('should handle cancellation', async () => {
    // AbortController.abort()
  });
});
```

**Timeline:** 1-2 dias  
**Esforço:** Baixo (já tem base)  
**Value:** 🟡 MÉDIO - Improve UX

---

## 📋 P2 (Semana 3-4) - QUICK WINS

### #4 APP ATTRIBUTION (Analytics)
```typescript
// Headers
'X-Client-Name': 'my-app'
'X-Client-Version': '1.2.3'
'Referer': 'https://myapp.com'

// Log + Dashboard
/dashboard/analytics?app=my-app
→ Requests, Models used, Cost, Tokens
```
**Timeline:** 2 dias | **Value:** 🟡 MÉDIO

---

### #5 SDK @perpetuo/sdk
```typescript
npm install @perpetuo/sdk

const perpetuo = new PerpetutoClient({ apiKey: 'pk_...' });
const response = await perpetuo.chat.create({
  model: 'gpt-4',
  messages: [...],
  strategy: 'cheapest' // ← DIFERENCIAL
});
```
**Timeline:** 3-4 dias | **Value:** 🟢 ALTO

---

### #6 SWAGGER/OPENAPI
```bash
npm run swagger  # Gera spec
# http://localhost:3000/docs
```
**Timeline:** 2 dias | **Value:** 🟡 MÉDIO

---

## 🎯 CHECKLIST DE PRIORIZAÇÃO

```
SEMANA 1-2 (P1):
✅ ZDR Endpoints (copiar de OpenRouter)
✅ ZDR Validation no gateway
✅ Guardrails DB schema
✅ Guardrails API endpoints
✅ Guardrails gateway enforcement
✅ Streaming error handling
✅ Dashboard ZDR + Guardrails UI

SEMANA 3-4 (P2):
✅ SDK @perpetuo/sdk (Node)
✅ App Attribution headers + logging
✅ Swagger/OpenAPI spec
✅ Request Builder UI
✅ Analytics dashboard (/apps)

SEMANA 5-6 (P2):
✅ Framework: Vercel AI SDK
✅ Framework: LangChain Python
✅ Presets (opcional)

SEMANA 7-8 (Polish):
✅ Tests para tudo
✅ Documentação
✅ Error codes standardized
✅ Rate limit tuning

SEMANA 9-10 (Marketing):
✅ "How Perpetuo vs OpenRouter" blog post
✅ Community outreach
✅ Enterprise case studies
```

---

## 📊 IMPACTO ESPERADO

### Após P1 (2 semanas)
```
Perpetuo agora tem:
✅ ZDR enforcement (match OpenRouter + BYOK)
✅ Guardrails (match OpenRouter + mais flexible)
✅ Robust streaming (match OpenRouter)
✅ Decision audit log (MELHOR que OpenRouter)

Vender pitch:
"Perpetuo = OpenRouter + controle + BYOK"
```

### Após P2 (4 semanas)
```
Perpetuo agora tem:
✅ Official SDK (match OpenRouter SDK)
✅ Swagger docs (match OpenRouter)
✅ App analytics (match OpenRouter)
✅ Request builder (match OpenRouter)

Vender pitch:
"Perpetuo = OpenRouter com BYOK e transparência"
```

### Após P3 (6-8 semanas)
```
Perpetuo agora tem:
✅ Framework integrations (LangChain, Vercel)
✅ Presets (avançado)
✅ Enterprise RBAC (acima OpenRouter)
✅ SLA tracking (acima OpenRouter)

Vender pitch:
"Perpetuo = Enterprise gateway com zero vendor lock-in"
```

---

## 💰 ROI ESTIMADO

| Feature | Effort | Value | ROI |
|---------|--------|-------|-----|
| ZDR | 2 dias | Enterprise sales | 🔴 CRÍTICO |
| Guardrails | 3 dias | Enterprise sales | 🔴 CRÍTICO |
| Streaming fix | 2 dias | UX improvement | 🟡 MÉDIO |
| SDK | 4 dias | Dev velocity | 🟢 ALTO |
| Swagger | 2 dias | DX improvement | 🟡 MÉDIO |
| App Analytics | 2 dias | Viral/referral | 🟡 MÉDIO |

**Total Esforço:** ~17 dias (~3-4 semanas)  
**Revenue Impact:** +50% enterprise conversions  
**Competitive Advantage:** Único com BYOK + ZDR + Guardrails

---

## 🚀 QUICK ACTION ITEMS (TODAY)

1. **Copiar ZDR endpoint list**
   ```bash
   curl https://openrouter.ai/api/v1/endpoints/zdr > zdr_endpoints.json
   # Commit como packages/core/src/zdr/endpoints.ts
   ```

2. **Design Guardrails DB schema**
   - [ ] Create Prisma model
   - [ ] Create migration
   - [ ] Teste com dados fictícios

3. **Revisar streaming code**
   - [ ] Identificar onde pré-stream errors ocorrem
   - [ ] Identificar onde mid-stream errors ocorrem
   - [ ] Planejar error handling

4. **Criar issue/PR**
   - [ ] P1: ZDR Implementation
   - [ ] P1: Guardrails Implementation
   - [ ] P1: Streaming Error Handling

---

## 📞 COMUNICAÇÃO AO USUÁRIO

Depois de implementar, comunicar:

```markdown
# Perpetuo v2.0 - Enterprise Ready

Perpetuo agora oferece o que OpenRouter tem + o que OpenRouter NÃO tem:

## Novo em v2.0
✅ Zero Data Retention (ZDR) enforcement
✅ Guardrails (budget + allowlists + ZDR)
✅ Streaming error handling robusto
✅ Decision Audit Log (único)

## Mantém Vantagem
✅ BYOK (Bring Your Own Key)
✅ Transparent routing (decision log)
✅ Per-request strategies (fastest/cheapest/reliable)
✅ Zero vendor lock-in

## Próximo (Semana 3)
⏳ Official SDK (@perpetuo/sdk)
⏳ Swagger/OpenAPI
⏳ App Attribution Analytics
```

---

**Status:** 🟢 **PRONTO PARA IMPLEMENTAR HOJE**

Não espere perfeição. Implemente ZDR + Guardrails em 2 semanas, depois itere.


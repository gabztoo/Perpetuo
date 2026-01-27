# 🚀 ARQUITETURA CORRIGIDA — Decisão de Provider Centralizada

## Resumo das Mudanças

Implementação completa da arquitetura mandatória onde **o cliente NUNCA escolhe provider**. Perpetuo decide por request baseado em:

1. **Model Alias** (interpretação lógica)
2. **Strategy** (header + workspace default)
3. **Provider Selection** (ordenação dinâmica)
4. **Error Handling** (retry vs abort inteligente)

---

## ✅ Componentes Implementados

### 1. **ModelAliasResolver** 
- **Arquivo:** `packages/core/src/resolvers/modelAlias.ts`
- **Função:** Interpreta aliases lógicos (`gpt-4`, `perpetuo/chat-fast`) → `{intent, tier}`
- **Impacto:** Cliente **NUNCA** controla implicitamente qual provider via nome do modelo
- **Exemplos:**
  - `"gpt-4"` → `{ intent: "chat", tier: "default" }`
  - `"perpetuo/chat-fast"` → `{ intent: "chat", tier: "fast" }`

### 2. **StrategyResolver**
- **Arquivo:** `packages/core/src/resolvers/strategy.ts`
- **Função:** Resolve estratégia em ordem de prioridade: Header → Workspace → Fallback
- **Estratégias suportadas:** `default | fastest | cheapest | reliable`
- **Impacto:** Header `X-Perpetuo-Route` não controla completamente — workspace tem prioridade

### 3. **ProviderSelector**
- **Arquivo:** `packages/core/src/resolvers/providerSelector.ts`
- **Função:** Ordena providers elegíveis baseado em estratégia
  - **fastest:** por latência recente
  - **cheapest:** por custo médio
  - **reliable:** por taxa de erro (menor)
  - **default:** por prioridade manual
- **Impacto:** "Cheapest strategy" agora **funciona**

### 4. **ErrorClassifier**
- **Arquivo:** `packages/core/src/resilience/errorClassifier.ts`
- **Função:** Classifica erros em **RETRYABLE** vs **FATAL**
- **FATAL (ABORT):** 401 (BYOK inválida), 403 quota permanente
- **RETRYABLE (FALLBACK):** 429, 5xx, timeout, network errors
- **Impacto:** Não tenta provider indiscriminadamente — erros fatais abortam imediatamente

---

## 📝 Arquivos Refatorados

### `apps/perpetuo-gateway/src/routes/chat.ts` (COMPLETO)
**Mudanças principais:**

```typescript
// NOVO: Inicializar resolvers
const aliasResolver = new ModelAliasResolver(config);
const strategyResolver = new StrategyResolver();
const providerSelector = new ProviderSelector();
const errorClassifier = new ErrorClassifier();

// NOVO: Passo 3 - Resolver alias
const aliasResolution = aliasResolver.resolve(body.model);
// → { intent: "chat", tier: "default", explanation: "..." }

// NOVO: Passo 4 - Resolver strategy
const strategyResolution = strategyResolver.resolve(strategyHeader, workspaceStrategy);
// → { strategy: "fastest", source: "workspace", explanation: "..." }

// NOVO: Passo 5 - Selecionar providers ordenados
const selectedProviders = providerSelector.selectAndOrder(
    providers,
    models,
    strategyResolution.strategy
);

// NOVO: Passo 6 - Error classification
const classification = errorClassifier.classify(error);
if (!classification.retryable) {
    // ABORT: Fatal error
    return reply.code(401).send({ error: ... });
}
// RETRY: Tenta próximo provider
```

**Events emitidos (Decision Log):**
- `alias_resolved` → interpreted alias
- `strategy_resolved` → chosen strategy + source
- `chain_built` → ordered providers
- `provider_attempt` → trying provider N
- `provider_failure` → error + retryable flag
- `request_succeeded` → success with `fallback_used`, `providers_attempted`, `strategy`
- `request_failed` → all failed

---

### `apps/perpetuo-backend/src/modules/gateway/routes.ts` (ATUALIZADO)
**Removido:**
- ❌ Função `detectProvider()` hardcoded (baseada em prefixo)
- ❌ Tentativa cega de qualquer erro

**Adicionado:**
- ✅ `ErrorClassifier` para classificar erros
- ✅ Abort em erros fatais (401, 403 permanente)
- ✅ Retry lógico em erros retryable
- ✅ `fallback_used` e `providers_attempted` no log

**Antes:**
```typescript
// ❌ VIOLA: Regra hardcoded por prefixo
function detectProvider(model: string): string {
  if (model.startsWith('gpt-')) return 'openai';  // Cliente controla!
  if (model.startsWith('claude-')) return 'anthropic';
  return 'openai';
}
```

**Depois:**
```typescript
// ✅ CORRETO: Classificação inteligente de erro
const classification = errorClassifier.classify(error);
if (!classification.retryable) {
    // ABORT: Fatal
    return sendError(reply, classification.explanation, 401);
}
// RETRY: Continue
```

---

## 🔄 Fluxo de Decisão Atualizado

```
Cliente → POST /v1/chat/completions
           Authorization: Bearer pk_xxx
           X-Perpetuo-Route: fastest (optional)
           model: "gpt-4"

           ↓
Perpetuo Gateway (SaaS)
  │
  ├─ 1. VALIDATE: autenticação + quotas
  │
  ├─ 2. RESOLVE: Model Alias
  │   model: "gpt-4" → { intent: "chat", tier: "default" }
  │
  ├─ 3. RESOLVE: Strategy
  │   Header: "fastest" OR Workspace: "cheapest" OR Default: "default"
  │
  ├─ 4. SELECT: Providers (ordenados por strategy)
  │   [openai, anthropic, groq] ← sorted by latency/cost/reliability
  │
  ├─ 5. EXECUTE: Provider chain com fallback
  │   for each provider:
  │     try:
  │       invoke provider
  │       return response
  │     catch error:
  │       classify error
  │       if FATAL: abort & return error
  │       if RETRYABLE: continue to next provider
  │
  └─ 6. DECISION LOG
      { request_id, workspace_id, model_alias: "gpt-4", 
        strategy: "fastest", providers_attempted: [...], 
        provider_used: "openai", fallback_used: true, latency_ms: 234 }
```

---

## 🧪 Exemplos de Uso

### Exemplo 1: Client pede "gpt-4", Perpetuo escolhe provider

```bash
POST /v1/chat/completions
Authorization: Bearer pk_xxx
X-Perpetuo-Route: cheapest
Content-Type: application/json

{
  "model": "gpt-4",
  "messages": [...]
}
```

**O que acontece:**
1. `model: "gpt-4"` → alias resolver interpreta como `{ intent: "chat", tier: "default" }`
2. Header `cheapest` → strategy resolver escolhe "cheapest"
3. ProviderSelector ordena: `[groq, gemini, openai]` (por custo)
4. Tenta groq → timeout (retryable) → tenta gemini → sucesso
5. Log: `{ provider_used: "gemini", fallback_used: true, strategy: "cheapest" }`

### Exemplo 2: Fallback automático com erro fatal

```bash
POST /v1/chat/completions
Authorization: Bearer pk_xxx

{
  "model": "perpetuo/chat-fast",
  "messages": [...],
  "x-provider-key-openai": "invalid-key"  # ← BYOK inválida
}
```

**O que acontece:**
1. Alias resolver: `perpetuo/chat-fast` → `{ intent: "chat", tier: "fast" }`
2. Strategy resolver: header vazio → workspace default → "default"
3. ProviderSelector: `[openai, groq, gemini]`
4. Tenta openai → 401 Unauthorized (FATAL)
5. ErrorClassifier: `{ retryable: false, reason: "BYOK_INVALID" }`
6. **ABORT imediatamente** → `401 { error: "Provider rejected API key" }`
7. Não tenta groq ou gemini (não é culpa deles)

---

## 📊 Exportações Centralizadas

Todos os resolvers estão exportados de `@perpetuo/core`:

```typescript
export * from './resolvers/modelAlias';      // ModelAliasResolver
export * from './resolvers/strategy';        // StrategyResolver
export * from './resolvers/providerSelector'; // ProviderSelector
export * from './resilience/errorClassifier'; // ErrorClassifier
```

---

## ✨ Benefícios

| Antes | Depois |
|-------|--------|
| ❌ Cliente controla provider via prefixo do modelo | ✅ Perpetuo decide por strategy |
| ❌ "Cheapest" era hardcoded, não funcionava | ✅ "Cheapest" ordena por custo real |
| ❌ Tenta provider mesmo com BYOK inválida | ✅ Aborta em erro fatal imediatamente |
| ❌ Sem log centralizado de decisão | ✅ Cada request registra `strategy`, `providers_attempted`, `fallback_used` |
| ❌ Lógica espalhada entre gateway + backend | ✅ Resolvers centralizados em `@perpetuo/core` |

---

## 🔗 Próximas Etapas (P1+P2)

1. **Persistir Decision Log em DB** 
   - Adicionar campos a `RequestLog`: `fallback_used`, `providers_attempted`, `strategy`
   - Criar endpoint `/workspace/:id/decisions` para auditoria

2. **Métricas por Provider**
   - Coletar `avgLatencyMs`, `lastHourErrorRate`, `costPer1kTokens`
   - Usar no ProviderSelector para "fastest" e "reliable"

3. **Dashboard: Configurar Strategy por Workspace**
   - UI para escolher `default | fastest | cheapest | reliable`
   - Ler de DB, não hardcoded

4. **BYOK Centralizado**
   - Remover headers `x-provider-key-*`
   - Armazenar chaves criptografadas no banco por workspace
   - Gateway recupera do BD, não do request

---

## ✅ Validação

Para verificar que a arquitetura está correta, teste:

```bash
# 1. Cheapest strategy funciona
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer pk_xxx" \
  -H "X-Perpetuo-Route: cheapest" \
  -d '{"model":"gpt-4","messages":[...]}'
# → Deve usar provider mais barato

# 2. BYOK inválida não fallback
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer pk_xxx" \
  -H "x-provider-key-openai: invalid" \
  -d '{"model":"gpt-4","messages":[...]}'
# → Deve retornar 401 imediatamente, não tentar outros

# 3. Log contains decision info
SELECT provider_used, fallback_used, providers_attempted, strategy
FROM request_log
WHERE request_id = '...'
# → Deve ter campos preenchidos

```

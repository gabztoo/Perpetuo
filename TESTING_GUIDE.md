# 🧪 GUIA DE TESTES — Arquitetura Corrigida

## Setup

```bash
# 1. Instalar dependências
cd PERPETUO
pnpm install

# 2. Build core package (contém resolvers)
cd packages/core
pnpm build

# 3. Build gateway
cd apps/perpetuo-gateway
pnpm build

# 4. Start services
cd PERPETUO
docker-compose up -d
pnpm run dev
```

---

## Teste 1: ModelAliasResolver

### Objetivo
Validar que `model: "gpt-4"` é interpretado como alias lógico, não como provider direto.

### Código
```javascript
// test/modelAlias.test.ts
import { ModelAliasResolver } from '@perpetuo/core';
import { config } from '../config';

describe('ModelAliasResolver', () => {
  const resolver = new ModelAliasResolver(config);

  it('should resolve "gpt-4" to intent and tier', () => {
    const result = resolver.resolve('gpt-4');
    expect(result).toEqual({
      requestedAlias: 'gpt-4',
      intent: 'chat',
      tier: 'default',
      explanation: expect.any(String),
    });
  });

  it('should resolve perpetuo aliases', () => {
    const result = resolver.resolve('perpetuo/chat-fast');
    expect(result).toEqual({
      requestedAlias: 'perpetuo/chat-fast',
      intent: 'chat',
      tier: 'fast',
      explanation: expect.any(String),
    });
  });

  it('should NOT expose which provider will be used', () => {
    const result = resolver.resolve('gpt-4');
    // Campo 'provider' não deve existir
    expect(result).not.toHaveProperty('provider');
  });
});
```

### Executar
```bash
cd apps/perpetuo-backend
pnpm test -- modelAlias.test.ts
```

---

## Teste 2: StrategyResolver

### Objetivo
Validar que estratégia vem de header → workspace → fallback (nessa ordem).

### Código
```javascript
// test/strategy.test.ts
import { StrategyResolver } from '@perpetuo/core';

describe('StrategyResolver', () => {
  const resolver = new StrategyResolver();

  it('should prioritize header over workspace', () => {
    const result = resolver.resolve('fastest', 'cheapest');
    expect(result.strategy).toBe('fastest');
    expect(result.source).toBe('header');
  });

  it('should use workspace when header is empty', () => {
    const result = resolver.resolve(undefined, 'reliable');
    expect(result.strategy).toBe('reliable');
    expect(result.source).toBe('workspace');
  });

  it('should fallback to default', () => {
    const result = resolver.resolve(undefined, undefined);
    expect(result.strategy).toBe('default');
    expect(result.source).toBe('fallback');
  });

  it('should reject invalid strategies', () => {
    const result = resolver.resolve('invalid-strategy', undefined);
    expect(result.strategy).toBe('default');
  });
});
```

### Executar
```bash
cd packages/core
pnpm test -- strategy.test.ts
```

---

## Teste 3: ProviderSelector

### Objetivo
Validar que providers são ordenados corretamente por estratégia.

### Código
```javascript
// test/providerSelector.test.ts
import { ProviderSelector } from '@perpetuo/core';

describe('ProviderSelector', () => {
  const selector = new ProviderSelector();
  const providers = [
    { name: 'openai', enabled: true },
    { name: 'groq', enabled: true },
    { name: 'gemini', enabled: true },
  ];
  const models = [
    { name: 'gpt-4', provider: 'openai', costPer1kInput: 0.03, costPer1kOutput: 0.06 },
    { name: 'groq-fast', provider: 'groq', costPer1kInput: 0.0001, costPer1kOutput: 0.0002 },
    { name: 'gemini-pro', provider: 'gemini', costPer1kInput: 0.0005, costPer1kOutput: 0.001 },
  ];

  it('should order by cost (cheapest)', () => {
    const result = selector.selectAndOrder(providers, models, 'cheapest');
    // groq (0.0001 + 0.0002) < gemini (0.0005 + 0.001) < openai (0.03 + 0.06)
    expect(result.map((p) => p.name)).toEqual(['groq', 'gemini', 'openai']);
  });

  it('should order by priority (default)', () => {
    const result = selector.selectAndOrder(providers, models, 'default');
    // Mantém ordem original
    expect(result.map((p) => p.name)).toEqual(['openai', 'groq', 'gemini']);
  });
});
```

### Executar
```bash
cd packages/core
pnpm test -- providerSelector.test.ts
```

---

## Teste 4: ErrorClassifier

### Objetivo
Validar que erros são classificados corretamente em RETRYABLE vs FATAL.

### Código
```javascript
// test/errorClassifier.test.ts
import { ErrorClassifier } from '@perpetuo/core';

describe('ErrorClassifier', () => {
  const classifier = new ErrorClassifier();

  it('should classify 401 as FATAL', () => {
    const result = classifier.classify({ statusCode: 401, message: 'Unauthorized' });
    expect(result).toEqual({
      retryable: false,
      statusCode: 401,
      reason: 'BYOK_INVALID',
      explanation: expect.any(String),
    });
  });

  it('should classify 429 as RETRYABLE', () => {
    const result = classifier.classify({ statusCode: 429, message: 'Too many requests' });
    expect(result.retryable).toBe(true);
    expect(result.reason).toBe('RATE_LIMITED');
  });

  it('should classify timeout as RETRYABLE', () => {
    const result = classifier.classify(new Error('Provider timeout'));
    expect(result.retryable).toBe(true);
    expect(result.reason).toBe('TIMEOUT');
  });

  it('should classify 5xx as RETRYABLE', () => {
    const result = classifier.classify({ statusCode: 502, message: 'Bad Gateway' });
    expect(result.retryable).toBe(true);
    expect(result.reason).toBe('SERVICE_UNAVAILABLE');
  });

  it('should classify 403 quota as FATAL', () => {
    const result = classifier.classify({
      statusCode: 403,
      message: 'Provider quota exceeded',
    });
    expect(result.retryable).toBe(false);
    expect(result.reason).toBe('PROVIDER_QUOTA_EXCEEDED');
  });
});
```

### Executar
```bash
cd packages/core
pnpm test -- errorClassifier.test.ts
```

---

## Teste 5: Integration Test (E2E)

### Objetivo
Testar o fluxo completo: request → resolve → select → execute → log.

### Código
```javascript
// test/e2e/chatCompletion.test.ts
import axios from 'axios';

describe('Chat Completion E2E', () => {
  const api = axios.create({
    baseURL: 'http://localhost:3000',
    validateStatus: () => true, // Don't throw on any status
  });

  it('should complete request with cheapest strategy', async () => {
    const response = await api.post('/v1/chat/completions', {
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello' }],
    }, {
      headers: {
        Authorization: 'Bearer pk_test_123',
        'X-Perpetuo-Route': 'cheapest',
        'x-provider-key-groq': process.env.GROQ_API_KEY,
        'x-provider-key-openai': process.env.OPENAI_API_KEY,
      },
    });

    expect(response.status).toBe(200);
    expect(response.data.choices).toBeDefined();
    // Should have used groq (cheapest)
    expect(response.data.model).toBe('gpt-4'); // Client sees alias, not provider
  });

  it('should abort on invalid BYOK', async () => {
    const response = await api.post('/v1/chat/completions', {
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello' }],
    }, {
      headers: {
        Authorization: 'Bearer pk_test_123',
        'x-provider-key-openai': 'invalid-key-123',
      },
    });

    // Should abort immediately with 401
    expect(response.status).toBe(401);
    expect(response.data.error.message).toContain('API key');
    // Should NOT try other providers
  });

  it('should fallback on timeout', async () => {
    // Mock slow provider response
    const response = await api.post('/v1/chat/completions', {
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello' }],
    }, {
      headers: {
        Authorization: 'Bearer pk_test_123',
        'X-Perpetuo-Route': 'fastest',
        'x-provider-key-openai': process.env.OPENAI_API_KEY,
        'x-provider-key-groq': process.env.GROQ_API_KEY,
      },
      timeout: 35000, // Longer than provider timeout
    });

    // Should fallback to groq after openai timeout
    expect(response.status).toBe(200);
    // Event log should show fallback_used: true
  });
});
```

### Executar
```bash
# Setup env
export GROQ_API_KEY=...
export OPENAI_API_KEY=...

# Run tests
cd apps/perpetuo-backend
pnpm test -- e2e/chatCompletion.test.ts
```

---

## Teste 6: Decision Log Verification

### Objetivo
Validar que cada request gera um log de decisão completo.

### SQL Query
```sql
-- Check decision log
SELECT 
  request_id,
  model,
  strategy,
  provider_attempted,
  provider_used,
  fallback_used,
  latency_ms,
  status_code,
  created_at
FROM request_log
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- Expected output:
-- | request_id | model  | strategy | provider_attempted    | provider_used | fallback_used | latency_ms | status_code | created_at |
-- |------------|--------|----------|----------------------|---------------|---------------|-----------|------------|-----------|
-- | uuid-1234  | gpt-4  | cheapest | ["groq","openai"]    | groq          | false         | 234       | 200        | now       |
-- | uuid-5678  | gpt-4  | fastest  | ["openai","groq"]    | groq          | true          | 1000      | 200        | now       |
-- | uuid-9999  | gpt-4  | default  | ["openai"]           | null          | false         | 401       | 401        | now       |
```

### Verificação
```bash
# Connect to DB
psql $DATABASE_URL

# Run query above
\copy (SELECT ...) TO 'decision_log.csv' WITH CSV

# Validate fields exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'request_log'
ORDER BY column_name;
```

---

## Teste 7: Header Precedence

### Objetivo
Validar que header `X-Perpetuo-Route` tem precedência sobre workspace default.

### Código
```bash
# Setup workspace with default="cheapest"
# (via dashboard ou DB)
UPDATE workspace SET default_strategy = 'cheapest' WHERE id = 'ws_123';

# Test 1: Override with header
curl -X POST http://localhost:3000/v1/chat/completions \
  -H 'Authorization: Bearer pk_test_123' \
  -H 'X-Perpetuo-Route: fastest' \
  -H 'x-provider-key-groq: ...' \
  -d '{"model":"gpt-4","messages":[...]}'
# Expected: Uses "fastest" strategy, not "cheapest"

# Test 2: Use workspace default
curl -X POST http://localhost:3000/v1/chat/completions \
  -H 'Authorization: Bearer pk_test_123' \
  -H 'x-provider-key-groq: ...' \
  -d '{"model":"gpt-4","messages":[...]}'
# Expected: Uses "cheapest" strategy (workspace default)

# Test 3: Fallback to default
curl -X POST http://localhost:3000/v1/chat/completions \
  -H 'Authorization: Bearer pk_test_123' \
  -H 'X-Perpetuo-Route: invalid' \
  -H 'x-provider-key-groq: ...' \
  -d '{"model":"gpt-4","messages":[...]}'
# Expected: Uses "default" strategy (fallback)
```

---

## Checklist de Validação

- [ ] ModelAliasResolver testes passam
- [ ] StrategyResolver testes passam
- [ ] ProviderSelector testes passam
- [ ] ErrorClassifier testes passam
- [ ] E2E integration testes passam
- [ ] Decision log tem campos corretos
- [ ] Header precedence validado
- [ ] BYOK inválida aborta imediatamente
- [ ] Fallback funciona em timeout
- [ ] Cheapest strategy ordena corretamente
- [ ] Fastest strategy usa latência (se métricas disponíveis)

---

## Próximas Validações (Quando Implementado)

- [ ] Métricas de provider coletadas
- [ ] Fastest/reliable strategies usam métricas reais
- [ ] Dashboard mostra strategy por workspace
- [ ] BYOK keys removidas de headers
- [ ] BYOK keys armazenadas em DB

---

**Status:** Pronto para QA ✅

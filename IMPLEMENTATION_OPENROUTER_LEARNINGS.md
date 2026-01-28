# 🔧 IMPLEMENTAÇÃO PRÁTICA: Aprender de OpenRouter, Diferenciar com Perpetuo

## 1. SDK COMPATÍVEL COM OPENAI (Aprender)

### OpenRouter - Como Fazem
```typescript
// OpenRouter SDK
import { OpenRouter } from '@openrouter/sdk';

const openRouter = new OpenRouter({ 
  apiKey: 'openrouter_key',
  defaultHeaders: {
    'HTTP-Referer': 'https://myapp.com',
    'X-Title': 'MyApp'
  }
});

const response = await openRouter.chat.send({
  model: 'openai/gpt-4',
  messages: [...],
  stream: false
});
```

### Perpetuo - Como Implementar (P2)
```typescript
// @perpetuo/sdk (novo)
import { PerpetutoClient } from '@perpetuo/sdk';

const perpetuo = new PerpetutoClient({ 
  apiKey: 'pk_xxxxx',
  baseURL: 'https://your-perpetuo.com', // SaaS ou self-hosted
});

// ✨ DIFERENCIAL: Controle de estratégia
const response = await perpetuo.chat.create({
  model: 'gpt-4',  // Alias, não provider
  messages: [...],
  strategy: 'cheapest',  // ← NOVO (por request)
  onFallback: (from, to) => {
    console.log(`Fallback: ${from} → ${to}`);
  }
});
```

### Código do SDK (packages/sdk/src/index.ts)
```typescript
import axios from 'axios';

export interface PerpetutoClientOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

export type Strategy = 'default' | 'fastest' | 'cheapest' | 'reliable';

export interface ChatCreateRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  strategy?: Strategy;
  stream?: boolean;
  onFallback?: (from: string, to: string) => void;
}

export class PerpetutoClient {
  private client = axios.create();

  constructor(options: PerpetutoClientOptions) {
    this.client.defaults.baseURL = options.baseURL || 'https://api.perpetuo.ai';
    this.client.defaults.headers.Authorization = `Bearer ${options.apiKey}`;
    this.client.defaults.timeout = options.timeout || 30000;
  }

  chat = {
    create: async (req: ChatCreateRequest) => {
      const response = await this.client.post('/v1/chat/completions', {
        model: req.model,
        messages: req.messages,
        stream: req.stream || false,
      }, {
        headers: {
          ...(req.strategy && { 'X-Perpetuo-Route': req.strategy }),
          'X-Client': 'perpetuo-sdk',
          'X-SDK-Version': '1.0.0',
        }
      });

      // Log fallback se ocorreu
      if (response.data.metadata?.fallback_used && req.onFallback) {
        const providers = response.data.metadata?.providers_attempted || [];
        req.onFallback(providers[0], response.data.metadata?.provider_used);
      }

      return response.data;
    }
  };
}

// Exemplo de uso
const perpetuo = new PerpetutoClient({ apiKey: 'pk_...' });
const response = await perpetuo.chat.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello' }],
  strategy: 'cheapest',
  onFallback: (from, to) => console.log(`Used ${to} instead of ${from}`)
});
```

---

## 2. SWAGGER/OPENAPI SPEC (Aprender)

### OpenRouter - Swagger Format
OpenRouter oferece docs em Swagger, permitindo:
```
GET /docs
POST /request-builder  (gera código)
```

### Perpetuo - Implementar Swagger (P2)

#### apps/perpetuo-backend/tsoa.json
```json
{
  "specVersion": 3,
  "basePath": "/",
  "entryFile": "src/main.ts",
  "noImplicitAdditionalProperties": "throw-on-extras",
  "controllerPathGlobs": ["src/modules/**/*.routes.ts"],
  "specOutputDirectory": "dist/swagger"
}
```

#### apps/perpetuo-backend/package.json
```json
{
  "scripts": {
    "swagger": "tsoa spec-and-routes",
    "swagger:serve": "swagger-ui-express dist/swagger/swagger.json"
  },
  "devDependencies": {
    "tsoa": "^4.1.3",
    "swagger-ui-express": "^5.0.0"
  }
}
```

#### Backend setup (src/main.ts)
```typescript
import * as swaggerUI from 'swagger-ui-express';
import swaggerDoc from '../dist/swagger/swagger.json';

fastify.register(fastifySwagger, {
  swagger: {
    info: {
      title: 'Perpetuo API',
      version: '1.0.0',
      description: 'OpenAI-compatible gateway with intelligent routing'
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
      { url: 'https://api.perpetuo.ai', description: 'Production' }
    ]
  },
  staticCSP: true,
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false
  }
});

// Serve Swagger UI
fastify.get('/docs', async (request, reply) => {
  return reply.sendFile('index.html', path.join(__dirname, 'swagger-ui'));
});

// Serve OpenAPI spec
fastify.get('/swagger.json', async (request, reply) => {
  return reply.send(swaggerDoc);
});
```

#### Uso:
```bash
npm run swagger  # Gera dist/swagger/swagger.json
npm run dev
# Acessa http://localhost:3000/docs
```

---

## 3. REQUEST BUILDER (Aprender de OpenRouter)

### UI no Dashboard

#### apps/perpetuo-dashboard/src/components/RequestBuilder.tsx
```typescript
import React, { useState } from 'react';
import axios from 'axios';

export const RequestBuilder: React.FC = () => {
  const [model, setModel] = useState('gpt-4');
  const [strategy, setStrategy] = useState<'fastest' | 'cheapest' | 'reliable' | 'default'>('default');
  const [message, setMessage] = useState('Hello, world!');
  const [language, setLanguage] = useState<'curl' | 'python' | 'node' | 'go'>('curl');

  const generateCode = () => {
    const baseURL = 'https://your-perpetuo.com';
    const apiKey = 'pk_xxxxx';

    const code: Record<string, string> = {
      curl: `curl -X POST ${baseURL}/v1/chat/completions \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "X-Perpetuo-Route: ${strategy}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model}",
    "messages": [
      {"role": "user", "content": "${message}"}
    ]
  }'`,

      python: `import requests

response = requests.post(
    url='${baseURL}/v1/chat/completions',
    headers={
        'Authorization': 'Bearer ${apiKey}',
        'X-Perpetuo-Route': '${strategy}',
    },
    json={
        'model': '${model}',
        'messages': [
            {'role': 'user', 'content': '${message}'}
        ]
    }
)
print(response.json())`,

      node: `import axios from 'axios';

const response = await axios.post(
  '${baseURL}/v1/chat/completions',
  {
    model: '${model}',
    messages: [{ role: 'user', content: '${message}' }]
  },
  {
    headers: {
      Authorization: 'Bearer ${apiKey}',
      'X-Perpetuo-Route': '${strategy}',
      'Content-Type': 'application/json'
    }
  }
);
console.log(response.data);`,

      go: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "model": "${model}",
        "messages": []map[string]string{
            {"role": "user", "content": "${message}"},
        },
    }
    
    body, _ := json.Marshal(payload)
    req, _ := http.NewRequest("POST", "${baseURL}/v1/chat/completions", bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer ${apiKey}")
    req.Header.Set("X-Perpetuo-Route", "${strategy}")
    req.Header.Set("Content-Type", "application/json")
    
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    data, _ := io.ReadAll(resp.Body)
    fmt.Println(string(data))
}`
    };

    return code[language];
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>🔨 Request Builder</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Model: </label>
        <input 
          value={model} 
          onChange={(e) => setModel(e.target.value)}
          placeholder="gpt-4"
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Strategy: </label>
        <select value={strategy} onChange={(e) => setStrategy(e.target.value as any)}>
          <option value="default">Default (Manual Priority)</option>
          <option value="fastest">Fastest (by latency)</option>
          <option value="cheapest">Cheapest (by cost)</option>
          <option value="reliable">Reliable (by error rate)</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Message: </label>
        <textarea 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Language: </label>
        <select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
          <option value="curl">cURL</option>
          <option value="python">Python</option>
          <option value="node">Node.js</option>
          <option value="go">Go</option>
        </select>
      </div>

      <button 
        onClick={() => {
          const code = generateCode();
          navigator.clipboard.writeText(code);
          alert('Copied to clipboard!');
        }}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007AFF',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Copy Code
      </button>

      <div style={{ marginTop: '20px', backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
        <pre style={{ overflow: 'auto', fontSize: '12px' }}>
          {generateCode()}
        </pre>
      </div>
    </div>
  );
};
```

---

## 4. APP ATTRIBUTION (Aprender)

### OpenRouter Headers
```
X-Title: "MyApp"
HTTP-Referer: "https://myapp.com"
```

### Perpetuo Enhancement (P2)

#### apps/perpetuo-backend/src/modules/gateway/routes.ts
```typescript
// Extract client info for analytics
const clientName = request.headers['x-client-name'] || 'unknown';
const clientVersion = request.headers['x-client-version'] || 'unknown';
const referrer = request.headers['referer'] || request.headers['origin'] || 'unknown';

// Log com atribuição
eventManager.emit({
  id: crypto.randomUUID(),
  type: 'request_completed',
  tenantId,
  requestId,
  timestamp: Date.now(),
  meta: {
    client_name: clientName,
    client_version: clientVersion,
    referrer: referrer,
    model: aliasResolution.intent,
    strategy: strategyResolution.strategy,
    provider_used: lastProvider,
    latency_ms: duration,
    fallback_used: fallbackUsed,
  }
});
```

#### Dashboard Analytics (novo)
```typescript
// apps/perpetuo-dashboard/src/components/ClientAnalytics.tsx

type ClientAnalytics = {
  client_name: string;
  client_version: string;
  request_count: number;
  avg_latency_ms: number;
  fallback_rate: number;
};

export const ClientAnalytics = ({ data }: { data: ClientAnalytics[] }) => (
  <table>
    <thead>
      <tr>
        <th>Client</th>
        <th>Version</th>
        <th>Requests</th>
        <th>Avg Latency</th>
        <th>Fallback Rate</th>
      </tr>
    </thead>
    <tbody>
      {data.map((row) => (
        <tr key={`${row.client_name}-${row.client_version}`}>
          <td>{row.client_name}</td>
          <td>{row.client_version}</td>
          <td>{row.request_count}</td>
          <td>{row.avg_latency_ms}ms</td>
          <td>{(row.fallback_rate * 100).toFixed(2)}%</td>
        </tr>
      ))}
    </tbody>
  </table>
);
```

---

## 5. DECISÃO TRANSPARENTE (Diferencial Perpetuo)

### OpenRouter: Caixa Preta
```bash
# Você envia:
model: "openrouter/auto"

# Você recebe:
{ choices: [...], model: "openrouter/auto" }

# Você sabe: Quanto custou
# Você NÃO sabe: Qual provider foi usado, por quê
```

### Perpetuo: Caixa Branca
```bash
# Você envia:
model: "gpt-4"
X-Perpetuo-Route: cheapest

# Você recebe:
{
  choices: [...],
  metadata: {
    model: "gpt-4",                              # Alias
    provider_used: "groq",                       # QUEM
    strategy: "cheapest",                        # COMO
    providers_attempted: ["groq", "openai"],     # TENTATIVAS
    fallback_used: true,                         # SE CAIU
    decision_log: {                              # AUDITORIA
      alias_resolution: {
        requested: "gpt-4",
        intent: "chat",
        tier: "default"
      },
      strategy_resolution: {
        strategy: "cheapest",
        source: "header"
      },
      provider_selection: {
        available: ["groq", "openai"],
        order: ["groq", "openai"],
        reason: "Groq $0.0001/1k vs OpenAI $0.03/1k"
      },
      execution: {
        attempt_1: { provider: "groq", error: "timeout", ms: 30000 },
        attempt_2: { provider: "openai", success: true, ms: 2500 }
      }
    },
    cost: {
      tokens_input: 50,
      tokens_output: 100,
      cost_usd: 0.005,
      currency: "USD"
    }
  }
}
```

### Implementação (packages/core/src/decision/logger.ts)
```typescript
export interface DecisionAuditLog {
  request_id: string;
  timestamp: number;
  alias_resolution: {
    requested: string;
    intent: string;
    tier: string;
  };
  strategy_resolution: {
    strategy: Strategy;
    source: 'header' | 'workspace' | 'fallback';
  };
  provider_selection: {
    available: string[];
    order: string[];
    reason: string;  // Por quê (custo, latência, etc)
  };
  execution: Array<{
    attempt: number;
    provider: string;
    status: 'success' | 'error' | 'timeout';
    latency_ms: number;
    error?: string;
  }>;
  cost: {
    tokens_input: number;
    tokens_output: number;
    cost_usd: number;
  };
}

export class DecisionLogger {
  log(audit: DecisionAuditLog) {
    // Persistir em DB para auditoria
    // Incluir no response
    // Emit event para analytics
  }
}
```

---

## 📊 Comparação Final

| Feature | OpenRouter | Perpetuo | Effort |
|---------|-----------|---------|--------|
| SDK | ✅ Oficial | ⏳ P2 | 3-4 dias |
| Swagger | ✅ Sim | ⏳ P2 | 2 dias |
| Request Builder | ✅ Web | ⏳ P2 | 2 dias |
| Attribution | ✅ Básico | ✅ Avançado | 1 dia |
| **Decision Log** | ❌ Não | ✅ Completo | **2 dias** |
| **BYOK** | ❌ Não | ✅ Sim | **Já feito** |
| **Routing Control** | ❌ Não | ✅ Completo | **Já feito** |

---

## 🚀 Prioridade de Implementação

### Semana 1 (P1 Crítico)
1. ✅ Decision Audit Log (2 dias)
   - Persistir em DB
   - Incluir em response

### Semana 2 (P2 Importante)
2. SDK Node + Python (3 dias)
3. Swagger Spec (2 dias)
4. Request Builder UI (2 dias)

### Semana 3 (P2 Nice-to-have)
5. App Attribution Analytics (1 dia)
6. Cost Dashboard (2 dias)

---

**Total esforço: ~17 dias (3 semanas)**

Mantém Perpetuo **superior** em todos os aspectos de controle e transparência, enquanto aprende UX de OpenRouter.


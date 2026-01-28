# 🚀 PERPETUO MVP - Sustainable SaaS Architecture

**Um backend único + um dashboard web. Nada mais.**

## 📊 Estrutura Final

```
PERPETUO/
├── apps/
│   ├── perpetuo-backend/          ← ⭐ ÚNICO BACKEND
│   │   ├── src/
│   │   │   ├── main.ts            (Server principal)
│   │   │   ├── modules/           (Todos os endpoints)
│   │   │   └── shared/            (Utilities)
│   │   ├── prisma/
│   │   │   └── schema.prisma      (6 tabelas essenciais)
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── perpetuo-dashboard/        ← ⭐ DASHBOARD WEB
│       ├── src/
│       │   └── App.tsx            (Tudo em 1 arquivo)
│       ├── package.json
│       └── README.md
│
├── migrations/                    (Obsoleto)
├── packages/                      (Removidos)
└── README.md (este)
```

## ✂️ O Que Foi Removido

**Serviços:**
- ❌ `perpetuo-gateway` (consolidado no backend)
- ❌ `perpetuo-control-plane` (consolidado no backend)
- ❌ `perpetuo-console-web` (substituído por perpetuo-dashboard)

**Packages (não-essenciais):**
- ❌ `@perpetuo/cache` (MVP sincróno)
- ❌ `@perpetuo/events` (nenhuma queue/worker)
- ❌ `@perpetuo/observability` (logging básico)
- ❌ `@perpetuo/providers` (abstraído no gateway)
- ❌ `@perpetuo/sdk` (clientes usam axios direto)
- ❌ Redis, Kafka, Bull, anything async

**Configurações:**
- ❌ `perpetuo.config.yaml` (tudo em .env)
- ❌ Multi-tenant by default (simplificado)
- ❌ Billing, planos, invoices
- ❌ Abstrações de "futuro"

## ✅ O Que Foi Mantido

**Backend Consolidado:**
- ✅ Auth (signup/login)
- ✅ Workspace management
- ✅ Gateway `/v1/chat/completions` (OpenAI-compatible)
- ✅ BYOK provider configuration
- ✅ API key generation (PERPETUO_KEY)
- ✅ Request logging
- ✅ Usage analytics
- ✅ 1 PostgreSQL database

**Dashboard:**
- ✅ Login/signup
- ✅ Provider management
- ✅ API key generation
- ✅ Request logs viewer
- ✅ Usage dashboard

## 🔗 Endpoints Finais

### 🔓 Public (Auth)
```
POST   /auth/signup              Create account
POST   /auth/login               Login
GET    /auth/me                  Current user (JWT required)
POST   /v1/chat/completions      Gateway (API Key required)
GET    /health                   Health check
```

### 🔐 Private (SaaS API - JWT Required)
```
GET    /workspaces               List workspaces
POST   /workspaces               Create workspace
GET    /workspaces/:id           Get workspace
PUT    /workspaces/:id           Update workspace

GET    /workspaces/:id/providers                List providers
POST   /workspaces/:id/providers                Add provider
PUT    /workspaces/:id/providers/:providerId    Update provider
DELETE /workspaces/:id/providers/:providerId    Delete provider

GET    /workspaces/:id/api-keys                 List API keys
POST   /workspaces/:id/api-keys                 Create key
POST   /workspaces/:id/api-keys/:keyId/revoke   Revoke key
DELETE /workspaces/:id/api-keys/:keyId          Delete key

GET    /workspaces/:id/logs                     Request logs
GET    /workspaces/:id/usage                    Usage summary
GET    /workspaces/:id/usage/by-provider        Usage by provider
```

## 🗄️ Database Schema

```sql
-- Users
CREATE TABLE users (
  id CUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  password VARCHAR (hashed),
  name VARCHAR,
  created_at TIMESTAMP
);

-- Workspaces
CREATE TABLE workspaces (
  id CUID PRIMARY KEY,
  name VARCHAR,
  user_id CUID FK → users,
  created_at TIMESTAMP
);

-- Gateway API Keys (PERPETUO_KEY)
CREATE TABLE "APIKey" (
  id CUID PRIMARY KEY,
  workspace_id CUID FK → workspaces,
  key VARCHAR UNIQUE (pk_xxxxx),
  name VARCHAR,
  active BOOLEAN,
  last_used TIMESTAMP,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP
);

-- Provider Keys (BYOK - encrypted)
CREATE TABLE "ProviderKey" (
  id CUID PRIMARY KEY,
  workspace_id CUID FK → workspaces,
  provider VARCHAR,
  api_key VARCHAR (encrypted),
  priority INT,
  enabled BOOLEAN,
  created_at TIMESTAMP
);

-- Request Logs
CREATE TABLE "RequestLog" (
  id CUID PRIMARY KEY,
  workspace_id CUID FK → workspaces,
  provider_used VARCHAR,
  model VARCHAR,
  status_code INT,
  input_tokens INT,
  output_tokens INT,
  duration_ms INT,
  error_message VARCHAR,
  created_at TIMESTAMP (indexed)
);

-- Usage Counters
CREATE TABLE "UsageCounter" (
  id CUID PRIMARY KEY,
  workspace_id CUID UNIQUE FK → workspaces,
  total_requests INT,
  total_input_tokens INT,
  total_output_tokens INT,
  updated_at TIMESTAMP
);
```

## 🚀 Deploy & Run

### Local Development

```bash
# 1. Backend
cd apps/perpetuo-backend
export DATABASE_URL="postgresql://localhost/perpetuo"
npm install
npx prisma migrate dev
npm run dev

# 2. Dashboard (new terminal)
cd apps/perpetuo-dashboard
npm install
npm run dev

# 3. Test
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","name":"Test"}'
```

### Production (Docker)

```dockerfile
# Single image for backend
FROM node:20-alpine
WORKDIR /app
COPY apps/perpetuo-backend .
RUN npm ci
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📋 Pontos de Evolução Futura

Comentários no código indicam onde expandir:

### 1. **Providers** (`src/modules/gateway/routes.ts`)
```typescript
// TODO: Add Anthropic adapter
// TODO: Add Google adapter
// TODO: Add Cohere adapter
```

### 2. **Caching** (não implementado)
```typescript
// TODO: Add Redis for high-throughput
// TODO: Implement semantic caching
```

### 3. **Async Logging**
```typescript
// TODO: Move request logging to queue
// TODO: Batch writes to PostgreSQL
```

### 4. **Rate Limiting**
```typescript
// TODO: Per-API-key rate limits
// TODO: Per-workspace usage quotas
```

### 5. **Billing**
```typescript
// TODO: Simple token-based pricing
// TODO: Monthly invoices
// TODO: Credit system
```

### 6. **Team Features**
```typescript
// TODO: Multiple users per workspace
// TODO: Role-based access (admin, member)
// TODO: API key scopes/permissions
```

## ✨ Critério de Sucesso

Um dev deve conseguir em **menos de 10 minutos**:

1. ✅ **Criar conta** - Signup funcional
2. ✅ **Adicionar provider** - OpenAI BYOK
3. ✅ **Gerar API key** - PERPETUO_KEY
4. ✅ **Fazer request** - POST /v1/chat/completions
5. ✅ **Ver logs** - Dashboard com histórico

Se isso não for possível, itere até ficar **⬇️ 10 minutos**.

## 🔐 Security Notes

⚠️ **MVP Development Only**:
- Provider keys encrypted com base64 (TODO: use AWS KMS)
- JWT secret em .env (TODO: rotate regularly)
- CORS whitelist hardcoded (TODO: use env vars)
- No rate limiting (TODO: add Fastify rate-limit plugin)

## 📦 Dependencies Summary

**Backend:**
- fastify - HTTP server
- @fastify/cors, @fastify/jwt - Plugins
- axios - HTTP client (para chamar providers)
- prisma - ORM
- zod - Validation
- bcryptjs - Password hashing

**Dashboard:**
- react - UI
- axios - HTTP client
- vite - Bundler

**Total**: ~15 npm packages (vs 100+ antes)

---

**Built for sustainability, not for complexity. Less code = More maintainability.**

**Status**: ✅ MVP Ready | ⏭️ Scaling-Ready Architecture

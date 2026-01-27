# PERPETUO Backend

**OpenAI-compatible gateway + SaaS API em um único serviço.**

## 🎯 Arquitetura

```
Client (com PERPETUO_KEY)
         ↓
   POST /v1/chat/completions
         ↓
  ┌─────────────────────┐
  │ PERPETUO Backend    │
  │ (Single Service)    │
  ├─────────────────────┤
  │ • Gateway /v1/*     │  ← OpenAI-compatible
  │ • SaaS API /auth/*  │  ← Dashboard backend
  │ • Auth + Workspace  │
  │ • Logs + Usage      │
  └─────────────────────┘
         ↓
   ┌─────────────────────┐
   │   PostgreSQL        │
   │   (Single DB)       │
   └─────────────────────┘
```

## 🚀 Quick Start

### 1. Setup Database

```bash
# Create PostgreSQL database
createdb perpetuo

# Set DATABASE_URL
export DATABASE_URL="postgresql://user:password@localhost:5432/perpetuo"

# Run migrations
npx prisma migrate dev --name init
```

### 2. Install & Run

```bash
cd apps/perpetuo-backend
npm install

# Development
npm run dev

# Production build
npm run build
npm run start
```

### 3. Environment Variables

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001
```

## 📡 API Routes

### 🔓 Auth (No JWT required)

```bash
POST /auth/signup
  { email, password, name } → { user, token, workspace, api_key }

POST /auth/login
  { email, password } → { user, token }

GET /auth/me
  (requires JWT) → { user }
```

### 🔐 Gateway (No JWT, uses API Key)

```bash
POST /v1/chat/completions
  Authorization: Bearer pk_xxxxx
  { model, messages, ... } → OpenAI-compatible response
```

### 🔐 SaaS API (Requires JWT)

#### Workspaces
```bash
GET /workspaces
POST /workspaces
GET /workspaces/:id
PUT /workspaces/:id
```

#### Providers (BYOK)
```bash
GET /workspaces/:workspaceId/providers
POST /workspaces/:workspaceId/providers
PUT /workspaces/:workspaceId/providers/:providerId
DELETE /workspaces/:workspaceId/providers/:providerId
```

#### API Keys
```bash
GET /workspaces/:workspaceId/api-keys
POST /workspaces/:workspaceId/api-keys
POST /workspaces/:workspaceId/api-keys/:keyId/revoke
DELETE /workspaces/:workspaceId/api-keys/:keyId
```

#### Logs
```bash
GET /workspaces/:workspaceId/logs?page=1&limit=50&provider=openai
```

#### Usage
```bash
GET /workspaces/:workspaceId/usage
GET /workspaces/:workspaceId/usage/by-provider?days=7
```

## 🗂️ Project Structure

```
src/
├── main.ts                    # Server setup & registration
├── shared/
│   ├── types.ts              # Global interfaces
│   ├── crypto.ts             # Encryption, hashing, key generation
│   └── http.ts               # Response helpers, middleware
├── modules/
│   ├── auth/
│   │   └── routes.ts         # Signup, login, me
│   ├── workspaces/
│   │   └── routes.ts         # CRUD operations
│   ├── providers/
│   │   └── routes.ts         # BYOK configuration
│   ├── gateway/
│   │   ├── routes.ts         # /v1/chat/completions
│   │   └── api-keys.ts       # PERPETUO_KEY CRUD
│   ├── logs/
│   │   └── routes.ts         # Request logging
│   └── usage/
│       └── routes.ts         # Usage analytics
└── prisma/
    └── schema.prisma         # Database schema
```

## 🔑 Key Features

✅ **Single Service** - Gateway + Dashboard API  
✅ **OpenAI-compatible** - Drop-in `/v1/chat/completions`  
✅ **BYOK** - Users bring their own provider keys  
✅ **Fallback** - Automatic provider fallback on error  
✅ **Logging** - Sync request/usage tracking  
✅ **Zero Config** - No YAML/JSON for users  

## 🔄 Future Evolution (TODO Comments in Code)

1. **Caching** - Add Redis for high-throughput scenarios
2. **Async Logging** - Move logs to background queue
3. **Provider Adapters** - Add Anthropic, Google, Cohere
4. **Rate Limiting** - Per-API-key rate limits
5. **Billing** - Simple token-based pricing
6. **Team Management** - Multiple users per workspace

## 🧪 Test Flow (5 minutes)

```bash
# 1. Create account
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# 2. Add OpenAI provider
curl -X POST http://localhost:3000/workspaces/WORKSPACE_ID/providers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai","api_key":"sk-...","priority":1}'

# 3. Make a request
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer pk_..." \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hello"}]}'

# 4. Check logs
curl http://localhost:3000/workspaces/WORKSPACE_ID/logs \
  -H "Authorization: Bearer TOKEN"
```

## 📋 Database Schema

- **users** - Account data
- **workspaces** - User's workspaces
- **gateway_api_keys** - PERPETUO_KEY tokens
- **provider_keys** - BYOK encrypted keys
- **request_logs** - Request tracking (no PII)
- **usage_counters** - Token & request aggregates

---

**Built for sustainable MVP. Simplicity > Features.**

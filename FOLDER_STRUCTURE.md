# 📁 Estrutura Final de Pastas

```
PERPETUO/ (root)
│
├── 📄 README.md                          ← Leia primeiro!
├── 📄 MVP_RESTRUCTURE.md                 ← Arquitetura geral
├── 📄 RESTRUCTURE_REPORT.md              ← Relatório completo
├── 📄 docker-compose.yml                 ← Docker setup (simplificado)
├── 📄 Dockerfile                         ← Build backend (2-stage)
├── 📄 setup.sh                           ← Quick start script
│
├── 🗂️ apps/
│   │
│   ├── 🚀 perpetuo-backend/              ← ⭐⭐⭐ ÚNICO BACKEND
│   │   ├── 📄 package.json               (15 deps)
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 .env.example
│   │   ├── 📄 README.md                  ← API docs
│   │   │
│   │   ├── 🗂️ src/
│   │   │   │
│   │   │   ├── 📄 main.ts                ← Server principal
│   │   │   │   └── Inicia Fastify
│   │   │   │   └── Registra todos plugins
│   │   │   │   └── Conecta ao Prisma
│   │   │   │
│   │   │   ├── 🗂️ shared/                ← Utilities globais
│   │   │   │   ├── 📄 types.ts           (Interfaces globais)
│   │   │   │   ├── 📄 crypto.ts          (Hash, encrypt, key gen)
│   │   │   │   └── 📄 http.ts            (Response helpers)
│   │   │   │
│   │   │   └── 🗂️ modules/               ← Funcionalidades
│   │   │       │
│   │   │       ├── 🔐 auth/
│   │   │       │   └── 📄 routes.ts
│   │   │       │       ├── POST /auth/signup
│   │   │       │       ├── POST /auth/login
│   │   │       │       └── GET  /auth/me
│   │   │       │
│   │   │       ├── 🏢 workspaces/
│   │   │       │   └── 📄 routes.ts
│   │   │       │       ├── GET    /workspaces
│   │   │       │       ├── POST   /workspaces
│   │   │       │       ├── GET    /workspaces/:id
│   │   │       │       └── PUT    /workspaces/:id
│   │   │       │
│   │   │       ├── 🔑 providers/
│   │   │       │   └── 📄 routes.ts
│   │   │       │       ├── GET    /workspaces/:id/providers
│   │   │       │       ├── POST   /workspaces/:id/providers
│   │   │       │       ├── PUT    /workspaces/:id/providers/:id
│   │   │       │       └── DELETE /workspaces/:id/providers/:id
│   │   │       │
│   │   │       ├── 🚪 gateway/           ← HOT PATH
│   │   │       │   ├── 📄 routes.ts
│   │   │       │   │   └── POST /v1/chat/completions
│   │   │       │   │       ├── Validate API key
│   │   │       │   │       ├── Get providers
│   │   │       │   │       ├── Fallback logic
│   │   │       │   │       └── Log + usage sync
│   │   │       │   │
│   │   │       │   └── 📄 api-keys.ts
│   │   │       │       ├── GET    /workspaces/:id/api-keys
│   │   │       │       ├── POST   /workspaces/:id/api-keys
│   │   │       │       ├── POST   /workspaces/:id/api-keys/:id/revoke
│   │   │       │       └── DELETE /workspaces/:id/api-keys/:id
│   │   │       │
│   │   │       ├── 📊 logs/
│   │   │       │   └── 📄 routes.ts
│   │   │       │       └── GET /workspaces/:id/logs?page=1&limit=50
│   │   │       │
│   │   │       └── 📈 usage/
│   │   │           └── 📄 routes.ts
│   │   │               ├── GET /workspaces/:id/usage
│   │   │               └── GET /workspaces/:id/usage/by-provider
│   │   │
│   │   ├── 🗂️ prisma/
│   │   │   └── 📄 schema.prisma          ← 6 models
│   │   │       ├── User
│   │   │       ├── Workspace
│   │   │       ├── ProviderKey (BYOK)
│   │   │       ├── APIKey (PERPETUO_KEY)
│   │   │       ├── RequestLog
│   │   │       └── UsageCounter
│   │   │
│   │   └── 🗂️ dist/ (gerado na build)
│   │
│   │
│   ├── 💎 perpetuo-dashboard/            ← ⭐ DASHBOARD WEB
│   │   ├── 📄 package.json               (3 deps: react, axios, vite)
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 .env.example
│   │   ├── 📄 vite.config.ts
│   │   ├── 📄 README.md
│   │   │
│   │   ├── 📄 index.html
│   │   ├── 📄 index.tsx                  ← React entry point
│   │   │
│   │   ├── 🗂️ src/
│   │   │   └── 📄 App.tsx                ← Tudo em 1 arquivo
│   │   │       ├── LoginPage
│   │   │       ├── Dashboard
│   │   │       ├── ProvidersTab
│   │   │       ├── ApiKeysTab
│   │   │       ├── LogsTab
│   │   │       └── UsageTab
│   │   │
│   │   └── 🗂️ dist/ (gerado na build)
│
│
├── 🗂️ docs/ (opcional)
│   ├── 📄 ENDPOINTS.md                   ← TODO
│   ├── 📄 DEVELOPER.md                   ← TODO
│   └── 📄 DEPLOYMENT.md                  ← TODO
│
│
├── 🗂️ migrations/ (obsoleto - usar Prisma)
│   └── 📄 001_init.sql
│
│
├── 🗂️ packages/ (removido - consolidado)
│   ├── ❌ cache/
│   ├── ❌ core/
│   ├── ❌ db/
│   ├── ❌ events/
│   ├── ❌ observability/
│   ├── ❌ providers/
│   ├── ❌ sdk/
│   └── ❌ shared/
│
│
└── 🗂️ scripts/ (obsoleto)
    ├── ❌ check-db.js
    └── ❌ load_test.js

```

## 📊 Comparação Antes/Depois

### Antes (Complexo) ❌
```
apps/
├── perpetuo-gateway/         (backend 1)
├── perpetuo-control-plane/   (backend 2)
└── perpetuo-console-web/     (web frontend)

packages/
├── cache/
├── core/
├── db/
├── events/
├── observability/
├── providers/
├── sdk/
└── shared/

Configuração:
- perpetuo.config.yaml
- pnpm-workspace.yaml
- pnpm-lock.yaml
- Multiple Dockerfiles
```

### Depois (Simples) ✅
```
apps/
├── perpetuo-backend/         (backend único)
└── perpetuo-dashboard/       (web único)

Configuração:
- .env (tudo centralizado)
- docker-compose.yml (simplificado)
- Dockerfile (um só)
```

## 🚀 How to Navigate

### Se quer entender a arquitetura geral:
→ Leia `MVP_RESTRUCTURE.md`

### Se quer usar o backend:
→ Vá para `apps/perpetuo-backend/README.md`

### Se quer usar o dashboard:
→ Vá para `apps/perpetuo-dashboard/README.md`

### Se quer saber o que mudou:
→ Leia `RESTRUCTURE_REPORT.md`

### Se quer fazer deploy:
→ Use `docker-compose.yml` ou `setup.sh`

## 📝 Notas Importantes

1. **Tudo síncrono no MVP** - Sem queues, sem Redis
2. **Database first** - Prisma migra automaticamente
3. **Auth via JWT** - Para SaaS API
4. **Gateway via API Key** - Bearer token separado
5. **Single file components** - Dashboard em 1 arquivo
6. **Monorepo npm** - Sem pnpm, sem workspaces complexity

## 🔍 Arquivo por Arquivo

### Critical Files (NÃO DELETE)
- `apps/perpetuo-backend/src/main.ts` ← Core server
- `apps/perpetuo-backend/prisma/schema.prisma` ← Database
- `apps/perpetuo-backend/src/modules/gateway/routes.ts` ← Gateway API
- `apps/perpetuo-dashboard/src/App.tsx` ← Dashboard UI

### Generated Files (IGNORE)
- `dist/` - build output
- `node_modules/` - dependencies
- `.env` (local only)
- `build/`

### Config Files
- `docker-compose.yml` - 45 lines
- `Dockerfile` - 25 lines
- `package.json` - 20 lines (cada)

---

**Total: 2 aplicações, 1 repositório, <5000 linhas de código**

**Entregue**: MVP Pronto, Escalável, Sustentável 🚀

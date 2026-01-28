# Perpetuo AI Gateway — Copilot Instructions

**Purpose**: Guide AI coding agents through the Perpetuo monorepo architecture, workflows, and conventions.

---

## 🎯 Architecture Overview

**Perpetuo** is an **OpenAI-compatible AI Gateway MVP** with multi-tenant support and provider fallback logic.

### Key Components

- **Backend** (`apps/perpetuo-backend/`): Fastify HTTP server + Prisma ORM + JWT auth
- **Dashboard** (`apps/perpetuo-console-web/` or `perpetuo-dashboard/`): React/Next.js web UI for workspace & provider management
- **Core Packages** (`packages/core/`): Resolver logic for model aliases, strategies, provider selection
- **SDK** (`packages/sdk/`): Client library for calling the gateway
- **Database**: PostgreSQL with 6-table schema, multi-tenant isolation via workspace_id

### Critical Architecture Decision

```
❌ OLD: Client sends model="gpt-4" → Server detects provider from prefix
✅ NEW: Client sends model="gpt-4" (alias) → Server decides provider + strategy
```

**Why**: Clients should never control provider selection. Perpetuo decides based on strategy (fastest/cheapest/reliable) + workspace configuration.

---

## 📦 Project Structure

```
PERPETUO/
├── apps/
│   ├── perpetuo-backend/         ← ONLY backend service (Fastify)
│   ├── perpetuo-dashboard/       ← Web UI (React 19 + Vite) — NEW
│   ├── perpetuo-console-web/     ← Alternative UI
│   ├── perpetuo-gateway/         ← Gateway routes (uses core)
│   └── perpetuo-control-plane/   ← Admin control
│
├── packages/
│   ├── core/                     ← ModelAliasResolver, StrategyResolver, ProviderSelector
│   ├── providers/                ← IChatProvider interface + implementations
│   ├── sdk/                      ← Client library
│   ├── shared/                   ← Common types & utilities
│   ├── cache/                    ← MemoryCache + RedisCache
│   ├── events/                   ← EventManager for decision logging
│   ├── observability/            ← Logging & telemetry
│   └── db/                       ← Database utilities
│
└── docs/ + migrations/           ← Schema + scripts
```

**Monorepo Setup**: pnpm workspaces (see `pnpm-workspace.yaml`)

### Frontend Structure (Dashboard)

```
apps/perpetuo-dashboard/
├── src/
│   ├── App.tsx                   ← Main component (router + state)
│   ├── index.tsx                 ← React entry point
│   ├── index.html                ← HTML template (Vite)
│   └── components/
│       ├── Header.tsx            ← Navigation + user info
│       ├── Hero.tsx              ← Landing page hero section
│       ├── Features.tsx          ← Feature showcase
│       ├── HowItWorks.tsx       ← Tutorial section
│       ├── Pricing.tsx           ← Pricing table
│       ├── FAQ.tsx               ← FAQ section
│       ├── Footer.tsx            ← Footer
│       ├── UseCases.tsx          ← Use cases
│       └── SocialProof.tsx       ← Social proof/testimonials
│
├── .env.local                    ← VITE_API_URL=http://localhost:3000
├── vite.config.ts               ← Vite configuration (React plugin)
├── tsconfig.json                ← TypeScript config (strict mode)
└── package.json                 ← React 19, Vite 6, Axios
```

**Frontend Tech Stack**:
- React 19.2.3 + TypeScript
- Vite 6.2 (dev server on port 3001)
- Axios (HTTP client with Bearer auth)
- Inline styles (no CSS framework dependency)

---

## 🔑 Core Resolver System

### 1. ModelAliasResolver (`packages/core/src/resolvers/modelAlias.ts`)

Translates client model names into logical intents and tiers:

```typescript
resolve("gpt-4") → { intent: "chat", tier: "default", explanation: "..." }
resolve("claude-opus") → { intent: "chat", tier: "premium", explanation: "..." }
```

**Key Rule**: Aliases are **logical identifiers**, not provider-specific. Multiple providers can fulfill the same alias.

### 2. StrategyResolver (`packages/core/src/resolvers/strategy.ts`)

Determines routing strategy from (in priority order):
1. Header: `X-Perpetuo-Route: fastest|cheapest|reliable|default`
2. Workspace setting
3. Fallback: `default`

Strategies control provider ordering in selection.

### 3. ProviderSelector (`packages/core/src/resolvers/providerSelector.ts`)

Sorts available providers by the chosen strategy:
- `fastest`: Sort by latency (provider historical data)
- `cheapest`: Sort by cost per token
- `reliable`: Sort by error rate
- `default`: Use workspace-configured priority

### 4. ErrorClassifier (`packages/core/src/resilience/errorClassifier.ts`)

Categorizes errors for retry/fallback decisions:

```typescript
FATAL (abort):    401, 403, invalid_request_error
RETRYABLE (try next): 429, 5xx errors, timeout, network errors
```

---

## 🔐 Security Model (MVP)

All 5 critical fixes are implemented:

1. **Rate Limiting**: 1000 req/min per IP (Fastify plugin)
2. **API Keys**: Hashed with SHA256 (key_hash in DB, plaintext shown once)
3. **Provider Keys**: AES-256-GCM encrypted with random IV (ENCRYPTION_KEY in .env)
4. **Workspace Isolation**: JWT token contains workspace_id authority
5. **Secrets**: .env template provided, .gitignore enforced

**Key Files**:
- `apps/perpetuo-backend/src/shared/crypto.ts`: Hash & encrypt functions
- `apps/perpetuo-backend/src/main.ts`: Rate limit plugin registration
- `prisma/schema.prisma`: key_hash field (not plaintext key)

---

## 🚀 Developer Workflows

### Build & Run (pnpm monorepo)

```bash
# All apps/packages
pnpm install              # Install all dependencies
pnpm run dev              # Start all apps in watch mode (parallel)
pnpm run build            # Build all
pnpm run test             # Test all (Vitest)

# Single app
cd apps/perpetuo-backend
pnpm run dev              # Fastify server (tsx watch) → http://localhost:3000

cd apps/perpetuo-dashboard
pnpm run dev              # Vite dev server → http://localhost:3001
pnpm run build            # Build to dist/
pnpm run preview          # Preview production build
```

### Frontend Development (React + Vite)

```bash
cd apps/perpetuo-dashboard

# Development
pnpm dev                  # Hot reload on http://localhost:3001

# Environment setup
echo "VITE_API_URL=http://localhost:3000" > .env.local

# Building for production
pnpm build                # Creates dist/ folder
pnpm preview              # Test production build locally
```

**Frontend HTTP Client Pattern** (Axios):

```typescript
// Always include Bearer token for SaaS API endpoints
const response = await axios.get(
  `${API_URL}/workspaces/${workspaceId}/providers`,
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

// Gateway endpoint uses API key (pk_xxxx) instead
const response = await axios.post(
  `${API_URL}/v1/chat/completions`,
  { model: 'gpt-4', messages: [...] },
  {
    headers: { Authorization: `Bearer pk_xxxxx` },
  }
);
```

### Database Migrations (Prisma)

```bash
# After editing prisma/schema.prisma
cd apps/perpetuo-backend
npx prisma migrate dev --name feature_description
npx prisma db push        # Deploy to staging/prod

# See current schema
npx prisma studio        # GUI for DB inspection
```

### Testing (Vitest)

All packages use **Vitest** (not Jest). Test files in `src/**/*.test.ts`.

```bash
# Run all tests
pnpm test

# Watch mode (single package)
cd packages/core
pnpm test --watch
```

**Convention**: Test modules import from built output (not source) to verify exports work.

---

## 📋 Code Conventions

### TypeScript

- Target: ES2020, type: "module" (ESM)
- Use `zod` for runtime schema validation (backend)
- Import types: `import type { Foo } from './types'`
- React components: Always define `Props` interfaces, use `React.FC<Props>`
- State typing: Always type `useState<Type>([])` and `useEffect` dependencies

### Backend (Fastify)

- Routes in `modules/{feature}/routes.ts`
- Plugins in `plugins/{name}.ts`
- Utilities in `shared/{category}.ts`
- Request handlers use `async (request, reply) => {}`
- Return `{ success: true, data: {...} }` or `{ success: false, error: "..." }`

### Frontend (React + Vite)

- Components in `components/{Name}.tsx` (PascalCase)
- Define props as `interface ComponentProps { ... }`
- Styles using inline `style={}` objects (no CSS dependencies)
- API calls use Axios with types from backend
- Store auth token in `localStorage` with fallback to state
- Use `useEffect` for side effects (data loading, auth checks)

### Naming Conventions

- **Classes**: PascalCase (`ModelAliasResolver`, `EventManager`)
- **Functions**: camelCase (`generateAPIKey`, `resolveAlias`)
- **Constants**: UPPER_SNAKE_CASE (`ENCRYPTION_KEY`, `RATE_LIMIT_MAX`)
- **Exports**: Prefer named exports; re-export from `index.ts`

### Frontend Component Conventions (React)

```typescript
// ✅ GOOD: Functional component with clear interfaces
interface ProviderListProps {
  workspaceId: string;
  token: string;
  onRefresh?: () => void;
}

export const ProviderList: React.FC<ProviderListProps> = ({ 
  workspaceId, 
  token, 
  onRefresh 
}) => {
  const [providers, setProviders] = useState<ProviderKey[]>([]);
  const [loading, setLoading] = useState(false);

  // Load on mount and dependency changes
  useEffect(() => {
    loadProviders();
  }, [workspaceId]);

  const loadProviders = async () => {
    // Implementation
  };

  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// ❌ BAD: No types, vague names
export default function X({ w, t }) {
  const [p, setP] = useState([]);
  // ...
}
```

**React Patterns**:
- Functional components with TypeScript interfaces for props
- `useState` for component state
- `useEffect` for side effects (loading data, auth checks)
- Inline styles using `style={}` objects
- Axios for HTTP calls with Bearer token auth
- Load data on mount + dependency changes

### Documentation in Code

```typescript
// ✅ GOOD: Explain "why" and usage
export function generateAPIKey(): string {
  // Format: pk_xxxxx (24 random hex bytes)
  // Used by client apps to authenticate to gateway
  // Key is shown only once; client must save immediately
  const randomPart = crypto.randomBytes(24).toString('hex');
  return `pk_${randomPart}`;
}

// ❌ BAD: No context
export function generateAPIKey(): string {
  return `pk_${crypto.randomBytes(24).toString('hex')}`;
}
```

---

## � Frontend-Backend Integration

### Environment Setup

**Backend** (`apps/perpetuo-backend/`):
```bash
cd apps/perpetuo-backend
cp .env.example .env
# Set DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY
pnpm run dev  # Runs on http://localhost:3000
```

**Frontend** (`apps/perpetuo-dashboard/`):
```bash
cd apps/perpetuo-dashboard
echo "VITE_API_URL=http://localhost:3000" > .env.local
pnpm run dev  # Runs on http://localhost:3001
```

### Component State Flow

Typical dashboard component:
1. Load token from `localStorage` on mount
2. Use `useEffect` to fetch user data with Bearer token
3. Store response in `useState<Type>` with proper typing
4. Render UI from state
5. Handle logout → clear `localStorage` + clear state

```typescript
const [token, setToken] = useState<string | null>(
  localStorage.getItem('token')
);
const [providers, setProviders] = useState<ProviderKey[]>([]);

useEffect(() => {
  if (token) {
    axios.get(`${API_URL}/workspaces/${workspaceId}/providers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setProviders(res.data.data))
    .catch(err => console.error(err));
  }
}, [token, workspaceId]);
```

### Common Dashboard Endpoints

**Auth**:
- `POST /auth/signup` → `{ user, token, workspace }`
- `POST /auth/login` → `{ user, token }`
- `GET /auth/me` (requires Bearer token)

**Workspace**:
- `GET /workspaces` → List user's workspaces
- `GET /workspaces/:id/providers` → BYOK keys
- `GET /workspaces/:id/api-keys` → Generated keys
- `POST /workspaces/:id/api-keys` → Create key
- `GET /workspaces/:id/logs` → Request history

---

```
POST /v1/chat/completions (Gateway)
├─ Auth: Bearer pk_xxxxx (API key validation)
├─ Quota Check: Verify workspace usage limits
│
├─ [RESOLVE] ModelAliasResolver.resolve("gpt-4")
│   → { intent: "chat", tier: "default" }
│
├─ [RESOLVE] StrategyResolver.resolve(header || workspace)
│   → "fastest"
│
├─ [SELECT] ProviderSelector.select([openai, anthropic, groq])
│   → [anthropic, groq, openai] (sorted by latency)
│
├─ [EXECUTE] Try providers in order:
│   ├─ anthropic.chat(req) → timeout (RETRYABLE)
│   ├─ groq.chat(req) → 200 OK ✓
│   └─ (openai skipped)
│
├─ [LOG] EventManager.emit("decision", {
│     provider_used: "groq",
│     fallback_used: true,
│     strategy: "fastest",
│     latency_ms: 345
│   })
│
└─ Response: { choices: [...], usage: {...} }
```

---

## 📖 Essential Reference Docs

Before modifying anything:
1. **[QUICK_START.md](../QUICK_START.md)** (30s) — What changed and why
2. **[ARCHITECTURE_EXECUTIVE_SUMMARY.md](../ARCHITECTURE_EXECUTIVE_SUMMARY.md)** (5m) — Resolver system
3. **[TESTING_GUIDE.md](../TESTING_GUIDE.md)** (15m) — How to test each component
4. **[SECURITY_EXECUTIVE_SUMMARY.md](../SECURITY_EXECUTIVE_SUMMARY.md)** (10m) — All 5 fixes
5. **[CONTRIBUTING.md](../CONTRIBUTING.md)** (15m) — Development workflow rules

---

## ⚠️ Project Constraints

### MVP Philosophy: Simplicity Over Features

- ✅ **Keep**: 1 backend service, 1 React dashboard, direct HTTP calls, minimal dependencies
- ❌ **Don't Add**: Async job queues, RabbitMQ, microservices, complex abstractions
- ❌ **Don't Dependency-Hop**: lodash, moment, moment-timezone, styled-components (use native JS/inline styles)
- ✅ **Frontend**: Inline styles (no CSS framework), simple components, localStorage for state
- ❌ **Frontend**: No Redux, Zustand, or state management libraries (useState + useEffect only)

### No Over-Engineering

- If adding a feature: "Is this essential for MVP?" → No? → Postpone to Phase 2
- Read `CONTRIBUTING.md` rules before new features or dependencies
- Frontend components: If it's not in the dashboard spec, don't build it

### Environment Variables

**Required** (in `.env`):
- `DATABASE_URL`: PostgreSQL connection
- `JWT_SECRET`: Sign JWT tokens (32+ bytes, base64)
- `ENCRYPTION_KEY`: AES-256-GCM key (32+ bytes, base64)

**See**: `apps/perpetuo-backend/.env.example`

---

## 🎯 When Modifying Resolvers

### Adding a New Model Alias

1. Edit `packages/core/src/resolvers/modelAlias.ts`
2. Add mapping: `"claude-3.5-sonnet" → { intent: "chat", tier: "premium" }`
3. Test in `packages/core/src/modelAlias.test.ts`
4. Rebuild core: `cd packages/core && pnpm build`
5. Gateway uses updated core (no changes needed)

### Changing Provider Selection Logic

1. Edit `packages/core/src/resolvers/providerSelector.ts`
2. Update sorting algorithm (latency, cost, reliability)
3. Test with `pnpm test --watch`
4. Verify in `apps/perpetuo-gateway/src/routes/chat.ts` that it's called

### Adding New Strategy

1. Update `StrategyResolver` to accept new strategy name
2. Add sort logic to `ProviderSelector`
3. Document in this file and `ARCHITECTURE_EXECUTIVE_SUMMARY.md`

---

## 🐛 Debugging Tips

### Check Request Flow
```bash
# Enable debug logs in backend
DEBUG=perpetuo:* pnpm run dev

# Or add console.log() in routes.ts, then restart
```

### Prisma Issues
```bash
# See generated schema
npx prisma db pull

# Reset dev database (⚠️ clears data)
npx prisma migrate reset
```

### Import/Export Issues
```bash
# Verify exports from package
grep "export" packages/core/src/index.ts

# Check if built correctly
ls -la packages/core/dist/

# Rebuild if missing
cd packages/core && pnpm build
```

### Test Failures
```bash
# Run with verbosity
cd packages/core
pnpm test --reporter=verbose

# Watch mode for debugging
pnpm test --watch
```

---

## ✅ Pre-Commit Checklist

Before pushing code:

- [ ] `pnpm lint` passes (ESLint)
- [ ] `pnpm test` passes (Vitest)
- [ ] `pnpm build` succeeds (tsup + tsc)
- [ ] New code has comments explaining "why"
- [ ] No unused imports or console.log() statements
- [ ] Follows naming conventions (PascalCase classes, camelCase functions)
- [ ] Database schema changes use `npx prisma migrate dev`
- [ ] Dependencies added only if essential to MVP

---

## 🔗 Links

- Workspace root: `PERPETUO/`
- Architecture index: [README_ARCHITECTURE.md](../README_ARCHITECTURE.md)
- API reference: [apps/perpetuo-backend/README.md](../apps/perpetuo-backend/README.md)
- Docker setup: [docker-compose.yml](../docker-compose.yml)

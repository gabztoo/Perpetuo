# 🤝 PERPETUO MVP - Guia de Contribuição

**Como adicionar features, corrigir bugs e evoluir o MVP sustentavelmente.**

---

## 📋 Regras Fundamentais

### 1. **Mantenha a Simplicidade**
- 1 serviço backend
- 1 dashboard web
- Sem async/workers no MVP
- Sem abstrações de "futuro"

### 2. **Sem Dependências Desnecessárias**
```bash
# ❌ NÃO FAÇA ISSO
npm install express-async-errors  # Já temos Fastify
npm install lodash               # Use nativo JS
npm install moment              # Use Date nativa

# ✅ FAÇA ISSO
npm install crypto-js           # Só se realmente precisar
```

### 3. **Código Documentado**
```typescript
// ✅ BOM
export function generateAPIKey(): string {
  // Format: pk_xxxxx (24 random hex bytes)
  // Used by client apps to authenticate to gateway
  const randomPart = crypto.randomBytes(24).toString('hex');
  return `pk_${randomPart}`;
}

// ❌ RUIM
export function generateAPIKey(): string {
  return `pk_${crypto.randomBytes(24).toString('hex')}`;
}
```

---

## 🚀 Antes de Começar

1. Clone o repo
2. Rode `setup.sh`
3. Leia `MVP_RESTRUCTURE.md`
4. Entenda a estrutura em `FOLDER_STRUCTURE.md`

---

## 📝 Fluxo de Desenvolvimento

### Para Bug Fixes

```bash
# 1. Create branch
git checkout -b fix/bug-description

# 2. Locate the bug
# → Use FOLDER_STRUCTURE.md to find the module
# → Read inline comments for context

# 3. Fix the issue
# → Keep it minimal
# → Don't refactor unrelated code

# 4. Test
npm run dev
# Test in browser or with curl

# 5. Commit & PR
git add .
git commit -m "fix: description"
git push origin fix/bug-description
```

### Para Novas Features

**Antes de começar, pergunte:**
- ❓ Isso é essencial para MVP?
- ❓ Posso adicionar sem quebrar simplicidade?
- ❓ Precisa de dependências novas?

**Se "não" para qualquer pergunta, espere pós-MVP.**

```bash
# 1. Create branch
git checkout -b feat/feature-name

# 2. Add to module
# Example: Add rate limiting

# 3. Follow existing patterns
# Look at modules/gateway/routes.ts for guidance

# 4. Update database schema if needed
# Edit prisma/schema.prisma
npx prisma migrate dev --name add_feature

# 5. Test thoroughly
# Unit test (if relevant)
# Manual test (browser/curl)
# Check logging works

# 6. Update docs
# Add comments in code
# Update README if needed

# 7. Commit & PR
git commit -m "feat: description"
```

---

## 🎯 Módulos & Responsabilidades

### `src/modules/auth/`
**O que faz:** Signup, login, JWT generation  
**Não faça:** OAuth, social auth, 2FA  
**Next evolution:** Email verification, password reset

```typescript
// ✅ Adicione aqui
- Email verification flow
- Password reset token

// ❌ NÃO adicione
- OAuth (para depois)
- 2FA (para depois)
```

### `src/modules/gateway/`
**O que faz:** OpenAI-compatible endpoint, provider fallback  
**Não faça:** Streaming, semantic caching, custom routing rules  
**Next evolution:** Anthropic/Google adapters, basic caching

```typescript
// ✅ Adicione aqui
// src/modules/gateway/routes.ts linha 140
// TODO: Add Anthropic adapter
// TODO: Add Google adapter

// ❌ NÃO adicione
- Streaming responses (use standard request/response)
- Custom routing policies (para depois)
- Advanced caching (para depois)
```

### `src/modules/providers/`
**O que faz:** BYOK management, encryption  
**Não faça:** Advanced validation, key rotation  
**Next evolution:** Key rotation, audit logs

```typescript
// ✅ Adicione aqui
- Provider validation (test API key on add)
- Better error messages

// ❌ NÃO adicione
- Automatic key rotation (para depois)
```

### `src/modules/logs/`
**O que faz:** Request logging (read-only)  
**Não faça:** Async logging, log aggregation  
**Next evolution:** Async queue, log retention policies

```typescript
// ✅ Adicione aqui
- Filtering by multiple criteria
- Export logs to CSV

// ❌ NÃO adicione
- Async queue (para depois)
- Log retention rules (para depois)
```

---

## 📊 Database Schema Changes

### Quando adicionar coluna

```bash
# 1. Edit prisma/schema.prisma
model RequestLog {
  // ... existing fields
  latency_p95 Int?  // ← NEW FIELD
}

# 2. Create migration
npx prisma migrate dev --name add_latency_p95

# 3. Update related code
// Update logging code to fill this field
// Update types.ts if needed
```

### Quando adicionar model

**CUIDADO: Nova table = mais complexidade**

Pergunte:
- Isso é realmente essencial?
- Posso adicionar como coluna em table existente?

Se sim para ambas, adicione:

```bash
# 1. Add to schema.prisma
model MyNewTable {
  // ... fields
}

# 2. Migrate
npx prisma migrate dev --name add_my_new_table

# 3. Add routes
// src/modules/my_module/routes.ts
```

---

## 🧪 Testing Guidelines

### Local Testing

```bash
# 1. Ensure backend running
cd apps/perpetuo-backend && npm run dev

# 2. Ensure dashboard running (optional)
cd apps/perpetuo-dashboard && npm run dev

# 3. Test your change
curl -X POST http://localhost:3000/your/endpoint \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'

# 4. Check logs
# Look at console output for errors
```

### Integration Testing

```bash
# Run the test script
bash test.sh

# It will:
# 1. Check backend health
# 2. Create account
# 3. Add provider
# 4. Generate API key
# 5. Check usage
# 6. Validate dashboard
```

### No Unit Tests (MVP)

❌ Não adicionamos unit tests no MVP para manter simplicidade.

✅ Depois de MVP, adicionar vitest para funções críticas.

---

## 📚 Code Style

### TypeScript

```typescript
// ✅ DO
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ❌ DON'T
function validateEmail(e) {
  return /.*@.*/i.test(e);
}
```

### Error Handling

```typescript
// ✅ DO
try {
  // operation
  return sendSuccess(reply, data);
} catch (error) {
  if (error instanceof z.ZodError) {
    return sendError(reply, 'Invalid input', 400);
  }
  console.error('Operation failed:', error);
  return sendError(reply, 'Internal server error', 500);
}

// ❌ DON'T
return await database.query();  // No error handling
```

### Comments

```typescript
// ✅ GOOD
// Generate PERPETUO_KEY in format pk_xxxxx
// Used by client apps to authenticate to gateway
export function generateAPIKey(): string {
  const randomPart = crypto.randomBytes(24).toString('hex');
  return `pk_${randomPart}`;
}

// ❌ BAD
// Generate API key
function gen() {
  return `pk_${Math.random()}`;
}
```

---

## 🐛 Reportando Bugs

Crie issue com:

```markdown
## Descrição
O que não está funcionando?

## Steps to Reproduce
1. ...
2. ...
3. ...

## Resultado Esperado
Ele deveria fazer X

## Resultado Atual
Ele está fazendo Y

## Environment
- Node version: 20.x
- Database: PostgreSQL
- Browser: Chrome 120
```

---

## 🚀 Propostas de Feature

Crie issue com tag `enhancement`:

```markdown
## Motivação
Por que isso é importante?

## Solução Proposta
Como isso deveria funcionar?

## Alternativas
Outras abordagens?

## Impacto no MVP
- Complexidade: LOW/MEDIUM/HIGH
- Dependencies: nova? quantas?
- Breaking changes: sim/não
```

**Note:** Se complexidade = HIGH, reservamos para pós-MVP.

---

## 🎓 Evoluindo para Produção

### Depois do MVP (Phase 2)

```
□ Add Anthropic provider adapter
□ Add rate limiting per API key
□ Add async logging with queue
□ Add semantic caching
□ Add email verification
□ Add password reset
□ Add team features (invites)
□ Add usage quotas
```

### Phase 3 (Growth)

```
□ Add billing system
□ Add advanced RBAC
□ Add PII redaction
□ Add custom routing policies
□ Add log retention policies
□ Add API usage webhooks
```

### Phase 4 (Scale)

```
□ Multi-region deployment
□ Advanced observability
□ AI agent platform
□ Custom LLM support
□ Enterprise features
```

---

## ✅ Checklist para PR

Antes de submeter:

- [ ] Branch name is `fix/` ou `feat/`
- [ ] Código compila sem erros
- [ ] Sem breaking changes
- [ ] Testei localmente (npm run dev)
- [ ] Adicionei comments relevantes
- [ ] Não adicionei dependências desnecessárias
- [ ] Mantive a simplicidade
- [ ] Atualizei docs se necessário
- [ ] Commit message é descritivo

---

## 🤔 FAQ

### Posso usar React hooks?
✅ Sim, use conforme necessário no dashboard.

### Posso adicionar TypeScript stricto?
✅ Sim, melhor ter tipos corretos.

### Posso refatorar código legado?
⚠️ Apenas se for junto com feature ou bug fix.

### Posso adicionar Redis?
❌ Não no MVP. Phase 2 ou depois.

### Posso usar async/await?
✅ Sim, mas sem workers/queues.

### Preciso de testes?
⚠️ MVP: manual testing é ok. Phase 2: vitest.

### Qual é a política de branches?
```
main (production)
  ↑
staging (pre-release testing)
  ↑
feature branches (feat/xxx, fix/xxx)
```

---

## 📞 Precisa de Ajuda?

- 📖 Leia `MVP_RESTRUCTURE.md` para arquitetura
- 📁 Leia `FOLDER_STRUCTURE.md` para navegar
- 💬 Check inline code comments for context
- 🔍 Look at similar modules for patterns

---

**Happy coding! 🚀**

Mantenha o MVP simples, e tudo mais vem naturalmente.

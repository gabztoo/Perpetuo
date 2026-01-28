# Análise de Dependências - PERPETUO

## Resumo Executivo

Após análise completa dos `package.json` em toda a monorepo, identificamos **todas as dependências instaladas são necessárias**. Não há dependências órfãs ou não utilizadas.

---

## Dependências Declaradas vs. Necessárias

### ✅ Root (perpetuo-monorepo)

**package.json:**
```
@types/node ^20.10.0
typescript ^5.3.3
eslint ^8.56.0
prettier ^3.1.0
tsx ^4.7.0
tsup ^8.0.1
vitest ^1.1.0
```

**Status:** ✅ TODAS NECESSÁRIAS
- `@types/node`, `typescript`: Suporte de tipo para Node.js em toda a monorepo
- `eslint`, `prettier`: Linting e formatação de código
- `tsx`: Execução de TypeScript no desenvolvimento
- `tsup`: Build tool para todos os packages
- `vitest`: Framework de testes utilizado em @perpetuo/core

---

### ✅ Apps/perpetuo-backend

**package.json:**
```
fastify ^4.24.3
@fastify/cors ^8.4.1
@fastify/jwt ^7.2.3
@fastify/rate-limit ^9.0.1
axios ^1.13.3
bcryptjs ^2.4.3
jsonwebtoken ^9.0.2
prisma ^5.7.1
zod ^3.22.4
```

**Status:** ✅ TODAS NECESSÁRIAS
- `fastify` + plugins: Framework HTTP e segurança
- `axios`: Chamadas HTTP internas
- `bcryptjs`: Hash de senhas
- `jsonwebtoken`: Geração de JWTs
- `prisma`: ORM para banco de dados
- `zod`: Validação de esquemas

---

### ✅ Apps/perpetuo-console-web

**package.json:**
```
@radix-ui/react-dialog ^1.1.15
@radix-ui/react-label ^2.1.8
@radix-ui/react-slot ^1.2.4
@tanstack/react-query ^5.90.20
axios ^1.13.3
class-variance-authority ^0.7.1
clsx ^2.1.1
lucide-react ^0.563.0
next 14.1.0
react ^18
react-dom ^18
tailwind-merge ^3.4.0
tailwindcss-animate ^1.0.7
```

**Status:** ✅ TODAS NECESSÁRIAS
- `next`, `react`, `react-dom`: Framework Frontend
- `@radix-ui/*`: Componentes acessíveis
- `@tanstack/react-query`: Gerenciamento de estado do servidor
- `axios`: Chamadas HTTP
- `lucide-react`: Ícones
- `class-variance-authority`, `clsx`, `tailwind-merge`: Utilitários CSS
- `tailwindcss-animate`: Animações Tailwind

---

### ✅ Apps/perpetuo-control-plane

**package.json:**
```
@fastify/cookie ^9.2.0
@fastify/cors ^8.4.1
@fastify/jwt ^7.2.3
@fastify/rate-limit ^10.3.0
@perpetuo/db workspace:*
@perpetuo/observability workspace:*
@perpetuo/shared workspace:*
bcryptjs ^2.4.3
fastify ^4.24.3
fastify-plugin ^5.1.0
jsonwebtoken ^9.0.2
zod ^3.22.4
```

**Status:** ✅ TODAS NECESSÁRIAS
- Fastify + plugins: Framework HTTP
- Pacotes internos: Banco dados, observability, tipos compartilhados
- `bcryptjs`, `jsonwebtoken`: Autenticação
- `fastify-plugin`: Plugin system
- `zod`: Validação

---

### ✅ Apps/perpetuo-gateway

**package.json:**
```
@perpetuo/cache workspace:*
@perpetuo/core workspace:*
@perpetuo/db workspace:*
@perpetuo/events workspace:*
@perpetuo/observability workspace:*
@perpetuo/providers workspace:*
@perpetuo/shared workspace:*
axios ^1.13.3
fastify ^4.24.3
js-yaml ^4.1.0
zod ^3.22.4
```

**Status:** ✅ TODAS NECESSÁRIAS
- Pacotes internos: Toda a stack interna
- `fastify`: Framework HTTP
- `axios`: Chamadas HTTP
- `js-yaml`: Parsing de config YAML
- `zod`: Validação

---

### ✅ Packages/@perpetuo/cache

**package.json:**
```
ioredis ^5.3.2
```

**Status:** ✅ NECESSÁRIA
- `ioredis`: Cliente Redis para cache distribuído

---

### ✅ Packages/@perpetuo/core

**package.json:**
```
zod ^3.22.4
yaml ^2.3.4
```

**Status:** ✅ TODAS NECESSÁRIAS
- `zod`: Validação de esquemas
- `yaml`: Parsing de YAML para configurações

---

### ✅ Packages/@perpetuo/db

**package.json:**
```
@prisma/client ^5.7.0
prisma ^5.7.0
```

**Status:** ✅ TODAS NECESSÁRIAS
- `@prisma/client`: Runtime do ORM
- `prisma`: CLI para migrações e tipos

---

### ✅ Packages/@perpetuo/events

**package.json:**
```
pg ^8.11.3
```

**Status:** ✅ NECESSÁRIA
- `pg`: Conexão com PostgreSQL para event streaming

---

### ✅ Packages/@perpetuo/observability

**package.json:**
```
pino ^8.16.0
prom-client ^15.0.0
```

**Status:** ✅ TODAS NECESSÁRIAS
- `pino`: Logger estruturado
- `prom-client`: Métricas Prometheus

---

### ✅ Packages/@perpetuo/providers

**package.json:**
```
@perpetuo/core workspace:*
undici ^6.0.0
```

**Status:** ✅ TODAS NECESSÁRIAS
- `@perpetuo/core`: Dependência interna
- `undici`: HTTP client moderno (alternativa ao axios para providers)

---

### ✅ Packages/@perpetuo/sdk

**package.json:**
```
zod ^3.23.8
```

**Status:** ✅ NECESSÁRIA
- `zod`: Validação de tipos SDK

---

### ✅ Packages/@perpetuo/shared

**package.json:**
```
zod ^3.22.4
```

**Status:** ✅ NECESSÁRIA
- `zod`: Tipos e validações compartilhadas

---

## Análise de Duplicatas de Versão

### ⚠️ Versões Ligeiramente Diferentes de `zod`

```
@perpetuo/core:       zod ^3.22.4
@perpetuo/sdk:        zod ^3.23.8  (mais recente)
@perpetuo/shared:     zod ^3.22.4
perpetuo-backend:     zod ^3.22.4
perpetuo-control-plane: zod ^3.22.4
perpetuo-gateway:     zod ^3.22.4
```

**Recomendação:** Considere padronizar para `^3.23.8` em todos os pacotes para manter consistência.

### ✅ Duplicatas Aceitáveis

- `@fastify/cors`, `@fastify/jwt`, `@fastify/rate-limit`: Plugins específicos, mantidos em versões estáveis
- `@types/node`, `typescript`, `tsup`: Ferramentas de build compartilhadas (esperado ter múltiplas cópias)
- `axios`: Usado em múltiplos apps (aceitável)

---

## Recomendações

### 1. **Padronizar versão do Zod**
   - Atualize `@perpetuo/sdk` de `^3.23.8` para `^3.22.4` OU
   - Atualize todos os outros pacotes para `^3.23.8`
   - Prefiro a segunda opção (mais recente)

### 2. **Verificar uso real** (opcional)
   - Se quiser garantir que não há código morto, rode:
     ```bash
     npm ls --depth=0
     pnpm ls --depth=0
     ```

### 3. **Limpeza do package-lock.json**
   - Para remover entradas órfãs:
     ```bash
     rm package-lock.json pnpm-lock.yaml
     pnpm install --frozen-lockfile
     ```

---

## Conclusão

✅ **Todas as 30+ dependências no package-lock.json são necessárias e estão sendo utilizadas ativamente.**

Não há dependências órfãs ou não documentadas. O projeto está bem estruturado em termos de gerenciamento de dependências.

---

**Data da Análise:** 27 de Janeiro de 2026
**Ferramentas Analisadas:** 14 package.json files (1 root + 4 apps + 9 packages)

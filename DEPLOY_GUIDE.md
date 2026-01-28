# 🚀 Guia de Deploy - PERPETUO no Fly.io

## Quick Start (5 minutos)

### 1. Execute o Script Automatizado

```powershell
.\deploy-fly.ps1
```

O script vai:
- ✅ Instalar o Fly CLI (se necessário)
- ✅ Fazer login no Fly.io
- ✅ Criar os apps (backend + console web)
- ✅ Criar banco PostgreSQL
- ✅ Configurar variáveis de ambiente
- ✅ Fazer deploy completo

### 2. Informações Solicitadas

Durante a execução, você precisará fornecer:

1. **Nome da app backend** (ex: `perpetuo-backend`)
2. **Nome da app console web** (ex: `perpetuo-console`)
3. **Região** (padrão: `gru` - São Paulo)
   - Outras opções: `iad` (Virginia), `lhr` (Londres), `syd` (Sydney)
4. **JWT_SECRET** (será gerado automaticamente se deixar em branco)
5. **ENCRYPTION_KEY** (será gerado automaticamente se deixar em branco)

---

## Deploy Manual (Passo a Passo)

### Pré-requisitos

```powershell
# Instalar Fly CLI
iwr https://fly.io/install.ps1 -useb | iex

# Login
flyctl auth login
```

### Backend

```powershell
cd apps/perpetuo-backend

# Criar app
flyctl launch --name perpetuo-backend --region gru

# Criar banco PostgreSQL
flyctl postgres create --name perpetuo-db --region gru

# Anexar banco ao app
flyctl postgres attach perpetuo-db

# Configurar secrets
flyctl secrets set JWT_SECRET="seu-secret-aqui"
flyctl secrets set ENCRYPTION_KEY="sua-chave-aqui"

# Deploy
flyctl deploy
```

### Console Web

```powershell
cd apps/perpetuo-console-web

# Criar app
flyctl launch --name perpetuo-console --region gru

# Configurar API URL
flyctl secrets set VITE_API_URL="https://perpetuo-backend.fly.dev"

# Deploy
flyctl deploy
```

---

## Comandos Úteis

### Monitoramento

```powershell
# Ver logs em tempo real
flyctl logs --app perpetuo-backend

# Ver status
flyctl status --app perpetuo-backend

# Abrir no navegador
flyctl open --app perpetuo-console
```

### Atualizações

```powershell
# Redeploy após mudanças
cd apps/perpetuo-backend
flyctl deploy

cd apps/perpetuo-console-web
flyctl deploy
```

### Escalonamento

```powershell
# Aumentar número de instâncias
flyctl scale count 2 --app perpetuo-backend

# Mudar região
flyctl regions add gru iad --app perpetuo-backend
```

### Secrets

```powershell
# Listar secrets
flyctl secrets list --app perpetuo-backend

# Adicionar novo secret
flyctl secrets set OPENAI_KEY="sk-xxx" --app perpetuo-backend

# Remover secret
flyctl secrets unset OPENAI_KEY --app perpetuo-backend
```

---

## Troubleshooting

### Erro: "Port already in use"

```powershell
# Verificar se há instâncias rodando
flyctl status --app perpetuo-backend

# Reiniciar app
flyctl apps restart perpetuo-backend
```

### Erro: "Database connection failed"

```powershell
# Verificar conexão com banco
flyctl postgres connect -a perpetuo-db

# Ver logs do banco
flyctl logs --app perpetuo-db
```

### Erro: "Build failed"

```powershell
# Ver logs detalhados
flyctl logs --app perpetuo-backend

# Fazer build local primeiro
docker build -f Dockerfile -t perpetuo-backend .
```

---

## Arquitetura no Fly.io

```
┌─────────────────────────────────────────┐
│         Fly.io Edge Network             │
│  (Anycast IPv4 + IPv6, TLS automático)  │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼────────┐
│  Console Web │  │  Backend API  │
│  (Next.js)   │  │  (Fastify)    │
│  Port 3002   │  │  Port 8080    │
└──────────────┘  └───────┬───────┘
                          │
                  ┌───────▼───────┐
                  │  PostgreSQL   │
                  │  (Fly Postgres)│
                  └───────────────┘
```

---

## Custos Estimados

**Free Tier do Fly.io:**
- 3 VMs compartilhadas (256MB RAM cada)
- 3GB de armazenamento persistente
- 160GB de tráfego de saída/mês

**Configuração Recomendada (MVP):**
- Backend: 1 VM (512MB RAM) → ~$5/mês
- Console: 1 VM (256MB RAM) → $0 (free tier)
- PostgreSQL: 1 VM (256MB RAM) → $0 (free tier)
- **Total: ~$5/mês**

**Produção (Scale):**
- Backend: 2 VMs (1GB RAM) → ~$20/mês
- Console: 1 VM (512MB RAM) → ~$5/mês
- PostgreSQL: 1 VM (1GB RAM) → ~$10/mês
- **Total: ~$35/mês**

---

## Segurança

### Variáveis de Ambiente Sensíveis

✅ **Use secrets do Fly.io** (nunca hardcode):

```powershell
flyctl secrets set DATABASE_URL="postgresql://..."
flyctl secrets set JWT_SECRET="..."
flyctl secrets set ENCRYPTION_KEY="..."
```

### TLS/HTTPS

✅ **Automático** - Fly.io provisiona certificados Let's Encrypt automaticamente

### Rate Limiting

✅ **Implementado no código** - 1000 req/min por IP

### API Keys

✅ **Criptografadas** - AES-256-GCM no banco

---

## Backup

```powershell
# Fazer backup do PostgreSQL
flyctl postgres backup create --app perpetuo-db

# Listar backups
flyctl postgres backup list --app perpetuo-db

# Restaurar backup
flyctl postgres backup restore <backup-id> --app perpetuo-db
```

---

## Monitoramento

### Métricas Built-in

Acesse o dashboard:
```powershell
flyctl dashboard
```

Ou via web: https://fly.io/dashboard/personal

### Logs Centralizados

```powershell
# Ver últimos 100 logs
flyctl logs --app perpetuo-backend

# Seguir logs em tempo real
flyctl logs --app perpetuo-backend -f
```

---

## Suporte

- 📖 Documentação: https://fly.io/docs
- 💬 Comunidade: https://community.fly.io
- 🐛 Issues: GitHub do projeto

---

**Pronto para deploy? Execute:**

```powershell
.\deploy-fly.ps1
```

🚀 **Em 5 minutos seu gateway estará no ar!**

# 🚀 CHECKLIST DE DEPLOYMENT - PERPETUO

**Status Atual:** Backend no Railway aguardando variáveis de ambiente | Dashboard pronto para Vercel

---

## ✅ PROGRESSO ATÉ AGORA

- [x] Dockerfile corrigido (build de packages/core + tsconfig.json)
- [x] Prisma import corrigido (CommonJS pattern)
- [x] Código commitado e pushed para GitHub
- [x] Railway configurado com `FRONTEND_URL=*` (temporário)
- [x] Vercel config criado (`vercel.json` + `.env.production`)
- [x] Chaves de segurança geradas (ENCRYPTION_KEY + JWT_SECRET)

---

## 🔑 VARIÁVEIS GERADAS (GUARDAR COM SEGURANÇA)

**Você gerou essas chaves no terminal. Copie os valores que apareceram:**

```
ENCRYPTION_KEY=<copie do terminal>
JWT_SECRET=<copie do terminal>
```

**Se perdeu os valores, gere novamente:**

```powershell
# Gerar ENCRYPTION_KEY (32 bytes em base64)
$encryptionKey = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
Write-Host "ENCRYPTION_KEY: $encryptionKey"

# Gerar JWT_SECRET (32 bytes em base64)
$jwtSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
Write-Host "JWT_SECRET: $jwtSecret"
```

---

## 📦 PASSO 1: DEPLOY NO VERCEL (Dashboard)

### **Opção A: Via CLI**

```powershell
cd apps\perpetuo-console-web
vercel login
# Use: anam7615@gmail.com
# Confirme o email que o Vercel vai enviar

vercel --prod
```

**Respostas durante o processo:**
- `Set up and deploy`? → **Y**
- `Which scope`? → **Gabriel Gadelha**
- `Link to existing project`? → **N**
- `Project name`? → **perpetuo-dashboard**
- `In which directory is your code`? → **.** (ponto)
- `Override settings`? → **N**

### **Opção B: Via Dashboard (Mais Fácil)**

1. Acesse: https://vercel.com/login
2. Login com: **anam7615@gmail.com**
3. **New Project** → **Import Git Repository**
4. Escolha: **gabztoo/PERPETUO-refatorado**
5. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/perpetuo-console-web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

6. **Environment Variables (adicione esta):**
   ```
   Nome: NEXT_PUBLIC_API_URL
   Valor: https://perpetuo-backend.up.railway.app
   ```

7. Clique em **Deploy**

### **Resultado Esperado:**

```
✅ Deployment URL: https://perpetuo-dashboard-xyz123.vercel.app
```

**COPIE ESSA URL** - você vai precisar no próximo passo!

---

## 🚂 PASSO 2: CONFIGURAR RAILWAY (Backend)

### **2.1 Acesse Railway Dashboard**

1. https://railway.app/dashboard
2. Clique no projeto **PERPETUO**
3. Clique no serviço **perpetuo-backend**
4. Vá em **Variables** (ou Settings → Variables)

### **2.2 Adicione/Atualize as Variáveis**

Certifique-se de que **TODAS** estas variáveis estão configuradas:

| Variável | Valor | Observação |
|----------|-------|------------|
| `DATABASE_URL` | `postgresql://...` | Já deve estar configurado pelo Railway |
| `JWT_SECRET` | `<valor gerado acima>` | Cole o valor que você copiou |
| `ENCRYPTION_KEY` | `<valor gerado acima>` | Cole o valor que você copiou |
| `NODE_ENV` | `production` | Digite exatamente isso |
| `PORT` | `3000` | Digite exatamente isso |
| `FRONTEND_URL` | `https://perpetuo-dashboard-xyz123.vercel.app` | Substitua pela URL do Vercel |

**IMPORTANTE:** O `FRONTEND_URL` deve ser a URL **EXATA** que o Vercel te deu no Passo 1.

### **2.3 Salve e Force Redeploy**

1. Clique em **Save** ou **Apply Changes**
2. Vá em **Deployments** (ou Deploy)
3. Clique em **Force Redeploy** ou nos três pontinhos → **Redeploy**

---

## 🔍 PASSO 3: VERIFICAR SE FUNCIONOU

### **3.1 Monitorar Logs do Railway**

Railway → perpetuo-backend → **Logs**

**✅ LOGS DE SUCESSO (o que você DEVE ver):**

```
Starting Container
> perpetuo-backend@1.0.0 start
> node dist/main.js

[Fastify] Server listening on port 3000
✓ Prisma connected to database
✓ CORS configured
✓ JWT plugin registered
✓ Rate limit active
```

**❌ ERROS POSSÍVEIS:**

| Erro | Causa | Solução |
|------|-------|---------|
| `ENCRYPTION_KEY environment variable is required` | Variável não configurada | Volte ao Passo 2.2 e verifique |
| `JWT_SECRET is required` | Variável não configurada | Adicione JWT_SECRET no Railway |
| `Cannot connect to database` | DATABASE_URL incorreto | Verifique se o banco PostgreSQL está ativo |
| `Port 3000 already in use` | Problema no Railway | Force Redeploy novamente |

### **3.2 Testar o Backend**

Abra o navegador ou Postman:

```
GET https://perpetuo-backend.up.railway.app/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-28T22:30:00.000Z"
}
```

### **3.3 Testar o Dashboard**

Abra no navegador:

```
https://perpetuo-dashboard-xyz123.vercel.app
```

**Deve carregar:** A página inicial do dashboard sem erros.

**Teste login/signup:**
- Crie uma conta
- Faça login
- Dashboard deve carregar normalmente

---

## 🐛 TROUBLESHOOTING

### **Problema: Railway continua crashando**

```powershell
# Verifique se todas as variáveis estão configuradas
# Railway Dashboard → perpetuo-backend → Variables

# Deve ter 6 variáveis:
# - DATABASE_URL
# - JWT_SECRET
# - ENCRYPTION_KEY
# - NODE_ENV
# - PORT
# - FRONTEND_URL
```

### **Problema: Dashboard carrega mas não conecta ao backend**

1. Verifique se `FRONTEND_URL` no Railway está correto
2. Verifique se `NEXT_PUBLIC_API_URL` no Vercel está correto
3. Teste o endpoint diretamente: `https://perpetuo-backend.up.railway.app/health`

### **Problema: CORS error no navegador**

```
Access to fetch at 'https://perpetuo-backend.up.railway.app' 
from origin 'https://perpetuo-dashboard.vercel.app' has been blocked by CORS
```

**Solução:**
1. Verifique que `FRONTEND_URL` no Railway é exatamente igual à URL do Vercel
2. Não coloque `/` no final da URL
3. Force Redeploy no Railway após corrigir

### **Problema: "Cannot find module @perpetuo/core"**

Isso já foi resolvido, mas se aparecer:
1. Verifique se o Dockerfile tem a seção de build do packages/core
2. Force Redeploy no Railway

---

## 📋 CHECKLIST FINAL

Antes de considerar completo, verifique:

```
[ ] Vercel deploy concluído com sucesso
[ ] URL do Vercel copiada
[ ] Railway tem todas as 6 variáveis de ambiente configuradas
[ ] FRONTEND_URL no Railway = URL do Vercel (exata)
[ ] Force Redeploy executado no Railway
[ ] Logs do Railway mostram "Server listening on port 3000"
[ ] GET https://perpetuo-backend.up.railway.app/health retorna 200 OK
[ ] Dashboard do Vercel carrega sem erros
[ ] Possível criar conta no dashboard
[ ] Possível fazer login no dashboard
```

---

## 🎯 PRÓXIMOS PASSOS (Após Deploy Completo)

1. **Configurar domínio custom (opcional):**
   - Vercel: Settings → Domains → Add Domain
   - Railway: Settings → Networking → Custom Domain

2. **Testar fluxo completo:**
   - Signup → Login → Add Provider → Generate API Key → Test Gateway

3. **Configurar monitoramento:**
   - Railway: Logs + Metrics
   - Vercel: Analytics

4. **Backup das chaves:**
   - Salve `ENCRYPTION_KEY` e `JWT_SECRET` em local seguro
   - Se perder, terá que recriar todas as provider keys

---

## 📞 LINKS ÚTEIS

- **Railway Dashboard:** https://railway.app/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repo:** https://github.com/gabztoo/PERPETUO-refatorado
- **Backend URL:** https://perpetuo-backend.up.railway.app
- **Dashboard URL:** (será gerado após deploy no Vercel)

---

## 💾 BACKUP DAS CREDENCIAIS

**Guarde em local seguro:**

```
# PERPETUO - Credenciais de Produção

## Railway
URL: https://perpetuo-backend.up.railway.app
JWT_SECRET: <cole aqui>
ENCRYPTION_KEY: <cole aqui>

## Vercel
URL: https://perpetuo-dashboard-xyz123.vercel.app
Email: anam7615@gmail.com
User: Gabriel Gadelha

## GitHub
Repo: https://github.com/gabztoo/PERPETUO-refatorado
Email: anam7615@gmail.com
User: Gabriel Gadelha
```

---

**Status:** Pronto para deployment! 🚀

**Última atualização:** 28/01/2026 19:30

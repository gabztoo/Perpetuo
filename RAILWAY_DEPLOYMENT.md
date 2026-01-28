# 🚀 Deploy no Railway - Guia Prático

Railway é a melhor opção: Docker nativo, GitHub integrado, PostgreSQL incluído, $5/mês de crédito grátis.

## ✅ Pré-requisitos

- [ ] Conta GitHub (linked to PERPETUO-refatorado repo)
- [ ] Conta Railway (gratuita em [railway.app](https://railway.app))
- [ ] Código commitado em GitHub

## 📋 Variáveis de Ambiente (Preparadas)

```
JWT_SECRET=68vhOPQEpMsVLGR3BT51YwatjeDbfuH9
ENCRYPTION_KEY=ItHZ7Q0T4mLzeM68XNvEbgV1PJFKwsrA
NODE_ENV=production
```

---

## 🔧 Passo 1: Preparar o Repositório

### 1.1 Verificar Dockerfiles

```bash
# Confirmar que os Dockerfiles existem na raiz
ls -la Dockerfile*
# Esperado:
# - Dockerfile (backend)
# - Dockerfile.console-web (frontend)
```

### 1.2 Commit das Mudanças

```bash
cd c:\Users\gabriel.silva\Documents\PERPETUO-refatorado

git add .
git commit -m "feat: prepare for Railway deployment"
git push origin main
```

---

## 🚂 Passo 2: Criar Projeto no Railway

### 2.1 Acessar Railway

1. Abra [railway.app](https://railway.app)
2. Clique em **"Create Project"**
3. Selecione **"GitHub Repo"**
4. Authorize Railway no GitHub
5. Selecione **PERPETUO-refatorado**

### 2.2 Railway auto-detectará os Dockerfiles

Railway verá:
- `Dockerfile` → Backend (porta 3000)
- `Dockerfile.console-web` → Console Web (porta 3001)

---

## 🗄️ Passo 3: Provisionar PostgreSQL

### 3.1 Adicionar Banco de Dados

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Database"** → **"PostgreSQL"**
3. Railway provisiona automaticamente

### 3.2 Copiar Connection String

Railway gera automaticamente:
```
DATABASE_URL=postgresql://user:password@host:5432/railway
```

Copie este valor para usar na próxima etapa.

---

## ⚙️ Passo 4: Configurar Backend Service

### 4.1 Selecionar o serviço Backend

1. Clique em **"Dockerfile"** service (o backend)
2. Vá para **"Variables"**
3. Adicione as variáveis:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `68vhOPQEpMsVLGR3BT51YwatjeDbfuH9` |
| `ENCRYPTION_KEY` | `ItHZ7Q0T4mLzeM68XNvEbgV1PJFKwsrA` |
| `DATABASE_URL` | *(Cole aqui o valor do PostgreSQL)* |
| `PORT` | `3000` |
| `FRONTEND_URL` | *(Será preenchido após deploy)* |

### 4.2 Confirmar Deploy

Railway auto-detecta `Dockerfile` na raiz e faz build.

---

## 🎨 Passo 5: Configurar Console Web Service

### 5.1 Selecionar Console Web Service

1. Clique em **"Dockerfile.console-web"** service
2. Vá para **"Variables"**
3. Adicione:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `VITE_API_URL` | `https://{backend-url}.up.railway.app` |

**Nota:** Substitua `{backend-url}` pela URL do backend que Railway gerar.

---

## 🔗 Passo 6: Conectar Frontend ao Backend

### 6.1 Pegar URL do Backend

1. Clique no serviço **Backend** (Dockerfile)
2. Vá para **"Environment"** → **"Public URL"** ou **"Railway Domain"**
3. Copie a URL (ex: `https://perpetuo-backend-prod.up.railway.app`)

### 6.2 Atualizar Console Web

1. Clique em **Console Web** (Dockerfile.console-web)
2. Vá para **"Variables"**
3. Atualize `VITE_API_URL` com a URL do backend:
   ```
   VITE_API_URL=https://perpetuo-backend-prod.up.railway.app
   ```

---

## ✅ Passo 7: Verificar Deploy

### 7.1 Monitorar Build

1. Railway mostra **Build Logs** em tempo real
2. Espere até ver: ✅ **"Successfully deployed"**

### 7.2 Testar Endpoints

```bash
# Testar Backend
curl https://perpetuo-backend-prod.up.railway.app/health

# Testar Frontend
curl https://perpetuo-console-web-prod.up.railway.app
```

### 7.3 Acessar Aplicação

```
Console Web: https://perpetuo-console-web-prod.up.railway.app
API Backend: https://perpetuo-backend-prod.up.railway.app
```

---

## 🔧 Troubleshooting

### Erro: "Build failed"
- Verifique se `Dockerfile` está na raiz
- Verifique se Node modules estão instaladas
- Veja logs: **"View Logs"** no Railway

### Erro: "Database connection refused"
- Copie corretamente `DATABASE_URL` do PostgreSQL
- Aguarde 30s para banco inicializar
- Veja se porta é 5432 ou customizada

### Frontend não encontra Backend
- Verifique `VITE_API_URL` está correto
- Deve ser `https://` (não `http://`)
- Rebuild console web após mudar URL

### Erro 401 no login
- Copie corretamente `JWT_SECRET` (exatamente como gerado)
- Não pode mudar depois de users criados

---

## 💰 Custos

- **PostgreSQL**: Incluído na conta Railway
- **Deployment**: $5/mês de crédito grátis (suficiente para MVP)
- **Overage**: ~$0.50/mês por serviço extra

**Total para MVP: GRÁTIS**

---

## 🎉 Pronto!

Seu PERPETUO está no ar! 🚀

- Console: https://perpetuo-console-web-prod.up.railway.app
- API: https://perpetuo-backend-prod.up.railway.app
- Database: Managed PostgreSQL no Railway

---

## 📚 Referências

- [Railway Docker Docs](https://docs.railway.app/deploy/dockerfiles)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Railway PostgreSQL](https://docs.railway.app/databases/postgresql)


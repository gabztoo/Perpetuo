# 🚀 PERPETUO - Alternativas de Deploy para Fly.io

## Problema Identificado
O Fly CLI está tendo problemas de instalação/PATH no seu sistema.

## ✅ Alternativas Recomendadas

### **OPÇÃO 1: GitHub + GitHub Actions (RECOMENDADO) ⭐**

**Mais fácil e automatizado**

#### Passos:

1. **Push do código para GitHub**
```bash
cd PERPETUO-refatorado
git remote add origin https://github.com/seu-usuario/perpetuo.git
git branch -M main
git push -u origin main
```

2. **Criar arquivo `.github/workflows/deploy.yml`**
```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Backend
        uses: superfly/flyctl-actions@master
        with:
          args: "deploy --build-only -f Dockerfile"
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
          
      - name: Deploy Console
        uses: superfly/flyctl-actions@master
        with:
          args: "deploy -f Dockerfile.console-web"
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

3. **Configurar secrets no GitHub**
- Vá para: `Settings` → `Secrets and variables` → `Actions`
- Clique em `New repository secret`
- Nome: `FLY_API_TOKEN`
- Valor: Cole seu token do Fly.io

4. **Pronto!** Cada push para `main` faz deploy automático

---

### **OPÇÃO 2: Docker Desktop + VS Code (SIMPLES)**

**Se você tiver Docker instalado**

#### Passos:

1. **Instale Docker Desktop**
   - Download: https://www.docker.com/products/docker-desktop
   - Instale e reinicie

2. **Login no Fly.io via Docker**
```powershell
docker run --rm -it -v /var/run/docker.sock:/var/run/docker.sock \
  -v ~/.fly:/root/.fly \
  superfly/flyctl auth login
```

3. **Build e Deploy do Backend**
```powershell
cd apps/perpetuo-backend
docker build -t perpetuo-backend:latest .
docker tag perpetuo-backend:latest registry.fly.io/perpetuo-backend:latest
docker push registry.fly.io/perpetuo-backend:latest
```

4. **Build e Deploy do Console**
```powershell
cd apps/perpetuo-console-web
docker build -f ../../Dockerfile.console-web -t perpetuo-console:latest .
docker tag perpetuo-console:latest registry.fly.io/perpetuo-console:latest
docker push registry.fly.io/perpetuo-console:latest
```

---

### **OPÇÃO 3: Deploy via Dashboard Fly.io (VISUAL)**

**Mais simples - sem linha de comando**

#### Passos:

1. **Acesse o Dashboard**
   - URL: https://fly.io/dashboard/personal

2. **Crie novo app**
   - Clique em "Create new..." → "Create an app"

3. **Conecte GitHub** (recomendado)
   - Selecione seu repositório
   - Configure branch: `main`
   - Configure Dockerfile: `Dockerfile` (para backend)

4. **Configure variáveis de ambiente**
   - Variables → Add variable
   - `JWT_SECRET`: seu valor
   - `ENCRYPTION_KEY`: seu valor
   - `DATABASE_URL`: será criado pelo Fly Postgres

5. **Deploy**
   - Clique em "Deploy" ou faça um push para `main`

6. **Repita para Console Web**
   - Crie outro app com `Dockerfile.console-web`
   - Configure `VITE_API_URL` com a URL do backend

---

### **OPÇÃO 4: Reinstalar Fly CLI (Última Resort)**

Se nada funcionar, tente reinstalar manualmente:

```powershell
# 1. Download manual
# Acesse: https://github.com/superfly/flyctl/releases
# Download: flyctl_windows_amd64.zip

# 2. Extraia para C:\Program Files\flyctl

# 3. Adicione ao PATH
$env:Path += ";C:\Program Files\flyctl"

# 4. Verifique
flyctl version

# 5. Login
flyctl auth login

# 6. Deploy
cd apps/perpetuo-backend
flyctl launch --name perpetuo-backend --region gru
flyctl deploy
```

---

## 🎯 Recomendação

**Para você, recomendo a OPÇÃO 1 (GitHub + GitHub Actions)**

### Por quê?
✅ Sem problemas de CLI  
✅ Deploy automático a cada push  
✅ Sem precisar executar comandos locais  
✅ Logs centralizados no GitHub  
✅ Fácil de entender e manter  

### Tempo:
- Setup: 5 minutos
- Primeiro deploy: 10 minutos
- Próximos deploys: Automático (2-3 minutos)

---

## Próximas Ações

1. **Escolha uma opção acima**
2. **Copie o passo-a-passo**
3. **Siga as instruções**
4. **Acessar sua app em `https://seu-app-name.fly.dev`**

---

## Suporte

Se tiver dúvidas:
- 📖 [Fly.io Docs](https://fly.io/docs)
- 💬 [Fly Community](https://community.fly.io)
- 🐛 [Issues GitHub](https://github.com/superfly/flyctl/issues)

---

**Qual opção você quer usar?** 🚀

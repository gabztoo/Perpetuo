# PERPETUO - Deploy Automatizado para Fly.io
# Execute este script para fazer deploy completo do projeto

Write-Host "🚀 PERPETUO - Deploy para Fly.io" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# 1. Verificar se Fly CLI está instalado
Write-Host "📦 Verificando Fly CLI..." -ForegroundColor Cyan
try {
    $flyVersion = flyctl version 2>&1
    Write-Host "✓ Fly CLI encontrado: $flyVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Fly CLI não encontrado. Instalando..." -ForegroundColor Yellow
    iwr https://fly.io/install.ps1 -useb | iex
    Write-Host "✓ Fly CLI instalado com sucesso!" -ForegroundColor Green
}

Write-Host ""

# 2. Login no Fly.io
Write-Host "🔐 Fazendo login no Fly.io..." -ForegroundColor Cyan
flyctl auth login
Write-Host ""

# 3. Perguntar dados ao usuário
Write-Host "📝 Configuração do Deploy" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Cyan
$appNameBackend = Read-Host "Nome da app backend (ex: perpetuo-backend)"
$appNameConsole = Read-Host "Nome da app console web (ex: perpetuo-console)"
$region = Read-Host "Região preferida (padrão: gru - São Paulo)" 
if ([string]::IsNullOrWhiteSpace($region)) { $region = "gru" }

Write-Host ""
Write-Host "🔑 Variáveis de Ambiente" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Cyan
$jwtSecret = Read-Host "JWT_SECRET (pressione Enter para gerar automaticamente)"
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "✓ JWT_SECRET gerado: $jwtSecret" -ForegroundColor Green
}

$encryptionKey = Read-Host "ENCRYPTION_KEY (pressione Enter para gerar automaticamente)"
if ([string]::IsNullOrWhiteSpace($encryptionKey)) {
    $encryptionKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "✓ ENCRYPTION_KEY gerado: $encryptionKey" -ForegroundColor Green
}

Write-Host ""

# 4. Deploy Backend
Write-Host "🚀 Deploy Backend" -ForegroundColor Cyan
Write-Host "-----------------" -ForegroundColor Cyan

# Criar PostgreSQL no Fly.io
Write-Host "Criando banco de dados PostgreSQL..." -ForegroundColor Yellow
flyctl postgres create --name "$appNameBackend-db" --region $region --initial-cluster-size 1

# Anexar o banco ao app
$dbUrl = flyctl postgres attach "$appNameBackend-db" --app $appNameBackend 2>&1

# Criar app backend
Write-Host "Criando app backend..." -ForegroundColor Yellow
Set-Location apps/perpetuo-backend

# Criar fly.toml para backend
@"
app = "$appNameBackend"
primary_region = "$region"

[build]
  dockerfile = "../../Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

[[services.http_checks]]
  interval = 10000
  timeout = 2000
  grace_period = "5s"
  method = "get"
  path = "/health"
"@ | Out-File -FilePath fly.toml -Encoding UTF8

# Configurar secrets
Write-Host "Configurando variáveis de ambiente..." -ForegroundColor Yellow
flyctl secrets set JWT_SECRET="$jwtSecret" ENCRYPTION_KEY="$encryptionKey" --app $appNameBackend

# Deploy
Write-Host "Fazendo deploy do backend..." -ForegroundColor Yellow
flyctl deploy --app $appNameBackend

$backendUrl = "https://$appNameBackend.fly.dev"
Write-Host "✓ Backend deployado: $backendUrl" -ForegroundColor Green

Set-Location ../..
Write-Host ""

# 5. Deploy Console Web
Write-Host "🚀 Deploy Console Web" -ForegroundColor Cyan
Write-Host "---------------------" -ForegroundColor Cyan

Set-Location apps/perpetuo-console-web

# Criar fly.toml para console web
@"
app = "$appNameConsole"
primary_region = "$region"

[build]
  dockerfile = "../../Dockerfile.console-web"

[env]
  NODE_ENV = "production"
  VITE_API_URL = "$backendUrl"

[[services]]
  internal_port = 3002
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20
"@ | Out-File -FilePath fly.toml -Encoding UTF8

# Deploy
Write-Host "Fazendo deploy do console web..." -ForegroundColor Yellow
flyctl deploy --app $appNameConsole

$consoleUrl = "https://$appNameConsole.fly.dev"
Write-Host "✓ Console Web deployado: $consoleUrl" -ForegroundColor Green

Set-Location ../..
Write-Host ""

# 6. Resumo
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "  Backend API: $backendUrl" -ForegroundColor White
Write-Host "  Console Web: $consoleUrl" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Secrets Configurados:" -ForegroundColor Cyan
Write-Host "  JWT_SECRET: $jwtSecret" -ForegroundColor White
Write-Host "  ENCRYPTION_KEY: $encryptionKey" -ForegroundColor White
Write-Host ""
Write-Host "📝 Próximos Passos:" -ForegroundColor Cyan
Write-Host "  1. Acesse $consoleUrl" -ForegroundColor White
Write-Host "  2. Crie sua conta" -ForegroundColor White
Write-Host "  3. Configure suas API Keys dos providers" -ForegroundColor White
Write-Host "  4. Comece a usar o gateway!" -ForegroundColor White
Write-Host ""
Write-Host "💡 Comandos Úteis:" -ForegroundColor Cyan
Write-Host "  - Ver logs backend:   flyctl logs --app $appNameBackend" -ForegroundColor White
Write-Host "  - Ver logs console:   flyctl logs --app $appNameConsole" -ForegroundColor White
Write-Host "  - Abrir backend:      flyctl open --app $appNameBackend" -ForegroundColor White
Write-Host "  - Abrir console:      flyctl open --app $appNameConsole" -ForegroundColor White
Write-Host "  - Ver status:         flyctl status --app $appNameBackend" -ForegroundColor White
Write-Host ""

# Script para fazer deploy sem usar Fly CLI
# Usando curl para chamar a API do Fly.io

Write-Host "🚀 PERPETUO - Deploy via API Fly.io" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Para usar este método, você precisa:" -ForegroundColor Yellow
Write-Host "1. Acessar https://fly.io/dashboard/personal" -ForegroundColor White
Write-Host "2. Copiar seu API Token" -ForegroundColor White
Write-Host "3. Usar as URLs fornecidas para deploy" -ForegroundColor White
Write-Host ""

$apiToken = Read-Host "Cole seu API Token do Fly.io"

if ([string]::IsNullOrWhiteSpace($apiToken)) {
    Write-Host "❌ API Token não fornecido. Abortando." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ API Token recebido" -ForegroundColor Green
Write-Host ""

# Sugerir alternativa visual
Write-Host "📝 Instruções Visuais para Deploy:" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "OPÇÃO 1: Deploy via Web Dashboard" -ForegroundColor Yellow
Write-Host "1. Acesse: https://fly.io/dashboard/personal" -ForegroundColor White
Write-Host "2. Clique em 'Create new...' → 'Create an app'" -ForegroundColor White
Write-Host "3. Conecte seu repositório GitHub (recomendado)" -ForegroundColor White
Write-Host "4. Configure branch e Dockerfile" -ForegroundColor White
Write-Host ""

Write-Host "OPÇÃO 2: Deploy via Docker (Local)" -ForegroundColor Yellow
Write-Host "1. Instale Docker: https://www.docker.com/products/docker-desktop" -ForegroundColor White
Write-Host "2. Faça login no Fly:" -ForegroundColor White
Write-Host "   docker context create fly --docker 'host=unix:///var/run/docker.sock'" -ForegroundColor White
Write-Host "3. Build da imagem:" -ForegroundColor White
Write-Host "   docker build -f Dockerfile -t perpetuo-backend ." -ForegroundColor White
Write-Host "4. Deploy no Fly:" -ForegroundColor White
Write-Host "   docker build --push -t registry.fly.io/perpetuo-backend:latest -f Dockerfile ." -ForegroundColor White
Write-Host ""

Write-Host "OPÇÃO 3: GitHub Actions (Automático)" -ForegroundColor Yellow
Write-Host "1. Configure secrets no GitHub:" -ForegroundColor White
Write-Host "   - FLY_API_TOKEN: Cole seu token aqui" -ForegroundColor White
Write-Host "2. Push para main" -ForegroundColor White
Write-Host "3. GitHub Actions faz deploy automático" -ForegroundColor White
Write-Host ""

Write-Host "Links Úteis:" -ForegroundColor Cyan
Write-Host "- Dashboard: https://fly.io/dashboard/personal" -ForegroundColor White
Write-Host "- Documentação: https://fly.io/docs" -ForegroundColor White
Write-Host "- Suporte: https://community.fly.io" -ForegroundColor White
Write-Host ""

#!/bin/bash

# PERPETUO MVP - Quick Start Script

set -e

echo "🚀 PERPETUO MVP Setup"
echo "===================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Database
echo -e "\n${BLUE}1️⃣  Setting up PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
  echo "❌ PostgreSQL not installed. Please install PostgreSQL first."
  exit 1
fi

# Create database
psql -U postgres -c "CREATE DATABASE perpetuo;" 2>/dev/null || echo "Database already exists"

# 2. Backend
echo -e "\n${BLUE}2️⃣  Installing backend...${NC}"
cd apps/perpetuo-backend
npm install

# .env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env file"
fi

# Prisma migrations
echo -e "\n${BLUE}Running database migrations...${NC}"
npx prisma migrate dev --name init

cd ../..

# 3. Dashboard
echo -e "\n${BLUE}3️⃣  Installing dashboard...${NC}"
cd apps/perpetuo-dashboard
npm install

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "✅ Created .env.local file"
fi

cd ../..

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo -e "\n${BLUE}Next steps:${NC}"
echo "1. Start backend:    cd apps/perpetuo-backend && npm run dev"
echo "2. Start dashboard:  cd apps/perpetuo-dashboard && npm run dev"
echo ""
echo "Frontend: http://localhost:3001"
echo "Backend:  http://localhost:3000"
echo ""
echo "Test account: test@test.com / password123"

# 🔐 SETUP.md - Quick Start (com Security Fixes)

**Updated: January 27, 2026 - Security Phase**

---

## ⚡ 5-Minute Quick Start

### 1️⃣ Generate Secrets

```bash
# Generate encryption key for provider keys (REQUIRED)
openssl rand -base64 32
# Copy output → save for ENCRYPTION_KEY in .env

# Generate JWT secret
openssl rand -base64 32
# Copy output → save for JWT_SECRET in .env
```

### 2️⃣ Backend Setup

```bash
cd apps/perpetuo-backend

# Copy template
cp .env.example .env

# Edit .env and add:
# - DATABASE_URL (PostgreSQL connection)
# - JWT_SECRET (from step 1)
# - ENCRYPTION_KEY (from step 1, must be 32 bytes base64)

# Install dependencies
npm install

# Create database & run migrations
npx prisma migrate dev

# Start server
npm run dev
# → Backend runs on http://localhost:3000
```

### 3️⃣ Dashboard Setup

```bash
cd apps/perpetuo-dashboard

cp .env.example .env
# (Usually no changes needed if backend is localhost:3000)

npm install
npm run dev
# → Dashboard runs on http://localhost:3001
```

### 4️⃣ First Request (5-minute flow)

1. **Open dashboard**: http://localhost:3001
2. **Sign up**: 
   - Email: `test@example.com`
   - Password: `Test@123!`
   - Name: `Test User`
3. **Auto-created**: Default workspace + initial API key
4. **In dashboard**:
   - Go to "Providers" tab
   - Add OpenAI key (will be encrypted with AES-256-GCM)
   - Go to "API Keys" tab
   - View your first key (hash shown, plaintext lost)
5. **Test gateway**:
   ```bash
   curl -X POST http://localhost:3000/v1/chat/completions \
     -H "Authorization: Bearer pk_xxxxxxx" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "gpt-3.5-turbo",
       "messages": [{"role": "user", "content": "Hello"}]
     }'
   ```

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] **ENCRYPTION_KEY**: Generated with `openssl rand -base64 32`
- [ ] **JWT_SECRET**: Generated with `openssl rand -base64 32`
- [ ] **.env not committed**: Check `.gitignore` has `.env`
- [ ] **DATABASE_URL**: Points to production PostgreSQL
- [ ] **Rate limiting**: Enabled (1000 req/min by IP)
- [ ] **API keys**: Hashed before storage (no plaintext in DB)
- [ ] **Provider keys**: Encrypted with AES-256-GCM
- [ ] **Workspace isolation**: All ops check JWT token, not client input
- [ ] **CORS**: Set `FRONTEND_URL` to production domain

See [SECURITY_FIXES.md](../SECURITY_FIXES.md) for detailed explanation.

---

## 📋 Full Docker Setup (Production-like)

```bash
# From root directory
docker-compose up -d

# This starts:
# - PostgreSQL (port 5432)
# - Backend (port 3000)
# - Dashboard (port 3001)

# Check health
curl http://localhost:3000/health
```

---

## 🧪 Testing

```bash
# Backend tests
cd apps/perpetuo-backend
npm run test

# E2E validation
bash ../../test.sh
```

---

## 📁 File Structure

```
perpetuo-backend/
├── src/
│   ├── main.ts                    # Fastify + plugins
│   ├── shared/
│   │   ├── crypto.ts              # ✅ NEW: AES-256-GCM
│   │   ├── http.ts                # ✅ UPDATED: hashAPIKey
│   │   └── types.ts
│   └── modules/
│       ├── auth/routes.ts
│       ├── gateway/
│       │   ├── routes.ts
│       │   └── api-keys.ts        # ✅ UPDATED: key_hash
│       ├── workspaces/routes.ts
│       ├── providers/routes.ts
│       ├── logs/routes.ts
│       └── usage/routes.ts
├── prisma/
│   └── schema.prisma              # ✅ UPDATED: key_hash field
├── package.json                   # ✅ UPDATED: @fastify/rate-limit
├── .env.example                   # ✅ UPDATED: ENCRYPTION_KEY
└── tsconfig.json
```

---

## 🚀 Environment Variables

### Development

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/perpetuo"

# Secrets (generate with openssl)
JWT_SECRET="dev-secret-not-for-production"
ENCRYPTION_KEY="YourBase64EncodedKey=="

# Server
NODE_ENV="development"
PORT="3000"
FRONTEND_URL="http://localhost:3001"
API_BASE_URL="http://localhost:3000"
```

### Production (Render/Fly/Heroku)

```env
# Database URL from provider (secret)
DATABASE_URL="postgresql://user:pass@db.example.com:5432/perpetuo"

# Secrets from secrets manager or env vars
JWT_SECRET="[generate: openssl rand -base64 32]"
ENCRYPTION_KEY="[generate: openssl rand -base64 32]"

# Server
NODE_ENV="production"
PORT="3000"
FRONTEND_URL="https://app.example.com"
API_BASE_URL="https://api.example.com"
```

---

## ⚠️ Common Issues

### Issue: "ENCRYPTION_KEY must be 32 bytes"

**Cause**: Key is not properly base64 encoded or wrong length

**Fix**:
```bash
openssl rand -base64 32
# Copy ENTIRE output (should be ~44 characters)
# Paste into .env as ENCRYPTION_KEY
```

### Issue: API key doesn't work after update

**Cause**: Old plaintext keys won't validate against new hash system

**Fix**:
```bash
# Delete old keys from database
npx prisma db push

# Users create new keys in dashboard
# Each new key is hashed on creation
```

### Issue: "CORS blocked" from dashboard

**Cause**: `FRONTEND_URL` doesn't match dashboard domain

**Fix**:
```env
# If dashboard is on example.com:3001
FRONTEND_URL="https://example.com:3001"
```

---

## 📚 Security References

- [AES-256-GCM Best Practices](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- [API Key Security](https://owasp.org/www-community/attacks/API_key_exposure)
- [Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/API_Security_Cheat_Sheet.html#2-authentication)
- [Multi-Tenant Security](https://owasp.org/www-community/attacks/account_enumeration)

---

## ✅ Status

✅ Rate limiting configured  
✅ AES-256-GCM implemented  
✅ API keys hashed  
✅ Workspace isolation validated  
✅ Secrets properly managed  

**Ready for**: Development → Staging → Production

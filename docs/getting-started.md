# 🚀 Getting Started with PERPETUO

**Fastest way to start using PERPETUO AI Gateway in any language or framework.**

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed
- **PostgreSQL** database (local or Docker)
- **pnpm** package manager (`npm install -g pnpm`)
- **Docker & Docker Compose** (optional, for containerized setup)

---

## 🚀 Quick Start

### 1. Clone & Setup

```bash
# Clone the repository
git clone https://github.com/your-org/perpetuo.git
cd perpetuo

# Install dependencies
pnpm install

# Set up environment
cp apps/perpetuo-backend/.env.example apps/perpetuo-backend/.env
```

### 2. Database Setup

```bash
# Create database (if not using Docker)
createdb perpetuo

# Run migrations
cd apps/perpetuo-backend
npx prisma migrate dev --name init
```

### 3. Start Services

```bash
# Option 1: Using Docker Compose (recommended)
docker-compose up -d

# Option 2: Manual start
cd apps/perpetuo-backend && npm run dev &
cd apps/perpetuo-dashboard && npm run dev &
```

### 4. Verify Installation

```bash
# Check backend health
curl http://localhost:3000/health

# Expected response:
{"status":"ok","timestamp":"2026-01-28T14:00:00Z"}
```

---

## 🔑 First Steps

### 1. Create Account

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "secure-password-123",
    "name": "Your Name"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "email": "your@email.com",
      "name": "Your Name",
      "created_at": "2026-01-28T14:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "workspace": {
      "id": "ws_123",
      "name": "My Workspace",
      "created_at": "2026-01-28T14:00:00Z"
    },
    "api_key": "pk_xxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

### 2. Add Provider Key (BYOK)

```bash
curl -X POST http://localhost:3000/workspaces/ws_123/providers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "api_key": "sk-your-openai-key-here",
    "priority": 1
  }'
```

### 3. Make Your First Request

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer pk_xxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

---

## 🌐 Client Integration

### JavaScript/Node.js

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Authorization': 'Bearer pk_xxxxxxxxxxxxxxxxxxxxxx',
    'Content-Type': 'application/json'
  }
});

async function chatCompletion() {
  try {
    const response = await client.post('/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'user', content: 'Hello, how are you?' }
      ]
    });
    
    console.log(response.data.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

chatCompletion();
```

### Python

```python
import requests

client = requests.Session()
client.headers.update({
    'Authorization': 'Bearer pk_xxxxxxxxxxxxxxxxxxxxxx',
    'Content-Type': 'application/json'
})

def chat_completion():
    try:
        response = client.post(
            'http://localhost:3000/v1/chat/completions',
            json={
                'model': 'gpt-4',
                'messages': [
                    {'role': 'user', 'content': 'Hello, how are you?'}
                ]
            }
        )
        response.raise_for_status()
        print(response.json()['choices'][0]['message']['content'])
    except Exception as e:
        print(f'Error: {e}')

chat_completion()
```

### React/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Authorization': `Bearer ${process.env.REACT_APP_PERPETUO_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  model: string;
  messages: ChatMessage[];
}

export const chatCompletion = async (request: ChatRequest) => {
  const response = await api.post('/v1/chat/completions', request);
  return response.data;
};
```

---

## 📊 Dashboard Setup

### 1. Access Dashboard

Open your browser and navigate to `http://localhost:3001`

### 2. Login

Use the credentials you created in Step 1.

### 3. Configure Workspace

1. Go to **Workspaces** → **Your Workspace**
2. Add provider keys in **Providers** section
3. Generate API keys in **API Keys** section
4. Test requests in **Logs** section

---

## 🔧 Configuration

### Environment Variables

**Backend** (`apps/perpetuo-backend/.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/perpetuo
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ENCRYPTION_KEY=your-32-byte-encryption-key-here
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001
```

**Frontend** (`apps/perpetuo-dashboard/.env.local`):
```env
VITE_API_URL=http://localhost:3000
```

### Docker Configuration

Edit `docker-compose.yml` to customize:
- PostgreSQL credentials
- Port mappings
- Environment variables

---

## 🧪 Testing Your Setup

### 1. Health Check

```bash
curl http://localhost:3000/health
```

### 2. Authentication Test

```bash
# Test signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Test login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 3. Provider Test

```bash
# Test with your API key
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer pk_xxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}}],
    "max_tokens": 10
  }'
```

---

## 🚀 Next Steps

### 1. Explore Features

- **Multiple Providers**: Add OpenAI, Anthropic, Groq keys
- **Strategies**: Test `fastest`, `cheapest`, `reliable` routing
- **Logging**: View request logs and analytics
- **Usage**: Monitor token consumption and costs

### 2. Production Deployment

1. Set up proper database
2. Configure HTTPS
3. Set up monitoring
4. Configure backup strategies
5. Review security settings

### 3. Advanced Configuration

- Custom model aliases
- Workspace-specific strategies
- Rate limiting configuration
- Provider priority tuning

---

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check PostgreSQL status
docker-compose ps postgres
# Or locally
pg_isready -d perpetuo
```

**Permission Denied**
```bash
# Ensure .env files have correct permissions
chmod 600 apps/perpetuo-backend/.env
```

**CORS Issues**
```bash
# Check frontend URL configuration
echo $FRONTEND_URL  # Should match your frontend URL
```

### Getting Help

- Check the [API Reference](./api-reference.md)
- Review [Analytics & Monitoring](./analytics-monitoring.md)
- Visit our [GitHub Issues](https://github.com/your-org/perpetuo/issues)
- Join our [Discord Community](https://discord.gg/perpetuo)

---

**Happy coding! 🚀**

For more detailed information, see:
- [API Reference](./api-reference.md)
- [Analytics & Monitoring](./analytics-monitoring.md)
- [LLM Gateways Guide](./llm-gateways.md)

---
id: getting-started
title: Getting Started
description: Step-by-step guide to set up and use the PERPETUO AI Gateway.
---
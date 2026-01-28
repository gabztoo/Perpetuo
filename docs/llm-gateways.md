---
id: llm-gateways
title: LLM Gateways Guide
description: Learn how to configure and use Language Model Gateways in PERPETUO.
---

## 📖 Overview

PERPETUO supports multiple Language Model Providers (LLMs) through a unified gateway. This allows you to:

- Use **OpenAI**, **Anthropic**, **Groq**, and more with a single API.
- Configure **BYOK (Bring Your Own Key)** for each provider.
- Automatically fallback to alternative providers in case of errors.
- Optimize requests based on **cost**, **latency**, or **reliability**.

---

## 🔑 Supported Providers

### 1. OpenAI
- **Models**: `gpt-4`, `gpt-3.5-turbo`
- **API Key**: `sk-...`
- **Endpoint**: `https://api.openai.com/v1`

### 2. Anthropic
- **Models**: `claude-v1`, `claude-v2`
- **API Key**: `sk-...`
- **Endpoint**: `https://api.anthropic.com/v1`

### 3. Groq
- **Models**: `groq-fast`, `groq-reliable`
- **API Key**: `sk-...`
- **Endpoint**: `https://api.groq.com/v1`

---

## 🛠️ Configuration

### 1. Add Provider Keys

Use the `/workspaces/:workspaceId/providers` endpoint to add keys for each provider.

```bash
curl -X POST http://localhost:3000/workspaces/ws_123/providers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "api_key": "sk-your-openai-key",
    "priority": 1
  }'
```

### 2. Configure Priorities

Set the `priority` field to determine the order of fallback:
- `1`: Highest priority
- `2`: Secondary fallback
- `3`: Lowest priority

### 3. Test Configuration

Use the `/v1/chat/completions` endpoint to test:

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

## ⚙️ Routing Strategies

PERPETUO supports the following routing strategies:

### 1. Fastest
- Prioritizes providers with the lowest latency.
- Use case: Real-time applications.

### 2. Cheapest
- Prioritizes providers with the lowest cost per token.
- Use case: Cost-sensitive workloads.

### 3. Reliable
- Prioritizes providers with the lowest error rates.
- Use case: Mission-critical applications.

### 4. Default
- Uses the workspace-configured priority.
- Use case: General-purpose.

---

## 🔄 Fallback Logic

If a provider fails (e.g., timeout, 5xx error), PERPETUO automatically retries with the next provider in the priority list.

### Error Classifications:
- **Retryable**: 429, 5xx, timeouts
- **Fatal**: 401, 403, invalid requests

---

## 📊 Monitoring Usage

Use the `/workspaces/:workspaceId/usage` endpoint to monitor token consumption and costs:

```bash
curl http://localhost:3000/workspaces/ws_123/usage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "total_tokens": 123456,
  "total_cost": 45.67,
  "by_provider": {
    "openai": { "tokens": 100000, "cost": 40.00 },
    "anthropic": { "tokens": 23456, "cost": 5.67 }
  }
}
```

---

## 🆘 Troubleshooting

### Common Issues

**Invalid API Key**
- Ensure the key is correct and active.
- Test the key directly with the provider's API.

**Provider Timeout**
- Check network connectivity.
- Increase the `timeout` value in your request.

**High Costs**
- Use the `cheapest` strategy.
- Monitor usage regularly.

---

**For more details, see:**
- [Getting Started](./getting-started.md)
- [Analytics & Monitoring](./analytics-monitoring.md)
- [API Reference](./api-reference.md)
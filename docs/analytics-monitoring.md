---
id: analytics-monitoring
title: Analytics & Monitoring
description: Track and optimize your usage of PERPETUO AI Gateway.
---

## 📖 Overview

PERPETUO provides built-in analytics and monitoring tools to help you:

- Track **token usage** and **costs**.
- Analyze **request logs**.
- Monitor **provider performance**.
- Detect and troubleshoot **errors**.

---

## 🔍 Usage Analytics

### 1. Total Usage

Use the `/workspaces/:workspaceId/usage` endpoint to get an overview of your token consumption and costs.

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

### 2. Usage by Provider

Break down usage by provider:

```bash
curl http://localhost:3000/workspaces/ws_123/usage/by-provider?days=7 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "openai": {
    "tokens": 50000,
    "cost": 20.00
  },
  "anthropic": {
    "tokens": 10000,
    "cost": 3.00
  }
}
```

---

## 📂 Request Logs

### 1. View Logs

Use the `/workspaces/:workspaceId/logs` endpoint to view recent requests:

```bash
curl http://localhost:3000/workspaces/ws_123/logs?page=1&limit=50 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "logs": [
    {
      "request_id": "req_123",
      "model": "gpt-4",
      "provider": "openai",
      "tokens": 1000,
      "cost": 0.06,
      "status": 200,
      "latency_ms": 345,
      "created_at": "2026-01-28T14:00:00Z"
    },
    {
      "request_id": "req_124",
      "model": "claude-v2",
      "provider": "anthropic",
      "tokens": 500,
      "cost": 0.03,
      "status": 200,
      "latency_ms": 567,
      "created_at": "2026-01-28T14:01:00Z"
    }
  ]
}
```

### 2. Filter Logs

Filter logs by provider, status, or date range:

```bash
curl http://localhost:3000/workspaces/ws_123/logs?provider=openai&status=200&start_date=2026-01-01 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📈 Provider Performance

### 1. Latency Metrics

Monitor average latency per provider:

```bash
curl http://localhost:3000/workspaces/ws_123/performance/latency \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "openai": {
    "average_latency_ms": 300
  },
  "anthropic": {
    "average_latency_ms": 500
  }
}
```

### 2. Error Rates

Monitor error rates per provider:

```bash
curl http://localhost:3000/workspaces/ws_123/performance/errors \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "openai": {
    "error_rate": 0.01
  },
  "anthropic": {
    "error_rate": 0.02
  }
}
```

---

## 🛠️ Troubleshooting

### Common Issues

**High Latency**
- Check provider performance metrics.
- Use the `fastest` strategy.

**High Costs**
- Use the `cheapest` strategy.
- Monitor usage regularly.

**Frequent Errors**
- Check error logs for details.
- Use the `reliable` strategy.

---

**For more details, see:**
- [Getting Started](./getting-started.md)
- [LLM Gateways Guide](./llm-gateways.md)
- [API Reference](./api-reference.md)
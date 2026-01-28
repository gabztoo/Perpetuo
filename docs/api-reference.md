---
id: api-reference
title: API Reference
description: Comprehensive guide to PERPETUO API endpoints.
---

## 🔓 Authentication

### 1. Signup

**Endpoint:** `POST /auth/signup`

**Request:**
```json
{
  "email": "your@email.com",
  "password": "secure-password-123",
  "name": "Your Name"
}
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

---

### 2. Login

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "your@email.com",
  "password": "secure-password-123"
}
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
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 🔐 Gateway

### 1. Chat Completions

**Endpoint:** `POST /v1/chat/completions`

**Headers:**
- `Authorization: Bearer pk_xxxxxxxxxxxxxxxxxxxxxx`
- `Content-Type: application/json`

**Request:**
```json
{
  "model": "gpt-4",
  "messages": [
    {"role": "user", "content": "Hello, how are you?"}
  ]
}
```

**Response:**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1672531200,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I'm good, thank you! How can I assist you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

---

## 🔧 Workspaces

### 1. List Workspaces

**Endpoint:** `GET /workspaces`

**Headers:**
- `Authorization: Bearer YOUR_JWT_TOKEN`

**Response:**
```json
{
  "workspaces": [
    {
      "id": "ws_123",
      "name": "My Workspace",
      "created_at": "2026-01-28T14:00:00Z"
    }
  ]
}
```

---

### 2. Get Workspace Details

**Endpoint:** `GET /workspaces/:id`

**Headers:**
- `Authorization: Bearer YOUR_JWT_TOKEN`

**Response:**
```json
{
  "id": "ws_123",
  "name": "My Workspace",
  "created_at": "2026-01-28T14:00:00Z",
  "providers": [
    {
      "id": "prov_123",
      "provider": "openai",
      "priority": 1
    }
  ]
}
```

---

## 🔑 Providers

### 1. Add Provider

**Endpoint:** `POST /workspaces/:workspaceId/providers`

**Headers:**
- `Authorization: Bearer YOUR_JWT_TOKEN`
- `Content-Type: application/json`

**Request:**
```json
{
  "provider": "openai",
  "api_key": "sk-your-openai-key",
  "priority": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prov_123",
    "provider": "openai",
    "priority": 1
  }
}
```

---

## 📂 Logs

### 1. View Logs

**Endpoint:** `GET /workspaces/:workspaceId/logs`

**Headers:**
- `Authorization: Bearer YOUR_JWT_TOKEN`

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
    }
  ]
}
```

---

**For more details, see:**
- [Getting Started](./getting-started.md)
- [LLM Gateways Guide](./llm-gateways.md)
- [Analytics & Monitoring](./analytics-monitoring.md)
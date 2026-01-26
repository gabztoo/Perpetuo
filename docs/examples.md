# Perpetuo Gateway Examples

## 1. Basic Request (Routing to default/configured model)
Uses `x-tenant-id` (mandatory).

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-123" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## 2. Bring Your Own Key (BYOK)
Provide the provider key in header.

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-123" \
  -H "x-provider-key-openai: sk-..." \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Explain quantum physics"}]
  }'
```

## 3. Testing Fallback (Mock Provider)
Trigger a mock failure to see if it falls back or handles error.
(To test generic fallback, you'd need the primary to fail. The Mock provider has `fail-500` trigger).

Requesting `mock-gpt` directly with failure trigger:

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-123" \
  -d '{
    "model": "mock-gpt",
    "messages": [{"role": "user", "content": "fail-500"}]
  }'
```
(This should return 500 or fallback if configured recursively, but our config falls back TO mock-gpt, so if mock-gpt is primary and fails, it might just fail unless we have a 3rd option).

## 4. Metrics
```bash
curl http://localhost:3000/metrics
```

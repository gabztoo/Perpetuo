# Perpetuo AI Gateway - V1 Production Runbook

## Overview
Perpetuo is a high-performance AI Gateway with quota management, audit logging, and resilience features. This runbook details how to operate it in a production environment.

## Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server Port | `3000` |
| `LOG_LEVEL` | Logging Level | `info` |
| `REDIS_URL` | Redis Connection Request | `redis://localhost:6379` |
| `DATABASE_URL` | Postgres Connection (for Audit) | `postgres://user:pass@host:5432/db` |
| `PERPETUO_CONFIG_PATH` | Path to `perpetuo.config.yaml` | `./perpetuo.config.yaml` |

## Deployment
We use Docker Compose for easy orchestration.

### Start Services
```bash
docker-compose up -d --build
```
This starts:
1.  **Gateway** (Port 3000)
2.  **Redis** (Port 6379) - Used for Rate Limits, Quotas, Circuit Breaker
3.  **Postgres** (Port 5432) - Used for Event Logging

### Database Migrations
On first run, the gateway expects the `events` table to exist.
The `docker-compose` mounts `./migrations` to `/docker-entrypoint-initdb.d` which automatically runs `001_init.sql` on fresh Postgres start.

## Operational Tasks

### 1. Adding Tenants
Edit `perpetuo.config.yaml`:
```yaml
tenants:
  - id: "new-tenant"
    plan: "pro"
    limits:
      rateLimitMin: 100
      budgetDay: 50
    apiKeys: ["sk-new-key"]
```
*Note: Config reload currently requires restart.*

### 2. Rotaiting Keys
Update the `apiKeys` list in `perpetuo.config.yaml` and restart.

### 3. Monitoring
- **Admin Dashboard**: Visit `http://localhost:3000/admin` to see Provider Health (Circuit Breakers) and System Status.
- **Metrics**: Prometheus metrics available at `http://localhost:3000/metrics`.

### 4. Troubleshooting
- **Circuit Breaker Open**: If a provider fails repeatedly, it will be blocked. Check `/admin` to see status. It will auto-reset after TTL (default 30s) or you can delete the key `perpetuo:cb:{provider}` in Redis.
- **Quota Exceeded**: Users get 429 (Rate Limit) or 403 (Budget). Increase limits in YAML or wait for window reset.

## API Usage Example

**Chat Completion**:
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer sk-perpetuo-pro-1" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Idempotency**:
Add header `x-idempotency-key: unique-req-id` to cache the response.

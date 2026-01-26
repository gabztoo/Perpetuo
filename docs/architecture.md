# Arquitetura do Perpetuo AI Gateway

O Perpetuo segue uma arquitetura moderna de separação entre **Data Plane** (Execução) e **Control Plane** (Gestão), visando alta performance e escalabilidade.

## Diagrama Geral

```mermaid
graph TD
    subgraph "Clientes"
        App[App do Cliente]
        Dev[Desenvolvedor]
    end

    subgraph "Perpetuo Data Plane (Gateway)"
        GW[Gateway Service]
        Redis[Redis Cache & Rate Limit]
    end

    subgraph "Perpetuo Control Plane (Gestão)"
        CP[Control Plane API]
        DB[(Postgres DB)]
        Console[Console Web (Next.js)]
        KMS[Key Management (AES)]
    end

    subgraph "Providers AI"
        OpenAI
        Anthropic
        MockProvider
    end

    App -->|/v1/chat/completions| GW
    Dev -->|Configurações| Console
    Console -->|REST API| CP
    CP -->|Persiste| DB
    GW -->|Lê Config/Cache| Redis
    GW -->|Escreve Logs| DB
    GW -->|Chama| OpenAI
    GW -->|Chama| Anthropic
    CP -->|Publica Config| Redis
```

## Componentes

### 1. Data Plane (O Motor)
É o componente crítico que processa as requisições de IA.
-   **Local**: `apps/perpetuo-gateway`
-   **Tecnologia**: Fastify, Node.js.
-   **Responsabilidades**:
    -   Roteamento inteligente (Providers, Fallbacks).
    -   Resiliência (Circuit Breaker, Retries, Timeout).
    -   Enforcement de Quotas (Rate Limit, Budget) via **Redis**.
    -   Emissão de Logs de Auditoria (Events) para Postgres (via `events` package).
    -   **Observação**: Ele é "stateless" em relação à configuração. Ele recebe a configuração "publicada" pelo Control Plane.

### 2. Control Plane (O Cérebro)
É a API de gestão onde as regras são definidas.
-   **Local**: `apps/perpetuo-control-plane`
-   **Tecnologia**: Fastify, Prisma, Zod.
-   **Responsabilidades**:
    -   Gestão de Tenants, Usuários e Permissões (RBAC).
    -   Criptografia de chaves (BYOK) usando AES-256 (KMS simulado).
    -   CRUD de Projetos, Rotas e Políticas.
    -   **Config Publish**: Compila as regras do banco de dados em um JSON otimizado para o Gateway consumir.

### 3. Console Web (A Interface)
Interface visual para o cliente gerenciar o gateway.
-   **Local**: `apps/perpetuo-console-web`
-   **Tecnologia**: Next.js 14 (App Router), Tailwind, shadcn/ui.
-   **Responsabilidades**:
    -   Onboarding e Auth.
    -   Dashboards de métricas (consumindo dados do Control Plane).
    -   Editor visual de orquestração (Drag & Drop de providers).
    -   Visualizador de Logs (Traces).

### 4. Shared & Infra
-   **`packages/shared`**: Contém Zod Schemas compartilhados. Garante que o Frontend valida os formulários com as mesmas regras que o Backend e o Gateway.
-   **`packages/db`**: Cliente Prisma e migrações do banco de dados.
-   **`packages/cache`**: Lógica encapsulada de Redis (Rate Limiting, Circuit Breaker).
-   **`packages/events`**: Sistema de ingestão de logs (interfaces para File/Postgres).

## Fluxo de Dados

1.  **Configuração**: O usuário define uma regra no **Console**. O **Control Plane** salva no Postgres e "publica" a versão ativa (pode ser no Redis ou via API interna).
2.  **Requisição**: O **App do Cliente** chama o **Gateway** com uma API Key.
3.  **Processamento**:
    -   Gateway valida Auth e Quotas no Redis.
    -   Gateway consulta a config ativa (em memória/cache).
    -   Gateway executa a cadeia de modelos (ex: tenta OpenAI -> falha -> tenta Anthropic).
4.  **Auditoria**: Gateway emite um evento assíncrono para o Postgres registrando latência, custo e tokens.

## Segurança
-   **BYOK (Bring Your Own Key)**: Chaves dos providers (OpenAI Key) são armazenadas cifradas no banco. O Gateway as descriptografa apenas (ou as recebe decifradas via cache seguro) no momento do uso.
-   **API Tokens**: Hash SHA-256 armazenado no banco, token real mostrado apenas uma vez ao usuário.

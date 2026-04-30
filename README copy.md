# Softconnect Manager

Dashboard administrativo do **SoftConnect 2.0 API Hub** da Softcom.

## Visão Geral

O Softconnect Manager é um painel Next.js 14 que consome exclusivamente as rotas Admin da SoftConnect API (`/api/v1/admin/*`). Toda comunicação com a API passa por um BFF interno (Next.js Route Handlers) que decifra o token AES-256 e faz a chamada real com o JWT.

## Stack

- **Framework:** Next.js 14 App Router
- **Linguagem:** TypeScript strict
- **Estilo:** Tailwind CSS + shadcn/ui (tema dark fixo, paleta Softcom)
- **Estado:** Zustand (auth + UI) + TanStack Query (dados)
- **Formulários:** react-hook-form + Zod
- **Segurança:** crypto-js AES-256 (token nunca chega raw ao browser)

## Setup Local

### 1. Pré-requisitos

- Node.js 20+
- npm 10+
- SoftConnect API rodando (local ou `dev-api.hub.softconnect.net.br`)

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Editar `.env.local`:

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `SOFTCONNECT_API_URL` | URL base da API incluindo `/api/v1` | ✅ |
| `TOKEN_ENCRYPTION_KEY` | Chave AES-256 — gerar com `openssl rand -hex 32` | ✅ |
| `NEXT_PUBLIC_APP_NAME` | Nome exibido no browser | ✅ |
| `NEXT_PUBLIC_SOFTCOM_URL` | URL do site Softcom | ✅ |

### 4. Iniciar em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

### 5. Verificar tipos

```bash
npm run type-check
```

### 6. Build de produção

```bash
npm run build
npm start
```

## Deploy

### Docker

```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_NAME="Softconnect Manager" \
  --build-arg NEXT_PUBLIC_SOFTCOM_URL="https://softcominnovation.com.br" \
  -t softconnect-manager .
```

### CI/CD (GitHub Actions + Portainer)

| Branch | Imagem | URL |
|--------|--------|-----|
| `main` | `ghcr.io/softcominnovation/softconnect-manager:latest` | `manager.hub.softconnect.net.br` |
| `develop` | `ghcr.io/softcominnovation/softconnect-manager:dev` | `dev-manager.hub.softconnect.net.br` |

#### GitHub Secrets necessários

| Secret | Ambiente | Descrição |
|--------|----------|-----------|
| `PORTAINER_WEBHOOK_PROD` | prod | Webhook da stack `softconnect-manager-prod` no Portainer |
| `PORTAINER_WEBHOOK_DEV` | dev | Webhook da stack `softconnect-manager-dev` no Portainer |

> As variáveis `SOFTCONNECT_API_URL` e `TOKEN_ENCRYPTION_KEY` são configuradas diretamente no Portainer (stack environment) — **nunca** como GitHub Secrets.

## Estrutura do Projeto

```
app/                    # Next.js App Router
  api/                  # BFF Route Handlers (proxy para SoftConnect API)
    _utils/proxy.ts     # ← BFF helper central (encrypt/decrypt/proxy)
    auth/login/         # POST /api/auth/login
    me/                 # GET /api/me
    vps/                # CRUD /api/vps
    products/           # CRUD /api/products
    instances/          # CRUD /api/instances
    health/             # GET /api/health, /api/health/hub/metrics
    logs/               # GET /api/logs
    users/              # CRUD /api/users
  (pages)/              # Páginas por módulo
lib/
  api.ts                # Funções de fetch para /api/* (usadas pelos hooks)
  types.ts              # Tipos de domínio
  utils.ts              # cn(), formatDate(), etc.
hooks/                  # TanStack Query hooks por domínio
store/
  auth.store.ts         # Zustand: autenticação
  ui.store.ts           # Zustand: estado da UI
components/             # Componentes React por domínio
docker/                 # docker-compose.yaml (prod) e dev
```

## Documentação Interna

| Documento | Conteúdo |
|-----------|----------|
| `docs/spec-tecnica.md` | Arquitetura, stack, telas, endpoints, variáveis de ambiente |
| `docs/spec-request-pattern.md` | Padrão BFF obrigatório para todas as chamadas |
| `docs/plano-implementacao.md` | Plano incremental com gates de validação |
| `docs/SESSION-HEADER.md` | Header de contexto para agentes de IA |

## Segurança

- `SOFTCONNECT_API_URL` e `TOKEN_ENCRYPTION_KEY` são **server-only** — nunca usar prefixo `NEXT_PUBLIC_`
- O JWT real da SoftConnect API nunca toca o browser — apenas o token AES-256 cifrado circula no cliente
- Em caso de `401`, o Zustand auth store executa logout automático

---

© 2024–2026 Softcom Tecnologia

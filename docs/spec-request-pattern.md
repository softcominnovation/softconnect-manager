# Softconnect Manager — Padrão de Requests (BFF Pattern)

> Este documento descreve **o único padrão aceito** para realizar chamadas de dados no Softconnect Manager.
> Todo novo endpoint ou hook deve seguir este fluxo sem exceções.

---

## 1. Visão Geral do Fluxo

```
Browser (React)
    │
    │  fetch('/api/vps', { headers: { Authorization: 'Bearer <TOKEN_CIFRADO>' } })
    ▼
Next.js API Route (Server-side — app/api/*/route.ts)
    │
    │  1. Decifra TOKEN_CIFRADO → JWT_REAL
    │  2. Chama SoftConnect API com JWT_REAL
    │  3. Retorna dados ao browser (sem expor JWT_REAL)
    ▼
SoftConnect API (externa)
    │
    │  Valida JWT → processa → retorna dados
    ▼
Next.js API Route
    │
    │  Passa resposta ao browser
    ▼
Browser (TanStack Query cache)
```

**Regra absoluta:** O browser **nunca** conhece nem envia o JWT real. Ele armazena e trafega apenas o token cifrado. O JWT real existe somente na memória da Next.js API Route durante o ciclo de request.

---

## 2. Estrutura dos Arquivos

```
app/api/
├── _utils/
│   └── proxy.ts            ← BFF helper central — toda a lógica de proxy aqui
├── auth/
│   └── login/
│       └── route.ts        ← POST /api/auth/login (não usa proxyRequest, lógica especial)
├── me/
│   └── route.ts            ← GET /api/me
├── vps/
│   ├── route.ts            ← GET + POST /api/vps
│   └── [id]/
│       └── route.ts        ← PUT + DELETE /api/vps/[id]
└── ...
```

---

## 3. O arquivo `proxy.ts` — BFF Helper

Este é o único lugar onde existem referências a `SOFTCONNECT_API_URL` e `TOKEN_ENCRYPTION_KEY`.

```typescript
// app/api/_utils/proxy.ts
import { NextRequest, NextResponse } from 'next/server';
import { AES, enc } from 'crypto-js';

const API_BASE_URL = process.env.SOFTCONNECT_API_URL;      // server-only
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;   // server-only

// ── Criptografia ──────────────────────────────────────────────────────────────

export function encryptToken(token: string): string {
  if (!ENCRYPTION_KEY) throw new Error('TOKEN_ENCRYPTION_KEY not configured');
  return AES.encrypt(token, ENCRYPTION_KEY).toString();
}

export function decryptToken(encryptedToken: string): string {
  if (!ENCRYPTION_KEY) throw new Error('TOKEN_ENCRYPTION_KEY not configured');
  const bytes = AES.decrypt(encryptedToken, ENCRYPTION_KEY);
  const text = bytes.toString(enc.Utf8);
  if (!text) throw new Error('Invalid encrypted token');
  return text;
}

// ── Query String ──────────────────────────────────────────────────────────────

export function buildQueryString(request: NextRequest): string {
  return new URL(request.url).searchParams.toString();
}

// ── Proxy principal ───────────────────────────────────────────────────────────

export async function proxyRequest(
  request: NextRequest,
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    requireAuth?: boolean;
  } = {}
): Promise<NextResponse> {
  const method = options.method ?? request.method;

  // Lê o body da request original se não foi passado explicitamente
  let body = options.body;
  if (!body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    try { body = await request.json(); } catch { /* sem body */ }
  }

  const requireAuth = options.requireAuth ?? true;

  if (!API_BASE_URL) {
    return NextResponse.json({ error: 'SOFTCONNECT_API_URL not configured' }, { status: 500 });
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (requireAuth) {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader) {
        return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
      }

      const tokenPart = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

      try {
        const realToken = decryptToken(tokenPart);
        headers['Authorization'] = `Bearer ${realToken}`;
      } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    const qs = buildQueryString(request);
    const url = `${API_BASE_URL}${endpoint}${qs ? `?${qs}` : ''}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const resp = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (resp.status === 204) {
      return new Response(null, { status: 204 }) as NextResponse;
    }

    let data: unknown = null;
    try {
      const text = await resp.text();
      if (text) {
        try { data = JSON.parse(text); } catch { data = text; }
      }
    } catch { /* resposta vazia */ }

    return NextResponse.json(data, { status: resp.status });
  } catch (err) {
    const message = err instanceof Error && err.name === 'AbortError'
      ? 'Request timeout'
      : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

---

## 4. Implementando uma Next.js API Route

### Exemplo: VPS

```typescript
// app/api/vps/route.ts
import { NextRequest } from 'next/server';
import { proxyRequest } from '../_utils/proxy';

export async function GET(request: NextRequest) {
  return proxyRequest(request, '/admin/vps', { requireAuth: true });
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, '/admin/vps', { method: 'POST', requireAuth: true });
}
```

```typescript
// app/api/vps/[id]/route.ts
import { NextRequest } from 'next/server';
import { proxyRequest } from '../../_utils/proxy';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyRequest(request, `/admin/vps/${params.id}`, { method: 'PUT' });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyRequest(request, `/admin/vps/${params.id}`, { method: 'DELETE' });
}
```

### Exemplo: Login (caso especial — sem `proxyRequest`)

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { encryptToken } from '../../_utils/proxy';

const API_BASE_URL = process.env.SOFTCONNECT_API_URL;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'email e password são obrigatórios' }, { status: 400 });
    }

    if (!API_BASE_URL) {
      return NextResponse.json({ error: 'SOFTCONNECT_API_URL not configured' }, { status: 500 });
    }

    const resp = await fetch(`${API_BASE_URL}/admin/auth/dashboard/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return NextResponse.json(data, { status: resp.status });
    }

    // Cifra o token antes de enviar ao browser
    const encryptedToken = encryptToken(data.accessToken);

    return NextResponse.json({
      token: encryptedToken,
      user: data.user,           // { id, name, email, role }
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

---

## 5. Camada de API no Frontend (`lib/api.ts`)

Funções que encapsulam os `fetch('/api/...')` com o token cifrado no header. Estas funções são usadas pelos hooks do TanStack Query.

```typescript
// lib/api.ts

const withAuth = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, { ...options, cache: 'no-store' });

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message ?? data?.error ?? 'Erro na requisição');
  }

  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: AdminUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' },
    }),

  me: (token: string) =>
    request<AdminUser>('/api/me', { headers: withAuth(token) }),

  // VPS
  getVpsList: (token: string) =>
    request<VpsServer[]>('/api/vps', { headers: withAuth(token) }),

  createVps: (token: string, dto: CreateVpsDto) =>
    request<VpsServer>('/api/vps', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(dto),
    }),

  updateVps: (token: string, id: string, dto: UpdateVpsDto) =>
    request<VpsServer>(`/api/vps/${id}`, {
      method: 'PUT',
      headers: withAuth(token),
      body: JSON.stringify(dto),
    }),

  deactivateVps: (token: string, id: string) =>
    request<void>(`/api/vps/${id}`, {
      method: 'DELETE',
      headers: withAuth(token),
    }),

  // ... mesmo padrão para products, instances, health, logs, users
};
```

---

## 6. Hooks TanStack Query (`hooks/`)

```typescript
// hooks/use-vps.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export function useVpsList() {
  const token = useAuthStore((s) => s.token)!;
  return useQuery({
    queryKey: ['vps'],
    queryFn: () => api.getVpsList(token),
    enabled: !!token,
  });
}

export function useCreateVps() {
  const token = useAuthStore((s) => s.token)!;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateVpsDto) => api.createVps(token, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vps'] });
    },
  });
}

export function useDeactivateVps() {
  const token = useAuthStore((s) => s.token)!;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deactivateVps(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vps'] });
    },
  });
}
```

---

## 7. Tratamento de Erros

| Código | Origem | Comportamento no frontend |
|--------|--------|--------------------------|
| 401 | API ou proxy | `logout()` automático via Zustand + redirect `/login` |
| 422 | API (validação FK) | Toast de erro com `error.message` da resposta |
| 409 | API (conflito) | Toast de erro com mensagem de duplicidade |
| 400 | API (validação) | Exibir erros de campo no formulário (react-hook-form) |
| 500 | Proxy ou API | Toast genérico "Erro interno — tente novamente" |
| Timeout | Proxy (15s) | Toast "Tempo limite excedido" |

O tratamento global de 401 deve ser feito no `api.ts` (função `request`): se o status for 401, chama `useAuthStore.getState().logout()` antes de lançar o erro.

---

## 8. Regras para Adicionar Novos Endpoints

Ao precisar adicionar uma nova chamada, siga **sempre** esta ordem:

1. **Identificar o endpoint da SoftConnect API** — verificar em `docs/softconnect-spec-tecnica.md` da API
2. **Criar/atualizar a Next.js API Route** em `app/api/*/route.ts` usando `proxyRequest`
3. **Adicionar a função em `lib/api.ts`** seguindo o padrão `api.nomeVerboRecurso(token, params)`
4. **Criar o hook em `hooks/use-[dominio].ts`** com `useQuery` ou `useMutation`
5. **Usar o hook no componente** — nunca chamar `api.*` diretamente em componentes

**Nunca:**
- Chamar `fetch` diretamente em um componente React
- Usar a URL da SoftConnect API em código client-side
- Armazenar o JWT real no browser (localStorage, state, etc.)
- Criar uma Next Route que não use `proxyRequest` (exceto login e casos justificados)

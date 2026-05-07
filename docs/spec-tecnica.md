# Softconnect Manager — Especificação Técnica

> **Softcom · Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui**
> Dashboard administrativo do SoftConnect 2.0 API Hub

---

## 1. Visão Geral

O **Softconnect Manager** é o painel de administração web do SoftConnect 2.0. Ele consome exclusivamente as rotas do **Admin Plane** da SoftConnect API (`/api/v1/admin/*`), expondo uma interface visual para gerenciar VPS, produtos, instâncias, usuários admin, monitoramento de saúde e logs.

### Princípios inegociáveis

- Nenhuma chave de API ou token JWT real do SoftConnect chegará ao navegador — tudo passa pelo BFF interno (Next.js API Routes)
- O token recebido da API é cifrado com AES-256 antes de ser enviado ao frontend; o frontend o armazena e devolve cifrado; apenas a Next Route o decifra
- A única rota pública é `/login` — todas as demais requerem autenticação
- Validação de formulários sempre com **Zod**
- Estado global de autenticação e dados com **Zustand**
- Requests do frontend sempre para `/api/*` (Next Routes) — nunca diretamente para a SoftConnect API
- A ausência de VPS cadastradas deve bloquear o cadastro de Produtos; a ausência de Produtos deve bloquear o cadastro de Instâncias

---

## 2. Stack Técnica

| Camada        | Tecnologia                             | Observação                                      |
| ------------- | -------------------------------------- | ----------------------------------------------- |
| Framework     | Next.js 14 (App Router)                | SSR mínimo — majoritariamente Client Components |
| Linguagem     | TypeScript strict                      |                                                 |
| Estilo        | Tailwind CSS + shadcn/ui               | Paleta customizada Softcom                      |
| Componentes   | Radix UI (via shadcn)                  |                                                 |
| Formulários   | react-hook-form + Zod                  |                                                 |
| Estado global | Zustand                                | auth store + dados de contexto                  |
| Requests      | TanStack Query (react-query) v5        | Hooks de dados, cache, invalidation             |
| Notificações  | sonner                                 | Toast system                                    |
| Ícones        | lucide-react                           |                                                 |
| HTTP interno  | fetch nativo (Next Route Handlers)     | BFF pattern — proxy para SoftConnect API        |
| Criptografia  | crypto-js (AES-256)                    | Cifrar token antes de enviar ao browser         |
| Containers    | Docker multi-stage + standalone output |                                                 |
| CI/CD         | GitHub Actions + GHCR + Portainer      | Deploy idêntico ao da API                       |

---

## 3. Estrutura de Pastas

```
softconnect-manager/
├── .github/
│   ├── copilot-instructions.md
│   ├── workflows/
│   │   ├── deploy-prod.yml
│   │   └── deploy-dev.yml
│   └── prompts/
│       └── code-guidelines.prompt.md
├── public/
│   ├── favicon.png
│   ├── favicon.svg
│   └── images/
│       ├── logo.png               # Logo Softcom
│       ├── home-ilustration.svg   # Ilustração da tela de login
│
├── docs/
│   ├── spec-tecnica.md            # Este arquivo
│   ├── spec-request-pattern.md   # Padrão de requests BFF
│   ├── plano-implementacao.md    # Plano incremental
│   └── SESSION-HEADER.md         # Header de sessão para agentes IA
│
├── app/
│   ├── globals.css
│   ├── layout.tsx                 # Root layout: providers, sidebar, mobile-nav
│   ├── page.tsx                   # Dashboard (redirect para /dashboard)
│   ├── login/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx               # Visão geral: cards de resumo
│   ├── vps/
│   │   ├── page.tsx               # Listagem de VPS
│   │   └── [id]/
│   │       └── page.tsx           # Detalhes da VPS + instâncias vinculadas
│   ├── products/
│   │   ├── page.tsx               # Listagem de Produtos
│   │   └── [id]/
│   │       └── page.tsx           # Detalhes do Produto
│   ├── instances/
│   │   ├── page.tsx               # Listagem de Instâncias (todas)
│   │   └── [instanceId]/
│   │       └── page.tsx           # Detalhes da Instância
│   ├── health/
│   │   └── page.tsx               # Monitoramento de saúde das VPS
│   ├── logs/
│   │   └── page.tsx               # Logs de auditoria com filtros
│   ├── users/
│   │   └── page.tsx               # Gerenciamento de usuários admin
│   └── api/
│       ├── _utils/
│       │   └── proxy.ts           # BFF proxy helper + encrypt/decrypt
│       ├── auth/
│       │   └── login/
│       │       └── route.ts       # POST /api/auth/login
│       ├── me/
│       │   └── route.ts           # GET /api/me
│       ├── vps/
│       │   ├── route.ts           # GET /api/vps, POST /api/vps
│       │   └── [id]/
│       │       └── route.ts       # PUT /api/vps/[id], DELETE /api/vps/[id]
│       ├── products/
│       │   ├── route.ts           # GET /api/products, POST /api/products
│       │   └── [id]/
│       │       └── route.ts       # PUT /api/products/[id], DELETE /api/products/[id]
│       ├── instances/
│       │   ├── route.ts           # GET /api/instances
│       │   └── [instanceId]/
│       │       └── route.ts       # GET, DELETE /api/instances/[instanceId]
│       ├── health/
│       │   ├── route.ts           # GET /api/health
│       │   └── hub/
│       │       └── metrics/
│       │           └── route.ts   # GET /api/health/hub/metrics
│       ├── logs/
│       │   └── route.ts           # GET /api/logs
│       └── users/
│           ├── route.ts           # GET /api/users, POST /api/users
│           └── [id]/
│               └── route.ts       # PUT /api/users/[id], DELETE /api/users/[id]
│
├── components/
│   ├── auth/
│   │   └── protected-route.tsx
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── sidebar-item.tsx
│   │   ├── mobile-nav.tsx
│   │   └── dashboard-header.tsx
│   ├── ui/                        # shadcn/ui components
│   └── [módulo]/                  # Componentes por domínio (vps/, products/, etc.)
│
├── lib/
│   ├── utils.ts                   # cn(), formatters
│   ├── api.ts                     # Funções de chamada para /api/* (usadas pelos hooks)
│   └── types.ts                   # Tipos de domínio compartilhados
│
├── hooks/
│   ├── use-vps.ts                 # useQuery/useMutation para VPS
│   ├── use-products.ts
│   ├── use-instances.ts
│   ├── use-health.ts
│   ├── use-logs.ts
│   └── use-users.ts
│
├── store/
│   ├── auth.store.ts              # Zustand: user, token (cifrado), login, logout
│   └── ui.store.ts                # Zustand: sidebar collapsed state, etc.
│
├── .env.local                     # Variáveis locais (não commitadas)
├── .env.example                   # Template de variáveis
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── Dockerfile
└── docker/
    ├── docker-compose.yaml        # Produção
    └── docker-compose.dev.yaml    # Desenvolvimento/Homologação
```

---

## 4. Paleta de Cores

O tema é **dark-first**, baseado no projeto de referência (VPS Orbit), com a identidade visual da Softcom incorporada nas cores primária e de destaque.

### Cores Softcom

| Nome           | Hex       | Uso                                            |
| -------------- | --------- | ---------------------------------------------- |
| Softcom Yellow | `#ffd900` | Cor primária — botões, links ativos, destaques |
| Softcom Amber  | `#f2a900` | Hover, gradientes, badges de status            |

### CSS Custom Properties (globals.css)

```css
.dark {
  /* Softcom brand */
  --primary: 52 100% 50%; /* #ffd900 */
  --primary-foreground: 0 0% 5%; /* texto sobre botão primário: quase preto */
  --accent: 40 100% 47%; /* #f2a900 */
  --accent-foreground: 0 0% 5%;

  /* Base (idêntico ao projeto de referência) */
  --background: 0 0% 3.9%;
  --background-secundary: 0 0% 15%;
  --foreground: 0 0% 98%;
  --card: 0 0% 6%;
  --card-foreground: 0 0% 98%;
  --border: 0 0% 14.9%;
  --input: 0 0% 14.9%;
  --ring: 52 100% 50%; /* ring com cor Softcom */
  --muted: 0 0% 14.9%;
  --muted-foreground: 0 0% 63.9%;
  --secondary: 0 0% 14.9%;
  --secondary-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --radius: 0.5rem;
}
```

> O app roda sempre em modo dark. Não há toggle de tema neste projeto.

---

## 5. Autenticação

### Fluxo de Login

```
[Browser] POST /api/auth/login { email, password }
    └─► [Next Route: app/api/auth/login/route.ts]
            ├─ Chama SoftConnect API: POST /api/v1/admin/auth/dashboard/login
            │    body: { email, password }
            ├─ Recebe: { accessToken, user: { id, name, email, role } }
            ├─ Cifra o accessToken com AES-256 (SECRET_KEY env, server-only)
            └─ Retorna ao browser: { token: "<cifrado>", user: { id, name, email, role } }

[Browser] Salva token cifrado + user no Zustand (+ localStorage como fallback)
[Browser] Envia token cifrado como Bearer em todas as chamadas para /api/*
[Next Route] Decifra o token → usa o token real na chamada para SoftConnect API
```

### SoftConnect API — Endpoint de Login

```
POST /api/v1/admin/auth/dashboard/login
Body: { email: string, password: string }
Response: { accessToken: string, user: { id, name, email, role } }
```

O token JWT retornado pela API é um JWT padrão com validade configurada (`ADMIN_JWT_EXPIRY`). O Manager não precisa gerenciar refresh — ao expirar, a Next Route recebe `401` da API, repassa `401` ao frontend, e o Zustand store faz logout automático.

### Identificação do Usuário Autenticado

```
GET /api/v1/admin/auth/dashboard/me
Headers: Authorization: Bearer <jwt_real>
Response: { id, name, email, role }
```

Usado para:

1. Validar o token na inicialização do app (carregar do localStorage)
2. Exibir o nome/email do usuário logado na sidebar

### Proteção de Rotas (Client-side)

O componente `ProtectedRoute` (em `components/auth/protected-route.tsx`) verifica o estado do Zustand auth store:

- Se não autenticado → `router.replace('/login')`
- Se autenticado e na rota `/login` → `router.replace('/dashboard')` -> por hora, para a /health

O `layout.tsx` raiz envolve o conteúdo com `ProtectedRoute`, exceto a rota de `/login` que tem seu próprio layout sem sidebar.

---

## 6. Padrões de UI — Modais e Ações Destrutivas

### 6.1 Comportamento de Modais (Dialog)

Todo modal (`Dialog` do shadcn/ui) segue este comportamento responsivo:

**Mobile (< `sm` / < 640px)**

- Ocupa **100% da largura e altura** da tela (`fixed inset-0`)
- **Overlay (fundo escuro) oculto** — o modal já cobre toda a tela
- **Botão X oculto** — fechamento via header fixo no topo do modal
- Header fixo no topo com:
  - Botão **`← Voltar`** (ícone `ArrowLeft` + label "Voltar") à esquerda
  - Fechar o modal ao clicar

**Desktop (`sm+` / ≥ 640px)**

- Modal centralizado com `max-w` configurado por tela (ex: `sm:max-w-xl`)
- Overlay escuro visível (`bg-black/80`)
- Botão **X** no canto superior direito
- Botão Voltar oculto

**Implementação:** `components/ui/dialog.tsx` — `DialogContent` já implementa esse comportamento por padrão. Basta usar `<DialogContent className="sm:max-w-xl">`.

### 6.2 Layout de Inputs em Formulários de Modal

- **Mobile (`< sm`):** 1 input por linha — usar `grid-cols-1 sm:grid-cols-2` em pares
- **Desktop (`≥ sm`):** 2 inputs lado a lado quando forem semanticamente pares (ex: Label + Subdomínio, Tipo + URL do mesmo serviço)
- Inputs que ocupam linha inteira em ambas as resoluções: URLs longas, API Keys, campos únicos sem par semântico
- Todos os inputs de chave/token (API Keys, passwords) usam `type="password"`
- Mensagens de erro ficam imediatamente abaixo do input correspondente (`text-xs text-destructive`)

### 6.3 Confirmação de Ações Destrutivas

**Regra:** Toda ação que remove, desativa permanentemente ou executa operação irreversível **deve** exibir um `AlertDialog` de confirmação antes de executar.

Exemplos de ações que **exigem confirmação**:

- Desativar VPS
- Deletar produto
- Deletar instância
- Desativar/deletar usuário admin
- Qualquer ação com `DELETE` ou `isActive: false`

**Padrão do AlertDialog:**

```tsx
<AlertDialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Desativar [entidade]?</AlertDialogTitle>
      <AlertDialogDescription>
        A [entidade] <strong>{target?.label}</strong> será desativada.
        [Consequências relevantes para o usuário.]
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onClick={async () => {
          await mutate(target.id);
          setTarget(null);
        }}
      >
        [Ação]
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### 6.4 Filtros e Busca nas Telas de Listagem

**Regra:** Toda tela de listagem com tabela **deve** ter uma barra de filtros acima da tabela.

#### Princípios

- **Input de texto:** para campos de valor livre onde o usuário não conhece os valores exatos de antemão (nomes, slugs, IPs, emails, paths)
- **Select:** para campos com valores discretos/enumerados (status ativo/inativo, adapter type, role, método HTTP, status de instância) ou para relacionamentos (VPS, Produto)
- **Padrão de select de status:** sempre com opções **Todos** (default ao carregar) / **Ativo** / **Inativo** (ou equivalentes do domínio)
- **Filtragem:** sempre client-side via `useMemo` — sem chamadas extras à API
- **Estado inicial:** todos os selects iniciam com `'all'` (exibe tudo)
- **Estado vazio de filtro:** exibir mensagem _"Nenhum [item] encontrado para os filtros aplicados."_

#### Regras de decisão: Input vs Select

| Campo | Tipo de filtro | Justificativa |
|-------|---------------|---------------|
| Textos livres (nome, slug, label, email, path, IP) | `<Input>` com busca por substring | Valor não é enumerável |
| Status ativo/inativo | `<Select>` | Valor binário fixo: Todos / Ativo / Inativo |
| Adapter type | `<Select>` | Valores discretos derivados dos dados carregados |
| VPS (relacionamento) | `<Select>` | Lista fixa já carregada pelo TanStack Query |
| Produto (relacionamento) | `<Select>` | Lista fixa já carregada pelo TanStack Query |
| Role de usuário | `<Select>` | Enum fixo: Todos / admin / superadmin |
| Status de instância | `<Select>` | Enum fixo: Todos / open / close / connecting |
| Saúde de VPS | `<Select>` | Enum fixo: Todos / Saudável / Com erro |
| Método HTTP (logs) | `<Select>` | Enum fixo: Todos / GET / POST / PUT / DELETE |
| Classe de status HTTP (logs) | `<Select>` | Enum fixo: Todos / 2xx / 4xx / 5xx |
| ID de instância/produto (logs) | `<Input>` | UUID não enumerável |

#### Filtros por módulo

| Módulo | Input de texto | Selects |
|--------|---------------|---------|
| **VPS** `/vps` | label, subdomínio, IP | Adapter type; Status (Todos/Ativo/Inativo) |
| **Produtos** `/products` | name, slug | VPS; Adapter type; Status (Todos/Ativo/Inativo) |
| **Instâncias** `/instances` | instanceId, profileName | Produto; Status (Todos/open/close/connecting) |
| **Health** `/health` | — | VPS; Saúde (Todos/Saudável/Com erro) |
| **Logs** `/logs` | path, instanceId, productId | Método HTTP; Classe de status HTTP |
| **Usuários** `/users` | name, email | Role (Todos/admin/superadmin); Status (Todos/Ativo/Inativo) |

#### Layout da barra de filtros

```tsx
<div className="flex flex-col sm:flex-row gap-3">
  {/* Input de busca — sempre à esquerda, flex-1 */}
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    <Input
      placeholder="Buscar por [campos]…"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="pl-9"
    />
  </div>
  {/* Selects — largura fixa, empilham em mobile */}
  <Select value={filterX} onValueChange={setFilterX}>
    <SelectTrigger className="w-full sm:w-44">
      <SelectValue placeholder="[Label]" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todos</SelectItem>
      {/* opções específicas */}
    </SelectContent>
  </Select>
</div>
```

#### Padrão de filtragem client-side

```tsx
const filtered = useMemo(() => {
  const q = search.toLowerCase().trim()
  return (data ?? []).filter((item) => {
    const matchSearch = !q || item.name.toLowerCase().includes(q)
    const matchSelect = filterX === 'all' || item.field === filterX
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' ? item.isActive : !item.isActive)
    return matchSearch && matchSelect && matchStatus
  })
}, [data, search, filterX, filterStatus])
```

---

## 7. Layout e Navegação

### Layout Raiz


```
<html dark>
  <body>
    <Providers>                    ← QueryClientProvider + ZustandProvider
      <AuthProvider>               ← Zustand auth store hydration
        <ProtectedRoute>
          <div flex>
            <Sidebar />            ← Oculta em mobile
            <main>
              <MobileNav />        ← Apenas em mobile (< 720px)
              {children}
            </main>
          </div>
        </ProtectedRoute>
      </AuthProvider>
    </Providers>
  </body>
</html>
```

A rota `/login` usa um layout separado **sem** sidebar e **sem** `ProtectedRoute`.

### Sidebar

Comportamento idêntico ao projeto de referência (VPS Orbit):

| Viewport  | Comportamento                                           |
| --------- | ------------------------------------------------------- |
| < 720px   | Oculta (usa MobileNav)                                  |
| 720–920px | Sempre contraída (ícones), expande sobreposta ao clicar |
| > 920px   | Expandida por padrão, colapsável com toggle             |

**Itens de navegação:**

```
── Dashboard
   ├─ Visão Geral         /dashboard         (LayoutDashboard)
   ├─ Saúde das VPS       /health            (HeartPulse)

── Infraestrutura
   ├─ VPS                 /vps               (Server)
   ├─ Produtos            /products          (Package)
   ├─ Instâncias          /instances         (MessageCircle)

── Administração
   ├─ Usuários Admin      /users             (Users)
   ├─ Logs                /logs              (ScrollText)

── [Rodapé]
   └─ Sair                                   (LogOut)
```

### Tela de Login — Layout Especial

Em telas grandes (≥ 1024px), a página de login exibe **dois containers lado a lado**:

```
┌─────────────────────────┬────────────────────────────┐
│  [Painel esquerdo]      │  [Painel direito]           │
│  Nome: Softconnect      │                            │
│  Manager                │   Formulário de login       │
│                         │   - E-mail                  │
│  [home-ilustration.svg] │   - Senha                   │
│                         │   - Botão Entrar            │
│  Softcom Tecnologia     │                            │
│  softcominnovation.com  │                            │
│                         │                            │
│  © 2024–{anoAtual}      │                            │
└─────────────────────────┴────────────────────────────┘
```

Em mobile (< 1024px), apenas o painel direito (formulário) é exibido. O painel esquerdo é `hidden lg:flex`.

O copyright usa script para ano dinâmico:

```tsx
© 2024–{new Date().getFullYear()} Softcom Tecnologia
```

---

## 7. Mapeamento de Telas e Rotas da API

### 7.1 Dashboard — `/dashboard`

**Tela:** Cards de resumo do sistema.

| Card                | Dado                             | API                                             |
| ------------------- | -------------------------------- | ----------------------------------------------- |
| VPS Ativas          | count de `isActive && isHealthy` | `GET /api/v1/admin/health`                      |
| Total de Produtos   | count                            | `GET /api/v1/admin/products`                    |
| Total de Instâncias | count                            | `GET /api/v1/instance/list` (via produto ativo) |
| Status do Hub       | hub metrics                      | `GET /api/v1/admin/health/hub/metrics`          |

### 7.2 VPS — `/vps`

**Tela:** Tabela de todas as VPS com status de saúde.

| Ação      | Método | API Endpoint            |
| --------- | ------ | ----------------------- |
| Listar    | GET    | `/api/v1/admin/vps`     |
| Criar     | POST   | `/api/v1/admin/vps`     |
| Editar    | PUT    | `/api/v1/admin/vps/:id` |
| Desativar | DELETE | `/api/v1/admin/vps/:id` |

**Restrição:** Se não houver nenhuma VPS cadastrada, a tela de Produtos exibe um banner de aviso com link para `/vps`.

**Tela de Detalhe — `/vps/[id]`:**

- Dados completos da VPS (sem exibir chaves)
- Status de saúde atual (última checagem)
- Métricas de sistema (se `monitorUrl` configurado)
- Lista das instâncias vinculadas → botão "Ver instâncias" → `/instances?vpsId=[id]`
- Botão "Nova Instância" que navega para o formulário de criação com `vpsId` pré-selecionado

### 7.3 Produtos — `/products`

**Tela:** Tabela de produtos com status ativo/inativo.

| Ação      | Método | API Endpoint                 |
| --------- | ------ | ---------------------------- |
| Listar    | GET    | `/api/v1/admin/products`     |
| Criar     | POST   | `/api/v1/admin/products`     |
| Editar    | PUT    | `/api/v1/admin/products/:id` |
| Desativar | DELETE | `/api/v1/admin/products/:id` |

**Restrição:** Botão "Novo Produto" desabilitado + tooltip "Cadastre uma VPS primeiro" se não houver VPS ativa.

**Tela de Detalhe — `/products/[id]`:**

- Dados do produto
- API Key gerada: exibida **uma única vez** no momento da criação (modal com copy) — nunca é exposta novamente
- Lista de instâncias do produto

### 7.4 Instâncias — `/instances`

**Tela:** Grid de ProductCards com instâncias agrupadas por produto. Filtro por busca (nome/slug) e por status (Todos/Ativo/Inativo). Acesso via JWT — sem necessidade de API Key do produto no browser.

| Ação                     | Método | API Endpoint (Admin)                                                  |
| ------------------------ | ------ | --------------------------------------------------------------------- |
| Listar                   | GET    | `/api/v1/admin/products/:productId/instances`                         |
| Detalhe                  | GET    | `/api/v1/admin/products/:productId/instances/:instanceId`             |
| Status                   | GET    | `/api/v1/admin/products/:productId/instances/:instanceId/status`      |
| Criar                    | POST   | `/api/v1/admin/products/:productId/instances` (`qrcode: true`)        |
| Deletar                  | DELETE | `/api/v1/admin/products/:productId/instances/:instanceId`             |
| Conectar / QR Code       | GET    | `/api/v1/admin/products/:productId/instances/:instanceId/connect`     |
| Reiniciar                | POST   | `/api/v1/admin/products/:productId/instances/:instanceId/restart`     |
| Desconectar              | POST   | `/api/v1/admin/products/:productId/instances/:instanceId/disconnect`  |
| Enviar Mensagem de Teste | POST   | `/api/v1/admin/products/:productId/instances/:instanceId/sendText`    |
| Testar Presença          | POST   | `/api/v1/admin/products/:productId/instances/:instanceId/sendPresence`|
| Rotacionar API Key       | POST   | `/api/v1/admin/products/:productId/rotate-key`                        |

> **Auth:** Todas as operações acima usam `Authorization: Bearer <jwt_admin>`. O admin nunca usa a `apiKey` do produto para operar no dashboard.

**Restrição:** Botão "Nova Instância" desabilitado + tooltip se não houver produto ativo.

**Tela de Detalhe — `/instances/[instanceId]?productId=<id>`:**

- **Informações da instância:** ID, nome, perfil, JID, status, criado em
- **Painel de Conexão** (sempre visível):
  - Se status ≠ `open`: botão "Conectar / Gerar QR Code" → chama `GET .../connect`
  - Se resposta tiver `base64`: renderiza `<img src="data:image/png;base64,..." />` + polling de status a cada 10s
  - Se `state === "open"`: exibe "Instância conectada"
  - Botão **Reiniciar** com AlertDialog de confirmação
  - Botão **Desconectar** (disabled se não `open`) com AlertDialog de aviso (ação irreversível)
- **Painel de Testes** (apenas se `status === 'open'`):
  - Testar Presença: erro → alerta "Instância corrompida"
  - Enviar Mensagem de Teste: erro → alerta "Instância corrompida"
- **Painel de API Key do Produto:**
  - Exibe chave mascarada se disponível no localStorage
  - Botão "Rotacionar API Key" com AlertDialog (avisa sobre invalidação) + Dialog com nova key + botão copiar + aviso de que não será exibida novamente
- **Deletar** instância com AlertDialog no header da página

### 7.5 Saúde — `/health`

**Tela:** Status em tempo real de cada VPS + métricas do hub.

| Dado               | API                                    |
| ------------------ | -------------------------------------- |
| Status de cada VPS | `GET /api/v1/admin/health`             |
| Métricas do hub    | `GET /api/v1/admin/health/hub/metrics` |

Auto-refresh a cada 30 segundos (via `refetchInterval` do TanStack Query).

### 7.6 Logs — `/logs`

**Tela:** Tabela de logs de auditoria com filtros.

| Filtro           | Parâmetro    |
| ---------------- | ------------ |
| Produto          | `productId`  |
| Instância        | `instanceId` |
| Código HTTP      | `statusCode` |
| Data início      | `from`       |
| Data fim         | `to`         |
| Página           | `page`       |
| Itens por página | `limit`      |

**API:** `GET /api/v1/admin/logs?page=1&limit=20&...`

### 7.7 Usuários Admin — `/users`

**Tela:** Tabela de usuários admin com papel (superadmin/admin).

| Ação         | Método | API Endpoint              |
| ------------ | ------ | ------------------------- |
| Listar       | GET    | `/api/v1/admin/users`     |
| Criar        | POST   | `/api/v1/admin/users`     |
| Editar papel | PUT    | `/api/v1/admin/users/:id` |
| Desativar    | DELETE | `/api/v1/admin/users/:id` |

---

## 8. Dependências de Cadastro (UX Guards)

As seguintes regras de UX devem ser implementadas para evitar erros de integridade:

```
VPS → Produto → Instância
```

| Tentativa                       | Condição de bloqueio      | Comportamento                                  |
| ------------------------------- | ------------------------- | ---------------------------------------------- |
| Criar Produto                   | Nenhuma VPS ativa         | Botão desabilitado + tooltip + banner de aviso |
| Criar Instância                 | Nenhum Produto ativo      | Botão desabilitado + tooltip + banner de aviso |
| Criar Instância via tela de VPS | Nenhum Produto cadastrado | Aviso inline com link para `/products`         |

A verificação é feita no frontend com base nos dados já carregados pelo TanStack Query — sem chamadas extras à API apenas para verificar pré-condições.

---

## 9. Variáveis de Ambiente

### Server-only (Next.js API Routes — nunca expostas ao browser)

```env
SOFTCONNECT_API_URL=https://api.hub.softconnect.net.br/api/v1
SOFTCONNECT_ADMIN_SECRET=<admin-secret-da-api>
TOKEN_ENCRYPTION_KEY=<32-bytes-hex-para-AES256>
```

### Build-time / Client (prefixo NEXT_PUBLIC — visíveis no browser)

```env
NEXT_PUBLIC_APP_NAME=Softconnect Manager
NEXT_PUBLIC_SOFTCOM_URL=https://www.softcomtecnologia.com.br
```

> `SOFTCONNECT_API_URL` e `TOKEN_ENCRYPTION_KEY` **jamais** devem ter prefixo `NEXT_PUBLIC_`.
> `SOFTCONNECT_ADMIN_SECRET` não é usado diretamente nas chamadas de usuário — o login usa email/senha; o Admin Secret é usado apenas se houver endpoints que exijam autenticação de nível de sistema (ex: bootstrap).

### `.env.example`

```env
# --- SoftConnect API ---
SOFTCONNECT_API_URL=http://localhost:3000/api/v1

# --- Criptografia do token (gere com: openssl rand -hex 32) ---
TOKEN_ENCRYPTION_KEY=<hex-32-bytes>

# --- Build info ---
NEXT_PUBLIC_APP_NAME=Softconnect Manager
NEXT_PUBLIC_SOFTCOM_URL=https://www.softcomtecnologia.com.br
```

---

## 10. Docker e Deploy

### next.config.js — Standalone Output

```js
module.exports = {
  output: "standalone",
};
```

### Dockerfile (multi-stage)

Segue o mesmo padrão do projeto de referência (VPS Orbit):

- Stage `deps`: instala dependências
- Stage `builder`: build do Next.js com variáveis `NEXT_PUBLIC_*` como build args
- Stage `runner`: imagem final com `standalone` output — mínima e sem node_modules completo

### docker-compose.yaml (Produção)

```yaml
services:
  softconnect-manager:
    image: ghcr.io/softcominnovation/softconnect-manager:latest
    networks:
      - network_public
    environment:
      - SOFTCONNECT_API_URL=${SOFTCONNECT_API_URL}
      - TOKEN_ENCRYPTION_KEY=${TOKEN_ENCRYPTION_KEY}
      - NEXT_PUBLIC_APP_NAME=Softconnect Manager
      - NEXT_PUBLIC_SOFTCOM_URL=https://www.softcomtecnologia.com.br
    deploy:
      mode: replicated
      replicas: 1
      labels:
        - traefik.enable=true
        - traefik.http.routers.sc-manager-prod.rule=Host(`manager.hub.softconnect.net.br`)
        - traefik.http.routers.sc-manager-prod.tls.certresolver=letsencrypt
        - traefik.http.services.sc-manager-prod.loadbalancer.server.port=3000
networks:
  network_public:
    external: true
```

### docker-compose.dev.yaml (Dev/Homologação)

```yaml
services:
  softconnect-manager-dev:
    image: ghcr.io/softcominnovation/softconnect-manager:dev
    networks:
      - network_public
    environment:
      - SOFTCONNECT_API_URL=${SOFTCONNECT_API_URL_DEV}
      - TOKEN_ENCRYPTION_KEY=${TOKEN_ENCRYPTION_KEY_DEV}
      - NEXT_PUBLIC_APP_NAME=Softconnect Manager (Dev)
      - NEXT_PUBLIC_SOFTCOM_URL=https://www.softcomtecnologia.com.br
    deploy:
      mode: replicated
      replicas: 1
      labels:
        - traefik.enable=true
        - traefik.http.routers.sc-manager-dev.rule=Host(`dev-manager.hub.softconnect.net.br`)
        - traefik.http.routers.sc-manager-dev.tls.certresolver=letsencrypt
        - traefik.http.services.sc-manager-dev.loadbalancer.server.port=3000
networks:
  network_public:
    external: true
```

---

## 11. GitHub Actions — CI/CD

### Estratégia de Branches

| Branch    | Ambiente        | Imagem Docker                            | URL                                  |
| --------- | --------------- | ---------------------------------------- | ------------------------------------ |
| `main`    | Produção        | `ghcr.io/.../softconnect-manager:latest` | `manager.hub.softconnect.net.br`     |
| `develop` | Dev/Homologação | `ghcr.io/.../softconnect-manager:dev`    | `dev-manager.hub.softconnect.net.br` |

### Workflow Produção (`.github/workflows/deploy-prod.yml`)

```yaml
on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/softcominnovation/softconnect-manager:latest
          build-args: |
            NEXT_PUBLIC_APP_NAME=Softconnect Manager
            NEXT_PUBLIC_SOFTCOM_URL=https://www.softcomtecnologia.com.br
      - name: Deploy via Portainer webhook
        run: curl -X POST "${{ secrets.PORTAINER_WEBHOOK_PROD }}"
```

### GitHub Secrets necessários

| Secret                   | Ambiente | Descrição                              |
| ------------------------ | -------- | -------------------------------------- |
| `PORTAINER_WEBHOOK_PROD` | prod     | Webhook Portainer da stack de produção |
| `PORTAINER_WEBHOOK_DEV`  | dev      | Webhook Portainer da stack de dev      |

As variáveis de runtime (`SOFTCONNECT_API_URL`, `TOKEN_ENCRYPTION_KEY`) são configuradas diretamente no Portainer (stack environment variables) — não no GitHub Secrets, para não expô-las como build args.

---

## 12. Zustand Stores

### `store/auth.store.ts`

```typescript
interface AuthStore {
  user: AdminUser | null;
  token: string | null; // token CIFRADO — o que o browser armazena
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadFromStorage: () => Promise<void>;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin";
}
```

- O `token` armazenado é sempre o **cifrado** — nunca o JWT real
- `login()` chama `/api/auth/login`, recebe `{ token, user }`, salva no store e no `localStorage`
- `loadFromStorage()` é chamado no layout raiz; se token presente, chama `GET /api/me` para validar e hidratar o user; se retornar 401, chama `logout()`

### `store/ui.store.ts`

```typescript
interface UIStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}
```

---

## 13. TanStack Query — Estrutura de Hooks

Cada domínio tem um arquivo de hooks em `hooks/`. Exemplo para VPS:

```typescript
// hooks/use-vps.ts
export function useVpsList() {
  return useQuery({ queryKey: ["vps"], queryFn: () => api.getVpsList(token) });
}

export function useCreateVps() {
  return useMutation({
    mutationFn: (dto) => api.createVps(token, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vps"] }),
  });
}
```

As funções em `lib/api.ts` são wrappers sobre `fetch('/api/...')` com o token cifrado no header.

---

## 14. Decisões Arquiteturais

| Decisão                                  | Motivo                                                                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Next.js App Router (não Pages Router)    | Alinhado com versões modernas e com o projeto de referência                                                          |
| Dark mode fixo                           | Padrão de identidade do produto — não há demanda por tema claro                                                      |
| Token cifrado no browser                 | Impede vazamento do JWT real mesmo se o localStorage for inspecionado via XSS                                        |
| Zustand em vez de Context API            | Menos boilerplate, sem re-renders globais, fácil de testar                                                           |
| TanStack Query em vez de useEffect/fetch | Cache automático, loading/error states, invalidation e refetch controlados                                           |
| Sem SSR nas páginas de dados             | Todas as páginas de dados são Client Components; SSR seria overhead sem benefício real (dashboard admin autenticado) |
| Validação com Zod no frontend            | Mensagens consistentes antes mesmo de chamar a API; reutilização dos schemas                                         |
| Sem react-query nos formulários          | formulários usam react-hook-form; react-query apenas para leitura/mutação de listas                                  |

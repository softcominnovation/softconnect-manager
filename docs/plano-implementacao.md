# Softconnect Manager — Plano de Implementação

> **Guia de execução incremental do projeto.**
> Cada fase possui tarefas de implementação e um **gate de validação do desenvolvedor** que deve ser deliberadamente confirmado antes de avançar.

---

## ⚠️ Regra de Progressão — Leia antes de tudo

**Para agentes de IA e desenvolvedores:**

> Nenhuma fase pode ser iniciada sem que a fase anterior tenha sido **explicitamente aprovada** pelo desenvolvedor responsável.
>
> A aprovação consiste em:
> 1. Todos os itens da fase marcados como `[x]`
> 2. O item **"✅ Validação do Desenvolvedor"** marcado como `[x]`
> 3. O desenvolvedor ter **deliberadamente solicitado** o avanço para a próxima fase
>
> Um agente de IA **nunca deve sugerir iniciar a próxima fase** sem que essas condições estejam satisfeitas.

---

## Estado Atual do Projeto

| Fase | Status |
|------|--------|
| **Passo 0** — Setup, CI/CD e Infraestrutura Base | ✅ **Implementado** (aguarda gate) |
| **Passo 1** — Autenticação e Layout Base | ✅ **Implementado** (aguarda gate) |
| **Passo 2** — Módulo VPS | ✅ **Implementado** (aguarda gate) |
| **Passo 3** — Módulo Produtos | ✅ **Implementado** (aguarda gate) |
| **Passo 4** — Módulo Instâncias | ✅ **Implementado** (aguarda gate) |
| **Passo 5** — Módulo Health | ✅ **Implementado** (aguarda gate) |
| **Passo 6** — Módulo Logs | ✅ **Implementado** (aguarda gate) |
| **Passo 7** — Módulo Usuários Admin | 🔒 Bloqueado |
| **Passo 8** — Dashboard Overview | 🔒 Bloqueado |
| **Passo 9** — Polimento, Guards de UX e Ajustes Finais | 🔒 Bloqueado |

---

## Passo 0 — Setup, CI/CD e Infraestrutura Base

**Objetivo:** Scaffoldar o projeto Next.js do zero com toda a stack configurada, Dockerfile, docker-compose e workflows do GitHub Actions.

### Tarefas

#### 0.1 — Scaffold Next.js
- [x] Criar projeto Next.js 14 com App Router, TypeScript strict, Tailwind CSS
- [x] Instalar dependências: shadcn/ui, lucide-react, zustand, @tanstack/react-query, react-hook-form, zod, crypto-js, sonner
- [x] Configurar `next.config.js` com `output: 'standalone'`
- [x] Configurar `tsconfig.json` com path alias `@/`
- [x] Configurar `tailwind.config.ts` com paleta Softcom (vars CSS customizadas)
- [x] Criar `app/globals.css` com CSS variables do tema dark Softcom

#### 0.2 — shadcn/ui
- [x] Inicializar shadcn/ui (`npx shadcn-ui@latest init`)
- [x] Instalar componentes base: button, input, card, dialog, table, badge, tooltip, separator, scroll-area, dropdown-menu, select, skeleton, form, label

#### 0.3 — Estrutura de pastas
- [x] Criar estrutura completa de pastas conforme `docs/spec-tecnica.md` seção 3
- [x] Criar arquivos placeholder (`page.tsx`, `layout.tsx`) nas rotas previstas
- [x] Criar `lib/utils.ts`, `lib/api.ts`, `lib/types.ts`
- [x] Criar `store/auth.store.ts`, `store/ui.store.ts`
- [x] Criar `app/api/_utils/proxy.ts` com toda a lógica de criptografia e proxy

#### 0.4 — Variáveis de ambiente
- [x] Criar `.env.example` com todas as variáveis documentadas
- [x] Criar `.env.local` local (não commitado) com valores de desenvolvimento
- [x] Criar `.gitignore` apropriado para Next.js

#### 0.5 — Docker
- [x] Criar `Dockerfile` multi-stage (deps → builder → runner standalone)
- [x] Criar `docker/docker-compose.yaml` (produção)
- [x] Criar `docker/docker-compose.dev.yaml` (dev/homologação)

#### 0.6 — GitHub Actions
- [x] Criar `.github/workflows/deploy-prod.yml` (push em `main`)
- [x] Criar `.github/workflows/deploy-dev.yml` (push em `develop`)
- [x] Documentar secrets necessários no README

#### 0.7 — README
- [x] Criar `README.md` com visão geral, setup local, variáveis de ambiente e deploy

### ✅ Validação do Desenvolvedor
- [x] `npm run dev` executa sem erros
- [x] `npm run build` executa sem erros
- [x] `docker build` conclui sem erros
- [x] As variáveis de ambiente server-only NÃO aparecem no bundle cliente
- [x] Workflows do GitHub Actions configurados e testados

---

## Passo 1 — Autenticação e Layout Base

> **🔒 Este passo está bloqueado. O Passo 0 deve ser concluído e o gate de validação aprovado antes de iniciar.**

**Objetivo:** Tela de login funcional, layout raiz com sidebar, proteção de rotas e Zustand auth store.

### Tarefas

#### 1.1 — BFF Auth Routes
- [x] Implementar `app/api/auth/login/route.ts` — POST para `/admin/auth/dashboard/login`, cifra token, retorna `{ token, user }`
- [x] Implementar `app/api/me/route.ts` — GET para `/admin/auth/dashboard/me`, usa `proxyRequest`

#### 1.2 — Zustand Auth Store
- [x] Implementar `store/auth.store.ts` com `user`, `token` (cifrado), `login()`, `logout()`, `loadFromStorage()`
- [x] `loadFromStorage()` lê localStorage → chama `/api/me` para validar → se 401, faz logout

#### 1.3 — Tela de Login
- [x] Criar `app/login/layout.tsx` — layout sem sidebar, sem ProtectedRoute
- [x] Criar `app/login/page.tsx` com layout dois painéis (desktop) / um painel (mobile)
  - Painel esquerdo (hidden mobile): logo Softconnect Manager, `home-ilustration.svg`, link Softcom, copyright dinâmico
  - Painel direito: formulário email + senha, validação Zod, toast de erro
- [x] Formulário validado com react-hook-form + Zod

#### 1.4 — Layout Raiz e Sidebar
- [x] Criar `components/auth/protected-route.tsx` — redireciona para `/login` se não autenticado
- [x] Criar `components/layout/sidebar.tsx` — comportamento responsivo (mobile/tablet/desktop)
- [x] Criar `components/layout/sidebar-item.tsx`
- [x] Criar `components/layout/mobile-nav.tsx`
- [x] Criar `components/layout/dashboard-header.tsx`
- [x] Criar `components/layout/app-shell.tsx` — isola layout por rota (público vs. protegido)
- [x] Atualizar `app/layout.tsx` com QueryClientProvider, AppShell (Sidebar, MobileNav, ProtectedRoute)
- [x] `app/page.tsx` redireciona para `/dashboard`

### ✅ Validação do Desenvolvedor
- [x] Login com credenciais válidas funciona e redireciona para `/dashboard`
- [x] Login com credenciais inválidas exibe toast de erro
- [x] Acesso a `/dashboard` sem autenticação redireciona para `/login`
- [x] Refresh da página mantém sessão (localStorage + validação via `/api/me`)
- [x] Logout funciona e redireciona para `/login`
- [x] Sidebar responsiva: mobile (bottom nav), tablet (ícones), desktop (expandida)
- [x] Tela de login: dois painéis em desktop, um painel em mobile
- [x] Paleta de cores Softcom aplicada (amarelo nos elementos primários)

---

## Passo 2 — Módulo VPS

> **🔒 Este passo está bloqueado. O Passo 1 deve ser concluído e o gate de validação aprovado antes de iniciar.**

**Objetivo:** CRUD completo de VPS com tela de listagem e tela de detalhes.

### Tarefas

#### 2.1 — BFF Routes
- [x] `app/api/vps/route.ts` — GET + POST
- [x] `app/api/vps/[id]/route.ts` — GET + PUT + DELETE

#### 2.2 — API Layer e Hook
- [x] Adicionar funções VPS em `lib/api.ts`
- [x] Criar `hooks/use-vps.ts` com `useVpsList`, `useVps`, `useCreateVps`, `useUpdateVps`, `useDeactivateVps`

#### 2.3 — Tipos e Schemas
- [x] Definir tipos `VpsServer`, `CreateVpsDto`, `UpdateVpsDto` em `lib/types.ts`
- [x] Criar schemas Zod para os formulários em `lib/schemas/vps.schema.ts`

#### 2.4 — Tela de Listagem `/vps`
- [x] Tabela de VPS com colunas: Label, Subdomain, IP, Adapter, Status (Ativo/Inativo)
- [x] Botão "Nova VPS" abre modal de criação
- [x] Cada linha com ações: Ver detalhe, Editar, Desativar
- [x] Loading skeleton enquanto carrega

#### 2.5 — Modal de Criação/Edição
- [x] Formulário com todos os campos do `CreateVpsDto`
- [x] Campos sensíveis (providerApiKey, managerApiKey, monitorApiKey) com input tipo password
- [x] Validação Zod em tempo real

#### 2.6 — Tela de Detalhe `/vps/[id]`
- [x] Dados completos da VPS (sem exibir chaves)
- [x] Cards de informações de rede e gerenciamento
- [x] Botão "Ver instâncias vinculadas" com link para `/instances?vpsId=[id]`

#### 2.7 — Ajustes de campos (pós-implementação)
- [x] Campo `adapterType` transformado em Select com opção "evolution" (extensível)
- [x] Campo `notes` adicionado (Textarea com suporte a multilinhas), exibido no detalhe da VPS
- [x] Tipo `VpsServer` atualizado com `notes?: string | null`
- [x] Schema Zod atualizado com `notes: z.string().optional()`

### ✅ Validação do Desenvolvedor
- [x] Criar VPS funciona e aparece na lista
- [x] Editar VPS funciona
- [x] Desativar VPS funciona
- [x] Tela de detalhe exibe dados corretos
- [x] Navegação para instâncias vinculadas funciona
- [x] Formulário valida campos obrigatórios

---

## Passo 3 — Módulo Produtos

> **✅ Passo 2 concluído e gate aprovado. Implementação do Passo 3 concluída.**

**Objetivo:** CRUD de Produtos com guard de pré-condição (VPS obrigatória) e exibição única da API Key.

### Tarefas

#### 3.1 — BFF Routes
- [x] `app/api/products/route.ts` — GET + POST
- [x] `app/api/products/[id]/route.ts` — PUT + DELETE + GET

#### 3.2 — API Layer e Hooks
- [x] Funções em `lib/api.ts`
- [x] `hooks/use-products.ts`

#### 3.3 — Tipos e Schemas Zod
- [x] `Product`, `ProductWithApiKey`, `CreateProductDto`, `UpdateProductDto`
- [x] `lib/schemas/product.schema.ts`

#### 3.4 — Guard de Pré-condição
- [x] Se `useVpsList()` retornar lista vazia: botão "Novo Produto" desabilitado + banner de aviso com link para `/vps`

#### 3.5 — Tela de Listagem `/products`
- [x] Tabela: Name, Slug, VPS vinculada, Adapter, Status (ativo/inativo)
- [x] Botão "Novo Produto" (com guard)
- [x] Ações: Ver detalhe, Editar, Desativar

#### 3.6 — Modal de Criação
- [x] Formulário com campos do `CreateProductDto`
- [x] Select de VPS carregado de `useVpsList()`
- [x] Após criação bem-sucedida: modal com API Key gerada (exibição única, com botão copy e aviso)

#### 3.7 — Tela de Detalhe `/products/[id]`
- [x] Dados do produto
- [x] Link para lista de instâncias do produto

#### 3.8 — Ajustes de campos (pós-implementação)
- [x] Campo `adapterType` transformado em Select com opção "evolution" (extensível)
- [x] Campo `origins` adicionado: gerenciador de tags com input + botão Add, remoção com confirmação via AlertDialog
- [x] Tipo `Product.origins` atualizado para `string[] | null`
- [x] Schema Zod atualizado com `origins: z.array(z.string().url()).optional()`

### ✅ Validação do Desenvolvedor
- [x] Guard de VPS funciona (botão desabilitado se sem VPS)
- [x] Criar produto retorna e exibe API Key uma única vez
- [x] Editar produto funciona
- [x] Desativar produto funciona

---

## Passo 4 — Módulo Instâncias

> ✅ **Implementado — aguarda gate de validação do desenvolvedor**

**Objetivo:** Listagem, criação, visualização de detalhe e testes de saúde de instâncias.

### Tarefas

#### 4.1 — BFF Routes
- [x] `app/api/admin/products/[productId]/instances/route.ts` — GET + POST (JWT via `proxyRequest`)
- [x] `app/api/admin/products/[productId]/instances/[instanceId]/route.ts` — GET + DELETE
- [x] `app/api/admin/products/[productId]/instances/[instanceId]/status/route.ts` — GET
- [x] `app/api/admin/products/[productId]/instances/[instanceId]/connect/route.ts` — GET
- [x] `app/api/admin/products/[productId]/instances/[instanceId]/restart/route.ts` — POST
- [x] `app/api/admin/products/[productId]/instances/[instanceId]/disconnect/route.ts` — POST
- [x] `app/api/admin/products/[productId]/instances/[instanceId]/send-text/route.ts` — POST
- [x] `app/api/admin/products/[productId]/instances/[instanceId]/send-presence/route.ts` — POST
- ~~`data-plane/instances/*`~~ — removidos; admin usa rotas admin com JWT

#### 4.2 — API Layer e Hooks
- [x] Funções em `lib/api.ts` (getInstanceList, getInstance, createInstance, deleteInstance, getInstanceStatus, connectInstance, restartInstance, disconnectInstance, sendPresence, sendTestMessage) — todas com `(token, productId, instanceId, ...)` sem encryptedApiKey
- [x] `hooks/use-instances.ts` com todos os hooks JWT: useInstanceList, useInstance, useInstanceStatus, useCreateInstance, useDeleteInstance, useConnectInstance, useRestartInstance, useDisconnectInstance, useSendPresence, useSendTestMessage
- [x] `store/product-keys.store.ts` — adicionado `getPlainKey` e `setKey` (alias de `setProductKey`)
- [x] `lib/schemas/instance.schema.ts` — schema Zod
- [x] `lib/types.ts` — AdminInstance, AdminInstanceStatusResponse, AdminInstanceConnectResponse
- [x] `app/providers.tsx` — AppInitializer carrega product-keys do localStorage no boot

#### 4.3 — Guard de Pré-condição
- [x] Sem produtos ativos: banner amarelo + botão desabilitado com tooltip
- [x] Produtos existem mas sem API Key no navegador: banner azul + botão desabilitado

#### 4.4 — Tela de Listagem `/instances`
- [x] Grid de `ProductCard` por produto (não tabela global)
- [x] Cada card exibe: nome, slug, badge status, VPS vinculada
- [x] Se API Key disponível: botão "Nova" (abre modal) + botão "Ver instâncias" (expande `InstancesPanel` inline)
- [x] Se API Key indisponível: botão "Rotacionar API Key" diretamente no card
- [x] Busca por produto (nome/slug)

#### 4.4.1 — API Key e Rotate-Key
- [x] `ApiKeyCard` em `/products/[id]` — mostra key mascarada, toggle show/hide, botão copiar (toast), botão Rotacionar + AlertDialog
- [x] `app/api/products/[id]/rotate-key/route.ts` — BFF POST (aguarda endpoint na API)
- [x] `api.rotateProductKey` + `useRotateProductKey` — hook com `setProductKey` no onSuccess
- [x] `ignored-docs/api/spec-rotate-apikey.md` — spec completa para implementação na API NestJS

#### 4.5 — Modal de Criação
- [x] Formulário: nome da instância, select de produto, select de integração
- [x] Validação Zod: nome 3–64 chars, apenas `[a-zA-Z0-9_-]`

#### 4.6 — Tela de Detalhe `/instances/[instanceId]?productId=<id>`
- [x] Status atual com badge colorido (open = verde, connecting = amarelo, close = vermelho)
- [x] Deletar com AlertDialog de confirmação
- [x] **Painel de Conexão** (sempre visível):
  - [x] Botão "Conectar / Gerar QR Code" → `GET .../connect` → renderiza QR base64
  - [x] Polling de status via `refetchStatus()` após conectar
  - [x] Botão Reiniciar com AlertDialog
  - [x] Botão Desconectar (disabled se não `open`) com AlertDialog de aviso
- [x] **Painel de Testes** (apenas se `status === 'open'`):
  - [x] Testar Presença → resultado inline (ok / corrompida)
  - [x] Enviar Mensagem de Teste → resultado inline (ok / corrompida)
- [x] **Painel de API Key do Produto:**
  - [x] Exibe chave mascarada se disponível no localStorage (`getPlainKey`)
  - [x] Botão "Rotacionar API Key" com AlertDialog (avisa invalidação)
  - [x] Dialog com nova key + toggle show/hide + botão copiar + aviso de exibição única
  - [x] Salva nova key no localStorage com `setProductKey`

### ✅ Validação do Desenvolvedor
- [x] Listar instâncias de um produto funciona (JWT, sem API Key no browser)
- [x] Criar instância funciona
- [x] Filtro Ativo/Inativo/Todos funciona
- [x] QR Code gerado e exibido ao clicar "Conectar"
- [x] Polling detecta status `open` e para o QR
- [x] Reiniciar e Desconectar funcionam com confirmação
- [x] Testar Presença e Enviar Mensagem exibem resultado inline
- [x] Rotacionar API Key exibe nova key em modal com botão copiar e aviso de exibição única
- [x] Deletar funciona com confirmação
- [x] VPS form: providerApiKey com show/hide e copiar

---

## Passo 5 — Módulo Health

> **✅ Implementado — aguarda gate de validação do desenvolvedor.**

**Objetivo:** Tela de monitoramento de saúde das VPS com auto-refresh.

### Tarefas

#### 5.1 — BFF Routes
- [x] `app/api/health/route.ts` — GET
- [x] `app/api/health/hub/metrics/route.ts` — GET

#### 5.2 — API Layer e Hooks
- [x] `hooks/use-health.ts` com `refetchInterval: 30_000`

#### 5.3 — Tela `/health`
- [x] Cards por VPS: Label, Status (badge healthy/unhealthy), último check, responseMs
- [x] Se `systemMetrics` disponível: CPU %, Memória %, Disco %
- [x] Card do Hub (se `available: true`): métricas do próprio servidor
- [x] Indicador de last refresh + botão de refresh manual

### ✅ Validação do Desenvolvedor
- [x] Tela carrega e exibe dados de saúde das VPS
- [x] Auto-refresh a cada 30 segundos funciona
- [x] Métricas de sistema exibidas quando disponíveis
- [x] Hub metrics exibido quando configurado

---

## Passo 6 — Módulo Logs

**Objetivo:** Tabela de logs de auditoria com filtros e paginação.

### Tarefas

#### 6.1 — BFF Route
- [x] `app/api/logs/route.ts` — GET com query params repassados

#### 6.2 — API Layer e Hook
- [x] `hooks/use-logs.ts` — paginação server-side

#### 6.3 — Tela `/logs`
- [x] Filtros: Produto (select), Instância (input), Status HTTP (select), Data início, Data fim
- [x] Tabela: Timestamp, Produto, Instância, Método, Path, Status, ResponseMs
- [x] Paginação com controles anterior/próximo e seletor de itens por página
- [x] Aplicar/limpar filtros sem recarregar a página (query params na URL)

### ✅ Validação do Desenvolvedor
- [ ] Logs carregam com paginação
- [ ] Filtros funcionam corretamente
- [ ] URL reflete filtros ativos (compartilhável)

---

## Passo 7 — Módulo Usuários Admin

> **🔒 Este passo está bloqueado. O Passo 6 deve ser concluído e o gate de validação aprovado antes de iniciar.**

**Objetivo:** Gerenciamento de usuários administrativos.

### Tarefas

#### 7.1 — BFF Routes
- [ ] `app/api/users/route.ts` — GET + POST
- [ ] `app/api/users/[id]/route.ts` — PUT + DELETE

#### 7.2 — API Layer e Hooks
- [ ] `hooks/use-users.ts`

#### 7.3 — Tela `/users`
- [ ] Tabela: Nome, E-mail, Papel (badge superadmin/admin), Ativo, Criado em
- [ ] Botão "Novo Usuário" abre modal de criação
- [ ] Ações: Editar papel, Desativar

#### 7.4 — Modal de Criação/Edição
- [ ] Campos: Nome, E-mail, Senha (criação), Papel (select)
- [ ] Validação Zod

### ✅ Validação do Desenvolvedor
- [ ] Criar usuário funciona
- [ ] Editar papel funciona
- [ ] Desativar usuário funciona
- [ ] Usuário logado não consegue desativar a si mesmo (UX guard)

---

## Passo 8 — Dashboard Overview

> **🔒 Este passo está bloqueado. O Passo 7 deve ser concluído e o gate de validação aprovado antes de iniciar.**

**Objetivo:** Página de visão geral com cards de resumo e dados agregados.

### Tarefas

#### 8.1 — Tela `/dashboard`
- [ ] Card: VPS Ativas / Total (com link para `/vps`)
- [ ] Card: VPS Saudáveis vs Unhealthy (com link para `/health`)
- [ ] Card: Total de Produtos ativos (com link para `/products`)
- [ ] Card: Total de Instâncias (com link para `/instances`)
- [ ] Card: Status do Hub (se disponível)
- [ ] Tabela "Últimos Logs" (5 registros mais recentes) com link "Ver todos"
- [ ] Tabela "VPS com problemas" (isHealthy = false) com link para `/health`

#### 8.2 — Estados vazios
- [ ] Se sem VPS: banner de boas-vindas com passo a passo (VPS → Produto → Instância)

### ✅ Validação do Desenvolvedor
- [ ] Dashboard exibe dados corretos de todas as fontes
- [ ] Links de navegação funcionam
- [ ] Estado vazio (sem dados) exibe banner de orientação

---

## Passo 9 — Polimento, Guards de UX e Ajustes Finais

> **🔒 Este passo está bloqueado. O Passo 8 deve ser concluído e o gate de validação aprovado antes de iniciar.**

**Objetivo:** Refinamentos de UX, acessibilidade e preparação para produção.

### Tarefas

#### 9.1 — Guards de UX (verificação final)
- [ ] Confirmar guard Produto → requer VPS em todos os pontos de entrada
- [ ] Confirmar guard Instância → requer Produto em todos os pontos de entrada
- [ ] Tela de detalhe de VPS: link/botão "Nova Instância" com guard correto

#### 9.2 — Loading States e Skeletons
- [ ] Todos os carregamentos de dados têm skeleton ou spinner
- [ ] Mutações (criar, editar, deletar) têm estado de loading no botão

#### 9.3 — Error Boundaries
- [ ] Erros de fetch exibem mensagem amigável (não crash da página)
- [ ] Tratamento global de 401 → logout automático

#### 9.4 — Responsividade
- [ ] Todas as tabelas têm scroll horizontal em mobile
- [ ] Modais têm tamanho adequado em mobile
- [ ] Formulários usam layout de uma coluna em mobile

#### 9.5 — Meta e SEO básico
- [ ] `metadata` no `layout.tsx` com título e descrição
- [ ] Favicon configurado (já existem os arquivos em `/public`)

#### 9.6 — Build final e deploy
- [ ] `npm run build` sem warnings de tipo ou lint
- [ ] Deploy em ambiente dev testado e funcionando
- [ ] Deploy em produção configurado

### ✅ Validação do Desenvolvedor
- [ ] App completo funciona end-to-end em ambiente de desenvolvimento
- [ ] Build de produção sem erros
- [ ] Deploy em dev funcionando
- [ ] Todos os módulos testados manualmente

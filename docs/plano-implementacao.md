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
| **Passo 1** — Autenticação e Layout Base | ⏳ Página placeholder |
| **Passo 2** — Módulo VPS | ⏳ Página placeholder |
| **Passo 3** — Módulo Produtos | 🔒 Bloqueado |
| **Passo 4** — Módulo Instâncias | 🔒 Bloqueado |
| **Passo 5** — Módulo Health | 🔒 Bloqueado |
| **Passo 6** — Módulo Logs | 🔒 Bloqueado |
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
- [ ] `npm run dev` executa sem erros
- [ ] `npm run build` executa sem erros
- [ ] `docker build` conclui sem erros
- [ ] As variáveis de ambiente server-only NÃO aparecem no bundle cliente
- [ ] Workflows do GitHub Actions configurados e testados

---

## Passo 1 — Autenticação e Layout Base

> **🔒 Este passo está bloqueado. O Passo 0 deve ser concluído e o gate de validação aprovado antes de iniciar.**

**Objetivo:** Tela de login funcional, layout raiz com sidebar, proteção de rotas e Zustand auth store.

### Tarefas

#### 1.1 — BFF Auth Routes
- [ ] Implementar `app/api/auth/login/route.ts` — POST para `/admin/auth/dashboard/login`, cifra token, retorna `{ token, user }`
- [ ] Implementar `app/api/me/route.ts` — GET para `/admin/auth/dashboard/me`, usa `proxyRequest`

#### 1.2 — Zustand Auth Store
- [ ] Implementar `store/auth.store.ts` com `user`, `token` (cifrado), `login()`, `logout()`, `loadFromStorage()`
- [ ] `loadFromStorage()` lê localStorage → chama `/api/me` para validar → se 401, faz logout

#### 1.3 — Tela de Login
- [ ] Criar `app/login/layout.tsx` — layout sem sidebar, sem ProtectedRoute
- [ ] Criar `app/login/page.tsx` com layout dois painéis (desktop) / um painel (mobile)
  - Painel esquerdo (hidden mobile): logo Softconnect Manager, `home-ilustration.svg`, link Softcom, copyright dinâmico
  - Painel direito: formulário email + senha, validação Zod, toast de erro
- [ ] Formulário validado com react-hook-form + Zod

#### 1.4 — Layout Raiz e Sidebar
- [ ] Criar `components/auth/protected-route.tsx` — redireciona para `/login` se não autenticado
- [ ] Criar `components/layout/sidebar.tsx` — comportamento responsivo (mobile/tablet/desktop)
- [ ] Criar `components/layout/sidebar-item.tsx`
- [ ] Criar `components/layout/mobile-nav.tsx`
- [ ] Criar `components/layout/dashboard-header.tsx`
- [ ] Atualizar `app/layout.tsx` com QueryClientProvider, AuthProvider, Sidebar, MobileNav, ProtectedRoute
- [ ] Criar `app/page.tsx` que redireciona para `/dashboard`

### ✅ Validação do Desenvolvedor
- [ ] Login com credenciais válidas funciona e redireciona para `/dashboard`
- [ ] Login com credenciais inválidas exibe toast de erro
- [ ] Acesso a `/dashboard` sem autenticação redireciona para `/login`
- [ ] Refresh da página mantém sessão (localStorage + validação via `/api/me`)
- [ ] Logout funciona e redireciona para `/login`
- [ ] Sidebar responsiva: mobile (bottom nav), tablet (ícones), desktop (expandida)
- [ ] Tela de login: dois painéis em desktop, um painel em mobile
- [ ] Paleta de cores Softcom aplicada (amarelo nos elementos primários)

---

## Passo 2 — Módulo VPS

> **🔒 Este passo está bloqueado. O Passo 1 deve ser concluído e o gate de validação aprovado antes de iniciar.**

**Objetivo:** CRUD completo de VPS com tela de listagem e tela de detalhes.

### Tarefas

#### 2.1 — BFF Routes
- [ ] `app/api/vps/route.ts` — GET + POST
- [ ] `app/api/vps/[id]/route.ts` — PUT + DELETE

#### 2.2 — API Layer e Hook
- [ ] Adicionar funções VPS em `lib/api.ts`
- [ ] Criar `hooks/use-vps.ts` com `useVpsList`, `useCreateVps`, `useUpdateVps`, `useDeactivateVps`

#### 2.3 — Tipos e Schemas
- [ ] Definir tipos `VpsServer`, `CreateVpsDto`, `UpdateVpsDto` em `lib/types.ts`
- [ ] Criar schemas Zod para os formulários em `lib/schemas/vps.schema.ts`

#### 2.4 — Tela de Listagem `/vps`
- [ ] Tabela de VPS com colunas: Label, Subdomain, IP, Adapter, Status (healthy/unhealthy), Ativo
- [ ] Botão "Nova VPS" abre modal/dialog de criação
- [ ] Cada linha com ações: Editar, Desativar
- [ ] Loading skeleton enquanto carrega

#### 2.5 — Modal de Criação/Edição
- [ ] Formulário com todos os campos do `CreateVpsDto`
- [ ] Campos sensíveis (providerApiKey, managerApiKey, monitorApiKey) com input tipo password
- [ ] Validação Zod em tempo real

#### 2.6 — Tela de Detalhe `/vps/[id]`
- [ ] Dados completos da VPS (sem exibir chaves)
- [ ] Card de status de saúde (último healthcheck)
- [ ] Card de métricas de sistema (se disponível)
- [ ] Lista de instâncias vinculadas com link para cada uma
- [ ] Botão "Nova Instância" com `vpsId` pré-selecionado

### ✅ Validação do Desenvolvedor
- [ ] Criar VPS funciona e aparece na lista
- [ ] Editar VPS funciona
- [ ] Desativar VPS funciona
- [ ] Tela de detalhe exibe dados corretos
- [ ] Navegação para instâncias vinculadas funciona
- [ ] Formulário valida campos obrigatórios

---

## Passo 3 — Módulo Produtos

> **🔒 Este passo está bloqueado. O Passo 2 deve ser concluído e o gate de validação aprovado antes de iniciar.**

**Objetivo:** CRUD de Produtos com guard de pré-condição (VPS obrigatória) e exibição única da API Key.

### Tarefas

#### 3.1 — BFF Routes
- [ ] `app/api/products/route.ts` — GET + POST
- [ ] `app/api/products/[id]/route.ts` — PUT + DELETE + GET

#### 3.2 — API Layer e Hooks
- [ ] Funções em `lib/api.ts`
- [ ] `hooks/use-products.ts`

#### 3.3 — Tipos e Schemas Zod
- [ ] `Product`, `CreateProductDto`, `UpdateProductDto`
- [ ] `lib/schemas/product.schema.ts`

#### 3.4 — Guard de Pré-condição
- [ ] Se `useVpsList()` retornar lista vazia: botão "Novo Produto" desabilitado + banner de aviso com link para `/vps`

#### 3.5 — Tela de Listagem `/products`
- [ ] Tabela: Name, VPS vinculada, Status (ativo/inativo), Criado em
- [ ] Botão "Novo Produto" (com guard)
- [ ] Ações: Editar, Desativar

#### 3.6 — Modal de Criação
- [ ] Formulário com campos do `CreateProductDto`
- [ ] Select de VPS carregado de `useVpsList()`
- [ ] Após criação bem-sucedida: modal com API Key gerada (exibição única, com botão copy e aviso)

#### 3.7 — Tela de Detalhe `/products/[id]`
- [ ] Dados do produto
- [ ] Link para lista de instâncias do produto

### ✅ Validação do Desenvolvedor
- [ ] Guard de VPS funciona (botão desabilitado se sem VPS)
- [ ] Criar produto retorna e exibe API Key uma única vez
- [ ] Editar produto funciona
- [ ] Desativar produto funciona

---

## Passo 4 — Módulo Instâncias

> **🔒 Este passo está bloqueado. O Passo 3 deve ser concluído e o gate de validação aprovado antes de iniciar.**

**Objetivo:** Listagem, criação, visualização de QR Code e ações sobre instâncias.

### Tarefas

#### 4.1 — BFF Routes
- [ ] `app/api/instances/route.ts` — GET
- [ ] `app/api/instances/[instanceId]/route.ts` — GET + DELETE
- [ ] `app/api/instances/[instanceId]/connect/route.ts` — GET
- [ ] `app/api/instances/[instanceId]/status/route.ts` — GET
- [ ] `app/api/instances/[instanceId]/restart/route.ts` — POST
- [ ] `app/api/instances/create/route.ts` — POST

#### 4.2 — API Layer e Hooks
- [ ] Funções em `lib/api.ts`
- [ ] `hooks/use-instances.ts`

#### 4.3 — Guard de Pré-condição
- [ ] Se `useProductsList()` retornar lista vazia: botão "Nova Instância" desabilitado + banner

#### 4.4 — Tela de Listagem `/instances`
- [ ] Tabela: Instance ID, Produto, VPS, Status, Ativo
- [ ] Filtro por VPS (query param `vpsId`) e por Produto
- [ ] Botão "Nova Instância" (com guard)

#### 4.5 — Modal de Criação
- [ ] Formulário: nome da instância, produto (select), número de telefone
- [ ] VPS resolvida automaticamente pelo produto selecionado (ou select explícito se produto tem `vpsId`)

#### 4.6 — Tela de Detalhe `/instances/[instanceId]`
- [ ] Status atual
- [ ] QR Code exibido se status = `close` (polling via `refetchInterval` até conectar)
- [ ] Ações: Reiniciar, Desconectar, Deletar (com confirmação)

### ✅ Validação do Desenvolvedor
- [ ] Guard de Produto funciona
- [ ] Criar instância funciona
- [ ] QR Code exibido e atualizado automaticamente
- [ ] Reiniciar e deletar funcionam com confirmação
- [ ] Filtro por VPS/Produto funciona

---

## Passo 5 — Módulo Health

> **🔒 Este passo está bloqueado. O Passo 4 deve ser concluído e o gate de validação aprovado antes de iniciar.**

**Objetivo:** Tela de monitoramento de saúde das VPS com auto-refresh.

### Tarefas

#### 5.1 — BFF Routes
- [ ] `app/api/health/route.ts` — GET
- [ ] `app/api/health/hub/metrics/route.ts` — GET

#### 5.2 — API Layer e Hooks
- [ ] `hooks/use-health.ts` com `refetchInterval: 30_000`

#### 5.3 — Tela `/health`
- [ ] Cards por VPS: Label, Status (badge healthy/unhealthy), último check, responseMs
- [ ] Se `systemMetrics` disponível: CPU %, Memória %, Disco %
- [ ] Card do Hub (se `available: true`): métricas do próprio servidor
- [ ] Indicador de last refresh + botão de refresh manual

### ✅ Validação do Desenvolvedor
- [ ] Tela carrega e exibe dados de saúde das VPS
- [ ] Auto-refresh a cada 30 segundos funciona
- [ ] Métricas de sistema exibidas quando disponíveis
- [ ] Hub metrics exibido quando configurado

---

## Passo 6 — Módulo Logs

> **🔒 Este passo está bloqueado. O Passo 5 deve ser concluído e o gate de validação aprovado antes de iniciar.**

**Objetivo:** Tabela de logs de auditoria com filtros e paginação.

### Tarefas

#### 6.1 — BFF Route
- [ ] `app/api/logs/route.ts` — GET com query params repassados

#### 6.2 — API Layer e Hook
- [ ] `hooks/use-logs.ts` — paginação server-side

#### 6.3 — Tela `/logs`
- [ ] Filtros: Produto (select), Instância (input), Status HTTP (select), Data início, Data fim
- [ ] Tabela: Timestamp, Produto, Instância, Método, Path, Status, ResponseMs
- [ ] Paginação com controles anterior/próximo e seletor de itens por página
- [ ] Aplicar/limpar filtros sem recarregar a página (query params na URL)

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

````instructions
# Softconnect Manager — Copilot Instructions

> Leia este arquivo integralmente antes de qualquer interação com o projeto.
> Ele define como você deve se comportar, o que pode e não pode fazer, e como gerenciar o progresso do desenvolvimento.

---

## 1. Contexto do Projeto

O **Softconnect Manager** é o dashboard administrativo (Next.js 14) do **SoftConnect 2.0 API Hub** da Softcom.
Ele consome exclusivamente as rotas Admin da SoftConnect API (`/api/v1/admin/*` e algumas rotas de data plane).

**Antes de qualquer tarefa, leia:**
1. `docs/spec-tecnica.md` — arquitetura, stack, paleta, layout, autenticação, telas, docker
2. `docs/spec-request-pattern.md` — padrão BFF obrigatório para todas as chamadas
3. `docs/plano-implementacao.md` — estado atual e fase em andamento
4. `README.md` — visão geral e setup local

**Este projeto é Next.js. O projeto da API (NestJS) fica em `/softconnect`. Não confunda e nunca altere arquivos da API quando estiver trabalhando no Manager.**

---

## 2. Regras de Progressão de Fases

Cada fase no plano de implementação termina com um gate `### ✅ Validação do Desenvolvedor`.

**Uma fase só está completa quando:**
- Todos os itens de implementação estão marcados como `[x]`
- O gate de validação está marcado como `[x]`
- O desenvolvedor **explicitamente** solicitou avançar para a próxima fase

### O que fazer ao final de uma fase

1. Atualizar `docs/plano-implementacao.md` — marcar `[x]` nos itens efetivamente concluídos
2. Deixar os itens do gate de validação como `[ ]` — **nunca marque gates do desenvolvedor**
3. Atualizar a tabela **Estado Atual do Projeto** no topo do arquivo
4. Atualizar `docs/SESSION-HEADER.md` com a etapa atual

### O que NUNCA fazer

- **Nunca** iniciar implementação de uma fase cujo gate anterior não está `[x]`
- **Nunca** marcar itens do gate de validação do desenvolvedor como `[x]`
- **Nunca** sugerir avançar de fase sem instrução explícita
- **Nunca** modificar arquivos do projeto da API (`/softconnect`) quando trabalhando no Manager

---

## 3. Padrão Obrigatório de Requests (BFF)

**Este é o padrão mais importante do projeto. Toda chamada de dados deve seguir exatamente:**

```
Browser → /api/* (Next Route) → SoftConnect API
```

1. O browser envia o token **cifrado** no header `Authorization: Bearer <token_cifrado>`
2. A Next Route decifra o token com `decryptToken()` de `app/api/_utils/proxy.ts`
3. A Next Route chama a SoftConnect API com o JWT real
4. A Next Route retorna os dados ao browser

**Regras absolutas:**
- Nunca use `SOFTCONNECT_API_URL` em código client-side
- Nunca use o JWT real no browser
- Nunca chame `fetch` direto para a SoftConnect API em componentes React
- Toda nova Next Route deve usar `proxyRequest()` de `app/api/_utils/proxy.ts`, exceto `/api/auth/login` (que tem lógica especial de cifra)
- Funções de chamada ficam em `lib/api.ts`
- Hooks TanStack Query ficam em `hooks/use-[dominio].ts`
- Componentes usam apenas os hooks — nunca chamam `api.*` diretamente

Detalhes completos em `docs/spec-request-pattern.md`.

---

## 4. Código

- Siga estritamente o padrão de pastas definido em `docs/spec-tecnica.md` seção 3
- Use TypeScript strict — sem `any` implícito; tipagem explícita em todos os parâmetros e retornos
- Não use comentários em código, exceto quando a complexidade justifica ou quando explicitamente solicitado
- Formulários: sempre react-hook-form + Zod (nunca state manual para formulários complexos)
- Estado global: Zustand (auth e UI) — sem Context API para estado compartilhado
- Queries/mutations de dados: TanStack Query — sem useEffect + fetch manual
- Notificações: sonner (`toast.success`, `toast.error`) — sem alert nativo
- Ícones: lucide-react exclusivamente
- Componentes UI base: shadcn/ui — não reinvente o que o shadcn já fornece
- Evite criar abstrações, classes ou funções além do que a tarefa requer
- O app é dark-mode fixo — não adicione lógica de toggle de tema

---

## 5. Paleta e Identidade Visual

- Cor primária: `#ffd900` (Softcom Yellow) — `hsl(52 100% 50%)`
- Cor de destaque: `#f2a900` (Softcom Amber) — `hsl(40 100% 47%)`
- Use `text-primary` e `bg-primary` para elementos de ação e destaque
- Texto sobre fundo primário: sempre escuro (`primary-foreground`)
- Não altere as CSS variables definidas em `app/globals.css` sem justificativa documentada

---

## 6. Layout e Responsividade

- Sidebar: oculta em < 720px (usa MobileNav); ícones em 720–920px; expandida em > 920px
- Tela de login: dois painéis em ≥ 1024px; apenas formulário em < 1024px
- Tabelas: sempre com scroll horizontal em viewports pequenas
- Modais: tamanho apropriado para mobile

---

## 7. Dependências

- Não instale pacotes não previstos em `docs/spec-tecnica.md` seção 2 sem verificar se existe alternativa já instalada
- Ao propor nova dependência, justifique brevemente e aguarde aprovação antes de instalar
- `crypto-js` para AES-256 — não use outras libs de criptografia

---

## 8. Segurança

- O token JWT real da SoftConnect API **nunca** deve aparecer no código client-side
- `TOKEN_ENCRYPTION_KEY` e `SOFTCONNECT_API_URL` são server-only — nunca prefixe com `NEXT_PUBLIC_`
- Nunca logue tokens ou chaves no console, mesmo em desenvolvimento

---

## 9. Guards de UX — Dependências de Cadastro

O fluxo correto é: **VPS → Produto → Instância**

- Sem VPS ativa: botão "Novo Produto" desabilitado com tooltip e banner de aviso
- Sem Produto ativo: botão "Nova Instância" desabilitado com tooltip e banner de aviso
- A verificação usa dados já carregados pelo TanStack Query — sem chamadas extras à API

---

## 10. Documentação

Atualize documentação quando houver mudanças estruturais:

### Quando atualizar `docs/spec-tecnica.md`
- Nova tela ou rota adicionada
- Novo endpoint da API mapeado
- Mudança na estrutura de pastas
- Mudança em variáveis de ambiente

### Quando atualizar `docs/spec-request-pattern.md`
- Novo padrão de chamada introduzido
- Mudança na lógica do proxy ou da criptografia

### Quando atualizar `docs/plano-implementacao.md`
- Ao concluir itens de uma fase — marcar `[x]`
- Ao atualizar o estado atual do projeto

### Quando atualizar `docs/SESSION-HEADER.md`
- Ao início de cada nova sessão
- Ao concluir uma fase

---

## 11. Comunicação

- Ao iniciar uma tarefa, confirme brevemente o que será feito e em qual fase do plano se enquadra
- Ao finalizar, reporte quais arquivos foram criados ou modificados
- Se encontrar inconsistência entre a spec e o código existente, **reporte antes de implementar**
- Nunca assuma que o desenvolvedor quer avançar de fase — aguarde instrução explícita

---

## Prompts Disponíveis

- `/session-start` — Use no início de cada nova sessão para carregar o contexto e a fase ativa
- `/review-phase` — Use quando uma fase está completa e precisa ser validada
- `/code-guidelines` — Use ao escrever, revisar ou refatorar código
````

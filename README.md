# Softconnect Manager

Painel administrativo moderno para gerenciamento centralizado de VPS, produtos, instâncias e monitoramento operacional da plataforma Softconnect.

Desenvolvido por Softcom Tecnologia com foco em escalabilidade, automação e experiência de uso.

---

## ✨ Visão Geral

O **Softconnect Manager** é uma aplicação web construída para centralizar o gerenciamento da infraestrutura da plataforma Softconnect, permitindo:

* Gerenciamento de VPS
* Controle de produtos e instâncias
* Monitoramento de saúde dos serviços
* Logs e auditoria
* Gestão administrativa de usuários
* Dashboard operacional em tempo real

A aplicação foi planejada com arquitetura incremental, foco em segurança e deploy simplificado via Docker + CI/CD.

---

## 🧱 Stack Principal

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Zustand
* React Query
* Zod
* Docker
* GitHub Actions

---

## 📂 Estrutura do Projeto

```bash
softconnect-manager/
├── app/
├── components/
├── hooks/
├── lib/
├── store/
├── public/
├── docker/
└── .github/
```

---

## 🚀 Ambiente de Desenvolvimento

### Clone o projeto

```bash
git clone <repo-url>
cd softconnect-manager
```

### Instale as dependências

```bash
npm install
```

### Configure o ambiente

Crie um arquivo `.env.local` baseado no `.env.example`.

```bash
cp .env.example .env.local
```

### Execute o projeto

```bash
npm run dev
```

A aplicação ficará disponível em:

```bash
http://localhost:3000
```

---

## 🐳 Docker

Build da aplicação:

```bash
docker build -t softconnect-manager .
```

Executar ambiente com Docker Compose:

```bash
docker compose up -d
```

---

## ⚙️ CI/CD

O projeto possui pipelines automatizadas com GitHub Actions:

* `main` → Deploy Produção
* `develop` → Deploy Desenvolvimento

---

## Instâncias em conexão prolongada

Instâncias que ficam tempo demais tentando conectar podem ser desconectadas, ou excluídas, pelo detalhe do provider Evolution. A configuração vale para todos os produtos vinculados àquele provider. O prazo conta a partir do momento em que o painel passa a ver a instância em conexão, não desde a criação do cadastro.

No menu **Providers**, abra **Gerenciar** no provider e use o painel **Instâncias em conexão prolongada**.

Para ligar ou desligar só aquele provider, use a opção **Verificar instâncias em conexão prolongada** e clique em **Salvar configuração**. Desmarcada, aquele provider deixa de ser consultado e não dispara ações novas. A tela pede confirmação antes de gravar.

Exemplo usado no teste:

| Campo | Valor |
|---|---|
| Verificar instâncias em conexão prolongada | ligado |
| Tempo máximo em conexão (minutos) | 15 |
| Ação | Desconectar e manter cadastro |
| Modo | Executar ação |
| Produto afetado | Produto01 |

O prazo efetivo mostrado abaixo do campo deve ficar **15 minutos**. **Somente observar** consulta e não altera instâncias. Se a tela avisar que a manutenção global está desabilitada ou que a simulação global está ativa, nada será desconectado nem excluído, mesmo com esta configuração.

O passo a passo das ações, da exclusão e do acompanhamento está em [Instâncias em conexão prolongada](docs/instancias-conexao-prolongada.md).

---

## 📄 Licença

Projeto privado — © Softcom Tecnologia. Todos os direitos reservados.

---

## 👨‍💻 Desenvolvimento

Desenvolvido por Softcom Tecnologia.

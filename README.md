# Help Desk Portal

Sistema de gestão de chamados de suporte técnico com frontend Next.js e backend Node.js/Express.

## Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Estilização**: CSS Custom Properties (Dark Theme)
- **Portas**: Frontend (3081), Backend (3080)

## Instalação

```bash
# Instalar dependências do frontend
npm install

# Instalar dependências do backend
cd server && npm install
```

## Execução

```bash
# Rodar backend (porta 3080)
npm run dev:server

# Rodar frontend (porta 3000)
npm run dev
```

## Usuários de Demonstração

| Email | Senha | Função |
|-------|-------|--------|
| admin@helpdesk.com | admin123 | Administrador |
| user@helpdesk.com | user123 | Usuário |

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Redireciona para login ou dashboard |
| `/login` | Página de autenticação |
| `/dashboard` | Visão geral com estatísticas |
| `/dashboard/tickets` | Lista e gestão de chamados |

## API Endpoints

```
GET    /api/health
GET    /api/tickets
GET    /api/tickets/:id
POST   /api/tickets
PUT    /api/tickets/:id
DELETE /api/tickets/:id
POST   /api/tickets/:id/comments
```

## Estrutura

```
helpdesk-portal/
├── server/           # Backend API
│   └── src/
│       ├── server.ts
│       ├── store.ts
│       └── types.ts
├── src/
│   ├── app/          # Rotas Next.js
│   ├── components/   # Componentes
│   ├── context/      # Auth + Tickets
│   └── lib/          # API client
├── .env.local
└── README.md
```

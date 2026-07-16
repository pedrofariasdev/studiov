# StudioV

Plataforma SaaS para planeamento, criação, organização e publicação de conteúdos digitais.

A StudioV centraliza marcas, clientes, ideias, conteúdos, calendário editorial e ficheiros num único workspace, preparando também a integração futura com inteligência artificial, redes sociais e analytics.

## Estado do projeto

A StudioV encontra-se em desenvolvimento ativo.

### Módulos concluídos

- Landing page
- Autenticação base
- Workspaces e permissões
- Marcas
- Clientes
- Content Planner
- Conteúdos
- Calendário editorial
- Biblioteca de mídia — implementação principal

### Em desenvolvimento

- Testes finais da Biblioteca
- Publicações
- Dashboard principal
- Perfil e Configurações
- Inteligência Artificial
- Analytics

## Tecnologias

### Frontend

- HTML5
- CSS3
- JavaScript
- Lucide Icons

### Backend

- Supabase Auth
- PostgreSQL
- Supabase Storage
- Row Level Security
- Database Functions — RPC
- Triggers

### Desenvolvimento

- Visual Studio Code
- Git
- GitHub
- GitHub Desktop
- Node.js
- npm
- Prettier
- ESLint
- Supabase CLI
- Docker Desktop
- WSL 2

### Gestão

- Trello
- ChatGPT

## Estrutura do projeto

```text
studiov/
├── assets/
├── components/
├── css/
│   ├── components/
│   ├── globals/
│   ├── landing/
│   ├── pages/
│   └── sections/
├── docs/
├── html/
│   ├── auth/
│   ├── dashboard/
│   ├── landing/
│   └── legal/
├── js/
│   ├── auth/
│   ├── dashboard/
│   └── services/
├── supabase/
│   ├── migrations/
│   └── config.toml
├── index.html
├── eslint.config.js
├── package.json
└── README.md
```

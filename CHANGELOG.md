# Changelog

Todas as alterações importantes deste projeto serão documentadas neste arquivo.

O formato segue uma organização baseada em versões e categorias de mudanças.

---

# [0.1.0] - Desenvolvimento inicial

## Added

### Estrutura do projeto

- Criação da arquitetura inicial da StudioV.
- Organização de componentes, páginas, estilos e scripts.
- Separação entre:
  - componentes reutilizáveis;
  - páginas;
  - serviços;
  - estilos globais.

### Landing Page

- Criação da página inicial da plataforma.
- Desenvolvimento das seções:
  - Hero;
  - Features;
  - Como funciona;
  - Pricing;
  - FAQ;
  - CTA;
  - Footer.

### Autenticação

- Integração inicial com Supabase Auth.
- Sistema de login.
- Sistema de registro.
- Proteção de páginas privadas.

### Dashboard

Implementação inicial dos módulos:

- Dashboard principal;
- Marcas;
- Clientes;
- Conteúdos;
- Calendário;
- Planner;
- Biblioteca de mídia.

### Banco de dados

- Integração com Supabase PostgreSQL.
- Configuração inicial de segurança.
- Implementação de Row Level Security.
- Criação da migration inicial do schema remoto.

Arquivo:

supabase/migrations/20260716151347_initial_remote_schema.sql

---

# Ferramentas e qualidade

## Added

- Git como controle de versão.
- Branch workflow.
- Pull Requests.
- Prettier para padronização.
- ESLint para análise de código.
- Supabase CLI.
- Docker Desktop.
- WSL 2.

---

# Próximas versões

## [0.2.0]

Planejado:

- Sistema completo de publicação;
- Melhorias no dashboard;
- Perfil de usuário;
- Configurações;
- Integração com IA.

---

## [0.3.0]

Planejado:

- Analytics;
- Métricas;
- Automações;
- Integrações externas.

---

## Status

Projeto em desenvolvimento ativo.

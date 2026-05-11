# GG (RH+) - Sistema de Gestão de Recursos Humanos

> **Sistema de Virada** — O maior e mais completo sistema do setor de Gente e Gestão da Nordeste Locações
>
> **Versão:** 2.0.0 | **Stack:** Node.js + Express + PostgreSQL | **Empresa:** Nordeste Locações
>
> **Criado em:** 19 de Janeiro de 2026 | **Em produção:** VPS (aguardando auditoria)

---

## O que é o GG (RH+)?

O **GG (RH+)**, conhecido internamente como **Sistema de Virada**, é um ecossistema robusto de gestão de capital humano projetado para operações de RH de alta complexidade. Ele transita de uma arquitetura legada (SQLite) para uma infraestrutura moderna em **PostgreSQL**, oferecendo alta disponibilidade e integridade de dados para gestão completa do ciclo de vida do colaborador — desde o recrutamento até o desligamento.

O sistema foi desenvolvido **pelo setor de Gente e Gestão da Nordeste Locações** para resolver necessidades específicas do operations de RH. Inicialmente concebido como um **sistema primário de acompanhamento de fardamento**, o GG expandiu-se progressivamente para novos módulos, tornando-se a ferramenta central de gestão do setor. O sistema está em **constante evolução**, com atualizações regulares e encontra-se em pleno funcionamento em produção (VPS).

---

## Contribuintes

| Nome | Função | Contribuição |
|------|--------|--------------|
| **Nathanael Soeiro** | Analista de BI | Idealização, planejamento e especificação do sistema |
| **Caique Custódio** | Desenvolvedor | Implementação, arquitetura e manutenção do código |

---

## Pilares do Sistema

### Gestão de Talentos e Ciclo de Vida
- **Dossiê Digital Unificado:** Visão completa do colaborador integrando dados pessoais, contratuais, histórico de cargos, salários e documentos.
- **Múltiplos Vínculos por CPF:** Suporte a múltiplos contratos/vínculos por colaborador, com cálculo de tempo acumulado para gratificações por tempo de serviço.
- **Recrutamento e Seleção (R&S):** Pipeline visual, banco de talentos (Talent Pool) e gestão completa do funil de contratação.
- **Onboarding 90 dias:** Acompanhamento crítico dos primeiros três meses para garantir retenção e aculturamento.
- **Gestão de Carreira:** Promoções, transferências entre unidades e processos de desligamento rastreados.

### Compliance e Segurança do Trabalho (SST)
- **ASO (Atestado de Saúde Ocupacional):** Monitoramento rigoroso de exames admissionais, periódicos e demissionais com alertas de vencimento.
- **Gestão de Ocorrências:** Rastreabilidade de ocorrências disciplinares e seus impactos.
- **Certificados e Treinamentos:** Repositório de certificações técnicas e obrigatórias.

### Eficiência Operacional e Custos
- **Gestão de Horas Extras:** Análise detalhada de desvios e custos operacionais por unidade/setor, com dashboards analíticos.
- **Planejamento de Férias:** Calendário unificado com identificação de colaboradores em risco de férias vencidas.
- **Controle de Ativos:** Gestão de fardamentos (uniformes), ferramentas (cautela de equipamentos) e kits de integração — reduzindo perdas e garantindo padrão operacional.

### Inteligência de Dados (People Analytics)
- **Headcount Dinâmico:** Contagem de colaboradores por unidade, setor e período com capacidade de análise histórica.
- **População e Turnover:** Relatórios de evolução de quadro e motivos de desligamento.
- **Dashboard Analítico:** Gráficos e métricas para tomada de decisão estratégica.

---

## Arquitetura Técnica

### Stack
| Camada | Tecnologia |
|--------|------------|
| **Runtime** | Node.js (>=16.0.0) |
| **Framework** | Express.js 4.18.2 |
| **Banco de Dados** | PostgreSQL (principal), suporte legado SQLite |
| **Frontend** | Vanilla JS modular, Tailwind CSS (CDN), Chart.js, ApexCharts |
| **Segurança** | Helmet, CORS, Rate Limiting, bcrypt, JWT |

### Estrutura de Pastas
```
GG/
├── backend/                      # API Node.js + Express
│   ├── config/                   # Configurações (banco, variáveis ambiente)
│   ├── middleware/               # Middleware de autenticação (sessão/JWT)
│   ├── routes/                   # 38 arquivos de rotas (endpoints da API)
│   ├── services/                 # Camada de negócio (Analytics, Headcount, EmployeeCounter)
│   ├── migrations/               # Scripts de migração de banco
│   └── server.js                 # Entry point
├── public/                       # Frontend (HTML/CSS/JS vanilla)
│   ├── css/                      # Folhas de estilo
│   ├── js/
│   │   ├── modules/              # Módulos funcionais (recruitment,aso,vacation,etc)
│   │   ├── pages/                # Scripts de páginas específicas
│   │   └── utils/                # Utilitários
│   ├── layout/                   # Templates (header, sidebar)
│   ├── modals/                   # Templates de modais
│   ├── modules/                  # Módulos reutilizáveis
│   ├── templates/                # Templates de documentos
│   └── *.html                    # 32 páginas HTML
├── scripts/                      # Scripts de build, deploy e automação
├── docs/                         # Documentação técnica
├── logs/                         # Logs da aplicação
├── backups/                      # Backups de banco de dados
├── dados-config/                 # Guias de configuração por ambiente
├── package.json                  # Dependências npm
└── .env*                         # Configurações por ambiente
```

### Módulos de API (Backend Routes)

| Módulo | Endpoint Base | Descrição |
|--------|---------------|-----------|
| `auth` | `/api/auth` | Login, logout, gerenciamento de sessão |
| `employees` | `/api/employees` | CRUD básico de colaboradores |
| `employees-pro` | `/api/employees-pro` | Gestão avançada, vínculos, dossiê, documentos |
| `companies` | `/api/companies` | Unidades/empresas do grupo |
| `vacations` | `/api/vacations` | Planejamento e controle de férias |
| `overtime` | `/api/overtime` | Gestão e análise de horas extras |
| `aso` | `/api/aso` | Atestados de Saúde Ocupacional |
| `sst` | `/api/sst` | Segurança e Saúde do Trabalho |
| `career` | `/api/career` | Histórico de carreira, promoções |
| `recruitment` | `/api/recruitment` | Pipeline de recrutamento |
| `uniforms` | `/api/uniforms` | Gestão de fardamento |
| `tools` | `/api/tools` | Controle de ferramentas/cautela |
| `kits` | `/api/kits` | Kits de integração (onboarding) |
| `transfers` | `/api/transfers` | Transferências entre unidades |
| `occurrences` | `/api/occurrences` | Ocorrências disciplinares |
| `roles` | `/api/roles` | Papéis e permissões |
| `roles-matrix` | `/api/roles-matrix` | Matriz de permissões por papel |
| `human-center` | `/api/human-center` | People analytics |
| `headcount` | `/api/headcount` | Contagem de colaboradores por unidade |
| `population` | `/api/population` | Estatísticas populacionais |
| `analysis` | `/api/analysis` | Relatórios e análises |
| `onboarding` | `/api/onboarding` | Acompanhamento 90 dias |
| `notifications` | `/api/notifications` | Sistema de notificações |
| `activity` | `/api/activity` | Log de atividades |
| `archive` | `/api/archive` | Arquivo e desligamentos |
| `profile` | `/api/profile` | Perfil do usuário |
| `consulta-colaboradores` | `/api/consulta-colaboradores` | Busca de colaboradores |

### Telas e Páginas (Frontend)

| Página | Descrição |
|--------|-----------|
| `login.html` | Página de autenticação |
| `dashboard.html` | Dashboard principal com métricas |
| `colaboradores.html` | Lista de colaboradores |
| `employees-pro.html` | Gestão avançada de colaboradores |
| `employees-pro-new.html` | Formulário de novo colaborador |
| `employees-pro-editor.html` | Editor de dados do colaborador |
| `consulta-colaboradores.html` | Busca e consulta de colaboradores |
| `vacation-unified.html` | Gestão unificada de férias |
| `vacation-planning.html` | Planejamento de férias (calendário) |
| `vacation-archive.html` | Arquivo de férias |
| `vacation-dossier.html` | Dossiê de férias do colaborador |
| `vacation-analysis.html` | Análise de férias |
| `hora-extra.html` | Gestão de horas extras |
| `analise-hora-extra.html` | Análise gráfica de horas extras |
| `aso.html` | Gestão de ASO |
| `carreira.html` | Gestão de carreira |
| `recrutamento.html` | Pipeline de recrutamento |
| `talent-pool.html` | Banco de talentos |
| `uniforms-module.html` | Gestão de fardamento |
| `tools-module.html` | Gestão de ferramentas |
| `kit.html` | Kits de integração |
| `transfer-management.html` | Transferências entre unidades |
| `human-center.html` | People analytics |
| `perfil.html` | Perfil do usuário logado |
| `onboarding-90dias.html` | Acompanhamento de onboarding |
| `populacao.html` | Estatísticas populacionais |
| `role-matrix.html` | Matriz de permissões |
| `monitoring.html` | Monitoramento do sistema |
| `acessos.html` | Controle de acessos |
| `employee_manager.html` | Gerenciamento de colaboradores |
| `employee_raw.html` | Visualização bruta de dados |
| `editor-templates.html` | Editor de templates |

---

## Instalação

### Requisitos
- **Node.js:** >= 16.0.0
- **PostgreSQL:** >= 14
- **npm:** >= 8.0.0

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd GG

# 2. Instale as dependências
npm install

# 3. Configure o ambiente
cp .env.example .env
# Edite .env com suas configurações de banco de dados

# 4. Crie o banco de dados PostgreSQL
psql -U postgres -c "CREATE DATABASE rh;"
psql -U postgres -c "CREATE USER rhplus_user WITH PASSWORD '12Nordeste34+';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE rh TO rhplus_user;"

# 5. Execute as migrações
npm run db:migrate

# 6. (Opcional) Popule dados de teste
npm run db:seed

# 7. Inicie o servidor
npm run dev
```

Acesse: **http://localhost:3001**

---

## Comandos Disponíveis

### Banco de Dados
```bash
npm run db:status     # Verificar conexão com banco
npm run db:migrate    # Executar migrações
npm run db:seed       # Popular dados de teste
npm run db:reset      # Resetar banco de dados
npm run db:backup     # Criar backup
npm run db:sync-sqlite # Migrar dados do SQLite para PostgreSQL
```

### Ambientes
```bash
npm run dev           # Desenvolvimento (com hot-reload)
npm start             # Produção

# Trocar ambiente
npm run env:dev       # Desenvolvimento
npm run env:test      # Testes
npm run env:prod      # Produção

# Verificar deploy
npm run deploy:check  # Verifica configuração de produção
```

### Utilitários
```bash
npm run lint          # Verificar código (ESLint)
npm run logs          # Acompanhar logs em tempo real
```

---

## Ambientes

| Ambiente | Uso | Comando |
|----------|-----|---------|
| **Development** | Desenvolvimento local | `npm run dev` |
| **Test** | Testes automatizados | `NODE_ENV=test npm start` |
| **Production** | VPS/servidor de produção | `NODE_ENV=production npm start` |

### Configuração do ambiente `.env`

| Variável | Descrição |
|----------|-----------|
| `DB_HOST` | Host do PostgreSQL |
| `DB_PORT` | Porta do PostgreSQL (padrão: 5432) |
| `DB_NAME` | Nome do banco de dados |
| `DB_USER` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco |
| `PORT` | Porta do servidor (padrão: 3001) |
| `NODE_ENV` | Ambiente (development/test/production) |

---

## Deploy em VPS

### Rápido
```bash
# 1. Configure o .env com dados do VPS
# 2. Execute a verificação
npm run deploy:check

# 3. Inicie com PM2
pm2 start backend/server.js --name gg
pm2 save
pm2 startup
```

### Health Check
```bash
curl http://localhost:3001/health
```

Resposta:
```json
{
  "status": "ok",
  "environment": "production",
  "database": "connected",
  "version": "2.0.0"
}
```

---

## Segurança

- **Helmet:** Headers de segurança HTTP
- **Rate Limiting:** 100 req/15min em produção (500 para APIs de população)
- **CORS:** Configuração por ambiente
- **Compressão Gzip:** Redução de bandwidth
- **Logs de Acesso:** Morgan (dev no console, arquivo em produção)
- **Autenticação:** Sessão + JWT (configurável)
- **bcrypt:** Hash de senhas
- **Variáveis de ambiente:** Secrets nunca no código

---

## Documentação Adicional

| Documento | Descrição |
|-----------|-----------|
| `DOC-SISTEMA-GG.md` | Documentação estratégica e de negócio |
| `AUDITORIA-ESTRATEGICA-RH-PLUS.md` | Relatório de auditoria técnica |
| `GUIA-AMBIENTES.md` | Guia de configuração de ambientes |
| `docs/MIGRACAO-POSTGRESQL-COMPLETA-2026-04-30.md` | Documentação da migração PostgreSQL |
| `dados-config/` | Guias de configuração por ambiente |
| `.env.example` | Template de configuração |
| `PostgreSQL/` | Scripts e documentação do banco |

---

## Histórico de Versões

### v2.0.0 (Abril 2026)
- Arquitetura profissional multi-ambiente
- PostgreSQL com pool de conexões otimizado
- Scripts de automação de banco e deploy
- Sistema de health check
- Segurança reforçada (helmet, rate-limit)
- Camada de serviços transversal (analytics, headcount)
- Frontend modular com 32 páginas

---

## Suporte e Troubleshooting

### Erro de conexão PostgreSQL
```bash
pg_isready
npm run db:status
```

### Porta ocupada
```bash
# Altere no .env
PORT=3002
```

### Reset completo do banco
```bash
npm run db:reset
npm run db:migrate
npm run db:seed
```

---

**Desenvolvido por:** Nordeste Locações - Setor de Gente e Gestão
**Contribuinte Principal:** Nathanael Soeiro (Analista de BI)
**Desenvolvedor:** Caique Custódio
**Data de Criação:** 19 de Janeiro de 2026
**Licença:** PRIVATE
**Versão Atual:** 2.0.0
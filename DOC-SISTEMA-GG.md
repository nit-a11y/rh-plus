# Documentação Estratégica: Ecossistema RH+ (Nordeste Locações)

## 1. Visão Geral do Sistema
O **RH+** é um ecossistema integrado de gestão de capital humano, projetado para escalar operações de RH de alta complexidade. O sistema transita de uma arquitetura legada (SQLite) para uma infraestrutura robusta em **PostgreSQL**, oferecendo alta disponibilidade e integridade de dados.

---

## 2. Perspectiva do Gestor de RH Senior (Business Value)

Como gestor, o RH+ oferece controle 360º sobre o ciclo de vida do colaborador, focando em:

### A. Gestão de Talentos e Ciclo de Vida
- **Dossiê Unificado:** Visão completa do colaborador, integrando dados pessoais, contratuais, histórico de cargos e salários.
- **Recrutamento e Seleção (R&S):** Módulo avançado de triagem, matching de talentos e gestão de funil de contratação.
- **Onboarding (90 dias):** Acompanhamento crítico dos primeiros três meses para garantir retenção e aculturamento.

### B. Compliance e Segurança do Trabalho (SST)
- **Controle de ASO:** Monitoramento rigoroso de exames admissionais, periódicos e demissionais.
- **Gestão de Afastamentos:** Rastreabilidade de ocorrências e impactos na folha/operação.

### C. Eficiência Operacional e Custos
- **Gestão de Horas Extras:** Análise detalhada de desvios e custos operacionais por unidade/setor.
- **Planejamento de Férias:** Calendário unificado para evitar gargalos operacionais.
- **Controle de Ativos:** Gestão de fardamentos, ferramentas e kits de integração, reduzindo perdas e garantindo o padrão da empresa.

### D. Inteligência de Dados (People Analytics)
- **Headcount e Turnover:** Relatórios de evolução de quadro e motivos de desligamento.
- **Evolução Salarial:** Histórico detalhado para análise de mérito e orçamento.

---

## 3. Perspectiva do Desenvolvedor Senior (Arquitetura & Tech Stack)

### A. Core Stack
- **Runtime:** Node.js (>=16.0.0)
- **Framework:** Express.js
- **Banco de Dados:** PostgreSQL (Principal) com suporte legado a SQLite.
- **Frontend:** Vanilla JS com módulos, otimizado para performance sem sobrecarga de frameworks pesados.

### B. Módulos Técnicos (Backend Routes)
| Módulo | Endpoint Base | Responsabilidade Principal |
| :--- | :--- | :--- |
| **Auth** | `/api/auth` | JWT, Segurança e Rate Limiting. |
| **Employees Pro** | `/api/employees-pro` | Lógica complexa de vínculos, histórico salarial e documentos. |
| **Analysis** | `/api/analysis` | Agregações pesadas para dashboards e estatísticas por unidade. |
| **Career** | `/api/career` | Promoções, transferências e processos de desligamento. |
| **SST/ASO** | `/api/aso` / `/api/sst` | Gestão de saúde ocupacional e conformidade legal. |
| **Overtime** | `/api/overtime` | Processamento de horas extras e integrações de folha. |

### C. Diferenciais de Implementação
- **Migração Dinâmica:** Wrapper de banco que permite operar comandos SQL padrão em diferentes dialetos.
- **Segurança Camada 7:** Uso de `helmet`, `cors` e `express-rate-limit` configurados por tipo de recurso (API geral vs. API de população).
- **Escalabilidade de Dados:** Estrutura de `Pool` de conexões otimizada para produção (20 conexões simultâneas).

---

## 4. Mapa de Funcionalidades por Módulo

### 4.1 Gestão de Pessoas
- **Dossiê Digital:** Centralização de documentos e metadados do colaborador.
- **Histórico de Vínculos:** Suporte a múltiplos contratos/vínculos por CPF (acumulado).
- **Transferências:** Gestão de movimentação entre unidades e centros de custo.

### 4.2 Saúde e Segurança
- **Fila de Exames:** Alertas automáticos para vencimento de ASO.
- **Certificados:** Repositório de certificações técnicas e obrigatórias.

### 4.3 Operações e Logística de RH
- **Fardamento:** Controle de estoque e entregas de uniforme.
- **Ferramentas:** Registro de cautela de equipamentos.
- **Kits Onboarding:** Automação da entrega de materiais para novos contratados.

### 4.4 Analytics & BI
- **Dashboard de Evolução:** Gráficos de crescimento de quadro e massa salarial.
- **Filtros Avançados:** Busca por setor, unidade, cargo e tipo de contrato (CLT/PJ).

---

## 5. Próximos Passos de Evolução (Sugestão Senior)
1. **Refatoração de Rotas Old:** Eliminar duplicidade entre `archive_old.js` e `archive.js`.
2. **Centralização de Business Logic:** Mover lógicas pesadas de dentro dos arquivos de rota para `services/` dedicados.
3. **Frontend Modernization:** Avaliar a migração dos módulos Vanilla JS para componentes Web ou React para melhorar o estado global da aplicação.
4. **API Documentation:** Implementar Swagger para documentar formalmente os endpoints.

---
*Documento gerado em 06/05/2026 como parte da análise de sistema.*

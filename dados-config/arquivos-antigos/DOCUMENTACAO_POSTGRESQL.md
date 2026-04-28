# 📚 DOCUMENTAÇÃO COMPLETA - RH+ Sistema PostgreSQL

## 🎯 Visão Geral do Projeto

**Sistema:** RH+ - Sistema Profissional de Gestão de RH  
**Versão:** 2.0.0  
**Stack:** Node.js + Express + PostgreSQL  
**Autor:** Nordeste Locações  
**Data da Migração:** Abril 2026

---

## 🗄️ CONFIGURAÇÃO DO POSTGRESQL

### 1. Arquivo de Configuração `.env`

```bash
# ===========================================
# 🗄️ CONFIGURAÇÃO DO BANCO DE DADOS
# PostgreSQL - RH+ Sistema
# ===========================================

# Escolha o ambiente: development | test | production
NODE_ENV=development

# -------------------------------------------
# BANCO PRINCIPAL (Produção/Desenvolvimento)
# -------------------------------------------
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rh
DB_USER=rhplus_user
DB_PASSWORD=12Nordeste34+

# URL completa (opcional - sobrescreve configurações acima)
# DATABASE_URL=postgresql://rhplus_user:12Nordeste34+@localhost:5432/rh

# -------------------------------------------
# BANCO DE TESTES (para desenvolvimento seguro)
# -------------------------------------------
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=rh_test
TEST_DB_USER=rhplus_user
TEST_DB_PASSWORD=12Nordeste34+

# -------------------------------------------
# BANCO DE PRODUÇÃO (VPS/Cloud)
# -------------------------------------------
PROD_DB_HOST=seu-vps-ip
PROD_DB_PORT=5432
PROD_DB_NAME=rh
PROD_DB_USER=rhplus_prod
PROD_DB_PASSWORD=sua-senha-segura-aqui

# ===========================================
# 🔧 CONFIGURAÇÕES DO SERVIDOR
# ===========================================
PORT=3001
HOST=0.0.0.0

# ===========================================
# 🔐 SEGURANÇA
# ===========================================
JWT_SECRET=RhPlus2026NordesteSecureKey32CharX9!
SESSION_SECRET=NordesteSessaoSecreta2026RhPlusX7#

# ===========================================
# 📧 EMAIL (opcional - para notificações)
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app

# ===========================================
# 📝 LOGS
# ===========================================
LOG_LEVEL=info
# opções: debug, info, warn, error
```

---

## 📁 Estrutura do Projeto

```
RH+/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuração central do PostgreSQL
│   ├── database/
│   │   └── database.sqlite      # Backup SQLite (legado)
│   ├── middleware/
│   │   └── auth.js              # Middleware de autenticação
│   ├── migrations/              # Scripts de migração
│   │   ├── setup_pj_schema.js
│   │   ├── add_pj_columns.js
│   │   ├── create_pj_tables.js
│   │   └── ...
│   ├── routes/                  # 21 módulos migrados
│   │   ├── activity.js
│   │   ├── archive.js
│   │   ├── aso.js
│   │   ├── auth.js
│   │   ├── career.js
│   │   ├── companies.js
│   │   ├── employees.js
│   │   ├── employees_pro.js
│   │   ├── human_center.js
│   │   ├── kits.js
│   │   ├── occurrences.js
│   │   ├── overtime.js
│   │   ├── profile.js
│   │   ├── recruitment.js
│   │   ├── roles.js
│   │   ├── sst.js
│   │   ├── tools.js
│   │   ├── transfers.js
│   │   ├── uniforms.js
│   │   └── vacations.js
│   ├── .env                     # Configurações de ambiente
│   ├── database.js              # Interface de compatibilidade
│   ├── server.js                # Servidor Express
│   └── utils.js                 # Utilitários
├── package.json                 # Dependências do projeto
└── DOCUMENTACAO_POSTGRESQL.md   # Esta documentação
```

---

## 🔌 Configuração do Banco de Dados

### Arquivo: `backend/config/database.js`

```javascript
/**
 * 🗄️ CONFIGURAÇÃO PROFISSIONAL DE BANCO DE DADOS
 * Suporte a múltiplos ambientes: dev | test | prod
 */

const { Pool } = require('pg');
require('dotenv').config();

// Detectar ambiente atual
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Configurações por ambiente
 */
const configs = {
    development: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'rh',
        user: process.env.DB_USER || 'rhplus_user',
        password: process.env.DB_PASSWORD || '12Nordeste34+',
    },
    test: {
        host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.TEST_DB_PORT || process.env.DB_PORT || '5432'),
        database: process.env.TEST_DB_NAME || 'rh_test',
        user: process.env.TEST_DB_USER || process.env.DB_USER || 'rhplus_user',
        password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || '12Nordeste34+',
    },
    production: {
        host: process.env.PROD_DB_HOST || process.env.DB_HOST,
        port: parseInt(process.env.PROD_DB_PORT || process.env.DB_PORT || '5432'),
        database: process.env.PROD_DB_NAME || process.env.DB_NAME || 'rh',
        user: process.env.PROD_DB_USER || process.env.DB_USER,
        password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD,
    }
};
```

### Pool de Conexões

```javascript
function getPool() {
    if (!poolInstance) {
        const config = getConnectionConfig();
        
        poolInstance = new Pool({
            ...config,
            max: NODE_ENV === 'production' ? 20 : 10,        // Conexões máximas
            idleTimeoutMillis: 30000,                          // Timeout inativo
            connectionTimeoutMillis: 10000,                  // Timeout conexão
        });

        poolInstance.on('connect', () => {
            console.log(`✅ [${NODE_ENV}] Conectado ao PostgreSQL`);
        });

        poolInstance.on('error', (err) => {
            console.error(`❌ [${NODE_ENV}] Erro no pool:`, err.message);
        });
    }
    return poolInstance;
}
```

### Funções Exportadas

```javascript
module.exports = {
    db,              // Interface SQLite-compatível (run, all, get)
    query,           // Query assíncrona com logs
    transaction,     // Transações PostgreSQL
    getPool,         // Acesso ao pool
    checkConnection, // Verificação de conexão
    switchDatabase,  // Troca dinâmica de DB
    NODE_ENV,        // Ambiente atual
    configs          // Configurações
};
```

---

## 📦 Dependências (package.json)

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "body-parser": "^1.20.2",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^17.4.2",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "pg": "^8.20.0"           // ← Driver PostgreSQL
  }
}
```

---

## 🔄 MIGRAÇÃO SQLITE → POSTGRESQL

### O que foi migrado:

| Módulo | Status | Detalhes |
|--------|--------|----------|
| `activity.js` | ✅ Completo | Goals, demands, analytics |
| `archive.js` | ✅ Completo | Arquivamento de funcionários |
| `aso.js` | ✅ Completo | Exames admissionais, certificados |
| `auth.js` | ✅ Completo | Autenticação JWT |
| `career.js` | ✅ Completo | Histórico de carreira |
| `companies.js` | ✅ Completo | Cadastro de empresas |
| `employees.js` | ✅ Completo | Funcionários base |
| `employees_pro.js` | ✅ Completo | Funcionários avançado |
| `human_center.js` | ✅ Completo | Centro humano, calendário |
| `kits.js` | ✅ Completo | Controle de kits |
| `occurrences.js` | ✅ Completo | Ocorrências, disciplina |
| `overtime.js` | ✅ Completo | Horas extras |
| `profile.js` | ✅ Completo | Usuários, permissões |
| `recruitment.js` | ✅ Completo | Recrutamento, candidatos |
| `roles.js` | ✅ Completo | Cargos, CBO |
| `sst.js` | ✅ Completo | Segurança do trabalho |
| `tools.js` | ✅ Completo | Ferramentas diversas |
| `transfers.js` | ✅ Completo | Transferências |
| `uniforms.js` | ✅ Completo | Uniformes, EPIs |
| `vacations.js` | ✅ Completo | Férias, planejamento |

### Total: **21 módulos migrados**

---

## 🛠️ Scripts de Comando

```bash
# Desenvolvimento
npm run dev                 # Inicia servidor com nodemon

# Produção  
npm start                 # Inicia servidor produção

# Banco de Dados
npm run db:status         # Verifica status do PostgreSQL
npm run db:migrate        # Executa migrações
npm run db:seed           # Popula dados iniciais
npm run db:reset          # Reseta banco de dados
npm run db:backup         # Cria backup

# Setup
npm run setup             # Configuração inicial
npm run seed:users        # Cria usuários padrão
```

---

## 🚀 Servidor Express (server.js)

### Configurações Principais:

```javascript
const app = express();
const PORT = 3001;
const NODE_ENV = 'development';

// Segurança
app.use(helmet({...}));           // Headers de segurança
app.use(cors({...}));             // CORS configurado
app.use(rateLimit({...}));        // Rate limiting

// Body Parser
app.use(bodyParser.json({ limit: '50mb' }));

// Rotas (21 módulos)
app.use('/api/employees', employeeRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/overtime', overtimeRoutes);
// ... etc
```

---

## 🔐 Padrões de Código Migrados

### ANTES (SQLite - Callbacks):
```javascript
// ❌ Antigo - SQLite
router.get('/list', (req, res) => {
    db.all(`SELECT * FROM employees WHERE status = ?`, ['active'], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
```

### DEPOIS (PostgreSQL - Async/Await):
```javascript
// ✅ Novo - PostgreSQL
router.get('/list', async (req, res) => {
    try {
        const result = await query(`SELECT * FROM employees WHERE status = $1`, ['active']);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
```

### Placeholders:
- SQLite: `?` → PostgreSQL: `$1, $2, $3...`

### Transações:
- SQLite: `db.serialize()` → PostgreSQL: `await query('BEGIN') / COMMIT / ROLLBACK`

---

## 📝 Tabelas do Sistema

Principais entidades do banco:

- `employees` - Funcionários
- `employees_pro` - Dados profissionais
- `companies` - Empresas
- `roles_master` - Cargos
- `recruitment_jobs` - Vagas
- `recruitment_candidates` - Candidatos
- `recruitment_pipeline_stages` - Etapas de recrutamento
- `overtime_records` - Horas extras
- `vacation_records` - Férias
- `uniform_items` - Uniformes
- `sst_certificates` - Atestados
- `aso_records` - Exames admissionais
- `occurrences` - Ocorrências
- `career_history` - Histórico de carreira
- `users` - Usuários do sistema
- `goals` - Metas
- `user_demands` - Demandas de usuários
- `transfer_requests` - Transferências
- `activity_log` - Log de atividades

---

## ✅ Checklist de Migração Completa

- [x] Todas as queries convertidas para `$n` placeholders
- [x] Callbacks substituídos por `async/await`
- [x] Transações migradas para PostgreSQL
- [x] Funções de data SQLite → PostgreSQL
- [x] `LIKE` → `ILIKE` (case-insensitive)
- [x] `SUBSTR/INSTR` → `SUBSTRING/POSITION`
- [x] `strftime` → `EXTRACT/TO_CHAR`
- [x] `this.changes` → `result.rowCount`
- [x] Código duplicado removido
- [x] Erros de sintaxe corrigidos
- [x] 21 módulos testados

---

## 🌐 Deploy para VPS

### Configuração de Produção:

```bash
# 1. Atualizar .env
NODE_ENV=production
PROD_DB_HOST=seu-vps-ip
PROD_DB_USER=rhplus_prod
PROD_DB_PASSWORD=senha-segura

# 2. Instalar dependências
npm install

# 3. Executar migrações
npm run db:migrate

# 4. Popular dados iniciais
npm run db:seed

# 5. Iniciar servidor
npm start
```

### Recomendações VPS:
- PostgreSQL 14+
- Node.js 16+
- PM2 para gerenciamento de processos
- Nginx como reverse proxy
- SSL/TLS configurado

---

## 📞 Suporte

**Sistema:** RH+ v2.0.0 PostgreSQL  
**Stack:** Node.js + Express + PostgreSQL  
**Status:** ✅ **Migração Concluída**

**Total de módulos:** 21  
**Total de rotas:** ~150+  
**Ambientes:** Dev / Test / Prod

---

*Documentação gerada em Abril 2026*  
*Última atualização: Migração PostgreSQL Completa*

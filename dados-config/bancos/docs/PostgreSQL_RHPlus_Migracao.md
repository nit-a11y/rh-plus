# Guia de Migração: SQLite → PostgreSQL para RH+

> **Versão**: 1.0.0  
> **Projeto**: RH+  
> **Stack atual**: Node.js + Express + SQLite  
> **Stack alvo**: Node.js + Express + PostgreSQL  
> **Última atualização**: Abril 2026

---

## 📋 Sumário

1. [Por que migrar para PostgreSQL](#por-que-migrar-para-postgresql)
2. [Preparação do Ambiente](#preparação-do-ambiente)
3. [Instalação do PostgreSQL](#instalação-do-postgresql)
4. [Criação do Banco RH+](#criação-do-banco-rh)
5. [Migração dos Dados](#migração-dos-dados)
6. [Ajustes no Código do Sistema](#ajustes-no-código-do-sistema)
7. [Validação da Migração](#validação-da-migração)
8. [Rollback (se necessário)](#rollback-se-necessário)

---

## Por que migrar para PostgreSQL

### Indicadores que o SQLite está limitando o RH+

| Indicador | Descrição |
|-----------|-----------|
| `sqlite3.OperationalError: database is locked` | Erro frequente de bloqueio de banco |
| Múltiplos usuários simultâneos | SQLite permite apenas 1 escrita por vez |
| Banco de dados > 10GB | Degradação de performance no SQLite |
| Necessidade de backup automático | PostgreSQL tem ferramentas nativas |
| Autenticação de usuários do banco | SQLite não tem controle de acesso |

### Benefícios da Migração

- **Concorrência**: Múltiplos usuários simultâneos sem bloqueios
- **Escalabilidade**: Suporta crescimento ilimitado de dados
- **Backup**: Ferramentas profissionais (`pg_dump`, replicação)
- **Segurança**: Autenticação por usuário e permissões granulares
- **Recursos**: JSON nativo, busca de texto, triggers, etc.

---

## Preparação do Ambiente

### Pré-requisitos

- [ ] PostgreSQL 12 ou superior instalado
- [ ] pgLoader 3.6.0+ (ferramenta de migração)
- [ ] Acesso ao arquivo `.db` atual do RH+
- [ ] Backup do banco SQLite atual

### 1. Backup do Banco SQLite Atual

```bash
# Antes de qualquer coisa, faça uma cópia de segurança
copy rhplus.db rhplus_backup_pre_migracao.db

# Ou usando SQLite CLI
sqlite3 rhplus.db ".backup rhplus_backup_pre_migracao.db"
```

### 2. Instalar pgLoader (Ferramenta de Migração)

#### Windows

```powershell
# Baixar do site oficial: https://pgloader.io/
# Ou usar chocolatey
choco install pgloader
```

#### Ubuntu/Debian

```bash
sudo apt-get install pgloader
```

#### macOS

```bash
brew install pgloader
```

---

## Instalação do PostgreSQL

### Passo a Passo no Windows

1. **Download**: Acesse https://www.enterprisedb.com/downloads/postgresql
2. **Instalação**:
   - Execute como administrador
   - Porta: `5432` (padrão)
   - Senha do postgres: defina uma senha segura e anote
   - Componentes: Selecione PostgreSQL Server + pgAdmin + Command Line Tools

### Criação do Banco e Usuário RH+

#### Via pgAdmin

1. Abra **pgAdmin 4** (instalado com PostgreSQL)
2. Conecte no servidor local (senha definida na instalação)
3. **Criar usuário**:
   - Clique direito em **Login/Group Roles** → **Create** → **Login/Group Role**
   - **General**: Nome = `rhplus_user`
   - **Definition**: Senha = `sua_senha_segura`
   - **Privileges**: ☑ Can login? ☑ Create databases
4. **Criar banco**:
   - Clique direito em **Databases** → **Create** → **Database**
   - **General**: 
     - Database = `rhplus`
     - Owner = `rhplus_user`
   - **Definition**: Encoding = `UTF8`

#### Via psql (Alternativo)

```bash
# Acessar PostgreSQL como postgres
psql -U postgres -h localhost

# Criar usuário
CREATE USER rhplus_user WITH PASSWORD 'sua_senha_segura';

# Criar banco
CREATE DATABASE rhplus OWNER rhplus_user ENCODING 'UTF8';

# Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE rhplus TO rhplus_user;

# Sair
\q
```

---

## Migração dos Dados

### Método 1: pgLoader (Recomendado)

Crie um arquivo de configuração `rhplus_migration.load`:

```
LOAD DATABASE
    FROM sqlite:///C:/Users/NL - NIT/Desktop/RH+/backend/database/rhplus.db
    INTO postgresql://rhplus_user:sua_senha_segura@localhost:5432/rhplus

WITH include drop, create tables, create indexes, reset sequences

SET work_mem to '16MB', maintenance_work_mem to '512 MB'

CAST
    type integer when (= 1 precision) to boolean drop typemod using zero-if-null,
    type integer to serial drop typemod,
    type text to text drop typemod,
    type blob to bytea using hex-to-bytea,
    type real to float4

EXCLUDE TABLE NAMES LIKE 'sqlite_%'
;
```

**Execute a migração**:

```bash
# No terminal
pgloader rhplus_migration.load
```

#### Conversões Automáticas do pgLoader

| SQLite | PostgreSQL | Nota |
|--------|------------|------|
| `INTEGER PRIMARY KEY` | `SERIAL` | Auto-incremento |
| `INTEGER` (booleano 0/1) | `BOOLEAN` | Valores convertidos |
| `TEXT` (JSON válido) | `JSONB` | Se conteúdo for JSON |
| `TEXT` | `TEXT` | Texto normal |
| `REAL` | `FLOAT4` | Números decimais |
| `BLOB` | `BYTEA` | Dados binários |

### Método 2: SQL Dump (Alternativo)

Se pgLoader não funcionar:

```bash
# 1. Exportar SQLite para SQL
sqlite3 rhplus.db .dump > rhplus_dump.sql

# 2. Ajustar sintaxe (substituir tipos)
# Edite o arquivo e substitua:
# - INTEGER PRIMARY KEY -> SERIAL PRIMARY KEY
# - AUTOINCREMENT -> remova (SERIAL já faz isso)
# - date('now') -> CURRENT_DATE
# - datetime('now') -> NOW()

# 3. Importar para PostgreSQL
psql -U rhplus_user -d rhplus -h localhost -f rhplus_dump.sql
```

---

## Ajustes no Código do Sistema

### 1. Instalar Dependência

```bash
npm install pg
# Se ainda não tiver dotenv:
npm install dotenv
```

### 2. Criar Configuração de Conexão

#### `backend/config/database.js` (NOVO ARQUIVO)

```javascript
// Configuração de conexão com PostgreSQL
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do pool de conexões
const pool = new Pool({
  // Usar DATABASE_URL se disponível (produção)
  connectionString: process.env.DATABASE_URL,
  
  // Ou configuração individual (desenvolvimento)
  // host: process.env.DB_HOST || 'localhost',
  // port: parseInt(process.env.DB_PORT || '5432'),
  // database: process.env.DB_NAME || 'rhplus',
  // user: process.env.DB_USER || 'rhplus_user',
  // password: process.env.DB_PASSWORD || '',
  
  // Configurações do pool
  max: 20,                    // Máximo de conexões
  idleTimeoutMillis: 30000,   // Tempo máximo ocioso
  connectionTimeoutMillis: 2000, // Timeout de conexão
});

// Eventos do pool
pool.on('connect', () => {
  console.log('✅ PostgreSQL conectado');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool PostgreSQL:', err);
});

// Helper para executar queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executada', { text: text.substring(0, 50), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Erro na query:', { text, params, error: error.message });
    throw error;
  }
};

// Função para transações
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
```

### 3. Criar Arquivo `.env` (NOVO ARQUIVO)

#### `backend/.env` (ADICIONAR)

```bash
# PostgreSQL Configuration
DATABASE_URL=postgresql://rhplus_user:sua_senha_segura@localhost:5432/rhplus

# Ou variáveis separadas:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rhplus
DB_USER=rhplus_user
DB_PASSWORD=sua_senha_segura

# Node Environment
NODE_ENV=development
```

**⚠️ IMPORTANTE**: Adicione `.env` ao `.gitignore`:

```
# backend/.gitignore (ADICIONAR)
.env
```

### 4. Adaptar Módulos do Sistema

#### Exemplo: Adaptar Model de Usuários

**Antes (SQLite)**:
```javascript
// backend/models/usuario.js (ANTES)
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./database/rhplus.db');

export const criarUsuario = (dados) => {
  return new Promise((resolve, reject) => {
    const { nome, email, senha } = dados;
    db.run(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, senha],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...dados });
      }
    );
  });
};
```

**Depois (PostgreSQL)**:
```javascript
// backend/models/usuario.js (DEPOIS)
import { query } from '../config/database.js';

export const criarUsuario = async (dados) => {
  const { nome, email, senha } = dados;
  const result = await query(
    'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING *',
    [nome, email, senha]
  );
  return result.rows[0];
};

export const listarUsuarios = async () => {
  const result = await query('SELECT * FROM usuarios');
  return result.rows;
};

export const buscarUsuarioPorId = async (id) => {
  const result = await query('SELECT * FROM usuarios WHERE id = $1', [id]);
  return result.rows[0];
};
```

### 5. Principais Diferenças de Sintaxe

| Operação | SQLite | PostgreSQL |
|----------|--------|------------|
| **Parâmetros** | `?` | `$1, $2, $3...` |
| **Last ID** | `this.lastID` | `RETURNING id` |
| **Data atual** | `date('now')` | `CURRENT_DATE` |
| **Data/Hora atual** | `datetime('now')` | `NOW()` |
| **Limite** | `LIMIT n` | `LIMIT n` |
| **Concatenação** | `\|\|` | `\|\|` |
| **Booleano** | `0/1` | `true/false` |
| **Busca CASE** | `LIKE` (case-insensitive) | `ILIKE` |

### 6. Exemplo: Adaptar Rotas do Express

**Antes**:
```javascript
// backend/routes/usuarios.js (ANTES)
app.post('/usuarios', (req, res) => {
  const { nome, email } = req.body;
  db.run('INSERT INTO usuarios (nome, email) VALUES (?, ?)', [nome, email], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, nome, email });
  });
});
```

**Depois**:
```javascript
// backend/routes/usuarios.js (DEPOIS)
app.post('/usuarios', async (req, res) => {
  try {
    const { nome, email } = req.body;
    const result = await query(
      'INSERT INTO usuarios (nome, email) VALUES ($1, $2) RETURNING *',
      [nome, email]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## Validação da Migração

### Checklist de Verificação

- [ ] **Conexão**: Aplicação conecta ao PostgreSQL sem erros
- [ ] **Tabelas**: Todas as tabelas foram criadas
- [ ] **Dados**: Contagem de registros confere com SQLite
- [ ] **Integridade**: Chaves estrangeiras funcionam corretamente
- [ ] **Queries**: Principais queries retornam resultados idênticos
- [ ] **Inserção**: Novos registros são criados corretamente
- [ ] **Atualização**: Updates funcionam corretamente
- [ ] **Deleção**: Deletes funcionam corretamente

### Scripts de Validação

#### 1. Verificar Estrutura

```javascript
// scripts/validar-estrutura.js
import { query } from '../backend/config/database.js';

const validarEstrutura = async () => {
  console.log('🔍 Verificando estrutura do banco...\n');
  
  // Listar tabelas
  const tabelas = await query(`
    SELECT table_name 
    FROM information.tables 
    WHERE table_schema = 'public'
  `);
  
  console.log('Tabelas encontradas:');
  tabelas.rows.forEach(t => console.log(`  - ${t.table_name}`));
  
  // Verificar contagem em cada tabela
  console.log('\n📊 Contagem de registros:');
  for (const tabela of tabelas.rows) {
    const count = await query(`SELECT COUNT(*) FROM ${tabela.table_name}`);
    console.log(`  - ${tabela.table_name}: ${count.rows[0].count} registros`);
  }
};

validarEstrutura().catch(console.error);
```

#### 2. Verificar Integridade

```sql
-- No pgAdmin ou psql, execute:

-- Verificar chaves estrangeiras órfãs
SELECT 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

#### 3. Testar Operações CRUD

```javascript
// scripts/testar-crud.js
import { query, transaction } from '../backend/config/database.js';

const testarCRUD = async () => {
  console.log('🧪 Testando operações CRUD...\n');
  
  try {
    // CREATE
    console.log('1. Testando CREATE...');
    const insert = await query(
      'INSERT INTO usuarios (nome, email) VALUES ($1, $2) RETURNING *',
      ['Teste Migration', 'teste@migracao.com']
    );
    const novoId = insert.rows[0].id;
    console.log('   ✅ CREATE OK - ID:', novoId);
    
    // READ
    console.log('2. Testando READ...');
    const read = await query('SELECT * FROM usuarios WHERE id = $1', [novoId]);
    console.log('   ✅ READ OK - Encontrado:', read.rows[0].nome);
    
    // UPDATE
    console.log('3. Testando UPDATE...');
    await query('UPDATE usuarios SET nome = $1 WHERE id = $2', ['Nome Atualizado', novoId]);
    console.log('   ✅ UPDATE OK');
    
    // DELETE
    console.log('4. Testando DELETE...');
    await query('DELETE FROM usuarios WHERE id = $1', [novoId]);
    console.log('   ✅ DELETE OK');
    
    // Transaction
    console.log('5. Testando TRANSACTION...');
    await transaction(async (client) => {
      await client.query('INSERT INTO usuarios (nome, email) VALUES ($1, $2)', ['Trans 1', 't1@test.com']);
      await client.query('INSERT INTO usuarios (nome, email) VALUES ($1, $2)', ['Trans 2', 't2@test.com']);
    });
    console.log('   ✅ TRANSACTION OK');
    
    console.log('\n✅ Todos os testes passaram!');
  } catch (error) {
    console.error('\n❌ Erro nos testes:', error.message);
  }
};

testarCRUD();
```

---

## Rollback (se necessário)

Se precisar voltar para SQLite:

```bash
# 1. Parar a aplicação
# 2. Restaurar backup do SQLite
copy rhplus_backup_pre_migracao.db rhplus.db

# 3. Reverter código para versão SQLite
# (use git checkout ou restaure backup do código)
git checkout -- backend/config/database.js
git checkout -- backend/models/

# 4. Remover variáveis PostgreSQL do .env
# 5. Reinstalar dependências SQLite se necessário
npm uninstall pg
npm install sqlite3

# 6. Reiniciar aplicação
```

---

## Resumo da Migração

### Arquivos Novos

```
backend/
  config/
    database.js          # NOVO - Configuração PostgreSQL
  .env                   # NOVO/ATUALIZAR - Variáveis de ambiente
  
PostgreSQL/
  rhplus_migration.load  # NOVO - Config pgLoader
  PostgreSQL_Geral.md    # NOVO - Documentação geral
  PostgreSQL_RHPlus_Migracao.md  # NOVO - Este guia
```

### Arquivos Modificados

```
backend/
  models/*.js            # MODIFICAR - Adaptar para PostgreSQL
  routes/*.js            # MODIFICAR - Adaptar queries
  package.json           # MODIFICAR - Adicionar "pg"
  .gitignore             # MODIFICAR - Adicionar .env
```

### Comandos Rápidos

```bash
# 1. Instalar PostgreSQL
#    (baixar de https://www.enterprisedb.com/downloads/postgresql)

# 2. Criar banco e usuário (via pgAdmin)

# 3. Migrar dados
pgloader rhplus_migration.load

# 4. Instalar dependência Node
npm install pg dotenv

# 5. Configurar .env
#    (copiar de .env.example)

# 6. Validar migração
node scripts/validar-estrutura.js
node scripts/testar-crud.js

# 7. Iniciar aplicação
npm start
```

---

## Troubleshooting

### Erro: "database 'rhplus' does not exist"

**Solução**: Crie o banco via pgAdmin ou psql antes de rodar pgLoader.

### Erro: "permission denied for schema public"

**Solução**: Conceda privilégios ao usuário:
```sql
GRANT ALL ON SCHEMA public TO rhplus_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rhplus_user;
```

### Erro: "column 'id' does not exist" ao inserir

**Causa**: SQLite usa `this.lastID`, PostgreSQL usa `RETURNING id`.

**Solução**: Adicione `RETURNING *` nas queries de INSERT.

### Diferença de contagem de registros

**Verifique**: 
1. Sequences podem precisar de reset após migração:
```sql
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));
```

---

> **Dica**: Após a migração bem-sucedida, mantenha o backup do SQLite por pelo menos 30 dias antes de excluir definitivamente.

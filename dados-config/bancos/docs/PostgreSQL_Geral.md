# Guia Completo: PostgreSQL

> **Versão**: 1.0.0  
> **Última atualização**: Abril 2026  
> **Público-alvo**: Qualquer sistema que precise de banco de dados relacional robusto

---

## 📋 Sumário

1. [O que é PostgreSQL](#o-que-é-postgresql)
2. [Instalação](#instalação)
3. [Criando Banco de Dados e Usuários](#criando-banco-de-dados-e-usuários)
4. [Configuração de Aplicações](#configuração-de-aplicações)
5. [Melhores Práticas](#melhores-práticas)
6. [Comparação com SQLite](#comparação-com-sqlite)
7. [Recursos Avançados](#recursos-avançados)

---

## O que é PostgreSQL

PostgreSQL é um sistema de gerenciamento de banco de dados relacional (RDBMS) open-source, robusto e escalável. Ele opera no modelo **cliente-servidor**, diferente do SQLite que é serverless.

### Principais Características

| Característica | Descrição |
|----------------|-----------|
| **Modelo** | Cliente-servidor |
| **Concorrência** | MVCC (Multi-Version Concurrency Control) - permite 100+ conexões simultâneas |
| **Limite de dados** | Petabytes (SQLite: ~10GB recomendado) |
| **Tipos de dados** | Boolean, JSON, Array, UUID, geoespacial, etc. |
| **Extensibilidade** | Suporte a stored procedures, triggers, views materializadas |
| **Segurança** | Autenticação, controle de acesso por linha (row-level security) |

---

## Instalação

### Windows

#### Opção 1: Instalador EDB (Recomendado)

1. Acesse: https://www.enterprisedb.com/downloads/postgresql
2. Baixe o instalador para Windows (versão x86-64)
3. Execute como administrador

#### Passos do Instalador

```
1. Welcome → Next
2. Installation Directory → Next (ou escolha outro local)
3. Select Components:
   ☑ PostgreSQL Server
   ☑ pgAdmin 4
   ☑ Stack Builder
   ☑ Command Line Tools
4. Data Directory → Next
5. Password → Defina senha para usuário postgres
6. Port → 5432 (padrão)
7. Locale → Selecione pt_BR ou padrão do sistema
8. Pre Installation Summary → Next
9. Installing... → Finish
```

#### Opção 2: Chocolatey (Windows)

```powershell
choco install postgresql
```

### Linux (Ubuntu/Debian)

```bash
# Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS

```bash
# Usando Homebrew
brew install postgresql

# Iniciar
brew services start postgresql
```

### Verificação da Instalação

```bash
# Verificar versão
psql --version

# Acessar terminal PostgreSQL
sudo -u postgres psql

# Sair do psql
\q
```

---

## Criando Banco de Dados e Usuários

### Via psql (Terminal)

```bash
# Acessar como superusuário
sudo -u postgres psql

# Criar usuário
CREATE USER meu_usuario WITH PASSWORD 'minha_senha';

# Criar banco de dados
CREATE DATABASE meu_banco;

# Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE meu_banco TO meu_usuario;

# Criar banco a partir de template
CREATE DATABASE meu_banco2 TEMPLATE template1;

# Listar bancos
\l

# Listar usuários
\du
```

### Via pgAdmin (Interface Gráfica)

1. Abra o **pgAdmin 4**
2. Clique em **Servers** → **PostgreSQL [versão]**
3. Digite a senha do postgres (definida na instalação)

#### Criar Usuário

1. Clique com botão direito em **Login/Group Roles**
2. Selecione **Create** → **Login/Group Role**
3. Aba **General**: Digite o nome do usuário
4. Aba **Definition**: Configure:
   - **Password**: Senha do usuário
   - **Connection limit**: -1 (sem limite)
5. Aba **Privileges**: Habilite:
   - ☑ Can login?
   - ☑ Superuser (se necessário)
   - ☑ Create databases
6. Clique **Save**

#### Criar Banco de Dados

1. Clique com botão direito em **Databases**
2. Selecione **Create** → **Database**
3. Aba **General**:
   - **Database**: Nome do banco
   - **Owner**: Selecione o usuário criado
4. Aba **Definition** (opcional):
   - **Encoding**: UTF8
   - **Template**: template1
   - **Tablespace**: pg_default
5. Clique **Save**

---

## Configuração de Aplicações

### Node.js + Express (módulo `pg`)

#### Instalação

```bash
npm install pg
```

#### Conexão Simples (Client)

```javascript
// db.js - Conexão simples (não recomendado para produção)
import { Client } from 'pg';

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'meu_banco',
  user: 'meu_usuario',
  password: 'minha_senha',
});

await client.connect();

const res = await client.query('SELECT $1::text as message', ['Hello world!']);
console.log(res.rows[0].message);

await client.end();
```

#### Conexão com Pool (Recomendado para Produção)

```javascript
// db.js - Pool de conexões
import { Pool } from 'pg';

// Usando variável de ambiente (recomendado)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Ou configuração explícita:
  // host: 'localhost',
  // port: 5432,
  // database: 'meu_banco',
  // user: 'meu_usuario',
  // password: 'minha_senha',
  
  // Configurações do pool
  max: 20,                    // Máximo de conexões
  idleTimeoutMillis: 30000,   // Tempo máximo ocioso
  connectionTimeoutMillis: 2000, // Timeout de conexão
});

// Testar conexão
pool.on('connect', () => {
  console.log('Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Erro no pool PostgreSQL:', err);
});

// Função helper para queries
export const query = (text, params) => pool.query(text, params);

export default pool;
```

#### Uso no Express

```javascript
// server.js
import express from 'express';
import { query } from './db.js';

const app = express();

app.get('/usuarios', async (req, res) => {
  try {
    const result = await query('SELECT * FROM usuarios');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/usuarios', async (req, res) => {
  try {
    const { nome, email } = req.body;
    const result = await query(
      'INSERT INTO usuarios (nome, email) VALUES ($1, $2) RETURNING *',
      [nome, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});
```

#### String de Conexão (DATABASE_URL)

```
postgresql://usuario:senha@host:porta/banco?sslmode=require

# Exemplo:
postgresql://meu_usuario:minha_senha@localhost:5432/meu_banco

# Com SSL (produção):
postgresql://meu_usuario:minha_senha@db.exemplo.com:5432/meu_banco?sslmode=require
```

### Outras Linguagens

#### Python (psycopg2)

```python
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="meu_banco",
    user="meu_usuario",
    password="minha_senha"
)

cur = conn.cursor()
cur.execute("SELECT * FROM usuarios")
rows = cur.fetchall()

for row in rows:
    print(row)

cur.close()
conn.close()
```

#### PHP (PDO)

```php
<?php
$dsn = "pgsql:host=localhost;port=5432;dbname=meu_banco;";
$username = "meu_usuario";
$password = "minha_senha";

try {
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->query("SELECT * FROM usuarios");
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    echo "Erro: " . $e->getMessage();
}
?>
```

---

## Melhores Práticas

### 1. Use Connection Pooling

Sempre use pooling em aplicações com concorrência. A primeira conexão PostgreSQL é mais lenta (~50-100ms) devido à sobrecarga de rede e configuração.

### 2. Use Variáveis de Ambiente

**NUNCA** armazene credenciais no código. Use `.env`:

```bash
# .env
DATABASE_URL=postgresql://usuario:senha@host:porta/banco
```

```javascript
// Carregar dotenv
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

### 3. Use BIGINT ou UUID para Chaves Primárias

Evite `INT` - um dia você excederá o limite. A migração para `BIGINT` leva ~4 horas em tabelas grandes.

```sql
-- Opção 1: BIGSERIAL
CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

-- Opção 2: UUID (recomendado para sistemas distribuídos)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);
```

### 4. Roteie Credenciais Periodicamente

- Troque senhas trimestralmente
- Troque imediatamente ao remover membros da equipe
- Use ferramentas de secrets management (Vault, AWS Secrets Manager)

### 5. Indexação Inteligente

```sql
-- Índices simples
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- Índices parciais (economia de espaço)
CREATE INDEX idx_pedidos_ativos ON pedidos(data) WHERE status = 'ativo';

-- Índices para busca de texto
CREATE INDEX idx_documentos_conteudo ON documentos USING gin(to_tsvector('portuguese', conteudo));
```

### 6. Backup e Restore

```bash
# Backup de um banco
pg_dump -U postgres -d meu_banco > backup.sql

# Backup completo (todos os bancos)
pg_dumpall -U postgres > backup_completo.sql

# Restore
psql -U postgres -d meu_banco < backup.sql

# Restore com criação do banco
psql -U postgres -c "CREATE DATABASE meu_banco;"
psql -U postgres -d meu_banco < backup.sql
```

### 7. Monitoramento

```sql
-- Ver conexões ativas
SELECT * FROM pg_stat_activity;

-- Ver tamanho das tabelas
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver queries lentas
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Comparação com SQLite

| Aspecto | SQLite | PostgreSQL |
|---------|--------|------------|
| **Arquitetura** | Serverless (arquivo único) | Cliente-servidor |
| **Concorrência** | 1 escrita por vez | 100+ conexões simultâneas |
| **Limite de dados** | ~10GB recomendado | Petabytes |
| **Tipos de dados** | Básicos (NULL, INTEGER, REAL, TEXT, BLOB) | Avançados (JSON, Array, UUID, geoespacial) |
| **Autenticação** | Nenhuma (acesso ao arquivo) | Completa (usuários/roles) |
| **Backup** | Copiar arquivo | pg_dump, replicação |
| **Instalação** | Nenhuma necessária | Requer instalação do servidor |
| **Caso de uso** | Mobile, IoT, prototipagem | Web, enterprise, big data |

### Quando Usar SQLite

- Aplicações mobile/desktop locais
- Prototipagem rápida
- IoT e dispositivos embarcados
- Análise de dados local
- Sistemas de usuário único

### Quando Usar PostgreSQL

- Aplicações web com múltiplos usuários
- Sistemas que precisam escalar
- Dados maiores que 10GB
- Requisitos de alta concorrência
- Recursos avançados (full-text search, JSON, etc.)

---

## Recursos Avançados

### JSON/JSONB

```sql
-- Criar tabela com coluna JSONB
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255),
    atributos JSONB
);

-- Inserir dados
INSERT INTO produtos (nome, atributos) VALUES (
    'Notebook',
    '{"cor": "preto", "peso": 2.5, "processador": "Intel i7"}'
);

-- Consultar JSON
SELECT * FROM produtos WHERE atributos->>'cor' = 'preto';

-- Índice em campo JSON
CREATE INDEX idx_produtos_cor ON produtos((atributos->>'cor'));
```

### Full-Text Search

```sql
-- Criar índice de busca de texto
CREATE INDEX idx_artigos_busca ON artigos 
USING gin(to_tsvector('portuguese', conteudo));

-- Buscar
SELECT * FROM artigos 
WHERE to_tsvector('portuguese', conteudo) @@ to_tsquery('portuguese', 'postgresql & tutorial');
```

### Views Materializadas

```sql
-- Criar view materializada (cacheada)
CREATE MATERIALIZED VIEW relatorio_vendas AS
SELECT 
    categoria,
    SUM(valor) as total,
    COUNT(*) as quantidade
FROM vendas
GROUP BY categoria;

-- Atualizar view
REFRESH MATERIALIZED VIEW relatorio_vendas;

-- Índice na view materializada
CREATE INDEX idx_relatorio_categoria ON relatorio_vendas(categoria);
```

### Triggers

```sql
-- Criar função de trigger
CREATE OR REPLACE FUNCTION atualiza_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em tabela
CREATE TRIGGER trigger_atualiza_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION atualiza_updated_at();
```

---

## Recursos Adicionais

- **Documentação oficial**: https://www.postgresql.org/docs/
- **pgAdmin**: https://www.pgadmin.org/
- **node-postgres**: https://node-postgres.com/
- **PostgreSQL Wiki**: https://wiki.postgresql.org/

---

> **Nota**: Este guia cobre os conceitos essenciais. Para necessidades específicas, consulte a documentação oficial do PostgreSQL.

# Configuração do PostgreSQL - RH+ (Completo)

> **Projeto**: RH+ (Sistema de Gestão de RH e Fardamento)  
> **Data**: Abril 2026  
> **Status**: ✅ Em produção

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [O que foi feito](#o-que-foi-feito)
3. [Banco de Dados](#banco-de-dados)
4. [Migração de Dados](#migração-de-dados)
5. [Estrutura do Banco](#estrutura-do-banco)
6. [Problemas Encontrados e Soluções](#problemas-encontrados-e-soluções)
7. [Arquivos Criados/Modificados](#arquivos-criadosmodificados)
8. [Como Executar](#como-executar)
9. [Testes](#testes)
10. [Resolver Problemas](#resolver-problemas)

---

## Visão Geral

O sistema RH+ foi migrado do banco de dados SQLite para PostgreSQL. Esta documentação detalha todo o processo de configuração, migração e ajustes necessários.

### Dados da Conexão

| Configuração | Valor |
|-------------|-------|
| Host | localhost |
| Porta | 5432 |
| Banco | rh |
| Usuário | rhplus_user |
| Senha | 12Nordeste34+ |

---

## O que foi feito

### 1. Instalação das dependências Node.js

```bash
npm install pg dotenv
```

### 2. Criação do Banco de Dados

- Banco `rh` criado no PostgreSQL
- Usuário `rhplus_user` criado com senha `12Nordeste34+`
- Privilégios concedidos

### 3. Migração de Dados

- Todos os dados do SQLite migrados para PostgreSQL
- 41 tabelas criadas
- **2.477 registros** transferidos

### 4. Adaptação do Código

- `backend/database.js` reescrito para usar PostgreSQL
- Correção de queries com nomes de colunas case-sensitive
- Pool de conexões otimizado (singleton)

---

## Banco de Dados

### Tabelas e Registros

| Tabela | Registros | Status |
|--------|-----------|--------|
| employees | 159 | ✅ |
| users | 6 | ✅ |
| uniform_items | 242 | ✅ |
| career_history | 514 | ✅ |
| employee_benefits | 183 | ✅ |
| employee_documents | 160 | ✅ |
| employee_vinculos | 159 | ✅ |
| benefit_history | 295 | ✅ |
| vacation_records | 17 | ✅ |
| employee_terminations | 53 | ✅ |
| employee_archive | 53 | ✅ |
| user_demands | 173 | ✅ |
| roles_master | 88 | ✅ |
| kit_items | 39 | ✅ |
| kits_master | 12 | ✅ |
| uniform_history | 50 | ✅ |
|aso_records | 118 | ✅ |
|aso_history | 21 | ✅ |
| sst_certificates | 1 | ✅ |
| goals | 3 | ✅ |
| tool_items | 37 | ✅ |
| tool_history | 4 | ✅ |
| companies | 7 | ✅ |
| employee_dependents | 44 | ✅ |
| employee_emergency_contacts | 4 | ✅ |
| recruitment_pipeline_stages | 6 | ✅ |
| recruitment_stage_outcomes | 22 | ✅ |
| recruitment_jobs | 1 | ✅ |
| overtime_records | 1 | ✅ |
| occurrences | 1 | ✅ |
| user_sessions | 2 | ✅ |

### Estrutura das Principais Tabelas

#### employees
```
id, name, registrationNumber, role, sector, type, hierarchy, admissionDate, 
birthDate, currentSalary, photoUrl, street, city, neighborhood, state_uf, 
cep, employer_id, workplace_id, fatherName, motherName, gender, maritalStatus, 
ethnicity, educationLevel, placeOfBirth, personalEmail, personalPhone, 
work_schedule, work_scale, cbo, criado_em, lat, lng, initialRole, initialSalary, 
metadata, terminationReason, terminationDate, observation, cpf
```

#### users
```
id, name, username, password, photoUrl, role, permissions, currentThemeId, 
createdAt, lastLogin, login_time, status
```

---

## Migração de Dados

### Script de Migração

O arquivo `migrar_banco.js` realiza a migração completa:

```bash
node migrar_banco.js
```

### Características da Migração

- Preserva nomes de colunas com case-sensitive (ex: `registrationNumber`, `photoUrl`)
- Converte todos os campos para TEXT (para evitar problemas de tipo)
- Usa aspas duplas nos nomes de colunas para preservar case

### Verificação dos Dados

```bash
node verificar_banco.js
```

---

## Problemas Encontrados e Soluções

### 1. Timeout de Conexão

**Problema**: Muitas conexões simultâneas ao banco.

**Solução**: Implementado padrão Singleton no pool de conexões:
```javascript
let poolInstance = null;

function getPool() {
    if (!poolInstance) {
        poolInstance = new Pool({...});
    }
    return poolInstance;
}
```

### 2. Nomes de Colunas Case-Sensitive

**Problema**: PostgreSQL é case-sensitive para nomes de colunas sem aspas.

**Solução**: Usar aspas duplas nos nomes de colunas:
```sql
SELECT e."registrationNumber", e."photoUrl" FROM employees e
```

### 3. Falta de Espaço em JOINs

**Problema**: Queries com `JOINaso_records` (sem espaço).

**Solução**: Corrigido nos arquivos de rota.

---

## Arquivos Criados/Modificados

### Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `backend/database.js` | Conexão PostgreSQL |
| `backend/.env` | Variáveis de ambiente |
| `migrar_banco.js` | Script de migração |
| `verificar_banco.js` | Verificar dados |
| `test_query.js` | Testar queries |
| `test_conexao.js` | Testar conexão |

### Arquivos Modificados

- `backend/routes/employees_pro.js` - Correção de queries

---

## Como Executar

### 1. Iniciar o Servidor

```bash
npm start
```

O servidor inicia na porta **3001**.

### 2. Verificar Banco

```bash
node verificar_banco.js
```

### 3. Testar Conexão

```bash
node test_conexao.js
```

---

## Testes

### Testar API

Acesse no navegador:
```
http://localhost:3001/api/employees-pro/list-summary
```

### Testar Query Específica

```bash
node test_query.js
```

---

## Resolver Problemas

### Erro 500 na API

1. Verificar logs do terminal
2. Testar query diretamente:
   ```bash
   node test_query.js
   ```
3. Verificar banco:
   ```bash
   node verificar_banco.js
   ```

### "Conectado ao PostgreSQL" muitas vezes

Isso indica que o pool está criando novas conexões. Já foi corrigido com o padrão Singleton.

### Dados não aparecem

1. Verificar se há dados no banco:
   ```bash
   node verificar_banco.js
   ```

2. Testar query:
   ```bash
   node test_query.js
   ```

---

## Configurações do Banco

### backend/.env

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rh
DB_USER=rhplus_user
DB_PASSWORD=12Nordeste34+
NODE_ENV=development
```

### backend/database.js

```javascript
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'rh',
    user: 'rhplus_user',
    password: '12Nordeste34+',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});
```

---

## Próximos Passos

1. ✅ Banco PostgreSQL configurado
2. ✅ Dados migrados
3. ✅ Código adaptado
4. ⏳ Testes finais em andamento
5. ⏳ Limpar tabelas de teste (test_case, test_col)

---

> **Nota**: Esta documentação foi atualizada em Abril de 2026 após a migração completa do SQLite para PostgreSQL.

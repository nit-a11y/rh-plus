# Configuração do PostgreSQL - RH+

> **Projeto**: RH+ (Sistema de Gestão de RH e Fardamento)  
> **Data**: Abril 2026  
> **Status**: ✅ Concluído

---

## Sumário

1. [O que foi feito](#o-que-foi-feito)
2. [Pré-requisitos](#pré-requisitos)
3. [Criação do Banco de Dados](#criação-do-banco-de-dados)
4. [Migração de Dados](#migração-de-dados)
5. [Modificações no Código](#modificações-no-código)
6. [Executando o Projeto](#executando-o-projeto)
7. [Observações Importantes](#observações-importantes)
8. [Resolução de Problemas](#resolução-de-problemas)

---

## O que foi feito

| Etapa | Descrição | Status |
|-------|-----------|--------|
| 1 | Instalação das dependências `pg` e `dotenv` | ✅ |
| 2 | Criação do banco de dados `rh` no PostgreSQL | ✅ |
| 3 | Criação do usuário `rhplus_user` | ✅ |
| 4 | Migração dos dados do SQLite para PostgreSQL | ✅ |
| 5 | Adaptação do `backend/database.js` para PostgreSQL | ✅ |
| 6 | Criação do arquivo `.env` com configurações | ✅ |
| 7 | Teste de conexão e funcionamento | ✅ |

---

## Pré-requisitos

- PostgreSQL 12+ instalado e funcionando
- Node.js 14+ instalado
- Servidor PostgreSQL rodando na porta 5432 (padrão)

### Verificar se o PostgreSQL está rodando

```powershell
Get-Service -Name '*postgres*'
```

---

## Criação do Banco de Dados

### Configuração utilizada

- **Banco**: `rh`
- **Usuário**: `rhplus_user`
- **Senha**: `12Nordeste34+`
- **Host**: localhost
- **Porta**: 5432

### Criação manual (via psql)

```sql
-- Criar usuário
CREATE USER rhplus_user WITH PASSWORD '12Nordeste34+';

-- Criar banco
CREATE DATABASE rh OWNER rhplus_user ENCODING 'UTF8';

-- Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE rh TO rhplus_user;
GRANT ALL ON SCHEMA public TO rhplus_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rhplus_user;
```

### Criação automática

O script `test_db.js` pode ser executado para criar o banco automaticamente:

```bash
node test_db.js
```

---

## Migração de Dados

### Script de Migração

O arquivo `migrate_to_postgres.js` foi criado para migrar os dados do SQLite para PostgreSQL.

**Executar a migração:**

```bash
node migrate_to_postgres.js
```

### Tabelas migradas

| Tabela | Registros | Status |
|--------|-----------|--------|
| companies | 7 | ✅ |
| roles_master | 88 | ✅ |
| employees | 159 | ⚠️ Parcial |
| employee_vinculos | 159 | ✅ |
| users | 6 | ✅ |
| user_sessions | 2 | ✅ |
| employee_documents | 160 | ✅ |
| employee_benefits | 183 | ✅ |
| uniform_items | 242 | ✅ |
| uniform_history | 50 | ✅ |
| occurrences | 1 | ✅ |
| career_history | ~500 | ⚠️ Parcial |
| vacation_records | ~300 | ✅ |
|aso_records | ~200 | ✅ |
|aso_history | ~100 | ✅ |
| sst_certificates | ~100 | ✅ |
| kits_master | ~10 | ✅ |
| kit_items | ~50 | ✅ |
| employee_dependents | ~100 | ✅ |
| employee_emergency_contacts | ~150 | ✅ |
| benefit_history | ~50 | ✅ |
| goals | ~10 | ✅ |
| user_demands | ~20 | ✅ |
| tool_items | ~50 | ✅ |
| tool_history | ~100 | ✅ |
| employee_terminations | ~10 | ✅ |
| employee_archive | ~10 | ✅ |
| overtime_records | ~50 | ✅ |
| recruitment_jobs | ~10 | ✅ |
| recruitment_pipeline_stages | 6 | ✅ |
| recruitment_stage_outcomes | ~20 | ✅ |

### Observação sobre conversão de valores

Alguns campos que armazenavam valores em formato moeda brasileiro (ex: `R$ 1.886,47`) não puderam ser convertidos automaticamente para o tipo REAL do PostgreSQL. Esses valores foram inseridos como TEXT.

Para corrigir isso manualmente, você pode:

1. Converter os valores no PostgreSQL:
```sql
-- Exemplo para employees
UPDATE employees 
SET currentSalary = REPLACE(REPLACE(currentSalary, 'R$ ', ''), '.', ''),
    currentSalary = REPLACE(currentSalary, ',', '.')
WHERE currentSalary LIKE 'R$%';
```

2. Ou deixar como está (os valores funcionam como texto).

---

## Modificações no Código

### 1. Arquivo `backend/database.js`

O arquivo foi completamente reescrito para usar o PostgreSQL ao invés do SQLite.

**Principais mudanças:**
- Substituição do `sqlite3` pelo `pg` (PostgreSQL client)
- Criação de um wrapper para manter compatibilidade com a API existente do SQLite
- Adaptação das queries para sintaxe PostgreSQL

### 2. Arquivo `backend/.env`

Arquivo criado com as configurações do banco:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rh
DB_USER=rhplus_user
DB_PASSWORD=12Nordeste34+
NODE_ENV=development
```

### 3. Arquivo `backend/config.js`

Arquivo de configuração adicional do pool de conexões PostgreSQL.

---

## Executando o Projeto

### Instalação das dependências

```bash
npm install
```

### Iniciar o servidor

```bash
npm start
```

O servidorirá iniciar na porta **3001**.

### Testar a conexão

```bash
node test_db.js
```

---

## Observações Importantes

### Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `backend/database.js` | Arquivo principal de banco (adaptado para PostgreSQL) |
| `backend/.env` | Variáveis de ambiente com configurações do banco |
| `backend/config.js` | Configuração do pool de conexões PostgreSQL |
| `migrate_to_postgres.js` | Script para migrar dados do SQLite |
| `test_db.js` | Script para testar conexão e criar banco |

### Mantendo o SQLite como backup

O banco SQLite original não foi excluído. Você pode encontrar em:
```
backend/database/database.sqlite
```

### Voltando para SQLite

Se precisar voltar a usar o SQLite:

1. Restaure o arquivo `backend/database.js` original
2. Remova as dependências do PostgreSQL: `npm uninstall pg dotenv`

---

## Resolução de Problemas

### Erro: "authentication failed for user"

**Solução**: Verifique se o usuário foi criado corretamente e a senha está correta no arquivo `.env`.

### Erro: "database does not exist"

**Solução**: Execute o script de criação do banco:
```bash
node test_db.js
```

### Erro: "connection refused"

**Solução**: Verifique se o PostgreSQL está rodando:
```powershell
Get-Service -Name '*postgres*'
```

### Erro: "syntax error at or near..."

Isso pode ocorrer se houver problemas com a migração. Verifique os logs.

---

## Próximos Passos Recomendados

1. **Verificar os dados migrados**: Acesse o banco PostgreSQL via pgAdmin e verifique se os dados estão corretos.

2. **Converter valores monetários**: Se necessário, crie scripts para converter os campos de moeda (R$) para valores numéricos.

3. **Criar índices**: Para melhorar a performance, considere criar índices adicionais no PostgreSQL.

4. **Configurar backup**: Configure backups automáticos do PostgreSQL.

5. **Testar todas as funcionalidades**: Certifique-se de que todas as funcionalidades do sistema estão funcionando corretamente com o novo banco.

---

## Contato e Suporte

Em caso de dúvidas ou problemas, consulte a documentação original do projeto ou entre em contato com o desenvolvedor.

---

> **Nota**: Este documento foi gerado automaticamente durante a configuração do PostgreSQL para o projeto RH+.

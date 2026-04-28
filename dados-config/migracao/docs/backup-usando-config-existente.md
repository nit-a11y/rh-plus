# 🔐 BACKUP USANDO CONFIGURAÇÃO EXISTENTE

**Baseado na análise da pasta PostgreSQL/**  
**Data:** 28/04/2026

---

## 📋 **SUA CONFIGURAÇÃO ATUAL**

### **Dados do PostgreSQL (já configurado)**
- **Banco:** `rh`
- **Usuário:** `rhplus_user`
- **Senha:** `12Nordeste34+`
- **Host:** localhost
- **Porta:** 5432
- **Status:** ✅ Funcionando

### **Dados Migrados**
- **2.477 registros** transferidos
- **41 tabelas** criadas
- **Migração SQLite → PostgreSQL** concluída

---

## 🚀 **BACKUP MANUAL (USANDO CONFIG EXISTENTE)**

### **Passo 1: Abrir CMD**
```cmd
# Pressione Win + R
# Digite cmd
# Pressione Enter
```

### **Passo 2: Navegar para PostgreSQL**
```cmd
cd "C:\Program Files\PostgreSQL\18\bin"
```

### **Passo 3: Verificar conexão**
```cmd
psql -h localhost -U rhplus_user -d rh -c "SELECT COUNT(*) FROM users;"
```
*Digite a senha: `12Nordeste34+`*

### **Passo 4: Contar registros**
```cmd
psql -h localhost -U rhplus_user -d rh -c "SELECT COUNT(*) FROM users;"
psql -h localhost -U rhplus_user -d rh -c "SELECT COUNT(*) FROM employees;"
psql -h localhost -U rhplus_user -d rh -c "SELECT COUNT(*) FROM companies;"
```

### **Passo 5: Criar Backup**
```cmd
mkdir "C:\Users\NL - NIT\Desktop\GG\backups"
set DATA=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set DATA=%DATA: =0%

pg_dump -h localhost -U rhplus_user -d rh > "C:\Users\NL - NIT\Desktop\GG\backups\rh_backup_%DATA%.sql"
```

### **Passo 6: Verificar Backup**
```cmd
dir "C:\Users\NL - NIT\Desktop\GG\backups\rh_backup_*.sql"
```

---

## 🔍 **VERIFICAÇÃO DO BACKUP**

### **Tamanho do arquivo**
- Deve ter mais de 1MB (se tiver menos, algo deu errado)
- Arquivos .sql com 2.477 registros costumam ter 5-10MB

### **Testar restauração (opcional)**
```cmd
# Criar banco de teste
psql -U postgres -c "CREATE DATABASE rh_test_backup;"

# Restaurar backup no teste
psql -h localhost -U postgres rh_test_backup < "C:\Users\NL - NIT\Desktop\GG\backups\rh_backup_*.sql"

# Verificar
psql -U postgres rh_test_backup -c "SELECT COUNT(*) FROM users;"

# Remover banco de teste
psql -U postgres -c "DROP DATABASE rh_test_backup;"
```

---

## 🚀 **MIGRAÇÃO PARA VPS (APÓS BACKUP)**

### **Transferir Backup**
```cmd
scp "C:\Users\NL - NIT\Desktop\GG\backups\rh_backup_*.sql" root@147.93.10.11:/tmp/
```

### **Restaurar na VPS**
```bash
ssh root@147.93.10.11
cd /tmp
sudo -u postgres psql rh < rh_backup_*.sql
```

### **Verificar na VPS**
```bash
sudo -u postgres psql rh -c "SELECT COUNT(*) FROM users;"
sudo -u postgres psql rh -c "SELECT COUNT(*) FROM employees;"
sudo -u postgres psql rh -c "SELECT COUNT(*) FROM companies;"
```

---

## ⚠️ **OBSERVAÇÕES IMPORTANTES**

### **Sobre a Senha**
- Senha atual: `12Nordeste34+`
- Se não funcionar, verifique no arquivo `.env` do projeto
- Arquivo .env está em: `backend/.env`

### **Sobre o Banco**
- Nome: `rh`
- Se o banco não existir, use o script `setup_postgres.sql`
- Script está em: `PostgreSQL/setup_postgres.sql`

### **Sobre os Dados**
- Migração já foi feita (SQLite → PostgreSQL)
- 2.477 registros já estão no PostgreSQL
- Backup é para transferir esses dados para VPS

---

## 🔄 **ALTERNATIVA: USAR USUÁRIO GLOBAL**

Se preferir criar um usuário global (superuser) como discutido antes:

```sql
-- Criar usuário global
CREATE USER nit_admin WITH 
    PASSWORD 'NitAdmin2026!Secure'
    SUPERUSER 
    CREATEDB 
    CREATEROLE 
    INHERIT 
    LOGIN;

-- Usar no backup
pg_dump -h localhost -U nit_admin -d rh > backup.sql
```

---

## ✅ **CHECKLIST**

- [ ] PostgreSQL está rodando
- [ ] Banco `rh` existe
- [ ] Usuário `rhplus_user` funciona
- [ ] Backup criado com sucesso
- [ ] Backup tem tamanho adequado (>1MB)
- [ ] Backup transferido para VPS
- [ ] Dados restaurados na VPS
- [ ] Contagens batendo (local vs VPS)

---

**Vantagem:** Você já tem tudo configurado localmente! 
Só precisa fazer o backup e migrar para VPS. 🚀

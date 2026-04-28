# 🔐 BACKUP MANUAL POSTGRESQL - INSTRUÇÕES

**Problema:** Scripts automáticos com problemas de encoding/variáveis  
**Solução:** Executar comandos manualmente passo a passo

---

## 📋 **COMANDOS MANUAIS PARA BACKUP**

### **Passo 1: Abrir Terminal**
- Pressione `Win + R`
- Digite `cmd` ou `powershell`
- Pressione Enter

### **Passo 2: Navegar para pasta PostgreSQL**
```cmd
cd "C:\Program Files\PostgreSQL\18\bin"
```

### **Passo 3: Verificar conexão**
```cmd
psql -h localhost -U postgres -l
```
*Digite a senha do postgres quando solicitado*

### **Passo 4: Verificar banco RH**
```cmd
psql -h localhost -U postgres -c "\l rh"
```

### **Passo 5: Criar backup**
```cmd
set DATA=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set DATA=%DATA: =0%
set BACKUP_DIR=C:\Users\NL - NIT\Desktop\GG\backups

mkdir "%BACKUP_DIR%"

pg_dump -h localhost -U rhplus_user -d rh > "%BACKUP_DIR%\rh_backup_%DATA%.sql
```

### **Passo 6: Verificar backup**
```cmd
dir "%BACKUP_DIR%\rh_backup_*.sql"
```

### **Passo 7: Compactar (opcional)**
```cmd
gzip -c "%BACKUP_DIR%\rh_backup_%DATA%.sql" > "%BACKUP_DIR%\rh_backup_%DATA%.sql.gz"
```

---

## 🔍 **VERIFICAÇÃO MANUAL**

### **Contar registros antes do backup**
```cmd
psql -h localhost -U rhplus_user -d rh -c "SELECT COUNT(*) FROM users;"
psql -h localhost -U rhplus_user -d rh -c "SELECT COUNT(*) FROM employees;"
psql -h localhost -U rhplus_user -d rh -c "SELECT COUNT(*) FROM companies;"
```

### **Verificar backup criado**
```cmd
type "%BACKUP_DIR%\rh_backup_%DATA%.sql" | more
```

---

## 🚀 **MIGRAÇÃO MANUAL PARA VPS**

### **Passo 1: Transferir backup**
```cmd
scp "C:\Users\NL - NIT\Desktop\GG\backups\rh_backup_*.sql" root@147.93.10.11:/tmp/
```

### **Passo 2: Conectar na VPS**
```cmd
ssh root@147.93.10.11
```

### **Passo 3: Restaurar na VPS**
```bash
cd /tmp
gunzip rh_backup_*.sql.gz 2>/dev/null || true
sudo -u postgres psql rh < rh_backup_*.sql
```

### **Passo 4: Verificar restauração**
```bash
sudo -u postgres psql rh -c "SELECT COUNT(*) FROM users;"
sudo -u postgres psql rh -c "SELECT COUNT(*) FROM employees;"
sudo -u postgres psql rh -c "SELECT COUNT(*) FROM companies;"
```

---

## ⚠️ **SOLUÇÃO DE PROBLEMAS**

### **Erro: "banco de dados não existe"**
- Verifique se o nome do banco está correto
- Use `psql -h localhost -U postgres -l` para listar bancos

### **Erro: "usuário não existe"**
- Verifique se o usuário está correto
- Use `psql -h localhost -U postgres -c "\du"` para listar usuários

### **Erro: "connection refused"**
- Verifique se PostgreSQL está rodando
- Use `net start postgresql-x64-18` para iniciar

### **Erro: "permission denied"**
- Verifique se o usuário tem permissão no banco
- Conecte como postgres para conceder permissões

---

## 📞 **INSTRUÇÕES DETALHADAS**

### **1. Backup Completo Manual**
```cmd
REM Abrir CMD como Administrador
cd "C:\Program Files\PostgreSQL\18\bin"

REM Criar pasta de backups
mkdir "C:\Users\NL - NIT\Desktop\GG\backups"

REM Fazer backup
pg_dump -h localhost -U rhplus_user -d rh > "C:\Users\NL - NIT\Desktop\GG\backups\rh_backup_manual.sql"

REM Verificar
dir "C:\Users\NL - NIT\Desktop\GG\backups\rh_backup_manual.sql"
```

### **2. Testar Backup**
```cmd
REM Criar banco de teste
psql -h localhost -U postgres -c "CREATE DATABASE rh_test;"

REM Restaurar backup no teste
psql -h localhost -U postgres rh_test < "C:\Users\NL - NIT\Desktop\GG\backups\rh_backup_manual.sql"

REM Verificar
psql -h localhost -U postgres rh_test -c "SELECT COUNT(*) FROM users;"

REM Remover banco de teste
psql -h localhost -U postgres -c "DROP DATABASE rh_test;"
```

---

## ✅ **CHECKLIST FINAL**

- [ ] PostgreSQL está rodando
- [ ] Banco 'rh' existe
- [ ] Usuário 'rhplus_user' existe
- [ ] Backup criado com sucesso
- [ ] Backup verificado (tamanho > 1KB)
- [ ] Backup testado (restauração OK)
- [ ] Arquivo salvo em local seguro

---

**Recomendação:** Execute os comandos manualmente usando o terminal CMD. É mais seguro e você tem controle total sobre cada passo.

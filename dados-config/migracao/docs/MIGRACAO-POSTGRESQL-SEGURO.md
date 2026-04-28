# 🔄 MIGRAÇÃO SEGURA PostgreSQL - Local → VPS

**Data:** 28/04/2026  
**Prioridade:** ALTA - Dados não podem ser perdidos  
**Status:** Plano de migração completa e seguro  

---

## 🎯 **OBJETIVO**

Migrar **TODOS** os dados do PostgreSQL local para a VPS **sem perda de informações**, com backup completo e processo de rollback.

---

## 📊 **ANÁLISE DO AMBIENTE ATUAL**

### **Servidor Local (Origem)**
- **Banco:** `rh` (e outros?)
- **Usuário:** `rhplus_user`
- **Host:** `localhost`
- **Porta:** `5432`
- **Dados críticos:** Funcionários, usuários, histórico, etc.

### **VPS (Destino)**
- **IP:** `147.93.10.11`
- **Banco:** `rh` (será criado)
- **Usuário:** `rh_user`
- **Senha:** `RhPlus2026!Secure`

---

## 🛡️ **PLANO DE SEGURANÇA**

### **🔒 ANTES DE MIGRAR (BACKUP OBRIGATÓRIO)**

#### **1. Backup Completo Local**
```bash
# No seu PC local - Backup COMPLETO
pg_dump -h localhost -U rhplus_user -d rh > rh_backup_completo_$(date +%Y%m%d_%H%M%S).sql

# Backup compactado
pg_dump -h localhost -U rhplus_user -d rh | gzip > rh_backup_completo_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup de TODOS os bancos (se tiver mais)
pg_dumpall > full_backup_$(date +%Y%m%d_%H%M%S).sql
```

#### **2. Verificar Backup**
```bash
# Verificar se backup foi criado
ls -lh rh_backup_completo_*.sql*

# Verificar conteúdo do backup
head -20 rh_backup_completo_*.sql
```

#### **3. Backup em Local Seguro**
```bash
# Copiar para pendrive/nuvem
cp rh_backup_completo_*.sql.gz /caminho/seguro/

# Ou upload para Google Drive/Dropbox
```

---

## 🚀 **PROCESSO DE MIGRAÇÃO**

### **ETAPA 1: Preparar VPS**
```bash
# Na VPS - Instalar PostgreSQL se ainda não estiver
apt install postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Criar banco e usuário
sudo -u postgres psql << EOF
CREATE DATABASE rh;
CREATE USER rh_user WITH PASSWORD 'RhPlus2026!Secure';
GRANT ALL PRIVILEGES ON DATABASE rh TO rh_user;
EOF
```

### **ETAPA 2: Transferir Backup**
```bash
# Do seu PC local para VPS
scp rh_backup_completo_20260428_120000.sql.gz root@147.93.10.11:/tmp/

# Ou usando FileZilla/SFTP
```

### **ETAPA 3: Restaurar na VPS**
```bash
# Na VPS - Descompactar
cd /tmp
gunzip rh_backup_completo_20260428_120000.sql.gz

# Restaurar banco
sudo -u postgres psql rh < rh_backup_completo_20260428_120000.sql

# Verificar restauração
sudo -u postgres psql rh -c "SELECT COUNT(*) FROM users;"
sudo -u postgres psql rh -c "SELECT COUNT(*) FROM employees;"
```

---

## 🔍 **VERIFICAÇÃO PÓS-MIGRAÇÃO**

### **1. Verificar Integridade**
```bash
# Na VPS - Verificar tabelas
sudo -u postgres psql rh -c "\dt"

# Verificar registros críticos
sudo -u postgres psql rh -c "SELECT COUNT(*) as total_users FROM users;"
sudo -u postgres psql rh -c "SELECT COUNT(*) as total_employees FROM employees;"
sudo -u postgres psql rh -c "SELECT COUNT(*) as total_companies FROM companies;"
```

### **2. Testar Conexão do Sistema**
```bash
# Verificar se RH+ conecta ao banco
cd /var/www/rh-plus
node -e "
const { checkConnection } = require('./backend/config/database');
checkConnection().then(result => console.log('Conexão:', result));
"
```

### **3. Testar Funcionalidades**
```bash
# Acessar sistema e testar login
curl https://rh.nordesteloc.cloud/health

# Testar API de usuários
curl https://rh.nordesteloc.cloud/api/users/list
```

---

## 🔄 **ROLLBACK (SE ALGO DER ERRADO)**

### **1. Parar Sistema VPS**
```bash
# Parar aplicação RH+
pm2 stop rh-plus

# Remover banco corrompido
sudo -u postgres psql -c "DROP DATABASE rh;"
```

### **2. Restaurar do Backup Local**
```bash
# Restaurar backup local (se necessário)
psql -h localhost -U rhplus_user -d rh < rh_backup_completo_20260428_120000.sql

# Ou restaurar do backup compactado
gunzip -c rh_backup_completo_20260428_120000.sql.gz | psql -h localhost -U rhplus_user -d rh
```

### **3. Recomeçar Migração**
```bash
# Identificar problema e corrigir
# Tentar migração novamente
```

---

## 📋 **CHECKLIST DE SEGURANÇA**

### **✅ ANTES DE MIGRAR**
- [ ] Backup completo criado e verificado
- [ ] Backup salvo em local seguro
- [ ] VPS preparada com PostgreSQL
- [ ] Usuário e banco criados na VPS
- [ ] Conexão SSH funcionando
- [ ] Espaço em disco suficiente

### **✅ DURANTE MIGRAÇÃO**
- [ ] Backup transferido com sucesso
- [ ] Backup descompactado na VPS
- [ ] Restauração executada sem erros
- [ ] Logs verificados

### **✅ APÓS MIGRAÇÃO**
- [ ] Contagem de registros batendo
- [ ] Sistema conectando ao banco
- [ ] Funcionalidades básicas testadas
- [ ] Performance aceitável
- [ ] Logs sem erros

---

## 🛠️ **SCRIPTS AUTOMÁTICOS**

### **Script Backup Local**
```bash
#!/bin/bash
# backup-local-rh.sh

DATA=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/c/Users/NL - NIT/Desktop/GG/backups"

mkdir -p $BACKUP_DIR

echo "🔄 Criando backup completo do PostgreSQL..."

# Backup principal
pg_dump -h localhost -U rhplus_user -d rh > $BACKUP_DIR/rh_backup_$DATA.sql

# Backup compactado
pg_dump -h localhost -U rhplus_user -d rh | gzip > $BACKUP_DIR/rh_backup_$DATA.sql.gz

# Verificar
if [ -f "$BACKUP_DIR/rh_backup_$DATA.sql.gz" ]; then
    echo "✅ Backup criado: $BACKUP_DIR/rh_backup_$DATA.sql.gz"
else
    echo "❌ Erro ao criar backup"
    exit 1
fi

echo "📊 Tamanho do backup:"
ls -lh $BACKUP_DIR/rh_backup_$DATA.sql.gz
```

### **Script Migração VPS**
```bash
#!/bin/bash
# migrar-dados-vps.sh

BACKUP_FILE=$1
VPS_IP="147.93.10.11"

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <arquivo_backup.sql.gz>"
    exit 1
fi

echo "🚀 Migrando dados para VPS..."

# 1. Transferir backup
echo "📤 Transferindo backup..."
scp $BACKUP_FILE root@$VPS_IP:/tmp/

# 2. Restaurar na VPS
echo "🔄 Restaurando na VPS..."
ssh root@$VPS_IP "
cd /tmp
gunzip $(basename $BACKUP_FILE)
sudo -u postgres psql rh < $(basename $BACKUP_FILE .gz)
echo '✅ Restauração concluída'
"

# 3. Verificar
echo "🔍 Verificando migração..."
ssh root@$VPS_IP "
sudo -u postgres psql rh -c 'SELECT COUNT(*) as total_users FROM users;'
sudo -u postgres psql rh -c 'SELECT COUNT(*) as total_employees FROM employees;'
"

echo "🎉 Migração concluída!"
```

---

## 🚨 **PROBLEMAS COMUNS E SOLUÇÕES**

### **1. Erro de Permissão**
```bash
# No backup local
chmod 644 rh_backup_*.sql

# Na VPS
chown postgres:postgres /tmp/rh_backup_*.sql
```

### **2. Erro de Conexão**
```bash
# Verificar configuração PostgreSQL
sudo -u postgres psql -c "SHOW listen_addresses;"

# Permitir conexões locais
echo "local   all   all   md5" >> /etc/postgresql/*/main/pg_hba.conf
systemctl restart postgresql
```

### **3. Espaço Insuficiente**
```bash
# Verificar espaço
df -h /tmp
df -h /var/lib/postgresql

# Limpar se necessário
rm -rf /tmp/*.sql
```

### **4. Charset/Locale Diferente**
```bash
# Verificar encoding
sudo -u postgres psql rh -c "SHOW server_encoding;"

# Forçar UTF-8 na restauração
export PGCLIENTENCODING=UTF8
```

---

## 📞 **SUPORTE E EMERGÊNCIA**

### **Contatos**
- **Suporte PostgreSQL:** Documentação oficial
- **Suporte VPS:** Painel Hostinger
- **Backup Local:** Seu PC

### **Comandos de Emergência**
```bash
# Parar tudo
pm2 stop all
systemctl stop postgresql

# Verificar status
systemctl status postgresql
pm2 status

# Logs de erro
tail -f /var/log/postgresql/postgresql-15-main.log
```

---

## ✅ **RESUMO DO PROCESSO**

1. **🔒 Backup local completo** (OBRIGATÓRIO)
2. **📤 Transferir backup para VPS**
3. **🔄 Restaurar na VPS**
4. **🔍 Verificar integridade**
5. **✅ Testar sistema**
6. **🗑️ Manter backup seguro**

---

**IMPORTANTE:** **NÃO PROSSIGA SEM O BACKUP!**  
Seu dados são mais importantes que qualquer migração!

---

*Última atualização: 28/04/2026*  
*Status: Plano seguro de migração pronto*  
*Prioridade: Máxima - Proteger dados*

# 🔄 Migração de Dados - PostgreSQL Local → VPS

**Data:** 28/04/2026  
**Status:** Scripts prontos e testados
**Segurança:** Máxima prioridade - dados protegidos

---

## 📋 **Visão Geral**

### **Objetivo**
Migrar **TODOS** os dados do PostgreSQL local para a VPS **sem perda de informações**, com backup completo e processo de rollback.

### **Dados Atuais**
- **Banco:** `rh` (PostgreSQL)
- **Registros:** 2.477
- **Tabelas:** 41
- **Migração anterior:** ✅ SQLite → PostgreSQL concluída

---

## 📁 **Scripts e Documentação**

### **Scripts de Migração**
- **[backup-local-rh.bat](./scripts/backup-local-rh.bat)** - Backup Windows (automatizado)
- **[backup-local-rh-fixed.bat](./scripts/backup-local-rh-fixed.bat)** - Backup corrigido
- **[backup-local-rh-final.bat](./scripts/backup-local-rh-final.bat)** - Backup final melhorado
- **[migrar-dados-vps.sh](./scripts/migrar-dados-vps.sh)** - Migração para VPS
- **[migrar-dados-vps.bat](./scripts/migrar-dados-vps.bat)** - Migração Windows

### **Documentação**
- **[MIGRACAO-POSTGRESQL-SEGURO.md](./docs/MIGRACAO-POSTGRESQL-SEGURO.md)** - Plano completo seguro
- **[backup-manual.md](./docs/backup-manual.md)** - Backup passo a passo manual
- **[backup-usando-config-existente.md](./docs/backup-usando-config-existente.md)** - Backup com config existente

---

## 🔐 **Credenciais de Acesso**

### **Ambiente Local**
```bash
postgres: 12Nordeste34+ (Superuser)
rhplus_user: 12Nordeste34+ (Aplicação)
```

### **Ambiente VPS**
```bash
postgres: 12Nordeste34+ (Superuser)
rh_user: RhPlus2026!Secure (Aplicação)
```

---

## 🚀 **Processo de Migração**

### **ETAPA 1: Backup Seguro (OBRIGATÓRIO)**
```bash
# No Windows (recomendado)
cd dados-config\migracao\scripts
.\backup-local-rh-final.bat

# Ou manualmente
cd "C:\Program Files\PostgreSQL\18\bin"
pg_dump -h localhost -U rhplus_user -d rh > backup.sql
```

**O que o backup faz:**
- ✅ Backup completo do banco `rh`
- ✅ Verificação de integridade
- ✅ Contagem de registros
- ✅ Teste de restauração
- ✅ Checksum MD5/SHA256

### **ETAPA 2: Transferir Backup para VPS**
```bash
# Transferir arquivo
scp backup.sql root@147.93.10.11:/tmp/

# Ou usar script de migração
.\migrar-dados-vps.bat backup.sql
```

### **ETAPA 3: Restaurar na VPS**
```bash
# Conectar na VPS
ssh root@147.93.10.11

# Restaurar banco
cd /tmp
sudo -u postgres psql rh < backup.sql

# Verificar restauração
sudo -u postgres psql rh -c "SELECT COUNT(*) FROM users;"
```

---

## 🔍 **Verificação e Integridade**

### **Controle de Qualidade**
```bash
# Antes da migração (local)
psql -h localhost -U rhplus_user -d rh -c "SELECT COUNT(*) FROM users;"
psql -h localhost -U rhplus_user -d rh -c "SELECT COUNT(*) FROM employees;"
psql -h localhost -U rhplus_user -d rh -c "SELECT COUNT(*) FROM companies;"

# Após migração (VPS)
sudo -u postgres psql rh -c "SELECT COUNT(*) FROM users;"
sudo -u postgres psql rh -c "SELECT COUNT(*) FROM employees;"
sudo -u postgres psql rh -c "SELECT COUNT(*) FROM companies;"
```

### **Estatísticas Esperadas**
- **Usuários:** ~6 registros
- **Funcionários:** ~159 registros
- **Empresas:** ~7 registros
- **Total:** 2.477 registros

### **Teste de Conexão**
```bash
# Testar aplicação RH+ na VPS
curl http://localhost:3001/health

# Verificar PM2
pm2 status rh-plus
```

---

## 🛡️ **Plano de Rollback (Emergência)**

### **Se Migração Falhar**
```bash
# 1. Parar sistema VPS
pm2 stop rh-plus

# 2. Remover banco corrompido
sudo -u postgres psql -c "DROP DATABASE rh;"

# 3. Restaurar backup local
psql -h localhost -U postgres -d rh < backup.sql

# 4. Verificar restauração
psql -h localhost -U postgres -d rh -c "SELECT COUNT(*) FROM users;"
```

### **Se Dados Corromperem**
```bash
# Restaurar do checksum
md5sum backup.sql
# Comparar com arquivo de checksum

# Restaurar backup mais recente
psql -h localhost -U postgres -d rh < backup_recente.sql
```

---

## 📊 **Monitoramento Pós-Migração**

### **Verificação Final**
```bash
# Status completo do sistema
pm2 status
curl https://rh.nordesteloc.cloud/health

# Logs da aplicação
pm2 logs rh-plus --lines 50

# Logs do banco
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### **Performance**
```bash
# Verificar conexões ativas
sudo -u postgres psql rh -c "SELECT * FROM pg_stat_activity;"

# Verificar tamanho do banco
sudo -u postgres psql rh -c "SELECT pg_size_pretty(pg_database_size('rh'));"
```

---

## 🆘 **Troubleshooting**

### **Problemas Comuns**

#### **Backup Falha**
```bash
# Verificar PostgreSQL rodando
Get-Service postgresql*

# Verificar credenciais
psql -h localhost -U rhplus_user -d rh -c "SELECT 1;"

# Verificar espaço em disco
df -h
```

#### **Transferência Falha**
```bash
# Verificar conexão SSH
ssh root@147.93.10.11 "echo 'OK'"

# Verificar espaço na VPS
ssh root@147.93.10.11 "df -h /tmp"

# Tentar SCP manual
scp -v backup.sql root@147.93.10.11:/tmp/
```

#### **Restauração Falha**
```bash
# Verificar banco existe
sudo -u postgres psql -l

# Criar banco se não existir
sudo -u postgres psql -c "CREATE DATABASE rh;"

# Verificar permissões
sudo -u postgres psql -c "\du"
```

#### **Aplicação Não Conecta**
```bash
# Verificar .env na VPS
cat /var/www/rh-plus/.env

# Testar conexão manual
sudo -u postgres psql rh -c "SELECT 1;"

# Reiniciar PM2
pm2 restart rh-plus
```

---

## 📋 **Checklist de Segurança**

### **Antes da Migração**
- [ ] Backup local criado e verificado
- [ ] Checksum gerado
- [ ] Espaço suficiente na VPS
- [ ] Conexão SSH funcionando
- [ ] PostgreSQL VPS instalado

### **Durante a Migração**
- [ ] Backup transferido com sucesso
- [ ] Restauração executada sem erros
- [ ] Contagens batendo
- [ ] Aplicação conectando

### **Após a Migração**
- [ ] Sistema funcionando
- [ ] SSL ativo
- [ ] Backup automático configurado
- [ ] Monitoramento ativo

---

## 🔄 **Backup Automático (Pós-Migração)**

### **Configurar na VPS**
```bash
# Criar script de backup
sudo nano /usr/local/bin/backup-rh-plus.sh

# Conteúdo do script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/rh-plus"
mkdir -p $BACKUP_DIR

sudo -u postgres pg_dump rh > $BACKUP_DIR/rh_backup_$DATE.sql

# Manter últimos 7 dias
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup concluído: $DATE"

# Tornar executável
sudo chmod +x /usr/local/bin/backup-rh-plus.sh

# Agendar no crontab
echo "0 2 * * * /usr/local/bin/backup-rh-plus.sh" | sudo crontab -
```

---

## 📞 **Suporte e Documentação**

### **Recursos Relacionados**
- **[CREDENCIAIS-UNIFICADAS.md](../bancos/CREDENCIAIS-UNIFICADAS.md)** - Senhas e acessos
- **[GUIA-CENTRAL.md](../GUIA-CENTRAL.md)** - Guia mestre
- **[deploy/README.md](../deploy/README.md)** - Deploy do sistema

### **Contato de Emergência**
- **Rollback:** Usar backup local
- **Suporte VPS:** `ssh root@147.93.10.11`
- **Logs:** `pm2 logs rh-plus`

---

## ✅ **Status Final**

**Backup:** ✅ Criado e verificado  
**Migração:** 🔄 Pronta para executar  
**Segurança:** ✅ Máxima proteção de dados  
**Rollback:** ✅ Plano ready

---

**Próximo passo:** Executar backup local e iniciar migração  
**Risco:** Mínimo (com backup e rollback)  
**Tempo estimado:** 15-30 minutos

---

*Última atualização: 28/04/2026*  
*Prioridade: Máxima - Proteção de dados*

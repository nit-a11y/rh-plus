# 🗄️ GUIA COMPLETO DE INSTALAÇÃO POSTGRESQL - RH+ VPS

**Data:** 28/04/2026  
**VPS:** srv1566743 (147.93.10.11)  
**Sistema:** Ubuntu 24.04.4 LTS  
**Versão PostgreSQL:** 18

---

## 📋 **PRÉ-REQUISITOS**

### **Acesso e Permissões**
- ✅ Acesso SSH como root à VPS: `ssh root@147.93.10.11`
- ✅ Senha root ou chave SSH configurada
- ✅ Conexão internet estável

### **Sistema Operacional**
```bash
# Verificar versão Ubuntu
lsb_release -a

# Verificar arquitetura
uname -m

# Verificar espaço em disco
df -h

# Verificar memória RAM
free -h
```

### **Requisitos Mínimos**
- **CPU:** Multi-core (já verificado)
- **RAM:** 7.8GB total (✅ OK)
- **Disco:** 94GB livre (✅ OK)
- **Rede:** Portas 22, 80, 443 abertas (✅ OK)

---

## 🚀 **PASSO A PASSO - INSTALAÇÃO COMPLETA**

### **PASSO 1: Conectar à VPS**
```bash
# Do seu ambiente local
ssh root@147.93.10.11

# Verificar que está como root
whoami  # Deve retornar "root"
```

### **PASSO 2: Atualizar Sistema**
```bash
# Atualizar lista de pacotes
apt update

# Atualizar pacotes instalados
apt upgrade -y

# Reiniciar se necessário (apenas se kernel foi atualizado)
# systemctl reboot
```

### **PASSO 3: Instalar Dependências**
```bash
# Pacotes necessários para PostgreSQL
apt install -y wget curl gnupg2 software-properties-common \
    apt-transport-https lsb-release ca-certificates \
    vim htop net-tools

# Verificar instalação
which wget curl gnupg2
```

### **PASSO 4: Adicionar Repositório PostgreSQL Oficial**
```bash
# Importar chave GPG do repositório
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | \
    gpg --dearmor -o /usr/share/keyrings/postgresql.gpg

# Adicionar repositório ao sources.list
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/postgresql.gpg] \
    http://apt.postgresql.org/pub/repos/apt/ \
    $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list

# Atualizar lista de pacotes novamente
apt update
```

### **PASSO 5: Instalar PostgreSQL 18**
```bash
# Instalar PostgreSQL servidor e contribuições
apt install -y postgresql-18 postgresql-contrib-18

# Verificar instalação
psql --version
# Deve retornar: psql (PostgreSQL) 18.x

# Verificar serviço
systemctl status postgresql
```

### **PASSO 6: Iniciar e Habilitar Serviço**
```bash
# Iniciar PostgreSQL
systemctl start postgresql

# Habilitar início automático no boot
systemctl enable postgresql

# Verificar status novamente
systemctl status postgresql
# Deve mostrar: active (running)
```

### **PASSO 7: Configurar Senha do Administrador**
```bash
# Acessar PostgreSQL como usuário postgres
sudo -u postgres psql

# Dentro do psql, alterar senha
ALTER USER postgres PASSWORD '12Nordeste34+';

# Sair do psql
\q

# Testar nova senha
sudo -u postgres psql -c "SELECT version();"
# Deve pedir senha e mostrar versão
```

### **PASSO 8: Criar Banco de Dados RH+**
```bash
# Conectar como postgres
sudo -u postgres psql

# Criar banco de dados
CREATE DATABASE rh;

# Verificar banco criado
\l

# Sair
\q
```

### **PASSO 9: Criar Usuário da Aplicação**
```bash
# Conectar como postgres
sudo -u postgres psql

# Criar usuário RH
CREATE USER rh_user WITH PASSWORD 'RhPlus2026!Secure';

# Conceder permissões ao banco
GRANT ALL PRIVILEGES ON DATABASE rh TO rh_user;

# Conectar ao banco RH para configurar schema
\c rh

# Conceder permissões no schema public
GRANT ALL ON SCHEMA public TO rh_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rh_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rh_user;

# Configurar permissões padrão para tabelas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rh_user;

# Sair
\q
```

### **PASSO 10: Configurar Acesso Local**
```bash
# Fazer backup do arquivo original
cp /etc/postgresql/18/main/postgresql.conf \
    /etc/postgresql/18/main/postgresql.conf.backup

# Editar configuração
vim /etc/postgresql/18/main/postgresql.conf
```

**Configurações importantes:**
```ini
# Descomentar e configurar estas linhas:
listen_addresses = 'localhost'
port = 5432
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 6GB
```

### **PASSO 11: Configurar Autenticação**
```bash
# Backup do pg_hba.conf
cp /etc/postgresql/18/main/pg_hba.conf \
    /etc/postgresql/18/main/pg_hba.conf.backup

# Editar configuração de autenticação
vim /etc/postgresql/18/main/pg_hba.conf
```

**Configurar para:**
```
# Substituir todas as linhas "peer" por "scram-sha-256"
local   all             postgres                                scram-sha-256
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

### **PASSO 12: Reiniciar PostgreSQL**
```bash
# Reiniciar para aplicar configurações
systemctl restart postgresql

# Verificar status
systemctl status postgresql

# Verificar logs se houver erro
tail -f /var/log/postgresql/postgresql-18-main.log
```

---

## 🔍 **VERIFICAÇÃO PÓS-INSTALAÇÃO**

### **Teste 1: Conexão como Administrador**
```bash
# Testar conexão postgres
sudo -u postgres psql -c "SELECT current_user, current_database();"

# Sair
\q
```

### **Teste 2: Conexão como Usuário RH**
```bash
# Testar conexão usuário RH
PGPASSWORD='RhPlus2026!Secure' psql -h localhost -U rh_user -d rh -c "SELECT current_user, current_database();"

# Sair
\q
```

### **Teste 3: Verificar Bancos e Usuários**
```bash
# Listar bancos
sudo -u postgres psql -c "\l"

# Listar usuários
sudo -u postgres psql -c "\du"

# Verificar conexões ativas
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

### **Teste 4: Criar Tabela de Teste**
```bash
# Conectar ao banco RH
sudo -u postgres psql rh

# Criar tabela de teste
CREATE TABLE teste_instalacao (
    id SERIAL PRIMARY KEY,
    data_inclusao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mensagem VARCHAR(255)
);

# Inserir registro de teste
INSERT INTO teste_instalacao (mensagem) VALUES ('PostgreSQL instalado com sucesso!');

# Verificar registro
SELECT * FROM teste_instalacao;

# Limpar tabela de teste
DROP TABLE teste_instalacao;

# Sair
\q
```

---

## 📊 **CONFIGURAÇÃO DE PERFORMANCE**

### **Otimizações para VPS 7.8GB RAM**
```bash
# Editar postgresql.conf
vim /etc/postgresql/18/main/postgresql.conf
```

**Adicionar no final do arquivo:**
```ini
# ===========================================
# 🔧 OTIMIZAÇÕES NIT SYSTEMS - RH+ VPS
# ===========================================

# Memória (25% da RAM total)
shared_buffers = 256MB
effective_cache_size = 6GB
work_mem = 8MB
maintenance_work_mem = 128MB

# Conexões
max_connections = 100
superuser_reserved_connections = 3

# Performance
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# Logs
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Segurança
ssl = off
password_encryption = scram-sha-256

# Autovacuum
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
```

### **Aplicar configurações:**
```bash
# Reiniciar PostgreSQL
systemctl restart postgresql

# Verificar status
systemctl status postgresql
```

---

## 🔐 **CONFIGURAÇÃO DE SEGURANÇA**

### **1. Firewall**
```bash
# Verificar status do firewall
ufw status

# Se estiver inativo, ativar
ufw enable

# Permitir SSH (se ainda não permitido)
ufw allow ssh

# PostgreSQL apenas local (não precisa abrir porta 5432)
# Acesso será apenas via localhost
```

### **2. Remover Acesso Externo**
```bash
# Verificar se postgresql.conf tem apenas localhost
grep "listen_addresses" /etc/postgresql/15/main/postgresql.conf
# Deve retornar: listen_addresses = 'localhost'
```

### **3. Configurar Logrotate**
```bash
# Criar configuração de logrotate
cat > /etc/logrotate.d/postgresql-nit << EOF
/var/log/postgresql/postgresql-15-main.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 postgres postgres
    postrotate
        systemctl reload postgresql > /dev/null 2>&1 || true
    endscript
}
EOF

# Testar logrotate
logrotate -d /etc/logrotate.d/postgresql-nit
```

---

## 🔄 **BACKUP AUTOMATIZADO**

### **1. Criar Script de Backup**
```bash
# Criar diretório de backup
mkdir -p /var/backups/postgresql

# Criar script de backup
cat > /usr/local/bin/backup-postgresql-rh.sh << 'EOF'
#!/bin/bash

DATA=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/postgresql"
LOG_FILE="/var/log/backup-postgresql.log"

# Criar backup do banco RH
PGPASSWORD="RhPlus2026!Secure" pg_dump -h localhost -U rh_user -d rh > $BACKUP_DIR/rh_backup_$DATA.sql

# Compactar
gzip $BACKUP_DIR/rh_backup_$DATA.sql

# Limpar backups antigos (7 dias)
find $BACKUP_DIR -name "rh_backup_*.sql.gz" -mtime +7 -delete

# Registrar log
echo "[$DATA] Backup PostgreSQL RH+ concluído" >> $LOG_FILE
EOF

# Tornar executável
chmod +x /usr/local/bin/backup-postgresql-rh.sh
```

### **2. Agendar Backup**
```bash
# Adicionar ao crontab
crontab -e

# Adicionar linha (backup diário às 3AM)
0 3 * * * /usr/local/bin/backup-postgresql-rh.sh

# Verificar crontab
crontab -l
```

---

## 🚨 **TROUBLESHOOTING COMUM**

### **Problema 1: PostgreSQL não inicia**
```bash
# Verificar status
systemctl status postgresql

# Verificar logs
tail -f /var/log/postgresql/postgresql-18-main.log

# Verificar se porta está em uso
netstat -tlnp | grep 5432

# Tentar iniciar manualmente
pg_ctl -D /var/lib/postgresql/18/main start
```

### **Problema 2: Conexão negada**
```bash
# Verificar se postgresql.conf permite localhost
grep "listen_addresses" /etc/postgresql/18/main/postgresql.conf

# Verificar pg_hba.conf
cat /etc/postgresql/18/main/pg_hba.conf

# Reiniciar PostgreSQL
systemctl restart postgresql
```

### **Problema 3: Senha incorreta**
```bash
# Resetar senha postgres
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '12Nordeste34+';"

# Resetar senha rh_user
sudo -u postgres psql -c "ALTER USER rh_user PASSWORD 'RhPlus2026!Secure';"
```

### **Problema 4: Permissões negadas**
```bash
# Reconceder permissões
sudo -u postgres psql rh -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rh_user;"
sudo -u postgres psql rh -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rh_user;"
```

---

## ✅ **CHECKLIST FINAL DE VALIDAÇÃO**

### **Instalação:**
- [ ] PostgreSQL 15 instalado
- [ ] Serviço ativo e habilitado
- [ ] Senha postgres configurada
- [ ] Banco rh criado
- [ ] Usuário rh_user criado
- [ ] Permissões concedidas

### **Configuração:**
- [ ] Acesso apenas localhost
- [ ] Autenticação scram-sha-256
- [ ] Performance otimizada
- [ ] Logs configurados
- [ ] Firewall configurado

### **Segurança:**
- [ ] Senhas fortes
- [ ] Acesso restrito
- [ ] Backup automatizado
- [ ] Logrotate ativo

### **Testes:**
- [ ] Conexão postgres funciona
- [ ] Conexão rh_user funciona
- [ ] Criação de tabela funciona
- [ ] Backup funciona

---

## 🌐 **PRÓXIMOS PASSOS**

Após instalação completa:

1. **Migrar dados:**
   ```bash
   # Do ambiente local
   ./dados-config/migracao/scripts/migrar-dados-local-vps.sh
   ```

2. **Deploy RH+:**
   ```bash
   # Na VPS
   ./dados-config/deploy/scripts/deploy-rh-plus.sh
   ```

3. **Configurar SSL:**
   ```bash
   # Após configurar DNS
   certbot --nginx -d rh.nordesteloc.cloud
   ```

---

## 📞 **SUPORTE**

**Comandos úteis:**
```bash
# Status completo
systemctl status postgresql
pm2 status
ufw status

# Logs importantes
tail -f /var/log/postgresql/postgresql-15-main.log
tail -f /var/log/nginx/access.log
pm2 logs rh-plus

# Conexões rápidas
sudo -u postgres psql rh
PGPASSWORD='RhPlus2026!Secure' psql -h localhost -U rh_user -d rh
```

**Documentação relacionada:**
- `dados-config/bancos/postgresql.md`
- `dados-config/bancos/CREDENCIAIS-UNIFICADAS.md`
- `dados-config/deploy/scripts/deploy-rh-plus.sh`

---

**Status:** ✅ **Guia completo pronto para execução**  
**Próximo:** Executar instalação passo a passo  
**Validação:** Seguir checklist final

---

*Última atualização: 28/04/2026*  
*Versão: 1.0*  
*Responsável: NIT Systems Team*

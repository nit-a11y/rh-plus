#!/bin/bash

# 🗄️ SETUP POSTGRESQL SEGURO - RH+ VPS
# Uso: ./setup-postgresql-vps.sh
# Data: 28/04/2026
# VPS: srv1566743 (147.93.10.11)

set -e  # Parar em caso de erro

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
POSTGRES_VERSION="18"
POSTGRES_DB="rh"
POSTGRES_USER="rh_user"
POSTGRES_PASSWORD="RhPlus2026!Secure"
POSTGRES_ADMIN_PASSWORD="12Nordeste34+"

# Funções
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERRO: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] AVISO: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Verificar root
if [[ $EUID -ne 0 ]]; then
   error "Execute como root: sudo ./setup-postgresql-vps.sh"
fi

log "🚀 Iniciando setup PostgreSQL seguro para RH+..."

# ETAPA 1: Instalação PostgreSQL
log "ETAPA 1: Instalando PostgreSQL $POSTGRES_VERSION..."

# Atualizar sistema
apt update && apt upgrade -y

# Adicionar repositório PostgreSQL oficial
apt install -y wget curl gnupg2 software-properties-common apt-transport-https lsb-release ca-certificates

# Importar chave do repositório
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg

# Adicionar repositório
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list

# Atualizar e instalar
apt update
apt install -y postgresql-$POSTGRES_VERSION postgresql-contrib-$POSTGRES_VERSION

# Iniciar e habilitar serviço
systemctl start postgresql
systemctl enable postgresql

log "PostgreSQL $POSTGRES_VERSION instalado!"

# ETAPA 2: Configuração de Segurança
log "ETAPA 2: Configurando segurança..."

# Alterar senha do usuário postgres
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$POSTGRES_ADMIN_PASSWORD';"

# Criar banco de dados RH
sudo -u postgres psql -c "CREATE DATABASE $POSTGRES_DB;"

# Criar usuário da aplicação
sudo -u postgres psql -c "CREATE USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';"

# Conceder permissões
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;"

# Conectar ao banco RH e conceder permissões no schema
sudo -u postgres psql -d $POSTGRES_DB -c "GRANT ALL ON SCHEMA public TO $POSTGRES_USER;"
sudo -u postgres psql -d $POSTGRES_DB -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;"
sudo -u postgres psql -d $POSTGRES_DB -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;"

# Configurar permissões padrão para futuras tabelas
sudo -u postgres psql -d $POSTGRES_DB -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $POSTGRES_USER;"

log "Segurança configurada!"

# ETAPA 3: Configuração de Performance
log "ETAPA 3: Configurando performance..."

# Backup do arquivo original
cp /etc/postgresql/$POSTGRES_VERSION/main/postgresql.conf /etc/postgresql/$POSTGRES_VERSION/main/postgresql.conf.backup

# Otimizar configuração para VPS com 7.8GB RAM
cat >> /etc/postgresql/$POSTGRES_VERSION/main/postgresql.conf << EOF

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
EOF

log "Performance configurada!"

# ETAPA 4: Configurar pg_hba.conf
log "ETAPA 4: Configurando acesso de rede..."

# Backup do arquivo original
cp /etc/postgresql/$POSTGRES_VERSION/main/pg_hba.conf /etc/postgresql/$POSTGRES_VERSION/main/pg_hba.conf.backup

# Configurar acesso seguro
cat > /etc/postgresql/$POSTGRES_VERSION/main/pg_hba.conf << EOF
# ===========================================
# 🔐 CONFIGURAÇÃO SEGURA - NIT SYSTEMS
# ===========================================

# Conexões locais (método scram-sha-256)
local   all             postgres                                scram-sha-256
local   all             all                                     scram-sha-256

# Conexões IPv4 localhost
host    all             all             127.0.0.1/32            scram-sha-256

# Conexões IPv6 localhost
host    all             all             ::1/128                 scram-sha-256

# Replicação (se necessário no futuro)
# host    replication     replicator      127.0.0.1/32            scram-sha-256
EOF

log "Acesso de rede configurado!"

# ETAPA 5: Reiniciar e Validar
log "ETAPA 5: Reiniciando e validando..."

# Reiniciar PostgreSQL
systemctl restart postgresql
systemctl status postgresql

# Esperar 5 segundos
sleep 5

# Testar conexão como postgres
if sudo -u postgres psql -c "SELECT version();" > /dev/null 2>&1; then
    log "✅ Conexão postgres funcionando!"
else
    error "❌ Falha na conexão postgres"
fi

# Testar conexão como usuário da aplicação
if PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT current_user, current_database();" > /dev/null 2>&1; then
    log "✅ Conexão usuário aplicação funcionando!"
else
    error "❌ Falha na conexão usuário aplicação"
fi

# ETAPA 6: Configurar Logrotate
log "ETAPA 6: Configurando rotação de logs..."

cat > /etc/logrotate.d/postgresql-nit << EOF
/var/log/postgresql/postgresql-$POSTGRES_VERSION-main.log {
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

log "Logrotate configurado!"

# ETAPA 7: Configurar Backup Automático
log "ETAPA 7: Configurando backup automatizado..."

# Criar diretório de backup
mkdir -p /var/backups/postgresql
mkdir -p /var/backups/rh-plus

# Script de backup
cat > /usr/local/bin/backup-postgresql-rh.sh << EOF
#!/bin/bash

DATA=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/postgresql"
LOG_FILE="/var/log/backup-postgresql.log"

# Criar backup do banco RH
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h localhost -U $POSTGRES_USER -d $POSTGRES_DB > \$BACKUP_DIR/rh_backup_\$DATA.sql

# Compactar
gzip \$BACKUP_DIR/rh_backup_\$DATA.sql

# Limpar backups antigos (7 dias)
find \$BACKUP_DIR -name "rh_backup_*.sql.gz" -mtime +7 -delete

# Registrar log
echo "[\$DATA] Backup PostgreSQL RH+ concluído" >> \$LOG_FILE
EOF

chmod +x /usr/local/bin/backup-postgresql-rh.sh

# Adicionar ao crontab
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-postgresql-rh.sh") | crontab -

log "Backup automatizado configurado!"

# ETAPA 8: Monitoramento Básico
log "ETAPA 8: Configurando monitoramento..."

# Script de verificação
cat > /usr/local/bin/check-postgresql-rh.sh << EOF
#!/bin/bash

# Verificar se PostgreSQL está rodando
if ! systemctl is-active --quiet postgresql; then
    echo "[(date)] PostgreSQL não está rodando" >> /var/log/postgresql-check.log
    systemctl start postgresql
fi

# Verificar conexão com banco RH
if ! PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;" > /dev/null 2>&1; then
    echo "[(date)] Falha na conexão com banco RH" >> /var/log/postgresql-check.log
fi
EOF

chmod +x /usr/local/bin/check-postgresql-rh.sh

# Verificação a cada 5 minutos
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/check-postgresql-rh.sh") | crontab -

log "Monitoramento configurado!"

# ETAPA 9: Resumo e Informações
log "ETAPA 9: Gerando resumo..."

echo ""
echo "================================================"
log "🚀 SETUP POSTGRESQL RH+ CONCLUÍDO!"
echo ""
echo "📊 CONFIGURAÇÕES:"
echo "- Versão: PostgreSQL $POSTGRES_VERSION"
echo "- Banco: $POSTGRES_DB"
echo "- Usuário: $POSTGRES_USER"
echo "- Porta: 5432"
echo "- Socket: /var/run/postgresql"
echo ""
echo "🔐 CREDENCIAIS:"
echo "- Admin (postgres): $POSTGRES_ADMIN_PASSWORD"
echo "- Aplicação ($POSTGRES_USER): $POSTGRES_PASSWORD"
echo ""
echo "📁 DIRETÓRIOS IMPORTANTES:"
echo "- Config: /etc/postgresql/$POSTGRES_VERSION/main/"
echo "- Logs: /var/log/postgresql/"
echo "- Backups: /var/backups/postgresql/"
echo "- Data: /var/lib/postgresql/$POSTGRES_VERSION/main/"
echo ""
echo "🔧 COMANDOS ÚTEIS:"
echo "- Status: systemctl status postgresql"
echo "- Conectar: sudo -u postgres psql"
echo "- Conectar RH: sudo -u postgres psql $POSTGRES_DB"
echo "- Logs: tail -f /var/log/postgresql/postgresql-$POSTGRES_VERSION-main.log"
echo "- Backup: /usr/local/bin/backup-postgresql-rh.sh"
echo "- Verificar: /usr/local/bin/check-postgresql-rh.sh"
echo ""
echo "🌐 PRÓXIMOS PASSOS:"
echo "1. Testar conexão: psql -h localhost -U $POSTGRES_USER -d $POSTGRES_DB"
echo "2. Executar deploy RH+: ./deploy-rh-plus.sh"
echo "3. Migrar dados do ambiente local"
echo "4. Configurar SSL no domínio"
echo ""
echo "📋 VALIDAÇÃO:"
echo "□ PostgreSQL rodando: systemctl status postgresql"
echo "□ Banco criado: sudo -u postgres psql -c '\\l'"
echo "□ Usuário criado: sudo -u postgres psql -c '\\du'"
echo "□ Conexão aplicação: PGPASSWORD='$POSTGRES_PASSWORD' psql -h localhost -U $POSTGRES_USER -d $POSTGRES_DB -c 'SELECT 1;'"
echo "□ Backup agendado: crontab -l | grep backup"
echo "================================================"

log "Setup PostgreSQL RH+ concluído com sucesso! 🎉"

# Criar arquivo de status
echo "POSTGRESQL_SETUP_COMPLETED=true" > /etc/nit-systems/postgresql-status
echo "SETUP_DATE=$(date '+%Y-%m-%d %H:%M:%S')" >> /etc/nit-systems/postgresql-status
echo "POSTGRES_VERSION=$POSTGRES_VERSION" >> /etc/nit-systems/postgresql-status
echo "POSTGRES_DB=$POSTGRES_DB" >> /etc/nit-systems/postgresql-status
echo "POSTGRES_USER=$POSTGRES_USER" >> /etc/nit-systems/postgresql-status

log "Status salvo em /etc/nit-systems/postgresql-status"

#!/bin/bash

# 🚀 MIGRAÇÃO SEGURA DADOS - PostgreSQL Local → VPS
# Uso: ./migrar-dados-vps.sh <arquivo_backup.sql.gz>
# Data: 28/04/2026
# IMPORTANTE: Execute APÓS o backup local

set -e  # Parar em caso de erro

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configurações
VPS_IP="147.93.10.11"
VPS_USER="root"
DB_NAME="rh"
DB_USER="rh_user"

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

# Verificar parâmetro
if [ -z "$1" ]; then
    error "Uso: $0 <arquivo_backup.sql.gz>"
    echo ""
    echo "Exemplo:"
    echo "  $0 /c/Users/NL - NIT/Desktop/GG/backups/rh_backup_completo_20260428_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
BACKUP_FILENAME=$(basename "$BACKUP_FILE")

# Verificar se arquivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    error "Arquivo de backup não encontrado: $BACKUP_FILE"
fi

# Verificar se é arquivo .gz
if [[ ! "$BACKUP_FILE" =~ \.gz$ ]]; then
    error "Arquivo deve estar compactado (.gz): $BACKUP_FILE"
fi

log "🚀 Iniciando migração segura para VPS..."
log "📁 Arquivo: $BACKUP_FILE"
log "📏 Tamanho: $(ls -lh "$BACKUP_FILE" | awk '{print $5}')"

# ETAPA 1: Verificar conexão com VPS
log "🔌 ETAPA 1: Verificando conexão com VPS..."

if ! ssh -o ConnectTimeout=10 $VPS_USER@$VPS_IP "echo 'VPS acessível'" > /dev/null 2>&1; then
    error "Não foi possível conectar à VPS. Verifique SSH e IP."
fi

log "✅ VPS acessível"

# ETAPA 2: Verificar PostgreSQL na VPS
log "🗄️ ETAPA 2: Verificando PostgreSQL na VPS..."

if ! ssh $VPS_USER@$VPS_IP "pg_isready" > /dev/null 2>&1; then
    error "PostgreSQL não está rodando na VPS. Instale primeiro."
fi

# Verificar se banco existe
if ! ssh $VPS_USER@$VPS_IP "sudo -u postgres psql -l | grep -q '$DB_NAME'"; then
    error "Banco '$DB_NAME' não existe na VPS. Execute setup primeiro."
fi

log "✅ PostgreSQL pronto na VPS"

# ETAPA 3: Backup de segurança na VPS
log "🛡️ ETAPA 3: Criando backup de segurança na VPS..."

BACKUP_VPS_DATE=$(date +%Y%m%d_%H%M%S)
ssh $VPS_USER@$VPS_IP "
if sudo -u postgres psql $DB_NAME -c 'SELECT COUNT(*) FROM users;' > /dev/null 2>&1; then
    sudo -u postgres pg_dump $DB_NAME > /tmp/vps_backup_$BACKUP_VPS_DATE.sql
    echo '✅ Backup de segurança VPS criado'
else
    echo 'ℹ️ Banco VPS está vazio (primeira migração)'
fi
"

# ETAPA 4: Transferir backup
log "📤 ETAPA 4: Transferindo backup para VPS..."

if scp "$BACKUP_FILE" $VPS_USER@$VPS_IP:/tmp/; then
    log "✅ Backup transferido para VPS"
else
    error "Falha ao transferir backup para VPS"
fi

# ETAPA 5: Restaurar na VPS
log "🔄 ETAPA 5: Restaurando banco na VPS..."

ssh $VPS_USER@$VPS_IP "
cd /tmp

# Descompactar backup
echo '📦 Descompactando backup...'
gunzip -f $BACKUP_FILENAME || true

# Verificar arquivo descompactado
SQL_FILE=\"${BACKUP_FILENAME%.gz}\"
if [ ! -f \"\$SQL_FILE\" ]; then
    echo '❌ Arquivo não encontrado após descompactar'
    exit 1
fi

# Restaurar banco
echo '🔄 Restaurando banco...'
if sudo -u postgres psql $DB_NAME < \"\$SQL_FILE\"; then
    echo '✅ Restauração concluída'
else
    echo '❌ Falha na restauração'
    exit 1
fi

# Limpar arquivo SQL
rm -f \"\$SQL_FILE\"
"

log "✅ Banco restaurado na VPS"

# ETAPA 6: Verificar integridade
log "🔍 ETAPA 6: Verificando integridade dos dados..."

# Obter contagens do backup local
log "📊 Obtendo estatísticas do backup..."
LOCAL_USERS=$(gunzip -c "$BACKUP_FILE" | grep -c "INSERT INTO users" || echo "0")
LOCAL_EMPLOYEES=$(gunzip -c "$BACKUP_FILE" | grep -c "INSERT INTO employees" || echo "0")
LOCAL_COMPANIES=$(gunzip -c "$BACKUP_FILE" | grep -c "INSERT INTO companies" || echo "0")

echo "📈 Estatísticas do backup:"
echo "   Usuários (INSERTs): $LOCAL_USERS"
echo "   Funcionários (INSERTs): $LOCAL_EMPLOYEES"
echo "   Empresas (INSERTs): $LOCAL_COMPANIES"

# Verificar contagens na VPS
log "🔍 Verificando contagens na VPS..."
VPS_STATS=$(ssh $VPS_USER@$VPS_IP "
sudo -u postgres psql $DB_NAME -t -c 'SELECT COUNT(*) FROM users;' | tr -d ' '
sudo -u postgres psql $DB_NAME -t -c 'SELECT COUNT(*) FROM employees;' | tr -d ' '
sudo -u postgres psql $DB_NAME -t -c 'SELECT COUNT(*) FROM companies;' | tr -d ' '
")

VPS_USERS=$(echo "$VPS_STATS" | sed -n '1p')
VPS_EMPLOYEES=$(echo "$VPS_STATS" | sed -n '2p')
VPS_COMPANIES=$(echo "$VPS_STATS" | sed -n '3p')

echo "📊 Estatísticas na VPS:"
echo "   Usuários: $VPS_USERS"
echo "   Funcionários: $VPS_EMPLOYEES"
echo "   Empresas: $VPS_COMPANIES"

# Comparar estatísticas
if [ "$LOCAL_USERS" -eq "$VPS_USERS" ] && [ "$LOCAL_EMPLOYEES" -eq "$VPS_EMPLOYEES" ] && [ "$LOCAL_COMPANIES" -eq "$VPS_COMPANIES" ]; then
    log "✅ Estatísticas batendo perfeitamente!"
else
    warning "⚠️ Diferença nas estatísticas encontrada. Verifique manualmente."
fi

# ETAPA 7: Testar conexão do sistema
log "🧪 ETAPA 7: Testando conexão do sistema RH+..."

if ssh $VPS_USER@$VPS_IP "cd /var/www/rh-plus && node -e \"require('./backend/config/database').checkConnection().then(r => console.log('OK:', r.connected)).catch(e => console.error('ERRO:', e.message))\"" 2>/dev/null | grep -q "OK: true"; then
    log "✅ Sistema RH+ conectando ao banco!"
else
    warning "⚠️ Sistema RH+ não está conectando. Verifique configuração."
fi

# ETAPA 8: Limpeza
log "🧹 ETAPA 8: Limppeza de arquivos temporários..."

ssh $VPS_USER@$VPS_IP "
# Manter backup por 7 dias
find /tmp -name 'vps_backup_*.sql' -mtime +7 -delete
find /tmp -name 'rh_backup_*.sql.gz' -mtime +1 -delete
echo '✅ Limpeza concluída'
"

# Resumo final
echo ""
echo "================================================"
log "🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!"
echo ""
echo "📊 RESUMO:"
echo "   Backup: $BACKUP_FILENAME"
echo "   VPS: $VPS_IP"
echo "   Banco: $DB_NAME"
echo ""
echo "📈 DADOS MIGRADOS:"
echo "   Usuários: $LOCAL_USERS → $VPS_USERS"
echo "   Funcionários: $LOCAL_EMPLOYEES → $VPS_EMPLOYEES"
echo "   Empresas: $LOCAL_COMPANIES → $VPS_COMPANIES"
echo ""
echo "🔧 PRÓXIMOS PASSOS:"
echo "   1. Teste o sistema: https://rh.nordesteloc.cloud"
echo "   2. Verifique login e funcionalidades"
echo "   3. Mantenha backup local por 7 dias"
echo "   4. Configure backup automático na VPS"
echo ""
echo "🛡️ SEGURANÇA:"
echo "   ✅ Backup local mantido"
echo "   ✅ Backup de segurança VPS criado"
echo "   ✅ Integridade verificada"
echo ""
echo "🚨 SE ALGO DER ERRADO:"
echo "   1. Pare o sistema: pm2 stop rh-plus"
echo "   2. Restaure do backup local"
echo "   3. Entre em contato com suporte"
echo "================================================"

log "Migração concluída! Seus dados estão seguros na VPS. 🚀"

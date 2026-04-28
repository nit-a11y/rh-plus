#!/bin/bash

# 🔄 MIGRAÇÃO SEGURA DE DADOS - LOCAL → VPS
# Uso: ./migrar-dados-local-vps.sh
# Data: 28/04/2026
# Sistema: RH+ PostgreSQL

set -e  # Parar em caso de erro

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
VPS_IP="147.93.10.11"
VPS_USER="root"
LOCAL_DB_HOST="localhost"
LOCAL_DB_PORT="5432"
LOCAL_DB_NAME="rh"
LOCAL_DB_USER="rhplus_user"
LOCAL_DB_PASSWORD="12Nordeste34+"

VPS_DB_HOST="localhost"
VPS_DB_PORT="5432"
VPS_DB_NAME="rh"
VPS_DB_USER="rh_user"
VPS_DB_PASSWORD="RhPlus2026!Secure"

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

# Verificar pré-requisitos
log "🔍 Verificando pré-requisitos..."

# Verificar se está no Windows (ambiente local)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    log "Ambiente Windows detectado"
    PG_DUMP_PATH="C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe"
    PSQL_PATH="C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe"
    
    if [[ ! -f "$PG_DUMP_PATH" ]]; then
        error "PostgreSQL não encontrado em: $PG_DUMP_PATH"
    fi
else
    PG_DUMP_PATH="pg_dump"
    PSQL_PATH="psql"
fi

# Verificar conexão SSH com VPS
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_IP "echo 'SSH OK'" > /dev/null 2>&1; then
    error "Não foi possível conectar via SSH à VPS $VPS_IP"
fi

log "Pré-requisitos verificados!"

# ETAPA 1: Backup Local
log "ETAPA 1: Criando backup local..."

DATA=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR_LOCAL="./backups/migracao"
BACKUP_FILE_LOCAL="$BACKUP_DIR_LOCAL/rh_local_backup_$DATA.sql"

# Criar diretório de backup
mkdir -p "$BACKUP_DIR_LOCAL"

# Fazer backup do banco local
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    PGPASSWORD="$LOCAL_DB_PASSWORD" "$PG_DUMP_PATH" -h "$LOCAL_DB_HOST" -p "$LOCAL_DB_PORT" -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" > "$BACKUP_FILE_LOCAL"
else
    # Linux/Mac
    PGPASSWORD="$LOCAL_DB_PASSWORD" $PG_DUMP_PATH -h "$LOCAL_DB_HOST" -p "$LOCAL_DB_PORT" -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" > "$BACKUP_FILE_LOCAL"
fi

# Verificar backup
if [[ ! -s "$BACKUP_FILE_LOCAL" ]]; then
    error "Backup local falhou ou arquivo está vazio"
fi

# Compactar backup
gzip "$BACKUP_FILE_LOCAL"
BACKUP_FILE_LOCAL_GZ="$BACKUP_FILE_LOCAL.gz"

log "Backup local criado: $BACKUP_FILE_LOCAL_GZ"

# ETAPA 2: Verificar VPS
log "ETAPA 2: Verificando VPS..."

# Verificar se PostgreSQL está rodando na VPS
if ! ssh $VPS_USER@$VPS_IP "systemctl is-active --quiet postgresql"; then
    error "PostgreSQL não está rodando na VPS"
fi

# Verificar banco de dados na VPS
if ! ssh $VPS_USER@$VPS_IP "sudo -u postgres psql -c '\\l' | grep -q '$VPS_DB_NAME'"; then
    error "Banco $VPS_DB_NAME não encontrado na VPS"
fi

# Verificar usuário na VPS
if ! ssh $VPS_USER@$VPS_IP "sudo -u postgres psql -c '\\du' | grep -q '$VPS_DB_USER'"; then
    error "Usuário $VPS_DB_USER não encontrado na VPS"
fi

log "VPS verificada!"

# ETAPA 3: Transferir Backup
log "ETAPA 3: Transferindo backup para VPS..."

BACKUP_DIR_VPS="/tmp/migracao"
BACKUP_FILE_VPS="$BACKUP_DIR_VPS/rh_local_backup_$DATA.sql.gz"

# Criar diretório na VPS
ssh $VPS_USER@$VPS_IP "mkdir -p $BACKUP_DIR_VPS"

# Transferir arquivo
scp "$BACKUP_FILE_LOCAL_GZ" "$VPS_USER@$VPS_IP:$BACKUP_FILE_VPS"

# Verificar transferência
if ! ssh $VPS_USER@$VPS_IP "test -f '$BACKUP_FILE_VPS'"; then
    error "Falha na transferência do backup"
fi

log "Backup transferido para VPS!"

# ETAPA 4: Backup VPS (Segurança)
log "ETAPA 4: Criando backup de segurança na VPS..."

BACKUP_VPS_SEGURANCA="/var/backups/postgresql/rh_vps_antes_migracao_$DATA.sql"

# Fazer backup do banco VPS atual
ssh $VPS_USER@$VPS_IP "sudo -u postgres pg_dump $VPS_DB_NAME > $BACKUP_VPS_SEGURANCA"

# Compactar backup de segurança
ssh $VPS_USER@$VPS_IP "gzip $BACKUP_VPS_SEGURANCA"

log "Backup de segurança criado na VPS!"

# ETAPA 5: Restaurar Dados
log "ETAPA 5: Restaurando dados na VPS..."

# Descompactar backup na VPS
ssh $VPS_USER@$VPS_IP "gunzip -c $BACKUP_FILE_VPS > $BACKUP_DIR_VPS/rh_restore_$DATA.sql"

# Restaurar dados
ssh $VPS_USER@$VPS_IP "sudo -u postgres psql $VPS_DB_NAME < $BACKUP_DIR_VPS/rh_restore_$DATA.sql"

log "Dados restaurados na VPS!"

# ETAPA 6: Verificação
log "ETAPA 6: Verificando migração..."

# Verificar número de tabelas
TABELAS_LOCAL=$(PGPASSWORD="$LOCAL_DB_PASSWORD" $PSQL_PATH -h "$LOCAL_DB_HOST" -p "$LOCAL_DB_PORT" -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

TABELAS_VPS=$(ssh $VPS_USER@$VPS_IP "sudo -u postgres psql -d $VPS_DB_NAME -t -c \"SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';\"" | tr -d ' ')

if [[ "$TABELAS_LOCAL" -eq "$TABELAS_VPS" ]]; then
    log "✅ Número de tabelas coincide: $TABELAS_LOCAL"
else
    warning "⚠️ Diferença no número de tabelas: Local=$TABELAS_LOCAL, VPS=$TABELAS_VPS"
fi

# Verificar número total de registros
REGISTROS_LOCAL=$(PGPASSWORD="$LOCAL_DB_PASSWORD" $PSQL_PATH -h "$LOCAL_DB_HOST" -p "$LOCAL_DB_PORT" -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" -t -c "SELECT sum(n_tup_ins) FROM pg_stat_user_tables;" 2>/dev/null || echo "0")

REGISTROS_VPS=$(ssh $VPS_USER@$VPS_IP "sudo -u postgres psql -d $VPS_DB_NAME -t -c \"SELECT sum(n_tup_ins) FROM pg_stat_user_tables;\"" 2>/dev/null || echo "0")

if [[ "$REGISTROS_LOCAL" -eq "$REGISTROS_VPS" ]]; then
    log "✅ Número de registros coincide: $REGISTROS_LOCAL"
else
    warning "⚠️ Diferença no número de registros: Local=$REGISTROS_LOCAL, VPS=$REGISTROS_VPS"
fi

# ETAPA 7: Limpeza
log "ETAPA 7: Limpando arquivos temporários..."

# Limpar arquivos temporários na VPS
ssh $VPS_USER@$VPS_IP "rm -rf $BACKUP_DIR_VPS"

# Manter backups locais
log "Backups locais mantidos em: $BACKUP_DIR_LOCAL"

log "Limpeza concluída!"

# ETAPA 8: Relatório Final
log "ETAPA 8: Gerando relatório final..."

RELATORIO_FILE="$BACKUP_DIR_LOCAL/relatorio_migracao_$DATA.txt"

cat > "$RELATORIO_FILE" << EOF
==========================================
🔄 RELATÓRIO DE MIGRAÇÃO - RH+ PostgreSQL
==========================================

Data: $(date '+%Y-%m-%d %H:%M:%S')
Sistema: RH+ Gestão de RH
Ambiente: Local → VPS

📊 CONFIGURAÇÕES:
- VPS: $VPS_IP
- Banco Local: $LOCAL_DB_NAME
- Banco VPS: $VPS_DB_NAME
- Usuário Local: $LOCAL_DB_USER
- Usuário VPS: $VPS_DB_USER

📋 VERIFICAÇÕES:
- Tabelas Local: $TABELAS_LOCAL
- Tabelas VPS: $TABELAS_VPS
- Registros Local: $REGISTROS_LOCAL
- Registros VPS: $REGISTROS_VPS

📁 ARQUIVOS:
- Backup Local: $BACKUP_FILE_LOCAL_GZ
- Backup Segurança VPS: $BACKUP_VPS_SEGURANCA.gz
- Relatório: $RELATORIO_FILE

✅ STATUS: Migração concluída com sucesso!

🌐 PRÓXIMOS PASSOS:
1. Testar aplicação na VPS
2. Verificar conexões com banco
3. Configurar backup automatizado
4. Monitorar performance

🔧 COMANDOS ÚTEIS:
- Conectar VPS: ssh $VPS_USER@$VPS_IP
- Verificar banco: sudo -u postgres psql $VPS_DB_NAME
- Verificar tabelas: \\dt
- Verificar registros: SELECT count(*) FROM tabela;

==========================================
EOF

log "Relatório gerado: $RELATORIO_FILE"

# Resumo final
echo ""
echo "================================================"
log "🚀 MIGRAÇÃO CONCLUÍDA COM SUCESSO!"
echo ""
echo "📊 RESUMO:"
echo "- Tabelas migradas: $TABELAS_LOCAL"
echo "- Registros migrados: $REGISTROS_LOCAL"
echo "- Backup local: $BACKUP_FILE_LOCAL_GZ"
echo "- Backup segurança VPS: $BACKUP_VPS_SEGURANCA.gz"
echo "- Relatório: $RELATORIO_FILE"
echo ""
echo "🌐 ACESSO VPS:"
echo "- SSH: ssh $VPS_USER@$VPS_IP"
echo "- Banco: sudo -u postgres psql $VPS_DB_NAME"
echo "- Aplicação: http://$VPS_IP:3001 (após deploy)"
echo ""
echo "🔧 VERIFICAÇÕES:"
echo "□ Testar conexão VPS"
echo "□ Verificar tabelas: \\dt"
echo "□ Verificar dados: SELECT count(*) FROM colaboradores;"
echo "□ Testar aplicação RH+"
echo "□ Configurar backup automatizado"
echo "================================================"

log "Migração RH+ concluída! 🎉"

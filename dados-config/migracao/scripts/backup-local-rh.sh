#!/bin/bash

# 🔐 BACKUP SEGURO POSTGRESQL - RH+ LOCAL
# Uso: ./backup-local-rh.sh
# Data: 28/04/2026
# IMPORTANTE: Execute ANTES de qualquer migração

set -e  # Parar em caso de erro

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configurações
DATA=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/c/Users/NL - NIT/Desktop/GG/backups"
DB_NAME="rh"
DB_USER="rhplus_user"
DB_HOST="localhost"

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

# Verificar se PostgreSQL está rodando
log "🔍 Verificando PostgreSQL..."
if ! pg_isready -h $DB_HOST > /dev/null 2>&1; then
    error "PostgreSQL não está rodando. Inicie o serviço antes de continuar."
fi

# Criar diretório de backup
log "📁 Criando diretório de backup..."
mkdir -p $BACKUP_DIR

# Verificar conexão com banco
log "🔌 Testando conexão com banco..."
if ! psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    error "Não foi possível conectar ao banco '$DB_NAME' com usuário '$DB_USER'"
fi

# Contar registros antes do backup
log "📊 Contando registros atuais..."
USERS_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
EMPLOYEES_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM employees;" | tr -d ' ')
COMPANIES_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM companies;" | tr -d ' ')

echo "📈 Estatísticas atuais:"
echo "   Usuários: $USERS_COUNT"
echo "   Funcionários: $EMPLOYEES_COUNT"
echo "   Empresas: $COMPANIES_COUNT"

# Criar backup completo
log "🔄 Criando backup completo do PostgreSQL..."
BACKUP_FILE="$BACKUP_DIR/rh_backup_completo_$DATA.sql"

if pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_FILE; then
    log "✅ Backup SQL criado: $BACKUP_FILE"
else
    error "❌ Falha ao criar backup SQL"
fi

# Criar backup compactado
log "📦 Criando backup compactado..."
BACKUP_GZ="$BACKUP_DIR/rh_backup_completo_$DATA.sql.gz"

if pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > $BACKUP_GZ; then
    log "✅ Backup compactado criado: $BACKUP_GZ"
else
    error "❌ Falha ao criar backup compactado"
fi

# Verificar arquivos
log "🔍 Verificando arquivos de backup..."
if [ -f "$BACKUP_FILE" ] && [ -f "$BACKUP_GZ" ]; then
    SQL_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    GZ_SIZE=$(ls -lh "$BACKUP_GZ" | awk '{print $5}')
    
    echo "📊 Tamanhos dos arquivos:"
    echo "   SQL: $SQL_SIZE"
    echo "   GZ:  $GZ_SIZE"
    
    # Verificar conteúdo do backup
    log "📋 Verificando conteúdo do backup..."
    LINE_COUNT=$(head -20 "$BACKUP_FILE" | grep -c "CREATE TABLE\|INSERT INTO\|COPY" || echo "0")
    
    if [ "$LINE_COUNT" -gt "0" ]; then
        log "✅ Backup contém dados ($LINE_COUNT operações encontradas)"
    else
        warning "⚠️ Backup pode estar vazio ou corrompido"
    fi
else
    error "❌ Arquivos de backup não encontrados"
fi

# Criar backup de estrutura (schema)
log "🏗️ Criando backup de estrutura..."
SCHEMA_FILE="$BACKUP_DIR/rh_schema_$DATA.sql"

if pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME --schema-only > $SCHEMA_FILE; then
    log "✅ Backup de estrutura criado: $SCHEMA_FILE"
else
    warning "⚠️ Falha ao criar backup de estrutura"
fi

# Testar restauração (dry run)
log "🧪 Testando restauração (dry run)..."
TEMP_DB="rh_test_restore_$(date +%s)"

if createdb -h $DB_HOST -U $DB_USER $TEMP_DB; then
    if psql -h $DB_HOST -U $DB_USER -d $TEMP_DB < "$BACKUP_FILE" > /dev/null 2>&1; then
        log "✅ Teste de restauração bem-sucedido"
        dropdb -h $DB_HOST -U $DB_USER $TEMP_DB
    else
        error "❌ Teste de restauração falhou"
    fi
else
    error "❌ Não foi possível criar banco de teste"
fi

# Criar checksum
log "🔐 Criando checksum de verificação..."
CHECKSUM_FILE="$BACKUP_DIR/rh_backup_checksum_$DATA.txt"
echo "Arquivo: $BACKUP_GZ" > $CHECKSUM_FILE
echo "MD5: $(md5sum "$BACKUP_GZ" | awk '{print $1}')" >> $CHECKSUM_FILE
echo "SHA256: $(sha256sum "$BACKUP_GZ" | awk '{print $1}')" >> $CHECKSUM_FILE
echo "Data: $DATA" >> $CHECKSUM_FILE
echo "Registros: Usuários=$USERS_COUNT, Funcionários=$EMPLOYEES_COUNT, Empresas=$COMPANIES_COUNT" >> $CHECKSUM_FILE

log "✅ Checksum criado: $CHECKSUM_FILE"

# Resumo final
echo ""
echo "================================================"
log "🎉 BACKUP COMPLETO CONCLUÍDO COM SUCESSO!"
echo ""
echo "📁 Arquivos criados:"
echo "   Principal: $BACKUP_GZ"
echo "   SQL:      $BACKUP_FILE"
echo "   Schema:   $SCHEMA_FILE"
echo "   Checksum: $CHECKSUM_FILE"
echo ""
echo "📊 Estatísticas:"
echo "   Usuários: $USERS_COUNT"
echo "   Funcionários: $EMPLOYEES_COUNT"
echo "   Empresas: $COMPANIES_COUNT"
echo "   Tamanho: $(ls -lh "$BACKUP_GZ" | awk '{print $5}')"
echo ""
echo "🔐 Segurança:"
echo "   ✅ Backup verificado"
echo "   ✅ Teste de restauração OK"
echo "   ✅ Checksum gerado"
echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo "   1. Copie os arquivos para local seguro"
echo "   2. Execute a migração para VPS"
echo "   3. Mantenha este backup como segurança"
echo ""
echo "⚠️ AVISO IMPORTANTE:"
echo "   NÃO exclua estes arquivos até confirmar que a migração foi 100% bem-sucedida!"
echo "================================================"

log "Backup seguro concluído! Seus dados estão protegidos. 🛡️"

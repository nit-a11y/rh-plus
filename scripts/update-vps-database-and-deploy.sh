#!/bin/bash

# Atualizar banco VPS e fazer deploy do sistema RH+
# Uso: ./scripts/update-vps-database-and-deploy.sh

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
PROJECT_DIR="/var/www/rh-plus"
DOMAIN="rh.nordesteloc.cloud"
PORT="3001"

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

# Verificar se está no ambiente local
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    log "Ambiente Windows detectado"
    SCP="scp"
    SSH="ssh"
else
    SCP="scp"
    SSH="ssh"
fi

# ETAPA 1: Verificar conexão com VPS
log "ETAPA 1: Verificando conexão com VPS..."

if ! $SSH -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_IP "echo 'SSH OK'" > /dev/null 2>&1; then
    error "Não foi possível conectar via SSH à VPS $VPS_IP"
fi

log "Conexão VPS OK!"

# ETAPA 2: Verificar estrutura atual do banco VPS
log "ETAPA 2: Verificando estrutura atual do banco VPS..."

$SSH $VPS_USER@$VPS_IP "sudo -u postgres psql rh -c '\dt'" > /tmp/vps_tables_current.txt 2>/dev/null || true

# ETAPA 3: Verificar estrutura do banco local
log "ETAPA 3: Verificando estrutura do banco local..."

cd backend
node migrations/check_employees_structure.js > /tmp/local_structure.txt 2>/dev/null || true

# ETAPA 4: Gerar script de atualização para VPS
log "ETAPA 4: Gerando script de atualização de estrutura..."

cat > /tmp/update_vps_schema.sql << 'EOF'
-- Script de atualização de estrutura para VPS RH+
-- Data: $(date)

-- Verificar se tabela employees existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'employees') THEN
        CREATE TABLE employees (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            registration VARCHAR(50),
            company VARCHAR(100),
            cost_center VARCHAR(100),
            role VARCHAR(100),
            admission_date DATE,
            termination_date DATE,
            salary DECIMAL(10,2),
            type VARCHAR(20) DEFAULT 'CLT',
            workplace VARCHAR(100),
            directorate VARCHAR(100),
            status VARCHAR(20) DEFAULT 'ACTIVE',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Tabela employees criada';
    ELSE
        RAISE NOTICE 'Tabela employees já existe';
    END IF;
END $$;

-- Verificar e adicionar colunas ausentes na tabela employees
DO $$
BEGIN
    -- Adicionar coluna type se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'type'
    ) THEN
        ALTER TABLE employees ADD COLUMN type VARCHAR(20) DEFAULT 'CLT';
        RAISE NOTICE 'Coluna type adicionada';
    END IF;

    -- Adicionar coluna workplace se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'workplace'
    ) THEN
        ALTER TABLE employees ADD COLUMN workplace VARCHAR(100);
        RAISE NOTICE 'Coluna workplace adicionada';
    END IF;

    -- Adicionar coluna directorate se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'directorate'
    ) THEN
        ALTER TABLE employees ADD COLUMN directorate VARCHAR(100);
        RAISE NOTICE 'Coluna directorate adicionada';
    END IF;

    -- Adicionar coluna status se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'status'
    ) THEN
        ALTER TABLE employees ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';
        RAISE NOTICE 'Coluna status adicionada';
    END IF;

    -- Adicionar coluna created_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE employees ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Coluna created_at adicionada';
    END IF;

    -- Adicionar coluna updated_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE employees ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Coluna updated_at adicionada';
    END IF;
END $$;

-- Verificar e criar tabela overtime se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'overtime') THEN
        CREATE TABLE overtime (
            id SERIAL PRIMARY KEY,
            employee_id INTEGER REFERENCES employees(id),
            date DATE NOT NULL,
            hours DECIMAL(4,2) NOT NULL,
            reason VARCHAR(255),
            approved BOOLEAN DEFAULT FALSE,
            approved_by VARCHAR(100),
            approved_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Tabela overtime criada';
    ELSE
        RAISE NOTICE 'Tabela overtime já existe';
    END IF;
END $$;

-- Verificar e criar tabela population_history se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'population_history') THEN
        CREATE TABLE population_history (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL,
            total_employees INTEGER DEFAULT 0,
            active_employees INTEGER DEFAULT 0,
            terminated_employees INTEGER DEFAULT 0,
            clt_employees INTEGER DEFAULT 0,
            pj_employees INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Tabela population_history criada';
    ELSE
        RAISE NOTICE 'Tabela population_history já existe';
    END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_employees_registration ON employees(registration);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company);
CREATE INDEX IF NOT EXISTS idx_overtime_employee_id ON overtime(employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_date ON overtime(date);
CREATE INDEX IF NOT EXISTS idx_population_history_date ON population_history(date);

-- Atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
\$\$ language 'plpgsql';

-- Adicionar triggers se não existirem
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at 
    BEFORE UPDATE ON employees 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_overtime_updated_at ON overtime;
CREATE TRIGGER update_overtime_updated_at 
    BEFORE UPDATE ON overtime 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

EOF

log "Script de atualização gerado!"

# ETAPA 5: Transferir e executar script na VPS
log "ETAPA 5: Atualizando estrutura do banco VPS..."

$SCP /tmp/update_vps_schema.sql $VPS_USER@$VPS_IP:/tmp/

$SSH $VPS_USER@$VPS_IP "sudo -u postgres psql rh < /tmp/update_vps_schema.sql"

log "Estrutura do banco VPS atualizada!"

# ETAPA 6: Fazer deploy do sistema
log "ETAPA 6: Fazendo deploy do sistema na VPS..."

# Criar script de deploy simplificado
cat > /tmp/deploy_update.sh << 'EOF'
#!/bin/bash

# Deploy simplificado para atualização RH+
set -e

PROJECT_DIR="/var/www/rh-plus"
DOMAIN="rh.nordesteloc.cloud"
PORT="3001"

echo "Iniciando deploy atualizado..."

# Entrar no diretório do projeto
cd $PROJECT_DIR

# Fazer pull das últimas alterações
echo "Atualizando código do GitHub..."
git pull origin main

# Instalar dependências atualizadas
echo "Instalando dependências..."
npm install --production

# Reiniciar PM2
echo "Reiniciando PM2..."
pm2 restart rh-plus || pm2 start ecosystem.config.js --env production

# Verificar status
echo "Verificando status..."
sleep 3
pm2 status

# Testar aplicação
echo "Testando aplicação..."
if curl -s http://localhost:$PORT/health > /dev/null; then
    echo "Aplicação funcionando!"
else
    echo "Aplicação não respondeu - Verificando logs..."
    pm2 logs rh-plus --lines 20
fi

echo "Deploy concluído!"
EOF

# Transferir e executar script de deploy
$SCP /tmp/deploy_update.sh $VPS_USER@$VPS_IP:/tmp/
$SSH $VPS_USER@$VPS_IP "chmod +x /tmp/deploy_update.sh && /tmp/deploy_update.sh"

log "Deploy concluído!"

# ETAPA 7: Verificação final
log "ETAPA 7: Verificação final..."

# Verificar PM2
PM2_STATUS=$($SSH $VPS_USER@$VPS_IP "pm2 status | grep rh-plus | grep 'online' | wc -l" | tr -d '\r\n')

if [[ "$PM2_STATUS" -eq "1" ]]; then
    log "PM2 RH+ está online!"
else
    warning "PM2 RH+ não está online. Verificando..."
    $SSH $VPS_USER@$VPS_IP "pm2 status"
fi

# Verificar aplicação
APP_STATUS=$($SSH $VPS_USER@$VPS_IP "curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/health" | tr -d '\r\n')

if [[ "$APP_STATUS" == "200" ]]; then
    log "Aplicação respondendo corretamente!"
else
    warning "Aplicação não respondeu (HTTP $APP_STATUS). Verificando logs..."
    $SSH $VPS_USER@$VPS_IP "pm2 logs rh-plus --lines 10"
fi

# Verificar banco
DB_TABLES=$($SSH $VPS_USER@$VPS_IP "sudo -u postgres psql rh -t -c 'SELECT count(*) FROM information_schema.tables WHERE table_schema = '\''public'\'';" | tr -d ' ')

log "Banco de dados com $DB_TABLES tabelas"

# Limpar arquivos temporários
rm -f /tmp/update_vps_schema.sql /tmp/deploy_update.sh
$SSH $VPS_USER@$VPS_IP "rm -f /tmp/update_vps_schema.sql /tmp/deploy_update.sh"

# Resumo final
echo ""
echo "================================================"
log "Atualização VPS concluída!"
echo ""
echo "Resumo:"
echo "- Estrutura do banco atualizada"
echo "- Sistema deployado"
echo "- PM2 reiniciado"
echo "- Aplicação testada"
echo ""
echo "Acessos:"
echo "- Sistema: https://$DOMAIN"
echo "- Health: https://$DOMAIN/health"
echo "- SSH: ssh $VPS_USER@$VPS_IP"
echo ""
echo "Comandos úteis:"
echo "- PM2 status: ssh $VPS_USER@$VPS_IP 'pm2 status'"
echo "- Logs: ssh $VPS_USER@$VPS_IP 'pm2 logs rh-plus'"
echo "- Banco: ssh $VPS_USER@$VPS_IP 'sudo -u postgres psql rh'"
echo "================================================"

log "Processo concluído com sucesso!

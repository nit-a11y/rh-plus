#!/bin/bash

# 🚀 DEPLOY AUTOMATICO RH+ - VPS NIT SYSTEMS
# Uso: ./deploy-rh-plus.sh
# Data: 28/04/2026

set -e  # Parar em caso de erro

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configurações
PROJECT_NAME="rh-plus"
PROJECT_DIR="/var/www/rh-plus"
DOMAIN="rh.nordesteloc.cloud"
PORT="3001"
POSTGRES_DB="rh"
POSTGRES_USER="rh_user"
POSTGRES_PASSWORD="RhPlus2026!Secure"

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

# Verificar root
if [[ $EUID -ne 0 ]]; then
   error "Execute como root: sudo ./deploy-rh-plus.sh"
fi

log "🚀 Iniciando deploy RH+ v2.0.0..."

# ETAPA 1: Verificar pré-requisitos
log "ETAPA 1: Verificando pré-requisitos..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    log "Instalando Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    log "Node.js encontrado: $(node -v)"
fi

# Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
    error "PostgreSQL não instalado. Execute: apt install postgresql postgresql-contrib"
else
    log "PostgreSQL encontrado: $(psql --version | cut -d' ' -f3)"
fi

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    log "Instalando PM2..."
    npm install -g pm2
else
    log "PM2 encontrado: $(pm2 -v)"
fi

# ETAPA 2: Preparar banco PostgreSQL
log "ETAPA 2: Configurando banco PostgreSQL..."

# Criar banco e usuário
sudo -u postgres psql << EOF
-- Criar banco se não existir
SELECT 'CREATE DATABASE $POSTGRES_DB'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$POSTGRES_DB')\gexec

-- Criar usuário se não existir
DO
\$do\$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = '$POSTGRES_USER') THEN

      CREATE ROLE $POSTGRES_USER LOGIN PASSWORD '$POSTGRES_PASSWORD';
   END IF;
END
\$do\$;

-- Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
EOF

log "Banco PostgreSQL configurado!"

# ETAPA 3: Preparar projeto
log "ETAPA 3: Preparando projeto..."

# Criar diretório
mkdir -p $PROJECT_DIR
mkdir -p /var/log/pm2

# Clonar projeto se não existir
if [ ! -d "$PROJECT_DIR/.git" ]; then
    log "Clonando projeto do GitHub..."
    cd $PROJECT_DIR
    git clone https://github.com/nit-a11y/rh-plus.git .
else
    log "Projeto já existe, atualizando..."
    cd $PROJECT_DIR
    git pull origin main
fi

# ETAPA 4: Configurar ambiente
log "ETAPA 4: Configurando ambiente..."

# Criar .env
cat > $PROJECT_DIR/.env << EOF
NODE_ENV=production
PORT=$PORT
HOST=0.0.0.0

# PostgreSQL Produção VPS
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$POSTGRES_DB
DB_USER=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD

# Segurança
JWT_SECRET=RhPlus2026NordesteSecureKey32CharX9!
SESSION_SECRET=NordesteSessaoSecreta2026RhPlusX7#

# Logs
LOG_LEVEL=info

# URL Pública
PUBLIC_URL=https://$DOMAIN
TRUST_PROXY=loopback, linklocal, uniquelocal
EOF

# ETAPA 5: Instalar dependências
log "ETAPA 5: Instalando dependências..."
cd $PROJECT_DIR
npm install --production

# ETAPA 6: Configurar PM2
log "ETAPA 6: Configurando PM2..."

cat > $PROJECT_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PROJECT_NAME',
    script: 'backend/server.js',
    cwd: '$PROJECT_DIR',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
      PORT: $PORT
    },
    log_file: '/var/log/pm2/$PROJECT_NAME.log',
    out_file: '/var/log/pm2/$PROJECT_NAME-out.log',
    error_file: '/var/log/pm2/$PROJECT_NAME-error.log',
    merge_logs: true,
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false,
    ignore_watch: ['node_modules', 'logs']
  }]
};
EOF

# ETAPA 7: Configurar Nginx
log "ETAPA 7: Configurando Nginx..."

# Criar configuração Nginx
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL será configurado pelo Certbot
    
    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains; preload" always;
    
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
    
    client_max_body_size 50M;
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Testar Nginx
nginx -t
systemctl restart nginx

# ETAPA 8: Iniciar aplicação
log "ETAPA 8: Iniciando aplicação com PM2..."

# Parar instância existente
pm2 delete $PROJECT_NAME 2>/dev/null || true

# Iniciar nova instância
cd $PROJECT_DIR
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd

# ETAPA 9: Configurar backup
log "ETAPA 9: Configurando backup automatizado..."

cat > /usr/local/bin/backup-$PROJECT_NAME.sh << EOF
#!/bin/bash

DATA=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/$PROJECT_NAME"
LOG_FILE="/var/log/backup-$PROJECT_NAME.log"

# Criar pasta
mkdir -p \$BACKUP_DIR

# Backup PostgreSQL
pg_dump -h localhost -U $POSTGRES_USER -d $POSTGRES_DB > \$BACKUP_DIR/\${PROJECT_NAME}_postgres_\$DATA.sql
gzip \$BACKUP_DIR/\${PROJECT_NAME}_postgres_\$DATA.sql

# Backup projeto
tar -czf \$BACKUP_DIR/\${PROJECT_NAME}_project_\$DATA.tar.gz $PROJECT_DIR --exclude=node_modules --exclude=logs

# Limpar antigos (7 dias)
find \$BACKUP_DIR -name "*.gz" -mtime +7 -delete
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "[\$DATA] Backup concluído" >> \$LOG_FILE
EOF

chmod +x /usr/local/bin/backup-$PROJECT_NAME.sh

# Adicionar ao crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-$PROJECT_NAME.sh") | crontab -

# ETAPA 10: Instalar SSL
log "ETAPA 10: Configurando SSL..."

# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Tentar instalar SSL
if certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email nit@nordesteloc.com.br; then
    log "SSL instalado com sucesso!"
else
    warning "SSL não pôde ser instalado automaticamente. Execute manualmente após configurar DNS:"
    warning "certbot --nginx -d $DOMAIN --agree-tos --email nit@nordesteloc.com.br"
fi

# ETAPA 11: Verificação final
log "ETAPA 11: Verificação final..."

# Verificar aplicação
sleep 5
if curl -s http://localhost:$PORT/health > /dev/null; then
    log "✅ Aplicação funcionando localmente!"
else
    warning "⚠️ Aplicação não respondeu localmente. Verifique logs: pm2 logs $PROJECT_NAME"
fi

# Verificar PM2
pm2 status
pm2 logs $PROJECT_NAME --lines 10

# Verificar banco
if sudo -u postgres psql -c "SELECT 1;" &>/dev/null; then
    log "✅ PostgreSQL funcionando!"
else
    error "❌ PostgreSQL não está funcionando"
fi

# Resumo
echo ""
echo "================================================"
log "🚀 DEPLOY RH+ CONCLUÍDO!"
echo ""
echo "📊 RESUMO:"
echo "- Projeto: $PROJECT_NAME"
echo "- Domínio: https://$DOMAIN"
echo "- Porta: $PORT"
echo "- Banco: $POSTGRES_DB"
echo "- Diretório: $PROJECT_DIR"
echo ""
echo "🔧 COMANDOS ÚTEIS:"
echo "- Status: pm2 status"
echo "- Logs: pm2 logs $PROJECT_NAME"
echo "- Reiniciar: pm2 restart $PROJECT_NAME"
echo "- Backup: /usr/local/bin/backup-$PROJECT_NAME.sh"
echo ""
echo "🌐 PRÓXIMOS PASSOS:"
echo "1. Configure DNS: $DOMAIN → $(curl -s ifconfig.me)"
echo "2. Aguarde propagação DNS"
echo "3. Instale SSL (se não instalado):"
echo "   certbot --nginx -d $DOMAIN --agree-tos --email admin@nordesteloc.com.br"
echo "4. Acesse: https://$DOMAIN"
echo ""
echo "📋 VERIFICAÇÃO:"
echo "□ DNS configurado"
echo "□ SSL instalado"
echo "□ Aplicação acessível"
echo "□ Backup funcionando"
echo "================================================"

log "Deploy RH+ concluído! 🎉"

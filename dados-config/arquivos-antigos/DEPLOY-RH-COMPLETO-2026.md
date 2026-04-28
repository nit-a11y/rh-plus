# 🚀 Plano Deploy Completo RH+ para VPS (2026)

**Data:** 28/04/2026  
**Sistema:** RH+ v2.0.0 - Gestão de RH  
**VPS:** 147.93.10.11 (Hostinger)  
**Status:** PRONTO PARA EXECUÇÃO  

---

## 📋 **RESUMO EXECUTIVO**

Deploy completo do sistema RH+ na VPS com PostgreSQL dedicado, SSL automático, backup automatizado e configuração profissional de produção.

**Arquitetura Final:**
```
rh.nordesteloc.com.br → 147.93.10.11 → Nginx (HTTPS) → localhost:3001 → RH+ Node.js → PostgreSQL
```

---

## 🎯 **OBJETIVOS**

### **Essenciais**
- [x] Análise completa do sistema RH+
- [ ] Configurar PostgreSQL na VPS
- [ ] Migrar dados do PostgreSQL local
- [ ] Deploy do RH+ em produção
- [ ] Configurar domínio rh.nordesteloc.com.br
- [ ] Instalar SSL Let's Encrypt

### **Segurança e Manutenção**
- [ ] Configurar firewall UFW
- [ ] Implementar backup automatizado
- [ ] Configurar PM2 para gerenciamento
- [ ] Monitoramento e logs

---

## 🗄️ **CONFIGURAÇÃO POSTGRESQL VPS**

### **1. Instalação PostgreSQL**
```bash
# Acessar VPS
ssh root@147.93.10.11

# Atualizar sistema
apt update && apt upgrade -y

# Instalar PostgreSQL 15
apt install -y postgresql postgresql-contrib

# Iniciar e habilitar serviço
systemctl start postgresql
systemctl enable postgresql
```

### **2. Criar Banco e Usuário RH**
```bash
# Acessar PostgreSQL
sudo -u postgres psql

-- Criar banco de dados
CREATE DATABASE rh;

-- Criar usuário dedicado
CREATE USER rh_user WITH PASSWORD 'RhPlus2026!Secure';

-- Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE rh TO rh_user;

-- Sair
\q
```

### **3. Configurar Acesso Remoto**
```bash
# Editar postgresql.conf
nano /etc/postgresql/15/main/postgresql.conf

# Alterar listen_addresses
listen_addresses = 'localhost'

# Editar pg_hba.conf
nano /etc/postgresql/15/main/pg_hba.conf

# Adicionar linha (local connections)
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5

# Reiniciar PostgreSQL
systemctl restart postgresql
```

---

## 📦 **MIGRAÇÃO DE DADOS**

### **1. Backup PostgreSQL Local**
```bash
# No seu PC local
pg_dump -h localhost -U rhplus_user -d rh > rh_backup_$(date +%Y%m%d).sql

# Compactar
gzip rh_backup_$(date +%Y%m%d).sql

# Enviar para VPS
scp rh_backup_20260428.sql.gz root@147.93.10.11:/tmp/
```

### **2. Restauração na VPS**
```bash
# Na VPS
cd /tmp
gunzip rh_backup_20260428.sql.gz

# Restaurar (como usuário postgres)
sudo -u postgres psql rh < rh_backup_20260428.sql

# Verificar dados
sudo -u postgres psql rh -c "SELECT COUNT(*) FROM users;"
sudo -u postgres psql rh -c "SELECT COUNT(*) FROM employees;"
```

---

## 🚀 **DEPLOY SISTEMA RH+**

### **1. Preparar Ambiente Node.js**
```bash
# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar versões
node -v  # v20.x.x
npm -v   # 10.x.x

# Instalar PM2 globalmente
npm install -g pm2

# Instalar Git
apt install -y git
```

### **2. Transferir Projeto**
```bash
# Criar pasta do projeto
mkdir -p /var/www/rh-plus
cd /var/www/rh-plus

# Opção A: Via GitHub (recomendado)
git clone https://github.com/nit-a11y/rh-plus.git .

# Opção B: Via SCP (se não tiver GitHub)
# No seu PC local:
# scp -r c:/Users/NL\ -\ NIT/Desktop/GG/* root@147.93.10.11:/var/www/rh-plus/
```

### **3. Configurar Variáveis de Ambiente**
```bash
# Criar .env de produção
nano .env
```

**Conteúdo .env:**
```env
# ===========================================
# 🗄️ CONFIGURAÇÃO PRODUÇÃO - RH+ VPS
# ===========================================

NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# PostgreSQL Produção VPS
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rh
DB_USER=rh_user
DB_PASSWORD=RhPlus2026!Secure

# Segurança
JWT_SECRET=RhPlus2026NordesteSecureKey32CharX9!
SESSION_SECRET=NordesteSessaoSecreta2026RhPlusX7#

# Logs
LOG_LEVEL=info

# URL Pública (para CORS e redirects)
PUBLIC_URL=https://rh.nordesteloc.com.br
TRUST_PROXY=loopback, linklocal, uniquelocal
```

### **4. Instalar Dependências**
```bash
# Instalar apenas dependências de produção
npm install --production

# Verificar instalação
npm run deploy:check  # Se tiver o script
```

### **5. Configurar PM2**
```bash
# Criar configuração PM2
nano ecosystem.config.js
```

**Conteúdo ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'rh-plus',
    script: 'backend/server.js',
    cwd: '/var/www/rh-plus',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_file: '/var/log/pm2/rh-plus.log',
    out_file: '/var/log/pm2/rh-plus-out.log',
    error_file: '/var/log/pm2/rh-plus-error.log',
    merge_logs: true,
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false,
    ignore_watch: ['node_modules', 'logs']
  }]
};
```

### **6. Iniciar Sistema**
```bash
# Criar pasta de logs
mkdir -p /var/log/pm2

# Iniciar com PM2
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save
pm2 startup systemd

# Verificar status
pm2 status
pm2 logs rh-plus --lines 20
```

---

## 🌐 **CONFIGURAÇÃO DOMÍNIO E SSL**

### **1. Configurar DNS (No seu registrador)**
Criar registro **Tipo A**:
```
Tipo: A
Nome: rh
Valor: 147.93.10.11
TTL: 300
```

### **2. Instalar Nginx**
```bash
# Instalar Nginx
apt install -y nginx

# Remover configuração padrão
rm /etc/nginx/sites-enabled/default
```

### **3. Configurar Virtual Host**
```bash
# Criar configuração RH+
nano /etc/nginx/sites-available/rh.nordesteloc.com.br
```

**Conteúdo Nginx:**
```nginx
server {
    listen 80;
    server_name rh.nordesteloc.com.br;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rh.nordesteloc.com.br;
    
    # SSL será configurado pelo Certbot
    # ssl_certificate /etc/letsencrypt/live/rh.nordesteloc.com.br/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/rh.nordesteloc.com.br/privkey.pem;
    
    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains; preload" always;
    
    # Proxy para Node.js
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts para uploads grandes
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
    
    # Limite de upload (50MB)
    client_max_body_size 50M;
}
```

### **4. Ativar Configuração**
```bash
# Ativar site
ln -s /etc/nginx/sites-available/rh.nordesteloc.com.br /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

### **5. Instalar SSL Let's Encrypt**
```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
certbot --nginx -d rh.nordesteloc.com.br --agree-tos --non-interactive --email seu-email@nordesteloc.com.br

# Verificar renovação automática
certbot renew --dry-run
```

---

## 🔒 **CONFIGURAÇÃO SEGURANÇA**

### **1. Firewall UFW**
```bash
# Instalar UFW
apt install -y ufw

# Configurar regras
ufw default deny incoming
ufw default allow outgoing

# Permitir SSH (ESSENCIAL!)
ufw allow 22/tcp

# Permitir HTTP e HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# NÃO abrir porta 3001 (acesso apenas via Nginx)
# ufw deny 3001/tcp

# Ativar firewall
ufw enable

# Verificar status
ufw status verbose
```

### **2. Segurança PostgreSQL**
```bash
# Apenas localhost pode acessar
nano /etc/postgresql/15/main/pg_hba.conf

# Garantir apenas conexões locais
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5

# Reiniciar PostgreSQL
systemctl restart postgresql
```

---

## 💾 **BACKUP AUTOMATIZADO**

### **1. Script de Backup**
```bash
# Criar script
nano /usr/local/bin/backup-rh-plus.sh
```

**Conteúdo do script:**
```bash
#!/bin/bash

# Configurações
DATA=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/rh-plus"
LOG_FILE="/var/log/backup-rh-plus.log"

# Criar pasta de backup
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo "[$DATA] Iniciando backup PostgreSQL..." >> $LOG_FILE
pg_dump -h localhost -U rh_user -d rh > $BACKUP_DIR/rh_postgres_$DATA.sql

# Backup arquivos do projeto
echo "[$DATA] Iniciando backup arquivos..." >> $LOG_FILE
tar -czf $BACKUP_DIR/rh_project_$DATA.tar.gz /var/www/rh-plus --exclude=node_modules --exclude=logs

# Compactar SQL
gzip $BACKUP_DIR/rh_postgres_$DATA.sql

# Limpar backups antigos (manter 7 dias)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "[$DATA] Backup concluído com sucesso!" >> $LOG_FILE
```

### **2. Permissões e Cron**
```bash
# Dar permissão
chmod +x /usr/local/bin/backup-rh-plus.sh

# Adicionar ao crontab
crontab -e

# Adicionar linhas:
# Backup diário às 2AM
0 2 * * * /usr/local/bin/backup-rh-plus.sh

# Backup semanal aos domingos 4AM
0 4 * * 0 /usr/local/bin/backup-rh-plus.sh
```

---

## 📊 **MONITORAMENTO E MANUTENÇÃO**

### **1. Health Checks**
```bash
# Testar API
curl https://rh.nordesteloc.com.br/health

# Verificar PM2
pm2 status
pm2 monit

# Verificar logs
pm2 logs rh-plus --lines 50
tail -f /var/log/nginx/access.log
```

### **2. Comandos Úteis**
```bash
# Reiniciar sistema
pm2 restart rh-plus

# Atualizar sistema
cd /var/www/rh-plus
git pull origin main
npm install --production
pm2 restart rh-plus

# Verificar uso de recursos
df -h
free -h
htop

# Logs importantes
tail -f /var/log/nginx/error.log
tail -f /var/log/postgresql/postgresql-15-main.log
```

---

## ✅ **CHECKLIST FINAL**

### **Pré-Deploy**
- [ ] DNS configurado: rh.nordesteloc.com.br → 147.93.10.11
- [ ] VPS acessível via SSH
- [ ] Sistema atualizado

### **Deploy**
- [ ] PostgreSQL instalado e configurado
- [ ] Dados migrados do local
- [ ] Projeto transferido para VPS
- [ ] Dependências instaladas
- [ ] .env configurado
- [ ] PM2 configurado e iniciado

### **Pós-Deploy**
- [ ] Nginx configurado
- [ ] SSL instalado
- [ ] Firewall ativo
- [ ] Backup automatizado
- [ ] Monitoramento funcionando

### **Testes Finais**
- [ ] Acessar: https://rh.nordesteloc.com.br
- [ ] Testar login
- [ ] Verificar funcionalidades principais
- [ ] Testar uploads
- [ ] Verificar logs de erros

---

## 🎉 **ACESSO PRODUÇÃO**

**URL Principal:** https://rh.nordesteloc.com.br  
**Health Check:** https://rh.nordesteloc.com.br/health  
**Admin PM2:** `pm2 monit` (via SSH)  

**Contatos Suporte:**
- **VPS:** root@147.93.10.11
- **PostgreSQL:** Porta 5432
- **RH+:** Porta 3001 (interna)

---

## 🔄 **MANUTENÇÃO FUTURA**

### **Semanal**
- Verificar logs de erro
- Monitorar uso de disco
- Testar backup

### **Mensal**
- Atualizar dependências
- Revisar segurança
- Otimizar performance

### **Emergência**
- Comandos restart: `pm2 restart rh-plus`
- Restore backup: Descompactar e importar SQL
- Contato administrador VPS

---

**Status:** ✅ **PRONTO PARA EXECUÇÃO**  
**Complexidade:** Média  
**Duração Estimada:** 3-4 horas  
**Próximo Passo:** Aprovação e início do deploy

---

*Plano criado em 28/04/2026*  
*Sistema: RH+ v2.0.0 PostgreSQL*  
*VPS: Hostinger 147.93.10.11*

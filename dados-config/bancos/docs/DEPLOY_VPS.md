# 🚀 Guia de Deploy - RH+ em VPS

> Deploy profissional do RH+ em servidor VPS Linux  
> Última atualização: Abril 2026

---

## 📋 Pré-requisitos

- VPS Linux (Ubuntu 22.04 LTS recomendado)
- Acesso SSH (root ou sudo)
- Domínio configurado (opcional, mas recomendado)

---

## 🛠️ Passo a Passo

### 1. Acessar VPS

```bash
ssh usuario@seu-vps-ip
```

### 2. Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Instalar Dependências

```bash
# Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Outras ferramentas
sudo apt install -y git nginx ufw fail2ban

# Verificar instalações
node --version  # v18.x.x
npm --version   # 9.x.x
```

### 4. Configurar PostgreSQL

```bash
# Acessar postgres
sudo -u postgres psql

# Criar banco e usuário
CREATE DATABASE rh;
CREATE USER rhplus_prod WITH PASSWORD 'sua_senha_segura_aqui';
GRANT ALL PRIVILEGES ON DATABASE rh TO rhplus_prod;

# Configurar acesso
\q

# Editar configuração de acesso
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Adicionar:
host    rh      rhplus_prod     127.0.0.1/32    scram-sha-256

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 5. Criar Usuário da Aplicação

```bash
sudo adduser --disabled-password --gecos "" rhplus
sudo usermod -aG sudo rhplus
```

### 6. Clonar Projeto

```bash
sudo su - rhplus
cd ~
git clone <URL_DO_SEU_REPOSITORIO> rhplus
cd rhplus
```

### 7. Configurar Ambiente

```bash
# Criar .env de produção
cp .env.example .env
nano .env
```

**Conteúdo do `.env` em produção:**

```bash
NODE_ENV=production

# Banco de Produção
PROD_DB_HOST=localhost
PROD_DB_PORT=5432
PROD_DB_NAME=rh
PROD_DB_USER=rhplus_prod
PROD_DB_PASSWORD=sua_senha_segura_aqui

# Ou use URL completa:
# DATABASE_URL=postgresql://rhplus_prod:senha@localhost:5432/rh

# Segurança (use valores aleatórios!)
JWT_SECRET=sua_chave_secreta_aqui_minimo_32_caracteres
SESSION_SECRET=outra_chave_secreta_aqui

# Servidor
PORT=3001
HOST=127.0.0.1  # Importante: não 0.0.0.0 com Nginx

# Logs
LOG_LEVEL=warn
```

### 8. Instalar Dependências

```bash
npm install
npm run db:migrate
```

### 9. Testar

```bash
NODE_ENV=production npm start
```

Deve ver:
```
🚀 RH+ - Sistema Profissional de Gestão de RH
📡 Ambiente: PRODUCTION
🌐 URL: http://127.0.0.1:3001
```

**Ctrl+C** para parar.

### 10. Instalar PM2 (Process Manager)

```bash
# Instalar PM2 global
sudo npm install -g pm2

# Iniciar aplicação
pm2 start backend/server.js --name rhplus

# Salvar configuração
pm2 save
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u rhplus --hp /home/rhplus
```

### 11. Configurar Nginx (Reverse Proxy)

```bash
sudo nano /etc/nginx/sites-available/rhplus
```

**Configuração:**

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Aumentar limite de upload
    client_max_body_size 50M;
}
```

**Ativar:**

```bash
sudo ln -s /etc/nginx/sites-available/rhplus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 12. Configurar SSL (Let's Encrypt)

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Auto-renewal já configurado
```

### 13. Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 14. Backup Automático

```bash
# Criar script de backup
sudo nano /home/rhplus/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/rhplus/backups"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
pg_dump -U rhplus_prod rh > $BACKUP_DIR/rh_backup_$DATE.sql

# Manter apenas últimos 7 backups
ls -t $BACKUP_DIR/*.sql | tail -n +8 | xargs rm -f

echo "Backup concluído: $DATE"
```

```bash
chmod +x /home/rhplus/backup.sh

# Agendar no cron
sudo crontab -e
# Adicionar:
0 2 * * * /home/rhplus/backup.sh >> /var/log/rhplus-backup.log 2>&1
```

---

## 📊 Comandos Úteis

### Gerenciar Aplicação

```bash
# Ver status
pm2 status

# Logs
pm2 logs rhplus
pm2 logs rhplus --lines 100

# Restart
pm2 restart rhplus

# Parar
pm2 stop rhplus

# Atualizar (após git pull)
pm2 restart rhplus
```

### Monitoramento

```bash
# Recursos do sistema
htop

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Health check
curl http://localhost:3001/health
```

---

## 🔄 Atualização de Código

```bash
sudo su - rhplus
cd ~/rhplus
git pull
npm install
npm run db:migrate
pm2 restart rhplus
```

---

## 🆘 Troubleshooting

### Erro: "Cannot connect to PostgreSQL"

```bash
# Verificar PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"

# Verificar usuário
sudo -u postgres psql -c "\du"

# Logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Erro: "Port already in use"

```bash
# Verificar processo na porta
sudo lsof -i :3001

# Matar processo
sudo kill -9 <PID>
```

### Erro 502 Bad Gateway

```bash
# Verificar se app está rodando
pm2 status
curl http://127.0.0.1:3001/health

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

### Logs PM2

```bash
pm2 logs rhplus --lines 200
pm2 flush  # Limpar logs
```

---

## 📋 Checklist Pós-Deploy

- [ ] Aplicação rodando: `pm2 status`
- [ ] Health check OK: `curl http://localhost:3001/health`
- [ ] SSL funcionando: `https://seu-dominio.com`
- [ ] Firewall ativo: `sudo ufw status`
- [ ] Backup configurado: `sudo crontab -l`
- [ ] Logs rotativos: PM2 gerencia automaticamente
- [ ] Auto-restart: `pm2 startup` configurado

---

## 🔒 Segurança Adicional

### Fail2ban (proteção contra brute force)

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Ver status
sudo fail2ban-client status
```

### Atualizações Automáticas

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📞 Contato

Para suporte, verifique:
- Logs: `pm2 logs`
- Documentação: `PostgreSQL/`
- Health: `curl http://seu-dominio.com/health`

---

**Deploy concluído!** 🎉

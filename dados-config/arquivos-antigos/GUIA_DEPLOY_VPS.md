# 🚀 Guia Completo: Deploy na VPS Hostinger
> **Última atualização:** 08/04/2026 - Deploy do Sistema Pesquisa de Clima

## 📋 Informações da VPS

| Item | Valor |
|------|-------|
| **Servidor** | srv1566743.hstgr.cloud |
| **IP** | 147.93.10.11 |
| **Usuário** | root |
| **Localização** | Brazil - São Paulo |
| **Plano** | KVM 2 (2 CPU, 8 GB RAM, 100 GB SSD) |
| **OS** | Ubuntu 24.04.4 LTS |

## � Informações do GitHub

| Item | Valor |
|------|-------|
| **Usuário** | nit-a11y |
| **Repositório** | pesquisa-clima-vanilla |
| **URL** | https://github.com/nit-a11y/pesquisa-clima-vanilla |
| **Branch** | main |

## 🌐 Sistema Deployado

| Sistema | Domínio | Porta | Status |
|---------|---------|-------|--------|
| Pesquisa de Clima | `pesquisadeclima.nordesteloc.cloud` | 3000 | ✅ Online |

> **Acesso:** https://pesquisadeclima.nordesteloc.cloud
> **SSL:** Let's Encrypt (válido até 07/07/2026)
> **Auto-renovação:** Ativada

---

## 📡 O que é a API da Hostinger?

A API da Hostinger permite **automatizar o gerenciamento da sua VPS via código**, sem precisar acessar o painel web. Com ela você pode:

- **Ligar/desligar/reiniciar** a VPS remotamente
- **Criar snapshots** (backups instantâneos)
- **Monitorar métricas** (CPU, memória, disco) em tempo real
- **Reinstalar o SO** automaticamente
- **Gerenciar firewall** via código

### Configuração da API (Opcional)

Para usar a API, gere um token no painel da Hostinger e configure o MCP no Windsurf:

```json
{
  "mcpServers": {
    "hostinger-mcp": {
      "command": "npx",
      "args": [
        "hostinger-api-mcp@latest"
      ],
      "env": {
        "API_TOKEN": "SEU_TOKEN_AQUI"
      }
    }
  }
}
```

> **Nota:** Para o deploy dos sistemas Node.js, você **não precisa usar a API** - é opcional para automações futuras.

---

## 🚀 Tutorial Passo a Passo

### ETAPA 1: Acessar a VPS

Conecte-se via SSH (use o terminal do Windows ou PowerShell):

```bash
ssh root@147.93.10.11
```

Digite a senha root quando solicitado.

---

### ETAPA 2.5: Configurar DNS (Registro A nos Subdomínios)

Antes de configurar o servidor, você precisa apontar os subdomínios para o IP da VPS no painel do seu registrador de domínio:

1. Acesse o painel de DNS do seu domínio (onde comprou nordesteloc.com.br)
2. Crie registros **Tipo A**:

| Tipo | Nome | Valor |
|------|------|-------|
| A | app1 | 147.93.10.11 |
| A | app2 | 147.93.10.11 |
| A | app3 | 147.93.10.11 |

3. Aguarde a propagação do DNS (pode levar de 10 minutos a 2 horas)
4. Verifique com: `nslookup app1.nordesteloc.com.br`

---

### ETAPA 3: Preparar o Ambiente

```bash
# Atualizar pacotes
apt update && apt upgrade -y

# Instalar Node.js (versão LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar instalação
node -v
npm -v

# Instalar PM2 globalmente
npm install -g pm2

# Instalar Nginx (para proxy reverso)
apt install -y nginx

# Instalar Git
apt install -y git
```

---

### ETAPA 4: Transferir Projetos para a VPS

#### Opção A: Via SCP (do PC local para VPS)

No seu **PC local** (PowerShell):

```powershell
# Compactar a pasta ecossistema
Compress-Archive -Path "C:\caminho\ecossistema\*" -DestinationPath "ecossistema.zip"

# Enviar para a VPS
scp ecossistema.zip root@147.93.10.11:/root/
```

Na **VPS**:

```bash
cd /root
apt install -y unzip
unzip ecossistema.zip -d /var/www/
mv /var/www/ecossistema /var/www/sistemas
```

#### Opção B: Via GitHub

```bash
cd /var/www
mkdir sistemas && cd sistemas

# Clonar cada projeto
git clone https://github.com/seuuser/sistema-1.git porta-3000
git clone https://github.com/seuuser/sistema-2.git porta-3001
git clone https://github.com/seuuser/sistema-3.git porta-3002
```

---

### ETAPA 5: Instalar Dependências

```bash
cd /var/www/sistemas

# Sistema na porta 3000
cd porta-3000
npm install
cd ..

# Sistema na porta 3001
cd porta-3001
npm install
cd ..

# Sistema na porta 3002
cd porta-3002
npm install
cd ..
```

---

### ETAPA 6: Configurar PM2

Crie o arquivo de configuração:

```bash
nano /var/www/sistemas/ecosystem.config.js
```

**Conteúdo:**

```javascript
module.exports = {
  apps: [
    {
      name: 'sistema-3000',
      cwd: '/var/www/sistemas/porta-3000',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_PATH: '/var/data/databases/sistema-3000.db',
        UPLOAD_PATH: '/var/data/uploads/sistema-3000',
        // URL pública do sistema
        PUBLIC_URL: 'https://app1.nordesteloc.com.br',
        // Trust proxy para obter IP real do cliente via Nginx
        TRUST_PROXY: 'loopback, linklocal, uniquelocal'
      },
      log_file: '/var/log/pm2/sistema-3000.log',
      out_file: '/var/log/pm2/sistema-3000-out.log',
      error_file: '/var/log/pm2/sistema-3000-error.log',
      merge_logs: true,
      time: true,
      // Auto-restart em caso de falha
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'sistema-3001',
      cwd: '/var/www/sistemas/porta-3001',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_PATH: '/var/data/databases/sistema-3001.db',
        UPLOAD_PATH: '/var/data/uploads/sistema-3001',
        PUBLIC_URL: 'https://app2.nordesteloc.com.br',
        TRUST_PROXY: 'loopback, linklocal, uniquelocal'
      },
      log_file: '/var/log/pm2/sistema-3001.log',
      out_file: '/var/log/pm2/sistema-3001-out.log',
      error_file: '/var/log/pm2/sistema-3001-error.log',
      merge_logs: true,
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'sistema-3002',
      cwd: '/var/www/sistemas/porta-3002',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        DB_PATH: '/var/data/databases/sistema-3002.db',
        UPLOAD_PATH: '/var/data/uploads/sistema-3002',
        PUBLIC_URL: 'https://app3.nordesteloc.com.br',
        TRUST_PROXY: 'loopback, linklocal, uniquelocal'
      },
      log_file: '/var/log/pm2/sistema-3002.log',
      out_file: '/var/log/pm2/sistema-3002-out.log',
      error_file: '/var/log/pm2/sistema-3002-error.log',
      merge_logs: true,
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

Salve: `Ctrl+O`, `Enter`, `Ctrl+X`

Crie as pastas necessárias:

```bash
mkdir -p /var/log/pm2
mkdir -p /var/data/databases
mkdir -p /var/data/uploads
```

Inicie os sistemas:

```bash
cd /var/www/sistemas
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save
pm2 startup systemd
```

---

### ETAPA 7: Configurar Nginx com SSL/HTTPS

**Arquitetura:** Nginx recebe as requisições HTTPS → faz proxy para os sistemas Node.js em localhost

#### 1. Remover configuração padrão

```bash
rm /etc/nginx/sites-enabled/default
```

#### 2. Configuração para app1.nordesteloc.com.br (Porta 3000)

```bash
nano /etc/nginx/sites-available/app1.nordesteloc.com.br
```

**Conteúdo:**

```nginx
server {
    listen 80;
    server_name app1.nordesteloc.com.br;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app1.nordesteloc.com.br;
    
    # SSL será configurado pelo Certbot automaticamente
    # (as linhas abaixo serão adicionadas pelo Certbot)
    # ssl_certificate /etc/letsencrypt/live/app1.nordesteloc.com.br/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/app1.nordesteloc.com.br/privkey.pem;
    
    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # HSTS - forçar HTTPS por 6 meses
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains; preload" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts aumentados para uploads (Multer)
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
    
    # Limite de tamanho para uploads (ajuste conforme necessário)
    client_max_body_size 50M;
}
```

#### 3. Configuração para app2.nordesteloc.com.br (Porta 3001)

```bash
nano /etc/nginx/sites-available/app2.nordesteloc.com.br
```

```nginx
server {
    listen 80;
    server_name app2.nordesteloc.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app2.nordesteloc.com.br;
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains; preload" always;
    
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
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
    
    client_max_body_size 50M;
}
```

#### 4. Configuração para app3.nordesteloc.com.br (Porta 3002)

```bash
nano /etc/nginx/sites-available/app3.nordesteloc.com.br
```

```nginx
server {
    listen 80;
    server_name app3.nordesteloc.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app3.nordesteloc.com.br;
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains; preload" always;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
    
    client_max_body_size 50M;
}
```

#### 5. Ativar Configurações

```bash
ln -s /etc/nginx/sites-available/app1.nordesteloc.com.br /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/app2.nordesteloc.com.br /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/app3.nordesteloc.com.br /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

#### 6. Instalar Certificados SSL (Certbot)

```bash
# Instalar Certbot e plugin do Nginx
apt install -y certbot python3-certbot-nginx

# Obter certificados para todos os subdomínios
certbot --nginx -d app1.nordesteloc.com.br -d app2.nordesteloc.com.br -d app3.nordesteloc.com.br --agree-tos --non-interactive --email seu-email@nordesteloc.com.br

# O Certbot configura automaticamente:
# - Certificados SSL gratuitos (Let's Encrypt)
# - Renovação automática (cron job)
# - Redirecionamento HTTP → HTTPS

# Verificar renovação automática
certbot renew --dry-run
```

> **Nota:** Certificados Let's Encrypt são gratuitos e válidos por 90 dias. O Certbot configura renovação automática via cron.

---

### ETAPA 8: Configurar Firewall (UFW)

```bash
# Instalar UFW
apt install -y ufw

# Configurar regras padrão
ufw default deny incoming
ufw default allow outgoing

# Permitir SSH (ESSENCIAL!)
ufw allow 22/tcp

# Permitir apenas HTTP e HTTPS (Nginx)
ufw allow 80/tcp
ufw allow 443/tcp

# IMPORTANTE: NÃO abra as portas 3000, 3001, 3002!
# Os sistemas só devem ser acessados via Nginx (HTTPS)

# Ativar firewall
ufw enable

# Verificar status
ufw status
```

> **Segurança:** As portas 3000, 3001 e 3002 ficam bloqueadas externamente. Apenas o Nginx na porta 443 pode acessá-las via proxy reverso.

---

### ETAPA 9: Configurar SQLite em Produção

Mova os bancos de dados para uma pasta central:

```bash
# Criar pasta para bancos
mkdir -p /var/data/databases

# Mover bancos existentes
mv /var/www/sistemas/porta-3000/database.db /var/data/databases/sistema-3000.db
mv /var/www/sistemas/porta-3001/database.db /var/data/databases/sistema-3001.db
mv /var/www/sistemas/porta-3002/database.db /var/data/databases/sistema-3002.db

# Ajustar permissões
chown -R www-data:www-data /var/data/databases
chmod -R 755 /var/data/databases
```

---

### ETAPA 10: Configurar Pasta de Uploads (Multer)

```bash
# Criar pastas para uploads
mkdir -p /var/data/uploads/sistema-3000
mkdir -p /var/data/uploads/sistema-3001
mkdir -p /var/data/uploads/sistema-3002

# Configurar permissões
chown -R www-data:www-data /var/data/uploads
chmod -R 755 /var/data/uploads
```

---

## 📝 Adaptando seus Sistemas Node.js

Seus sistemas precisam ler as variáveis de ambiente configuradas no `ecosystem.config.js`:

### Exemplo: Configurando SQLite

```javascript
// database.js ou db.js
const path = require('path');

// Usa a variável de ambiente ou fallback para desenvolvimento
const dbPath = process.env.DB_PATH || './database.db';

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err);
  } else {
    console.log('Conectado ao SQLite em:', dbPath);
  }
});

module.exports = db;
```

### Exemplo: Configurando Multer

```javascript
// upload.js ou middleware de upload
const multer = require('multer');
const path = require('path');

// Usa a variável de ambiente ou fallback para desenvolvimento
const uploadPath = process.env.UPLOAD_PATH || './uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

module.exports = upload;
```

### Exemplo: Configurando Express para HTTPS/Proxy

```javascript
// server.js ou app.js
const express = require('express');
const app = express();

// Confia no proxy (Nginx) para obter IP real do cliente
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', process.env.TRUST_PROXY);
}

// Middleware para forçar HTTPS em produção
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, 'https://' + req.headers.host + req.url);
    }
    next();
  });
}

// Usa a porta da variável de ambiente ou fallback
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em ${process.env.PUBLIC_URL || 'http://localhost:' + PORT}`);
});
```

### Exemplo: Servindo arquivos estáticos de uploads

```javascript
// app.js
const express = require('express');
const path = require('path');

const app = express();

// Configura pasta de uploads como estática
const uploadPath = process.env.UPLOAD_PATH || './uploads';
app.use('/uploads', express.static(uploadPath));

// Agora arquivos em /uploads/foto.jpg serão acessíveis via:
// https://app1.nordesteloc.com.br/uploads/foto.jpg
```

---

## 🎮 Comandos Úteis do PM2

| Comando | Descrição |
|---------|-----------|
| `pm2 status` | Ver status de todos os sistemas |
| `pm2 logs` | Ver logs em tempo real de todos |
| `pm2 logs sistema-3000` | Ver logs de um sistema específico |
| `pm2 restart sistema-3000` | Reiniciar um sistema |
| `pm2 stop sistema-3000` | Parar um sistema |
| `pm2 start sistema-3000` | Iniciar um sistema |
| `pm2 delete sistema-3000` | Remover um sistema do PM2 |
| `pm2 monit` | Monitorar CPU e memória em tempo real |
| `pm2 show sistema-3000` | Ver estatísticas detalhadas |
| `pm2 save` | Salvar configuração atual |

---

## 🔧 Comandos Úteis do Sistema

| Comando | Descrição |
|---------|-----------|
| `ufw status` | Ver status do firewall |
| `nginx -t` | Testar configuração do Nginx |
| `systemctl restart nginx` | Reiniciar Nginx |
| `systemctl status nginx` | Ver status do Nginx |
| `df -h` | Ver uso de disco |
| `free -h` | Ver uso de memória |
| `htop` | Monitor de recursos (se instalado) |

---

## 📁 Estrutura de Pastas Final

```
/var/
├── www/
│   └── sistemas/
│       ├── ecosystem.config.js
│       ├── porta-3000/
│       │   ├── package.json
│       │   └── ... (arquivos do projeto)
│       ├── porta-3001/
│       └── porta-3002/
├── data/
│   ├── databases/
│   │   ├── sistema-3000.db
│   │   ├── sistema-3001.db
│   │   └── sistema-3002.db
│   └── uploads/
│       ├── sistema-3000/
│       ├── sistema-3001/
│       └── sistema-3002/
└── log/
    └── pm2/
        ├── sistema-3000.log
        ├── sistema-3001.log
        └── sistema-3002.log
```

---

## ⚠️ Checklist de Deploy

- [ ] **ETAPA 2.5:** Configurar DNS (registros A: app1, app2, app3 → 147.93.10.11)
- [ ] **ETAPA 1:** Acessar VPS via SSH
- [ ] **ETAPA 3:** Preparar ambiente (Node.js, PM2, Nginx, Git)
- [ ] **ETAPA 4:** Transferir projetos para `/var/www/sistemas`
- [ ] **ETAPA 5:** Executar `npm install` em todos os projetos
- [ ] **ETAPA 6:** Criar `ecosystem.config.js` com variáveis de ambiente
- [ ] **ETAPA 9:** Criar pastas `/var/data/databases` e mover bancos SQLite
- [ ] **ETAPA 10:** Criar pastas `/var/data/uploads` e configurar Multer
- [ ] **ETAPA 6 (cont.):** Iniciar sistemas com PM2
- [ ] **ETAPA 7:** Configurar Nginx com proxy reverso e headers de segurança
- [ ] **ETAPA 7 (cont.):** Instalar Certificados SSL (Let's Encrypt)
- [ ] **ETAPA 8:** Configurar Firewall (UFW) - apenas portas 22, 80, 443
- [ ] Testar acesso HTTPS: https://app1.nordesteloc.com.br
- [ ] Testar acesso HTTPS: https://app2.nordesteloc.com.br
- [ ] Testar acesso HTTPS: https://app3.nordesteloc.com.br

---

## 🔒 Dicas de Segurança

1. **Altere a senha root** após o primeiro acesso
2. **Crie um usuário não-root** para deploy de aplicações
3. **Configure backups automáticos** via painel Hostinger
4. **Monitore logs regularmente** com `pm2 logs`
5. **Mantenha o sistema atualizado** com `apt update && apt upgrade`
6. **Configure rotação de logs** do PM2: `pm2 install pm2-logrotate`

---

## 📞 Acesso aos Sistemas

Após configurado, seus sistemas estarão disponíveis apenas via HTTPS:

| Sistema | URL de Acesso |
|---------|---------------|
| Sistema 1 (Porta 3000) | https://app1.nordesteloc.com.br |
| Sistema 2 (Porta 3001) | https://app2.nordesteloc.com.br |
| Sistema 3 (Porta 3002) | https://app3.nordesteloc.com.br |

> **Nota:** Acesso direto via IP:porta (http://147.93.10.11:3000) será bloqueado pelo firewall para segurança. Todos os acessos devem passar pelo Nginx com HTTPS.

---

## 🆘 Troubleshooting

### Sistema não inicia com PM2
```bash
# Verificar logs
pm2 logs nome-do-sistema

# Verificar se porta está em uso
lsof -i :3000

# Matar processo na porta
kill -9 $(lsof -t -i:3000)
```

### Nginx erro 502 Bad Gateway
```bash
# Verificar se sistema está rodando
pm2 status

# Verificar logs do Nginx
tail -f /var/log/nginx/error.log
```

### Permissão negada no SQLite/Multer
```bash
# Ajustar permissões
chown -R www-data:www-data /var/data
chmod -R 755 /var/data
```

---

## 🚀 Métodos de Deploy: GitHub vs Manual

Existem duas formas de colocar seus sistemas na VPS:

| Método | Quando Usar | Vantagem |
|--------|-------------|----------|
| **GitHub (Git Clone)** | Você já versiona código no GitHub | Fácil atualização, histórico de versões |
| **Manual (SCP/Upload)** | Código local, sem GitHub | Rápido, sem dependência de internet no GitHub |

> ⚠️ **IMPORTANTE:** NUNCA commitar arquivos `.sqlite`, `uploads/` ou `.env` no GitHub!

---

### 📝 Passo 0: Configurar `.gitignore` (OBRIGATÓRIO)

Antes de qualquer deploy, crie este arquivo no seu projeto:

```bash
# No seu PC local, dentro da pasta do sistema
nano .gitignore
```

**Conteúdo do `.gitignore`:**

```gitignore
# Bancos de dados (NUNCA commitar!)
*.sqlite
*.sqlite3
*.db
*.db-journal

# Arquivos de upload
uploads/
uploads/*
public/uploads/

# Variáveis de ambiente
.env
.env.local
.env.production

# Dependências
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Logs
logs/
*.log

# Sistema operacional
.DS_Store
Thumbs.db

# IDEs
.vscode/
.idea/
*.swp
*.swo
```

Salvar e fazer commit inicial:

```bash
git init
git add .
git commit -m "Sistema pronto para deploy"
git branch -M main
```

---

### 🌐 Opção A: Deploy via GitHub (Recomendado)

#### **1. Preparar Repositório (PC Local)**

```bash
# No PC local, dentro da pasta do sistema
cd meu-sistema

# Criar repositório GitHub (via web ou CLI)
gh repo create seuuser/meu-sistema --public --source=. --remote=origin --push

# Ou manualmente:
git remote add origin https://github.com/seuuser/meu-sistema.git
git push -u origin main
```

#### **2. Clonar na VPS**

```bash
# Acessar VPS
ssh root@147.93.10.11

# Criar pasta dos sistemas
mkdir -p /var/www/sistemas
cd /var/www/sistemas

# Clonar repositório (apenas código, sem dados!)
git clone https://github.com/seuuser/meu-sistema.git porta-3000

# Entrar na pasta e instalar dependências
cd porta-3000
npm install
```

#### **3. Criar Pastas de Dados (Fora do Git)**

```bash
# Criar pasta para banco e uploads (separado do código)
mkdir -p /var/data/databases
mkdir -p /var/data/uploads/sistema-3000

# Permissões
chown -R www-data:www-data /var/data/uploads/sistema-3000
chmod -R 755 /var/data/uploads/sistema-3000
```

#### **4. Configurar Código para usar Variáveis de Ambiente**

**database.js:**

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Usa variável de ambiente ou fallback
const dbPath = process.env.DB_PATH || './database.db';

// Cria pasta do banco se não existir
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar SQLite:', err);
  } else {
    console.log('✅ SQLite conectado em:', dbPath);
    
    // Cria tabelas na primeira execução
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
});

module.exports = db;
```

**upload.js (Multer):**

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Usa variável de ambiente
const uploadPath = process.env.UPLOAD_PATH || './uploads';

// Cria pasta se não existir
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

module.exports = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});
```

**server.js (Express + Configurações de Produção):**

```javascript
const express = require('express');
const path = require('path');

const app = express();

// Confia no proxy (Nginx) para obter IP real
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', process.env.TRUST_PROXY);
}

// Forçar HTTPS em produção
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, 'https://' + req.headers.host + req.url);
    }
    next();
  });
}

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos de uploads
const uploadPath = process.env.UPLOAD_PATH || './uploads';
app.use('/uploads', express.static(uploadPath));

// Rotas
const db = require('./database');

// API de exemplo
app.get('/api/usuarios', (req, res) => {
  db.all('SELECT * FROM usuarios ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Rota de backup do banco (protegida)
app.get('/admin/download-db', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  const dbPath = process.env.DB_PATH;
  if (!require('fs').existsSync(dbPath)) {
    return res.status(404).json({ error: 'Banco não encontrado' });
  }
  
  const filename = `backup-${new Date().toISOString().split('T')[0]}.sqlite`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.sendFile(require('path').resolve(dbPath));
});

// Porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em ${process.env.PUBLIC_URL || 'http://localhost:' + PORT}`);
});
```

#### **5. Atualizar ecosystem.config.js**

```javascript
module.exports = {
  apps: [{
    name: 'sistema-3000',
    cwd: '/var/www/sistemas/porta-3000',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DB_PATH: '/var/data/databases/sistema-3000.db',
      UPLOAD_PATH: '/var/data/uploads/sistema-3000',
      PUBLIC_URL: 'https://app1.nordesteloc.com.br',
      TRUST_PROXY: 'loopback, linklocal, uniquelocal',
      ADMIN_TOKEN: 'sua-senha-super-secreta-123'  // Para download do backup
    },
    log_file: '/var/log/pm2/sistema-3000.log',
    out_file: '/var/log/pm2/sistema-3000-out.log',
    error_file: '/var/log/pm2/sistema-3000-error.log',
    merge_logs: true,
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

#### **6. Iniciar com PM2**

```bash
cd /var/www/sistemas
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd
```

#### **7. Atualizar Sistema (Futuro)**

```bash
cd /var/www/sistemas/porta-3000

# Puxar atualizações do GitHub
git pull origin main

# Reinstalar dependências (se package.json mudou)
npm install

# Reiniciar no PM2
pm2 restart sistema-3000
```

---

### 📁 Opção B: Deploy Manual (Sem GitHub)

Use quando:
- Não tem repositório Git
- Código está apenas no seu PC
- Quer transferir rápido

#### **1. Preparar Projeto Local**

No seu PC local:

```bash
cd meu-sistema

# Criar .gitignore (mesmo sem GitHub, para organização)
echo "*.sqlite" >> .gitignore
echo "uploads/" >> .gitignore
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore

# Remover pastas que não devem ir para VPS
# (já estão no .gitignore, mas garantir)
rm -rf node_modules
rm -f *.sqlite
rm -rf uploads/

# Compactar projeto
# Windows (PowerShell):
Compress-Archive -Path "*" -DestinationPath "sistema-3000.zip"

# Linux/Mac:
zip -r sistema-3000.zip . -x "node_modules/*" "*.sqlite" "uploads/*" ".env"
```

#### **2. Transferir para VPS**

```bash
# No PC local - enviar via SCP
scp sistema-3000.zip root@147.93.10.11:/root/
```

Ou use **FileZilla/WinSCP** com SFTP:
- Host: `147.93.10.11`
- Usuário: `root`
- Senha: (sua senha root)
- Porta: `22`

#### **3. Extrair na VPS**

```bash
# Na VPS
ssh root@147.93.10.11

# Criar estrutura
mkdir -p /var/www/sistemas
cd /var/www/sistemas

# Extrair
apt install -y unzip
unzip /root/sistema-3000.zip -d porta-3000
cd porta-3000

# Instalar dependências
npm install
```

#### **4. Configurar Restante (Igual Opção A)**

Siga os **passos 3, 4, 5 e 6** da Opção A (criar pastas de dados, configurar código, ecosystem.config.js, iniciar PM2).

#### **5. Atualizar Sistema Manual (Futuro)**

```bash
# Na VPS - fazer backup dos dados primeiro
cp /var/data/databases/sistema-3000.db /var/backups/
cp -r /var/data/uploads/sistema-3000 /var/backups/

# Remover pasta antiga
rm -rf /var/www/sistemas/porta-3000

# Transferir nova versão do PC local
# (repetir passos 1 e 2)

# Extrair e instalar
cd /var/www/sistemas
unzip /root/sistema-3000-nova.zip -d porta-3000
cd porta-3000 && npm install

# Reiniciar
pm2 restart sistema-3000
```

---

### 🔐 Segurança: Download do Banco SQLite

Depois de configurado, você pode baixar o banco assim:

```bash
# Via curl (terminal)
curl -H "x-admin-token: sua-senha-super-secreta-123" \
     https://app1.nordesteloc.com.br/admin/download-db \
     -o backup-$(date +%Y%m%d).sqlite

# Ou via navegador
# Acesse: https://app1.nordesteloc.com.br/admin/download-db
# Header: x-admin-token: sua-senha-super-secreta-123
```

---

### 📋 Resumo das Diferenças

| Aspecto | GitHub | Manual |
|---------|--------|--------|
| **Setup inicial** | Médio | Rápido |
| **Atualização** | `git pull` | Reenviar ZIP |
| **Versionamento** | ✅ Histórico completo | ❌ Sem histórico |
| **Colaboração** | ✅ Fácil com equipe | ❌ Difícil |
| **Backup de código** | ✅ No GitHub | ❌ Apenas local |
| **Dados (SQLite)** | Fora do Git (sempre!) | Fora do ZIP (sempre!) |

---

## ➕ Adicionando Mais Sistemas

Quer adicionar um 4º, 5º sistema? Siga este passo a passo:

### Exemplo: Adicionando Sistema na Porta 3003

#### 1. Escolher Porta e Subdomínio

| Sistema | Porta Interna | Subdomínio |
|---------|---------------|------------|
| Sistema 4 | 3003 | `app4.nordesteloc.com.br` |
| Sistema 5 | 3004 | `app5.nordesteloc.com.br` |

#### 2. Configurar DNS

No painel do seu domínio, adicione um novo registro A:

| Tipo | Nome | Valor |
|------|------|-------|
| A | app4 | 147.93.10.11 |

#### 3. Transferir Projeto

```bash
# Na VPS
cd /var/www/sistemas

# Criar pasta (via SCP, Git clone, etc.)
mkdir porta-3003
cd porta-3003

# Transferir arquivos do projeto...

# Instalar dependências
npm install
```

#### 4. Criar Pastas de Dados

```bash
# Banco de dados
mkdir -p /var/data/databases
mkdir -p /var/data/uploads/sistema-3003

# Permissões
chown -R www-data:www-data /var/data/uploads/sistema-3003
chmod -R 755 /var/data/uploads/sistema-3003
```

#### 5. Adicionar ao ecosystem.config.js

Edite `/var/www/sistemas/ecosystem.config.js` e adicione um novo app:

```javascript
module.exports = {
  apps: [
    // ... apps existentes ...
    {
      name: 'sistema-3003',
      cwd: '/var/www/sistemas/porta-3003',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        DB_PATH: '/var/data/databases/sistema-3003.db',
        UPLOAD_PATH: '/var/data/uploads/sistema-3003',
        PUBLIC_URL: 'https://app4.nordesteloc.com.br',
        TRUST_PROXY: 'loopback, linklocal, uniquelocal'
      },
      log_file: '/var/log/pm2/sistema-3003.log',
      out_file: '/var/log/pm2/sistema-3003-out.log',
      error_file: '/var/log/pm2/sistema-3003-error.log',
      merge_logs: true,
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

#### 6. Criar Configuração do Nginx

```bash
nano /etc/nginx/sites-available/app4.nordesteloc.com.br
```

```nginx
server {
    listen 80;
    server_name app4.nordesteloc.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app4.nordesteloc.com.br;
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains; preload" always;
    
    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
    
    client_max_body_size 50M;
}
```

Ativar:

```bash
ln -s /etc/nginx/sites-available/app4.nordesteloc.com.br /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### 7. Gerar Certificado SSL

```bash
certbot --nginx -d app4.nordesteloc.com.br --agree-tos --non-interactive --email seu-email@nordesteloc.com.br
```

Ou adicione ao certificado existente:

```bash
certbot --nginx --expand -d app1.nordesteloc.com.br -d app2.nordesteloc.com.br -d app3.nordesteloc.com.br -d app4.nordesteloc.com.br
```

#### 8. Iniciar com PM2

```bash
cd /var/www/sistemas
pm2 start ecosystem.config.js  # Carrega o novo app
pm2 save
```

---

### 📊 Capacidade da VPS

**Sua VPS (KVM 2):**
- **CPU:** 2 núcleos
- **RAM:** 8 GB
- **Disco:** 100 GB

**Estimativa de capacidade:**

| Tipo de Sistema | Quantidade Estimada |
|-----------------|---------------------|
| Sistemas leves (APIs simples) | 15-20 |
| Sistemas médios (com SQLite) | 8-12 |
| Sistemas pesados (muitos uploads) | 4-6 |

**Monitoramento:**

```bash
# Ver uso de recursos
pm2 monit
htop
df -h  # Disco
free -h  # Memória
```

> **Dica:** Se a VPS começar a ficar lenta, considere fazer upgrade para KVM 4 (4 CPU / 16GB RAM) ou otimizar os sistemas.

---

---

## 📝 RESUMO DO DEPLOY REALIZADO (08/04/2026)

### Sistema Deployado
- **Nome:** Pesquisa de Clima Organizacional
- **Domínio:** https://pesquisadeclima.nordesteloc.cloud
- **Porta:** 3000
- **Stack:** Node.js + Express + SQLite

### Comandos de Acesso Rápido

```bash
# Acessar VPS
ssh root@147.93.10.11

# Ver status do sistema
cd /var/www/sistemas/pesquisa-clima
pm2 status
pm2 logs pesquisa-clima

# Ver logs Nginx
tail -f /var/log/nginx/error.log

# Atualizar código (pull do GitHub)
cd /var/www/sistemas/pesquisa-clima
git pull
pm2 restart pesquisa-clima
```

### Estrutura Real de Pastas

```
/var/www/sistemas/
└── pesquisa-clima/                 # Código do projeto
    ├── backend/
    │   ├── controllers/
    │   ├── database/
    │   ├── routes/
    │   └── services/
    ├── frontend/
    │   ├── assets/
    │   │   ├── css/
    │   │   ├── images/
    │   │   └── js/
    │   └── index.html
    ├── ecosystem.config.cjs        # Config PM2
    ├── package.json
    └── server.js

/var/data/
├── databases/
│   └── pesquisa-clima.db            # Banco SQLite
└── uploads/
    └── pesquisa-clima/              # Uploads (se houver)

/var/log/pm2/
├── pesquisa-clima-out.log
├── pesquisa-clima-error.log
└── pesquisa-clima.log
```

### Troubleshooting Comum

| Problema | Causa | Solução |
|----------|-------|---------|
| 502 Bad Gateway | Node.js parado | `pm2 restart pesquisa-clima` |
| 502 Bad Gateway | Porta errada | Verificar `process.env.PORT` |
| SSL_ERROR | Certificado expirado | `certbot renew` |
| SQLITE_CANTOPEN | Permissão/pasta | `mkdir -p /var/data/databases` |

### Arquivos de Configuração Importantes

**ecosystem.config.cjs:**
```javascript
module.exports = {
  apps: [{
    name: 'pesquisa-clima',
    cwd: '/var/www/sistemas/pesquisa-clima',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DB_PATH: '/var/data/databases/pesquisa-clima.db',
      PUBLIC_URL: 'https://pesquisadeclima.nordesteloc.cloud',
      TRUST_PROXY: 'loopback, linklocal, uniquelocal'
    },
    autorestart: true
  }]
};
```

**Nginx (/etc/nginx/sites-available/pesquisa-clima):**
```nginx
server {
    listen 80;
    server_name pesquisadeclima.nordesteloc.cloud;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pesquisadeclima.nordesteloc.cloud;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

**Documento atualizado em:** 2026-04-08  
**VPS:** srv1566743.hstgr.cloud (KVM 2 - 8GB RAM / 100GB SSD)  
**GitHub:** https://github.com/nit-a11y/pesquisa-clima-vanilla

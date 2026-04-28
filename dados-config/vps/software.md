# 📦 SOFTWARE INSTALADO - VPS srv1566743

**Data:** 28/04/2026  
**SO:** Ubuntu 24.04.4 LTS  

---

## ✅ **SOFTWARE JÁ INSTALADO**

### **Serviços Ativos**
- ✅ **Nginx:** Servidor web + proxy reverso
  - Versão: Detectar com `nginx -v`
  - Status: Ativo e rodando
  - Portas: 80 (HTTP), 443 (HTTPS)
  - Config: `/etc/nginx/`

- ✅ **PM2:** Process Manager para Node.js
  - Versão: Detectar com `pm2 -v`
  - Status: Ativo
  - Apps rodando: 1 (pesquisa-clima)
  - Config: `/root/.pm2/`

### **Sistema Operacional**
- ✅ **Ubuntu 24.04.4 LTS**
  - Kernel: 6.8.0-107-generic
  - Pacotes atualizáveis: 20
  - Status: Requer reinicialização

### **Ferramentas Padrão**
- ✅ **SSH:** Servidor OpenSSH
- ✅ **UFW:** Firewall (ativo)
- ✅ **Systemd:** Gerenciador de serviços
- ✅ **Apt:** Gerenciador de pacotes

---

## ❌ **SOFTWARE NECESSÁRIO (NÃO INSTALADO)**

### **Banco de Dados**
- ❌ **PostgreSQL:** Necessário para RH+, POP, PRD, Matriz
- ❌ **MySQL:** Não necessário (usaremos PostgreSQL)

### **Runtime JavaScript**
- ❌ **Node.js:** Necessário para deploy dos sistemas
- ❌ **NPM:** Gerenciador de pacotes Node.js

### **Ferramentas de Deploy**
- ❌ **Git:** Para clonar repositórios
- ❌ **Certbot:** Para SSL Let's Encrypt

---

## 🔄 **PLANO DE INSTALAÇÃO**

### **Prioridade ALTA**
```bash
# 1. Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 2. PostgreSQL 15
apt install -y postgresql postgresql-contrib

# 3. Git
apt install -y git

# 4. Certbot (SSL)
apt install -y certbot python3-certbot-nginx
```

### **Prioridade MÉDIA**
```bash
# 5. Ferramentas de monitoramento
apt install -y htop iotop nethogs

# 6. Ferramentas de backup
apt install -y rclone

# 7. Editor de texto
apt install -y nano vim
```

---

## 📋 **VERIFICAÇÃO DE SOFTWARE**

### **Comandos para Verificar**
```bash
# Node.js
node -v
npm -v

# PostgreSQL
psql --version
sudo -u postgres psql -l

# Git
git --version

# Nginx
nginx -v

# PM2
pm2 -v
pm2 list

# Certbot
certbot --version

# Sistema
apt list --upgradable
```

---

## 🗂️ **CONFIGURAÇÕES IMPORTANTES**

### **Node.js**
- **Versão desejada:** 20.x LTS
- **Local:** /usr/bin/node
- **NPM:** /usr/bin/npm
- **Módulos globais:** PM2, outros

### **PostgreSQL**
- **Versão desejada:** 15+
- **Data dir:** /var/lib/postgresql/
- **Config:** /etc/postgresql/
- **Logs:** /var/log/postgresql/

### **Nginx**
- **Config:** /etc/nginx/nginx.conf
- **Sites:** /etc/nginx/sites-available/
- **Logs:** /var/log/nginx/
- **SSL:** /etc/letsencrypt/

### **PM2**
- **Config:** /root/.pm2/ecosystem.config.js
- **Logs:** /root/.pm2/logs/
- **Apps:** /var/www/*/ecosystem.config.js

---

## 🔧 **CONFIGURAÇÕES PÓS-INSTALAÇÃO**

### **Node.js**
```bash
# Verificar instalação
node -v && npm -v

# Instalar PM2 globalmente
npm install -g pm2

# Configurar npm para produção
npm config set production true
```

### **PostgreSQL**
```bash
# Iniciar serviço
systemctl start postgresql
systemctl enable postgresql

# Configurar acesso
sudo -u postgres psql

# Criar usuários e bancos
```

### **Git**
```bash
# Configurar usuário
git config --global user.name "NIT Systems"
git config --global user.email "admin@nordesteloc.com.br"

# Testar conexão
ssh -T git@github.com
```

---

## 📊 **USO DE RECURSOS POR SOFTWARE**

### **Estimativa de Memória**
| Software | RAM Base | RAM por Instância |
|-----------|----------|-------------------|
| Nginx | ~10MB | - |
| PostgreSQL | ~100MB | ~50MB por banco |
| Node.js | ~30MB | ~50MB por app |
| PM2 | ~20MB | ~10MB por app |

### **Estimativa de Disco**
| Software | Espaço Base |
|-----------|-------------|
| Node.js | ~200MB |
| PostgreSQL | ~500MB |
| Nginx | ~50MB |
| Git | ~100MB |
| Certbot | ~100MB |

---

## ⚠️ **CONFLITOS E CONSIDERAÇÕES**

### **Portas**
- **80/443:** Nginx (ocupado)
- **3000:** Pesquisa Clima (ocupado)
- **3001-3005:** Disponíveis para novos sistemas
- **5432:** PostgreSQL (será usado)

### **Serviços**
- **Apache:** Não instalar (conflita com Nginx)
- **MySQL:** Não instalar (usaremos PostgreSQL)
- **Docker:** Opcional, não necessário agora

---

## 🔄 **MANUTENÇÃO**

### **Atualizações**
```bash
# Atualizar sistema
apt update && apt upgrade -y

# Atualizar Node.js
npm update -g

# Atualizar PM2
pm2 update
```

### **Limpeza**
```bash
# Limpar cache apt
apt autoremove && apt autoclean

# Limpar npm
npm cache clean --force

# Limpar logs antigos
journalctl --vacuum-time=7d
```

---

*Última atualização: 28/04/2026*  
*Status: Aguardando instalação de softwares necessários*

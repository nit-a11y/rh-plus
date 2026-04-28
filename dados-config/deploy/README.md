# 🚀 Deploy - Scripts e Automação

**Data:** 28/04/2026  
**Status:** Scripts prontos para deploy automático

---

## 📋 **Visão Geral**

### **Scripts Disponíveis**
- **[deploy-rh-plus.sh](./scripts/deploy-rh-plus.sh)** - Deploy completo RH+
- **[deploy-rh-plus-provisorio.sh](./scripts/deploy-rh-plus-provisorio.sh)** - Domínio provisório

### **Sistemas Configurados**
| Sistema | Script | Domínio | Porta | Status |
|---------|---------|---------|-------|--------|
| RH+ | deploy-rh-plus.sh | rh.nordesteloc.cloud | 3001 | 🔄 Pronto |
| RH+ (Provisório) | deploy-rh-plus-provisorio.sh | rh.nordesteloc.cloud | 3001 | 🔄 Pronto |

---

## 🎯 **Deploy RH+ - Sistema Principal**

### **Script Principal**
```bash
# Deploy completo para domínio final
./deploy/scripts/deploy-rh-plus.sh
```

**O que faz:**
- ✅ Instala PostgreSQL (se necessário)
- ✅ Configura banco `rh` com usuário `rh_user`
- ✅ Deploy do projeto RH+ na VPS
- ✅ Configura PM2 para gerenciar processo
- ✅ Configura Nginx como reverse proxy
- ✅ Instala SSL Let's Encrypt
- ✅ Configura backup automático

### **Script Provisório**
```bash
# Deploy para domínio provisório
./deploy/scripts/deploy-rh-plus-provisorio.sh
```

**Diferenças:**
- Usa domínio `rh.nordesteloc.cloud`
- Configuração para ambiente de testes
- SSL para domínio provisório

---

## 🔧 **Configuração Pré-Deploy**

### **Requisitos VPS**
- **VPS:** 147.93.10.11 (Hostinger)
- **SO:** Ubuntu 24.04.4 LTS
- **Acesso:** SSH como root
- **DNS:** Apontado para VPS

### **Variáveis de Ambiente**
```bash
# Configurações do script
DOMAIN="rh.nordesteloc.cloud"
PROJECT_NAME="rh-plus"
PORT=3001
VPS_IP="147.93.10.11"
DB_USER="rh_user"
DB_PASSWORD="RhPlus2026!Secure"
DB_NAME="rh"
```

---

## 🚀 **Executando o Deploy**

### **Passo 1: Acessar VPS**
```bash
ssh root@147.93.10.11
```

### **Passo 2: Baixar Scripts**
```bash
# Clonar ou transferir scripts
git clone <repositorio> /tmp/dados-config
# Ou usar SCP para transferir
```

### **Passo 3: Executar Deploy**
```bash
cd /tmp/dados-config
chmod +x deploy/scripts/deploy-rh-plus.sh
./deploy/scripts/deploy-rh-plus.sh
```

### **Passo 4: Verificar Deploy**
```bash
# Verificar PM2
pm2 status

# Verificar aplicação
curl http://localhost:3001/health

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

---

## 📊 **Etapas do Deploy**

### **ETAPA 1: Pré-requisitos**
- Atualizar sistema
- Instalar Node.js, PM2, PostgreSQL
- Configurar firewall

### **ETAPA 2: Banco de Dados**
- Criar banco `rh`
- Criar usuário `rh_user`
- Configurar permissões

### **ETAPA 3: Projeto**
- Clonar/transferir código
- Instalar dependências
- Configurar ambiente

### **ETAPA 4: PM2**
- Iniciar aplicação
- Configurar auto-restart
- Salvar configuração

### **ETAPA 5: Nginx**
- Configurar reverse proxy
- Configurar SSL
- Testar configuração

### **ETAPA 6: Backup**
- Configurar script de backup
- Agendar no crontab
- Testar backup

---

## 🔍 **Verificação Pós-Deploy**

### **Health Check**
```bash
# Verificar aplicação
curl https://rh.nordesteloc.cloud/health

# Verificar SSL
curl -I https://rh.nordesteloc.cloud

# Verificar logs
pm2 logs rh-plus
```

### **Banco de Dados**
```bash
# Verificar conexão
sudo -u postgres psql rh -c "SELECT COUNT(*) FROM users;"

# Verificar tabelas
sudo -u postgres psql rh -c "\dt"
```

### **Sistema**
```bash
# Verificar processos
ps aux | grep node

# Verificar portas
netstat -tlnp | grep :3001

# Verificar Nginx
sudo systemctl status nginx
```

---

## 🛠️ **Comandos Úteis**

### **Gerenciar PM2**
```bash
pm2 status                    # Ver status
pm2 logs rh-plus             # Ver logs
pm2 restart rh-plus          # Reiniciar
pm2 stop rh-plus             # Parar
pm2 delete rh-plus           # Remover
pm2 monit                    # Monitorar
```

### **Gerenciar Nginx**
```bash
sudo nginx -t                # Testar configuração
sudo systemctl reload nginx   # Recarregar
sudo systemctl restart nginx  # Reiniciar
sudo nginx -s reload         # Recarregar suave
```

### **Gerenciar PostgreSQL**
```bash
sudo systemctl status postgresql
sudo -u postgres psql rh
sudo -u postgres pg_dump rh > backup.sql
```

---

## 🆘 **Troubleshooting**

### **Problemas Comuns**

#### **Deploy Falha**
```bash
# Verificar logs do script
tail -f deploy.log

# Verificar permissões
ls -la deploy/scripts/

# Executar modo debug
bash -x deploy/scripts/deploy-rh-plus.sh
```

#### **Aplicação Não Inicia**
```bash
# Verificar PM2
pm2 status
pm2 logs rh-plus --lines 50

# Verificar porta
lsof -i :3001

# Verificar Node.js
node --version
npm --version
```

#### **Nginx 502 Bad Gateway**
```bash
# Verificar se app está rodando
curl http://localhost:3001/health

# Verificar Nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log

# Verificar upstream
cat /etc/nginx/sites-available/rh-plus
```

#### **SSL Não Instala**
```bash
# Verificar DNS
dig rh.nordesteloc.cloud

# Instalar manualmente
sudo certbot --nginx -d rh.nordesteloc.cloud --agree-tos --email nit@nordesteloc.com.br

# Verificar certificado
sudo certbot certificates
```

---

## 🔄 **Atualização e Manutenção**

### **Atualizar Código**
```bash
# Na VPS
cd /var/www/rh-plus
git pull
npm install
pm2 restart rh-plus
```

### **Atualizar Configuração**
```bash
# Editar .env
nano /var/www/rh-plus/.env

# Reiniciar PM2
pm2 restart rh-plus
```

### **Backup e Restore**
```bash
# Backup
sudo /usr/local/bin/backup-rh-plus.sh

# Restore (se necessário)
sudo -u postgres psql rh < /backups/rh_backup.sql
```

---

## 📋 **Checklist de Deploy**

### **Antes do Deploy**
- [ ] VPS acessível via SSH
- [ ] DNS configurado e propagado
- [ ] Scripts baixados e executáveis
- [ ] Credenciais verificadas

### **Durante o Deploy**
- [ ] Pré-requisitos instalados
- [ ] PostgreSQL configurado
- [ ] Projeto deployado
- [ ] PM2 funcionando
- [ ] Nginx configurado
- [ ] SSL instalado

### **Após o Deploy**
- [ ] Health check OK
- [ ] SSL funcionando
- [ ] Backup configurado
- [ ] Logs sem erros
- [ ] Performance aceitável

---

## 📞 **Suporte**

### **Documentação Relacionada**
- **[GUIA-CENTRAL.md](../GUIA-CENTRAL.md)** - Guia mestre
- **[bancos/README.md](../bancos/README.md)** - Config bancos
- **[sistemas/rh-plus/docs/README.md](../sistemas/rh-plus/docs/README.md)** - Sistema RH+

### **Contato de Emergência**
- **VPS:** `ssh root@147.93.10.11`
- **Logs:** `pm2 logs rh-plus`
- **Status:** `curl https://rh.nordesteloc.cloud/health`

---

**Status:** ✅ Scripts prontos e documentados  
**Próximo:** Executar deploy na VPS  
**Última atualização:** 28/04/2026

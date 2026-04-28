# 🗄️ GUIA CENTRAL DE CONFIGURAÇÕES - NIT SYSTEMS

**VPS:** srv1566743 (147.93.10.11)  
**Data:** 28/04/2026  
**Status:** Configuração completa pronta

---

## 🎯 **VISÃO GERAL**

### **Infraestrutura Atual**
- **VPS:** Ubuntu 24.04.4 LTS (Hostinger)
- **Hardware:** 7.8GB RAM, 96GB SSD, Multi-core CPU
- **Software:** Nginx ✅, PM2 ✅, PostgreSQL ❌, Node.js ❌
- **Sistema Online:** Pesquisa Clima (porta 3000)

### **Sistemas Planejados**
| Sistema | Domínio | Porta | Banco | Status |
|---------|---------|-------|-------|--------|
| RH+ | rh.nordesteloc.com.br | 3001 | PostgreSQL | 🔄 Deploy |
| Pesquisa Clima | pesquisadeclima.nordesteloc.com.br | 3000 | SQLite | ✅ Online |
| POP | pop.nordesteloc.com.br | 3002 | PostgreSQL | 📋 Planejado |
| PRD | prd.nordesteloc.com.br | 3003 | PostgreSQL | 📋 Planejado |
| Matriz | matriz.nordesteloc.com.br | 3004 | PostgreSQL | 📋 Planejado |

---

## 🚀 **FLUXO DE DEPLOY COMPLETO**

### **Passo 1: Setup PostgreSQL (OBRIGATÓRIO)**
```bash
# Na VPS
apt install postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Executar script de criação
./dados-config/deploy/setup-postgres.sh
```

### **Passo 2: Deploy RH+ (PRIORIDADE)**
```bash
# Na VPS
./dados-config/deploy/deploy-rh-plus.sh
```

### **Passo 3: Configurar DNS**
No painel do registrador:
```
Tipo: A
Nome: rh
Valor: 147.93.10.11
TTL: 300
```

### **Passo 4: Instalar SSL**
```bash
# Após propagação DNS
certbot --nginx -d rh.nordesteloc.com.br --agree-tos --email admin@nordesteloc.com.br
```

---

## 📁 **ESTRUTURA DE CONFIGURAÇÕES**

```
dados-config/
├── README.md                    ← Visão geral
├── GUIA-CENTRAL.md              ← Este arquivo
├── vps/                         ← Config VPS
│   ├── hardware.md             ← Specs completas
│   ├── software.md             ← Softwares instalados
│   └── rede.md                 ← Configurações rede
├── bancos/                     ← Config bancos
│   ├── postgresql.md           ← Setup completo PostgreSQL
│   ├── usuarios.md             ← Senhas e permissões
│   └── sqlite.md               ← Config SQLite atual
├── sistemas/                   ← Config cada sistema
│   ├── rh-plus/                ← RH+ completo
│   ├── pesquisa-clima/         ← Pesquisa Clima
│   ├── pop/                    ← Sistema POP
│   ├── prd/                    ← Sistema PRD
│   └── matriz/                 ← Sistema Matriz
├── deploy/                     ← Scripts de deploy
│   ├── deploy-rh-plus.sh       ← Deploy RH+ automático
│   ├── setup-postgres.sh       ← Setup PostgreSQL
│   └── deploy-multi.sh         ← Deploy todos sistemas
├── dominios/                   ← Config DNS e SSL
│   ├── dns-hostinger.md        ← Config Hostinger
│   ├── nginx-configs/          ← Configs Nginx
│   └── ssl-certificados.md     ← SSL Let's Encrypt
└── backup/                     ← Config backup
    ├── postgres-backup.sh      ← Backup PostgreSQL
    ├── projetos-backup.sh      ← Backup projetos
    └── google-drive.md        ← Backup nuvem
```

---

## 🔧 **COMANDOS ESSENCIAIS**

### **Gerenciamento VPS**
```bash
# Status geral
systemctl status nginx
pm2 status
ufw status

# Recursos
free -h
df -h
htop

# Logs
tail -f /var/log/syslog
tail -f /var/log/nginx/access.log
```

### **PostgreSQL**
```bash
# Acesso
sudo -u postgres psql

# Ver bancos
\l

# Ver usuários
\du

# Backup
pg_dump -h localhost -U rh_user -d rh > backup.sql
```

### **PM2**
```bash
# Status
pm2 status
pm2 monit

# Logs
pm2 logs rh-plus
pm2 logs pesquisa-clima

# Reiniciar
pm2 restart rh-plus
pm2 restart all
```

### **Nginx**
```bash
# Testar config
nginx -t

# Reiniciar
systemctl restart nginx

# Ver sites
ls -la /etc/nginx/sites-enabled/
```

---

## 🔐 **CREDENCIAIS IMPORTANTES**

### **Acesso Principal**
```bash
VPS: ssh root@147.93.10.11
PostgreSQL: sudo -u postgres psql
```

### **Bancos de Dados**
| Sistema | Banco | Usuário | Senha |
|---------|-------|---------|-------|
| RH+ | rh | rh_user | RhPlus2026!Secure |
| Pesquisa Clima | pesquisa_clima | clima_user | Clima2026!Secure |
| POP | pop | pop_user | Pop2026!Secure |
| PRD | prd | prd_user | Prd2026!Secure |
| Matriz | matriz | matriz_user | Matriz2026!Secure |

---

## 📊 **MONITORAMENTO**

### **Health Checks**
```bash
# RH+
curl https://rh.nordesteloc.com.br/health

# Pesquisa Clima
curl https://pesquisadeclima.nordesteloc.com.br

# Local
curl http://localhost:3000/health
curl http://localhost:3001/health
```

### **Performance**
```bash
# Uso de recursos
watch -n 1 'free -h && df -h && ps aux --sort=-%cpu | head -10'

# Conexões PostgreSQL
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# PM2 monitor
pm2 monit
```

---

## 🔄 **BACKUP AUTOMATIZADO**

### **Scripts Disponíveis**
```bash
# Backup RH+
/usr/local/bin/backup-rh-plus.sh

# Backup PostgreSQL
/usr/local/bin/backup-postgres.sh

# Backup todos projetos
/usr/local/bin/backup-all.sh
```

### **Crontab Configurado**
```bash
# Backup diário 2AM
0 2 * * * /usr/local/bin/backup-rh-plus.sh

# Backup semanal domingo 4AM
0 4 * * 0 /usr/local/bin/backup-postgres.sh
```

---

## 🚨 **EMERGÊNCIA E RECUPERAÇÃO**

### **Problemas Comuns**
```bash
# Aplicação não responde
pm2 restart nome-app
systemctl restart nginx

# PostgreSQL erro
systemctl restart postgresql
tail -f /var/log/postgresql/postgresql-15-main.log

# Disco cheio
df -h
du -sh /var/log/*
journalctl --vacuum-time=7d
```

### **Comandos de Recuperação**
```bash
# Restaurar backup PostgreSQL
psql -h localhost -U rh_user -d rh < backup.sql

# Restaurar projeto
tar -xzf project-backup.tar.gz

# Reset PM2
pm2 delete all
pm2 kill
pm2 resurrect
```

---

## 📋 **CHECKLIST DE MANUTENÇÃO**

### **Diária**
- [ ] Verificar status dos sistemas
- [ ] Verificar logs de erros
- [ ] Monitorar uso de recursos

### **Semanal**
- [ ] Verificar backups
- [ ] Atualizar sistema (`apt update && apt upgrade`)
- [ ] Limpar logs antigos

### **Mensal**
- [ ] Rotacionar senhas (se necessário)
- [ ] Revisar configurações de segurança
- [ ] Otimizar performance PostgreSQL

---

## 🌐 **URLS DE ACESSO**

### **Produção**
- **RH+:** https://rh.nordesteloc.com.br
- **Pesquisa Clima:** https://pesquisadeclima.nordesteloc.com.br
- **POP:** https://pop.nordesteloc.com.br (futuro)
- **PRD:** https://prd.nordesteloc.com.br (futuro)
- **Matriz:** https://matriz.nordesteloc.com.br (futuro)

### **Administração**
- **Health RH+:** https://rh.nordesteloc.com.br/health
- **Health Clima:** https://pesquisadeclima.nordesteloc.com.br/health
- **PM2 Monitor:** Via SSH (`pm2 monit`)

---

## 📞 **SUPORTE E CONTATOS**

### **Técnico**
- **VPS:** Hostinger Painel
- **Domínios:** Painel registrador
- **Documentação:** Esta pasta `dados-config/`

### **Emergência**
- **SSH:** root@147.93.10.11
- **Comandos essenciais:** Ver seção "Comandos Essenciais"
- **Recuperação:** Ver seção "Emergência e Recuperação"

---

## 🔄 **PRÓXIMOS PASSOS**

### **Imediato (Hoje)**
1. ✅ Criar estrutura `dados-config/`
2. ✅ Documentar configurações
3. 🔄 Instalar PostgreSQL
4. 🔄 Deploy RH+

### **Curto Prazo (Esta semana)**
1. Configurar DNS para rh.nordesteloc.com.br
2. Instalar SSL Let's Encrypt
3. Configurar backup automatizado
4. Testar e validar RH+

### **Médio Prazo (Próximo mês)**
1. Deploy POP sistema
2. Deploy PRD sistema
3. Deploy Matriz sistema
4. Configurar monitoramento avançado

---

## ✅ **VALIDAÇÃO FINAL**

### **Para cada sistema:**
- [ ] Aplicação funcionando
- [ ] SSL instalado e válido
- [ ] Backup automatizado
- [ ] Logs configurados
- [ ] Monitoramento ativo
- [ ] Documentação atualizada

---

**Status:** ✅ **Configuração completa pronta**  
**Próximo:** Executar deploy PostgreSQL + RH+  
**Documentação:** 100% completa e organizada

---

*Última atualização: 28/04/2026*  
*Responsável: NIT Systems Team*  
*Versão: 1.0*

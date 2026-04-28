# 🚀 RH+ - SISTEMA DE GESTÃO DE RH

**Versão:** 2.0.0  
**Stack:** Node.js + Express + PostgreSQL  
**Status:** 🔄 Para deploy  
**Domínio:** rh.nordesteloc.com.br  

---

## 📊 **INFORMAÇÕES DO SISTEMA**

### **Características**
- **21 módulos completos** migrados para PostgreSQL
- **Sistema profissional** de gestão de RH
- **Multi-ambiente:** dev | test | production
- **Segurança:** JWT + Rate limiting + Helmet

### **Módulos Principais**
```
✅ employees          - Funcionários base
✅ employees_pro      - Funcionários avançado
✅ companies          - Cadastro de empresas
✅ recruitment        - Recrutamento e seleção
✅ career            - Histórico de carreira
✅ vacations         - Férias e planejamento
✅ uniforms          - Uniformes e EPIs
✅ occurrences       - Ocorrências e disciplina
✅ sst               - Segurança do trabalho
✅ aso               - Exames admissionais
✅ kits              - Controle de kits
✅ tools             - Ferramentas diversas
✅ transfers         - Transferências
✅ archive           - Arquivamento
✅ overtime          - Horas extras
✅ human_center      - Centro humano
✅ profile           - Perfis e permissões
✅ activity          - Atividades e metas
✅ notifications     - Notificações
✅ onboarding        - Onboarding 90 dias
```

---

## 🗄️ **CONFIGURAÇÃO DE BANCO**

### **PostgreSQL**
```env
# Produção VPS
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rh
DB_USER=rh_user
DB_PASSWORD=RhPlus2026!Secure
```

### **Tabelas Principais**
```sql
-- Estrutura principal
employees              - Funcionários
employees_pro          - Dados profissionais
companies              - Empresas
roles_master           - Cargos
recruitment_jobs       - Vagas
recruitment_candidates - Candidatos
users                  - Usuários do sistema
goals                  - Metas
user_demands           - Demandas
transfer_requests      - Transferências
activity_log           - Log de atividades
```

---

## 🌐 **CONFIGURAÇÃO WEB**

### **Domínio e URLs**
```
Domínio: rh.nordesteloc.com.br
Porta: 3001 (interna)
URL: https://rh.nordesteloc.com.br
Health: https://rh.nordesteloc.com.br/health
```

### **Nginx Config**
```nginx
server {
    listen 443 ssl http2;
    server_name rh.nordesteloc.com.br;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔧 **VARIÁVEIS DE AMBIENTE**

### **.env Produção**
```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# PostgreSQL
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

# URL Pública
PUBLIC_URL=https://rh.nordesteloc.com.br
TRUST_PROXY=loopback, linklocal, uniquelocal
```

---

## 🚀 **DEPLOY**

### **PM2 Configuration**
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
    min_uptime: '10s'
  }]
};
```

### **Scripts de Deploy**
```bash
# Iniciar
pm2 start ecosystem.config.js --env production

# Status
pm2 status rh-plus

# Logs
pm2 logs rh-plus --lines 50

# Reiniciar
pm2 restart rh-plus

# Atualizar
cd /var/www/rh-plus
git pull origin main
npm install --production
pm2 restart rh-plus
```

---

## 📁 **ESTRUTURA DE PASTAS**

```
/var/www/rh-plus/
├── backend/
│   ├── config/
│   │   └── database.js          # Config PostgreSQL
│   ├── routes/                  # 21 módulos
│   ├── middleware/
│   └── server.js                # Servidor principal
├── public/                      # Arquivos estáticos
├── logs/                        # Logs da aplicação
├── .env                         # Variáveis de ambiente
├── package.json                 # Dependências
└── ecosystem.config.js          # Config PM2
```

---

## 🔍 **MONITORAMENTO**

### **Health Checks**
```bash
# Verificar aplicação
curl https://rh.nordesteloc.com.br/health

# Verificar PM2
pm2 status
pm2 monit

# Verificar banco
psql -h localhost -U rh_user -d rh -c "SELECT COUNT(*) FROM users;"
```

### **Logs Importantes**
```bash
# Aplicação
pm2 logs rh-plus --lines 100

# Nginx
tail -f /var/log/nginx/rh.nordesteloc.com.br.access.log

# PostgreSQL
tail -f /var/log/postgresql/postgresql-15-main.log
```

---

## 🔄 **BACKUP**

### **Backup Automático**
```bash
# Script já configurado em:
/usr/local/bin/backup-rh-plus.sh

# Execução diária: 2AM
0 2 * * * /usr/local/bin/backup-rh-plus.sh
```

### **Backup Manual**
```bash
# Backup banco
pg_dump -h localhost -U rh_user -d rh > rh_backup_manual.sql

# Backup projeto
tar -czf rh-project-backup.tar.gz /var/www/rh-plus --exclude=node_modules
```

---

## ⚠️ **TROUBLESHOOTING**

### **Problemas Comuns**
```bash
# Aplicação não inicia
pm2 logs rh-plus
cd /var/www/rh-plus && npm start

# Erro de banco
psql -h localhost -U rh_user -d rh -c "SELECT 1;"

# Nginx 502
systemctl restart nginx
pm2 restart rh-plus
```

### **Comandos de Emergência**
```bash
# Reiniciar tudo
pm2 restart rh-plus
systemctl restart nginx
systemctl restart postgresql

# Verificar portas
ss -tuln | grep :3001
ss -tuln | grep :5432
```

---

## 📈 **MÉTRICAS DE PERFORMANCE**

### **Recursos Estimados**
- **Memória Base:** ~200MB
- **Memória por usuário:** ~5MB
- **CPU:** Baixo (< 10% normal)
- **Disco:** ~100MB inicial

### **Limites Recomendados**
- **Conexões simultâneas:** 50
- **Usuários ativos:** 100
- **Upload máximo:** 50MB
- **Timeout:** 30s

---

## 🔄 **ATUALIZAÇÕES**

### **Processo de Update**
```bash
# 1. Backup
/usr/local/bin/backup-rh-plus.sh

# 2. Atualizar código
cd /var/www/rh-plus
git pull origin main

# 3. Atualizar dependências
npm install --production

# 4. Migrar banco (se necessário)
npm run db:migrate

# 5. Reiniciar
pm2 restart rh-plus

# 6. Verificar
curl https://rh.nordesteloc.com.br/health
```

---

## 📞 **SUPORTE**

### **Contatos**
- **Desenvolvedor:** [Contato dev RH+]
- **DBA:** [Contato PostgreSQL]
- **Infra:** [Contato VPS]

### **Documentação**
- **Manual completo:** `/docs/RH-Manual.pdf`
- **API Docs:** `/docs/api/`
- **Database Schema:** `/docs/database/`

---

## ✅ **CHECKLIST DE DEPLOY**

- [ ] PostgreSQL instalado e configurado
- [ ] Banco `rh` criado com usuário `rh_user`
- [ ] Projeto clonado em `/var/www/rh-plus`
- [ ] Dependências instaladas
- [ ] `.env` configurado
- [ ] PM2 configurado e iniciado
- [ ] Nginx configurado para domínio
- [ ] SSL instalado
- [ ] Health check funcionando
- [ ] Backup automatizado ativo

---

*Última atualização: 28/04/2026*  
*Status: Configurado para deploy*  
*Próximo passo: Executar script de deploy*

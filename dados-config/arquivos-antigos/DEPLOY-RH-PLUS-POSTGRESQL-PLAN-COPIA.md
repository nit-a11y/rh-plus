# 🚀 Plano Deploy RH+ com PostgreSQL Multi-Bancos (CÓPIA)

**Data:** 23/04/2026  
**Status:** PRONTO PARA EXECUÇÃO  
**Prioridade:** ALTA  
**Responsável:** Equipe NIT

---

## 📋 **RESUMO EXECUTIVO**

Deploy completo do sistema RH+ (gg.nordesteloc.cloud) na VPS 147.93.10.11 com PostgreSQL centralizado para todos os sistemas, migração de dados existentes, SSL para todos os subdomínios e backup automatizado para Google Drive.

---

## 🎯 **OBJETIVOS PRINCIPAIS**

### **Imediatos**
- [x] Criar plano detalhado de deploy
- [ ] Configurar PostgreSQL multi-bancos na VPS
- [ ] Migrar dados do PostgreSQL local para VPS
- [ ] Fazer deploy do RH+ em produção

### **Secundários**
- [ ] Configurar subdomínio gg.nordesteloc.cloud
- [ ] Implementar SSL para todos os sistemas
- [ ] Criar backup automatizado para Google Drive
- [ ] Documentar procedimentos de gestão

---

## 🗄️ **ESTRUTURA POSTGRESQL MULTI-BANCOS**

### **Bancos de Dados Criados**
```
rh              ← RH+ (principal)
pesquisa_clima  ← Sistema Pesquisa Clima
pop             ← Sistema POP
prd             ← Sistema PRD
manuext         ← Sistema MANUEXT
matriz          ← Sistema Matriz
```

### **Usuários e Permissões**
```
nit_systems     ← Master admin (senha_super_segura_2026)
rh_user         ← RH+ específico (senha_rh_2026)
clima_user      ← Pesquisa Clima (senha_clima_2026)
pop_user        ← POP (senha_pop_2026)
```

---

## 📦 **MIGRAÇÃO DE DADOS**

### **Processo de Backup Local**
```bash
# Backup do PostgreSQL local
pg_dump -h localhost -U postgres -d rh > rh_backup_$(date +%Y%m%d).sql
gzip rh_backup_$(date +%Y%m%d).sql

# Transferência para VPS
scp rh_backup_20260423.sql.gz root@147.93.10.11:/tmp/
```

### **Processo de Restauração VPS**
```bash
# Descompactar e restaurar
cd /tmp
gunzip rh_backup_20260423.sql.gz
psql -h localhost -U rh_user -d rh < rh_backup_20260423.sql
```

---

## 🚀 **DEPLOY DO SISTEMA RH+**

### **Configuração de Produção**
```env
NODE_ENV=production
PORT=3235
HOST=0.0.0.0

# PostgreSQL Produção VPS
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rh
DB_USER=rh_user
DB_PASSWORD=senha_rh_2026

# Segurança
JWT_SECRET=sua_chave_secreta_jwt_32_caracteres_minimo_rh_2026
SESSION_SECRET=sua_chave_de_sessao_secreta_rh_2026
```

### **PM2 Configuration**
```javascript
module.exports = {
  apps: [{
    name: 'rh-plus',
    script: 'backend/server.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3235
    }
  }]
};
```

---

## 🌐 **DOMÍNIO E SSL**

### **Subdomínio Configurado**
- **URL:** https://gg.nordesteloc.cloud
- **Porta:** 3235 (internamente)
- **SSL:** Let's Encrypt automático
- **Renovação:** Diária via cron

### **Configuração Nginx**
```nginx
server {
    listen 80;
    server_name gg.nordesteloc.cloud;
    
    location / {
        proxy_pass http://localhost:3235;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 💾 **BACKUP AUTOMATIZADO GOOGLE DRIVE**

### **Ferramentas**
- **rclone** para Google Drive API
- **Script automatizado** `/usr/local/bin/backup-systems.sh`
- **Agendamento** Diário às 2AM + Semanal aos domingos 4AM

### **Estrutura de Backup**
```
Google Drive:/backups/
├── postgresql/     ← Todos os bancos SQL
├── projects/       ← Código fonte dos sistemas
└── configs/        ← Configurações críticas
```

### **Retenção**
- **Local:** 2 dias
- **Google Drive:** 7 dias
- **Mensal:** 30 dias (arquivo compactado)

---

## 🔥 **SEGURANÇA IMPLEMENTADA**

### **Firewall UFW**
```bash
sudo ufw allow 3235/tcp  # RH+
sudo ufw allow 5432/tcp  # PostgreSQL (restrito)
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH
```

### **PostgreSQL Security**
```bash
# pg_hba.conf - Apenas IPs confiáveis
host    all             all             127.0.0.1/32            md5
host    all             all             SEU_IP_FIXO/32           md5
```

---

## 📊 **MONITORAMENTO E TESTES**

### **Health Checks**
```bash
# Testar API RH+
curl https://gg.nordesteloc.cloud/api/health

# Verificar PM2
pm2 status
pm2 logs rh-plus

# Verificar PostgreSQL
psql -h localhost -U rh_user -d rh -c "SELECT COUNT(*) FROM users;"
```

### **Logs Importantes**
- **PM2:** `/var/log/pm2/rh-plus-*.log`
- **Nginx:** `/var/log/nginx/access.log`
- **Backup:** `/var/log/backup-systems.log`
- **PostgreSQL:** `/var/log/postgresql/`

---

## 🎯 **CRONOGRAMA DE EXECUÇÃO**

### **Dia 1 - Setup PostgreSQL e Migração (4 horas)**
- [ ] Instalar PostgreSQL 15+
- [ ] Criar 6 bancos de dados
- [ ] Configurar usuários e permissões
- [ ] Migrar dados do RH+ local
- [ ] Testar conexões

### **Dia 2 - Deploy e Configuração (3 horas)**
- [ ] Enviar arquivos do RH+ para VPS
- [ ] Configurar variáveis de ambiente
- [ ] Configurar PM2
- [ ] Configurar subdomínio gg.nordesteloc.cloud
- [ ] Instalar SSL Let's Encrypt

### **Dia 3 - Backup e Segurança (2 horas)**
- [ ] Configurar rclone + Google Drive
- [ ] Implementar script de backup
- [ ] Configurar firewall e segurança
- [ ] Testes finais e validação
- [ ] Documentação

---

## 🔧 **COMANDOS ESSENCIAIS**

### **Gerenciamento RH+**
```bash
# Status
pm2 status

# Reiniciar
pm2 restart rh-plus

# Logs
pm2 logs rh-plus --lines 50

# Atualizar
cd /var/www/rh-plus
git pull origin main
npm install --production
pm2 restart rh-plus
```

### **PostgreSQL Management**
```bash
# Ver bancos
psql -h localhost -U nit_systems -l

# Backup manual
pg_dump -h localhost -U rh_user -d rh > backup_manual.sql

# Acessar banco RH
psql -h localhost -U rh_user -d rh
```

### **Backup Operations**
```bash
# Executar backup manual
/usr/local/bin/backup-systems.sh

# Ver logs backup
tail -f /var/log/backup-systems.log

# Restaurar do Google Drive
rclone copy gdrive:/backups/postgresql/rh_20260423.sql.gz /tmp/
gunzip /tmp/rh_20260423.sql.gz
psql -h localhost -U rh_user -d rh < /tmp/rh_20260423.sql
```

---

## 🚨 **PONTOS CRÍTICOS E RISCOS**

### **High Risk**
1. **Perda de dados na migração**
   - **Mitigação:** Backup completo antes de migrar
   - **Rollback:** Restaurar do backup local

2. **SSL não renovar**
   - **Mitigação:** Configurar renovação automática
   - **Monitoramento:** Alertas 7 dias antes expiração

3. **Backup falhar**
   - **Mitigação:** Monitoramento e alertas
   - **Alternativa:** Backup manual semanal

### **Medium Risk**
1. **PostgreSQL sobrecarga**
   - **Mitigação:** Monitoramento de recursos
   - **Solução:** Otimizar queries e índices

2. **Performance do RH+**
   - **Mitigação:** Cache e otimização
   - **Monitoramento:** Métricas de response time

---

## 📚 **DOCUMENTAÇÃO NECESSÁRIA**

### **Manuais a Criar**
- [ ] Guia PostgreSQL Multi-Bancos
- [ ] Procedimentos Backup/Restauração
- [ ] Configuração Novos Sistemas
- [ ] Troubleshooting Guide
- [ ] Security Checklist

### **Monitoramento Implementar**
- [ ] Dashboard status sistemas
- [ ] Alertas email backup
- [ ] Relatórios performance
- [ ] Métricas uso recursos

---

## ✅ **CHECKLIST PRÉ-PRODUÇÃO**

### **Técnico**
- [ ] Todos os bancos criados e testados
- [ ] Dados migrados com sucesso
- [ ] RH+ funcionando em produção
- [ ] SSL configurado e validado
- [ ] Backup automatizado funcionando
- [ ] Monitoramento ativo

### **Negócio**
- [ ] Equipe treinada
- [ ] Documentação atualizada
- [ ] Procedimentos emergência
- [ ] Contatos suporte atualizados
- [ ] Plano comunicação usuários

---

## 🎉 **PÓS-DEPLOY**

### **Monitoramento 48h**
- [ ] Verificar estabilidade RH+
- [ ] Monitorar performance PostgreSQL
- [ ] Testar backup automático
- [ ] Validar SSL renovação
- [ ] Coletar feedback usuários

### **Otimizações Futuras**
- [ ] Implementar cache Redis
- [ ] Configurar cluster PostgreSQL
- [ ] Otimizar queries críticas
- [ ] Implementar CI/CD
- [ ] Expandir para outros sistemas

---

## 📞 **SUPORTE E CONTATOS**

### **Emergência**
- **VPS:** root@147.93.10.11
- **PostgreSQL:** Porta 5432
- **RH+:** Porta 3235
- **Backup:** Script `/usr/local/bin/backup-systems.sh`

### **Documentação Adicional**
- **Cérebro NIT:** `VPS/DEPLOY-RH-PLUS-POSTGRESQL-PLAN.md`
- **Commands:** `VPS/COMANDOS-VPS.md`
- **Best Practices:** `VPS/VPS-BEST-PRACTICES-GUIDE.md`

---

## 🔄 **VERSÃO E HISTÓRICO**

### **v1.0 - 23/04/2026**
- Plano inicial completo
- PostgreSQL multi-bancos
- Backup Google Drive
- SSL para todos os sistemas
- Documentação completa

---

**Status:** ✅ **PRONTO PARA EXECUÇÃO**  
**Complexidade:** Alta  
**Risco:** Médio (com backups adequados)  
**Duração Estimada:** 2-3 dias  
**Próximo Passo:** Aprovação e início da Fase 1

---

## 📋 **NOTAS DA CÓPIA**

**Arquivo:** DEPLOY-RH-PLUS-POSTGRESQL-PLAN-COPIA.md  
**Data Criação:** 23/04/2026  
**Local:** VPS/ (Cérebro NIT)  
**Tipo:** Cópia de segurança do plano oficial  
**Finalidade:** Backup e referência rápida durante execução

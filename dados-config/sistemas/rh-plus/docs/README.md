# 📋 Sistema RH+ - Documentação Completa

**Versão:** 2.0.0  
**Stack:** Node.js + Express + PostgreSQL  
**Data:** 28/04/2026

---

## 📁 **Documentação Disponível**

### **Arquitetura e Configuração**
- **[ARQUITETURA.md](./ARQUITETURA.md)** - Estrutura profissional do sistema
- **[Configuracao_PostgreSQL.md](./Configuracao_PostgreSQL.md)** - Setup PostgreSQL básico
- **[Configuracao_PostgreSQL_Completa.md](./Configuracao_PostgreSQL_Completa.md)** - Configuração completa
- **[DEPLOY_VPS.md](./DEPLOY_VPS.md)** - Guia de deploy para VPS

### **Banco de Dados**
- **[PostgreSQL_Geral.md](./PostgreSQL_Geral.md)** - Guia completo PostgreSQL
- **[PostgreSQL_RHPlus_Migracao.md](./PostgreSQL_RHPlus_Migracao.md)** - Migração SQLite→PostgreSQL
- **[schema_sqlite_completo.txt](./schema_sqlite_completo.txt)** - Schema completo do banco

---

## 🔧 **Configuração do Sistema**

### **Variáveis de Ambiente**
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rh
DB_USER=rhplus_user
DB_PASSWORD=12Nordeste34+
PORT=3001
```

### **Credenciais**
- **PostgreSQL Local:** `rhplus_user` / `12Nordeste34+`
- **PostgreSQL VPS:** `rh_user` / `RhPlus2026!Secure`
- **Superuser:** `postgres` / `12Nordeste34+`

---

## 🚀 **Deploy e Produção**

### **Scripts de Deploy**
- **[deploy-rh-plus.sh](../../../deploy/scripts/deploy-rh-plus.sh)** - Deploy principal
- **[deploy-rh-plus-provisorio.sh](../../../deploy/scripts/deploy-rh-plus-provisorio.sh)** - Domínio provisório

### **URLs de Produção**
- **Principal:** https://rh.nordesteloc.cloud
- **Provisório:** https://rh.nordesteloc.cloud

---

## 📊 **Dados do Sistema**

### **Estatísticas Atuais**
- **Registros:** 2.477
- **Tabelas:** 41
- **Migração:** SQLite → PostgreSQL ✅ Concluída

### **Bancos Configurados**
- **Desenvolvimento:** `rh` (localhost)
- **Produção:** `rh` (VPS)

---

## 🔄 **Migração e Backup**

### **Scripts de Migração**
- **[backup-local-rh.bat](../../../migracao/scripts/backup-local-rh.bat)** - Backup Windows
- **[migrar-dados-vps.sh](../../../migracao/scripts/migrar-dados-vps.sh)** - Migração para VPS

### **Documentação de Migração**
- **[MIGRACAO-POSTGRESQL-SEGURO.md](../../../migracao/docs/MIGRACAO-POSTGRESQL-SEGURO.md)** - Plano seguro
- **[backup-usando-config-existente.md](../../../migracao/docs/backup-usando-config-existente.md)** - Backup com config existente

---

## 🛠️ **Comandos Úteis**

### **Desenvolvimento**
```bash
npm start                    # Iniciar servidor
npm run dev                  # Modo desenvolvimento
npm run db:migrate          # Migrar banco
npm run db:seed             # Popular dados
```

### **Produção (VPS)**
```bash
pm2 status                   # Ver status
pm2 logs rh-plus            # Ver logs
pm2 restart rh-plus         # Reiniciar
```

### **Banco de Dados**
```bash
# Backup local
pg_dump -h localhost -U rhplus_user -d rh > backup.sql

# Backup VPS
sudo -u postgres pg_dump rh > backup_vps.sql
```

---

## 🔍 **Monitoramento e Logs**

### **Health Check**
- **Local:** http://localhost:3001/health
- **Produção:** https://rh.nordesteloc.cloud/health

### **Logs**
- **Aplicação:** `pm2 logs rh-plus`
- **Nginx:** `/var/log/nginx/`
- **PostgreSQL:** `/var/log/postgresql/`

---

## 🆘 **Troubleshooting**

### **Problemas Comuns**
1. **Conexão PostgreSQL:** Verifique `.env` e senhas
2. **Porta em uso:** `lsof -i :3001`
3. **Permissões:** Verifique usuário `rhplus_user`
4. **Migração:** Use scripts em `migracao/`

### **Documentação de Suporte**
- **[CREDENCIAIS-UNIFICADAS.md](../../../bancos/CREDENCIAIS-UNIFICADAS.md)** - Senhas e acessos
- **[GUIA-CENTRAL.md](../../../GUIA-CENTRAL.md)** - Guia mestre do sistema

---

## 📞 **Contato e Suporte**

### **Recursos**
- **Documentação completa:** `dados-config/`
- **Scripts de deploy:** `dados-config/deploy/`
- **Configurações VPS:** `dados-config/vps/`

### **Emergência**
- **Rollback:** Use backups em `migracao/`
- **Suporte:** Verificar logs e documentação

---

**Status:** ✅ Sistema documentado e configurado  
**Próximo:** Deploy para produção e migração de dados  
**Última atualização:** 28/04/2026

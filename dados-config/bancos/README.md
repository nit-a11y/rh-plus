# 🗄️ Bancos de Dados - Configuração Central

**Data:** 28/04/2026  
**Status:** PostgreSQL configurado e funcionando

---

## 📋 **Visão Geral**

### **Bancos Configurados**
| Banco | Ambiente | Usuário | Senha | Status |
|-------|----------|---------|-------|--------|
| `rh` | Local | `rhplus_user` | `12Nordeste34+` | ✅ Funcionando |
| `rh` | VPS | `rh_user` | `RhPlus2026!Secure` | 🔄 A configurar |
| `pesquisa_clima` | VPS | `clima_user` | `Clima2026!Secure` | ✅ Funcionando |

### **Sistemas e Bancos**
- **RH+:** PostgreSQL (migrado de SQLite)
- **Pesquisa Clima:** SQLite (funcionando)
- **POP/PRD/Matriz:** PostgreSQL (planejado)

---

## 📁 **Documentação Disponível**

### **Configuração PostgreSQL**
- **[postgresql.md](./postgresql.md)** - Setup completo e configuração
- **[CREDENCIAIS-UNIFICADAS.md](./CREDENCIAIS-UNIFICADAS.md)** - Senhas e acessos
- **[usuarios.md](./usuarios.md)** - Usuários e permissões

### **Scripts e Ferramentas**
- **[scripts/setup-postgres.sql](./scripts/setup-postgres.sql)** - Script de criação
- **[scripts/backup-postgres.sh](./scripts/backup-postgres.sh)** - Backup automático

### **Documentação Detalhada**
- **[docs/ARQUITETURA.md](./docs/ARQUITETURA.md)** - Arquitetura do sistema
- **[docs/Configuracao_PostgreSQL_Completa.md](./docs/Configuracao_PostgreSQL_Completa.md)** - Config completa
- **[docs/PostgreSQL_RHPlus_Migracao.md](./docs/PostgreSQL_RHPlus_Migracao.md)** - Migração SQLite→PG

---

## 🔐 **Credenciais Principais**

### **Ambiente Local**
```bash
postgres: 12Nordeste34+ (Superuser)
rhplus_user: 12Nordeste34+ (Aplicação)
```

### **Ambiente VPS**
```bash
postgres: 12Nordeste34+ (Superuser)
rh_user: RhPlus2026!Secure (Aplicação)
clima_user: Clima2026!Secure (Pesquisa Clima)
```

---

## 🚀 **Setup e Deploy**

### **Instalação PostgreSQL (VPS)**
```bash
# Usar script de deploy
./deploy/scripts/deploy-rh-plus.sh

# Ou manualmente
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql -f bancos/scripts/setup-postgres.sql
```

### **Migração de Dados**
```bash
# Backup local
./migracao/scripts/backup-local-rh.bat

# Transferir e restaurar
scp backup.sql root@147.93.10.11:/tmp/
sudo -u postgres psql rh < /tmp/backup.sql
```

---

## 📊 **Estatísticas Atuais**

### **RH+ - Sistema Principal**
- **Registros:** 2.477
- **Tabelas:** 41
- **Migração:** ✅ SQLite → PostgreSQL concluída
- **Status:** ✅ Funcionando localmente

### **Pesquisa Clima**
- **Banco:** SQLite
- **Status:** ✅ Online na VPS
- **URL:** https://pesquisadeclima.nordesteloc.cloud

---

## 🔧 **Comandos Úteis**

### **Verificar Conexão**
```bash
# Local
psql -h localhost -U rhplus_user -d rh

# VPS
sudo -u postgres psql rh
```

### **Backup e Restauração**
```bash
# Backup local
pg_dump -h localhost -U rhplus_user -d rh > backup.sql

# Backup VPS
sudo -u postgres pg_dump rh > backup_vps.sql

# Restauração
psql -U postgres -d rh < backup.sql
```

### **Gerenciamento de Usuários**
```bash
# Ver usuários
\du

# Criar usuário
CREATE USER novo_user WITH PASSWORD 'senha';

# Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE rh TO novo_user;
```

---

## 🔄 **Monitoramento e Manutenção**

### **Backup Automático**
```bash
# Script diário (configurar no crontab)
0 2 * * * /usr/local/bin/backup-rh-plus.sh
```

### **Verificação de Integridade**
```bash
# Contar registros
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM employees;
SELECT COUNT(*) FROM companies;
```

### **Performance**
```bash
# Ver conexões ativas
SELECT * FROM pg_stat_activity;

# Ver tamanho do banco
SELECT pg_size_pretty(pg_database_size('rh'));
```

---

## 🆘 **Troubleshooting**

### **Problemas Comuns**
1. **"database does not exist"**
   - Criar banco: `CREATE DATABASE rh;`
   - Verificar nome correto

2. **"authentication failed"**
   - Verificar senhas em `CREDENCIAIS-UNIFICADAS.md`
   - Resetar senha: `ALTER USER user PASSWORD 'nova_senha';`

3. **"connection refused"**
   - Verificar se PostgreSQL está rodando
   - Verificar firewall e porta 5432

### **Logs e Diagnóstico**
```bash
# Logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*-main.log

# Ver status do serviço
sudo systemctl status postgresql
```

---

## 📋 **Checklist de Configuração**

- [ ] PostgreSQL instalado e rodando
- [ ] Banco `rh` criado
- [ ] Usuários configurados com senhas corretas
- [ ] Permissões concedidas
- [ ] Backup automático configurado
- [ ] Migração de dados concluída
- [ ] Aplicações conectando ao banco
- [ ] Monitoramento ativo

---

## 📞 **Suporte e Documentação**

### **Recursos Relacionados**
- **Sistemas:** `sistemas/rh-plus/`
- **Deploy:** `deploy/scripts/`
- **Migração:** `migracao/scripts/`
- **VPS:** `vps/`

### **Emergência**
- **Rollback:** Usar backups em `migracao/`
- **Acesso VPS:** `ssh root@147.93.10.11`
- **Documentação completa:** `GUIA-CENTRAL.md`

---

**Status:** ✅ Configuração documentada e funcional  
**Próximo:** Deploy RH+ para produção  
**Última atualização:** 28/04/2026

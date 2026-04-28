# 🔐 CREDENCIAIS UNIFICADAS - POSTGRESQL RH+

**Data:** 28/04/2026  
**Status:** ✅ Documentado e Registrado  
**Acesso:** Nível Administrador

---

## 🔑 **CREDENCIAIS PRINCIPAIS**

### **PostgreSQL - Ambiente Local**
| Usuário | Senha | Banco | Host | Porta | Nível |
|---------|-------|-------|-------|-------|-------|
| `postgres` | `12Nordeste34+` | *todos* | localhost | 5432 | Superuser |
| `rhplus_user` | `12Nordeste34+` | `rh` | localhost | 5432 | Aplicação |

### **PostgreSQL - VPS (Produção)**
| Usuário | Senha | Banco | Host | Porta | Nível |
|---------|-------|-------|-------|-------|-------|
| `postgres` | `12Nordeste34+` | *todos* | localhost | 5432 | Superuser |
| `rh_user` | `RhPlus2026!Secure` | `rh` | localhost | 5432 | Aplicação |

---

## 📋 **CONFIGURAÇÕES POR AMBIENTE**

### **Desenvolvimento (Local)**
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rh
DB_USER=rhplus_user
DB_PASSWORD=12Nordeste34+
```

### **Produção (VPS)**
```env
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rh
DB_USER=rh_user
DB_PASSWORD=RhPlus2026!Secure
```

---

## 🗄️ **ESTRUTURA DE BANCOS**

### **Local**
- **Banco principal:** `rh`
- **Dados:** 2.477 registros migrados
- **Tabelas:** 41 tabelas
- **Status:** ✅ Funcionando

### **VPS**
- **Banco principal:** `rh` (a ser criado)
- **Usuário:** `rh_user`
- **Backup:** Automatizado diário

---

## 🔧 **COMANDOS DE ACESSO**

### **Local**
```bash
# Como postgres (superuser)
psql -U postgres -h localhost

# Como rhplus_user (aplicação)
psql -U rhplus_user -h localhost -d rh
# Senha: 12Nordeste34+
```

### **VPS**
```bash
# Como postgres (superuser)
sudo -u postgres psql

# Como rh_user (aplicação)
psql -U rh_user -h localhost -d rh
# Senha: RhPlus2026!Secure
```

---

## 🔄 **BACKUP E RESTAURAÇÃO**

### **Backup Local**
```bash
cd "C:\Program Files\PostgreSQL\18\bin"
pg_dump -h localhost -U rhplus_user -d rh > backup_rh.sql
# Senha: 12Nordeste34+
```

### **Backup VPS**
```bash
sudo -u postgres pg_dump rh > backup_rh_vps.sql
```

### **Restauração**
```bash
# Local
psql -U postgres -d rh < backup_rh.sql

# VPS
sudo -u postgres psql rh < backup_rh_vps.sql
```

---

## 🛡️ **POLÍTICAS DE SEGURANÇA**

### **Padrão de Senhas**
- **Local:** `12Nordeste34+` (senha unificada)
- **Produção:** `RhPlus2026!Secure` (senha forte)
- **Complexidade:** Letras + números + símbolos
- **Comprimento:** 14+ caracteres

### **Níveis de Acesso**
- **Superuser:** `postgres` - acesso total ao sistema
- **Aplicação:** `rhplus_user`/`rh_user` - acesso apenas ao banco RH
- **Restrição:** Usuários de aplicação não podem criar outros bancos

---

## 📊 **VERIFICAÇÃO DE INTEGRIDADE**

### **Verificar Usuários**
```sql
-- Local
\du

-- VPS
sudo -u postgres psql -c "\du"
```

### **Verificar Bancos**
```sql
-- Local
\l

-- VPS
sudo -u postgres psql -c "\l"
```

### **Verificar Conexão**
```sql
-- Testar conexão do usuário da aplicação
SELECT current_user, current_database();
```

---

## 🔄 **MIGRAÇÃO ENTRE AMBIENTES**

### **Local → VPS**
```bash
# 1. Backup local
pg_dump -h localhost -U rhplus_user -d rh > rh_backup.sql

# 2. Transferir
scp rh_backup.sql root@147.93.10.11:/tmp/

# 3. Restaurar VPS
ssh root@147.93.10.11
sudo -u postgres psql rh < /tmp/rh_backup.sql
```

### **VPS → Local (Rollback)**
```bash
# 1. Backup VPS
sudo -u postgres pg_dump rh > rh_vps_backup.sql

# 2. Transferir
scp root@147.93.10.11:/tmp/rh_vps_backup.sql .

# 3. Restaurar local
psql -U postgres -d rh < rh_vps_backup.sql
```

---

## 🚨 **PROCEDIMENTOS DE EMERGÊNCIA**

### **Senha Perdida**
```bash
# Resetar senha postgres (Windows)
net user postgres nova_senha

# Resetar via psql
ALTER USER postgres PASSWORD 'nova_senha';
```

### **Acesso Bloqueado**
```bash
# Verificar conexões ativas
SELECT * FROM pg_stat_activity;

# Matar conexões problemáticas
SELECT pg_terminate_backend(pid);
```

---

## 📞 **SUPORTE E CONTATOS**

### **Documentação Relacionada**
- `PostgreSQL/Configuracao_PostgreSQL_Completa.md`
- `PostgreSQL/PostgreSQL_RHPlus_Migracao.md`
- `dados-config/bancos/postgresql.md`
- `dados-config/bancos/usuarios.md`

### **Scripts Úteis**
- `PostgreSQL/setup_postgres.sql`
- `dados-config/migracao/backup-usando-config-existente.md`

---

## ✅ **CHECKLIST DE SEGURANÇA**

- [ ] Senhas documentadas e armazenadas
- [ ] Acesso restrito a pessoal autorizado
- [ ] Backup regular configurado
- [ ] Logs de acesso monitorados
- [ ] Políticas de expiração de senhas
- [ ] Procedimentos de emergência definidos

---

## 🔄 **HISTÓRICO DE ALTERAÇÕES**

| Data | Alteração | Responsável |
|------|-----------|-------------|
| 28/04/2026 | Documentação inicial - senha unificada `12Nordeste34+` | NIT Systems |
| | Criação de credenciais VPS `RhPlus2026!Secure` | NIT Systems |

---

## 📝 **NOTAS IMPORTANTES**

1. **Senha unificada:** `12Nordeste34+` usada tanto para `postgres` quanto `rhplus_user` no ambiente local
2. **Senha produção:** `RhPlus2026!Secure` é mais forte para ambiente de produção
3. **Never commit:** Nunca fazer commit de senhas em repositórios
4. **Armazenamento:** Manter esta documentação em local seguro
5. **Acesso:** Apenas administradores devem ter acesso a estas credenciais

---

**Status:** ✅ **Credenciais documentadas e registradas**  
**Próximo:** Usar estas credenciais para backup e migração  
**Segurança:** Nível máximo de documentação

---

*Última atualização: 28/04/2026*  
*Classificação: CONFIDENCIAL*  
*Acesso: Nível Administrador*

# 🚀 MIGRAÇÃO POSTGRESQL COMPLETA - RH+ Sistema
**Data:** 30/04/2026  
**Status:** ✅ CONCLUÍDO COM SUCESSO  
**Técnica:** pg_dump + pg_restore (formato customizado)

---

## 📋 RESUMO EXECUTIVO

**Objetivo:** Migrar banco de dados PostgreSQL local (Windows) para VPS Ubuntu, clonando exatamente todas as tabelas e dados.

**Resultado:** 48 tabelas clonadas com sucesso, sistema 100% funcional.

---

## 🎯 DIAGNÓSTICO INICIAL

### Problemas Identificados:
- ❌ VPS tinha apenas 2 tabelas (users, notifications)
- ❌ Middleware auth.js usava sintaxe SQLite
- ❌ Rota auth.js usava "photoUrl" vs "photourl"
- ❌ Server.js com ordem incorreta das rotas
- ❌ Encoding Windows vs Ubuntu (UTF-16 vs UTF-8)

### Ambiente Origem (Local):
- **Banco:** `rh` (localhost:5432)
- **Usuário:** `postgres` / `rhplus_user`
- **Dados:** 158 employees, 6 users, 7 companies
- **PostgreSQL:** 18.3 (Windows)

### Ambiente Destino (VPS):
- **IP:** 147.93.10.11
- **Banco:** `rh` (vazio inicialmente)
- **Usuário:** `rh_user` / `RhPlus2026!Secure`
- **PostgreSQL:** 18.3 (Ubuntu)

---

## 🛠️ PROCESSO DE MIGRAÇÃO

### ETAPA 1: Preparação e Diagnóstico
```bash
# Verificar estrutura local
psql -U postgres -c "\dt"  # 48 tabelas
psql -U postgres -c "\du"  # postgres, rhplus_user

# Verificar estrutura VPS
ssh root@147.93.10.11 "sudo -u postgres psql rh -c '\dt'"  # 2 tabelas
```

### ETAPA 2: Ajustes de Código (Local)
```javascript
// backend/middleware/auth.js - Corrigido para PostgreSQL
db.query(`SELECT u.id, u.name, u.username, u.role, u.permissions, u.status 
          FROM users u JOIN user_sessions s ON s.user_id = u.id 
          WHERE s.id = $1 AND s.logout_at IS NULL`, [sessionId])
.then(result => {
    const user = result.rows[0];
    // ... lógica corrigida
});

// backend/routes/auth.js - Corrigido nomenclatura
const sql = `SELECT id, name, username, photourl, role, permissions FROM users 
              WHERE username = $1 AND password = $2`;
// Resposta JSON: photoUrl: user.photourl

// backend/server.js - Ordem correta
app.use('/api', authRoutes);      // ANTES
app.use('/api', authMiddleware); // DEPOIS
```

### ETAPA 3: Dump Customizado (Método Profissional)
```bash
# Método que funcionou (formato customizado binário)
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -h localhost -d rh --format=custom --compress=9 --file=rh_final_20260430.dump

# Arquivo gerado: 56MB (compactado)
# Formato: binário, sem problemas de encoding
```

### ETAPA 4: Transferência e Restauração
```bash
# Transferir para VPS
scp rh_final_20260430.dump root@147.93.10.11:/tmp/

# Restaurar na VPS
ssh root@147.93.10.11 "sudo -u postgres pg_restore -d rh /tmp/rh_final_20260430.dump"
```

### ETAPA 5: Configuração de Permissões
```sql
-- Criar usuário rhplus_user
CREATE USER rhplus_user WITH SUPERUSER PASSWORD '12Nordeste34+';

-- Ajustar permissões
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rh_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rh_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO rh_user;
```

---

## 📊 RESULTADOS OBTIDOS

### Tabelas Clonadas: 48 ✅
```
- employees (158 registros)
- users (6 registros)
- companies (7 registros)
- employee_vinculos
- employee_benefits
- aso_history
- career_history
- notifications
- user_sessions
- ... e 38 outras tabelas
```

### Dados Verificados:
- ✅ **158 employees** clonados
- ✅ **6 users** clonados
- ✅ **7 companies** clonadas
- ✅ **Todas 48 tabelas** presentes

### Sistema Funcional:
- ✅ Login funcionando
- ✅ Conexão PostgreSQL estabelecida
- ✅ Middleware autenticando corretamente
- ✅ Permissões ajustadas

---

## 🔧 COMANDOS CHAVE

### Migração Futura (Padrão):
```bash
# 1. Dump customizado
pg_dump -U postgres -h localhost -d rh --format=custom --compress=9 --file=rh_backup.dump

# 2. Transferência
scp rh_backup.dump root@147.93.10.11:/tmp/

# 3. Restauração
ssh root@147.93.10.11 "sudo -u postgres pg_restore -d rh /tmp/rh_backup.dump"

# 4. Permissões
ssh root@147.93.10.11 "sudo -u postgres psql rh -c 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rh_user;'"
```

### Deploy Contínuo (PC → GitHub → VPS):
```bash
# PC Local
git add .
git commit -m "Update: RH+ system changes"
git push origin main

# VPS
ssh root@147.93.10.11
cd /var/www/rh-plus
git pull origin main
pm2 restart rh-plus
```

---

## 🚨 LIÇÕES APRENDIDAS

### ✅ O que funcionou:
- **Formato customizado (-Fc)** resolveu problemas de encoding
- **pg_restore** é mais robusto que psql < dump.sql
- **Permissões explícitas** necessárias após restauração
- **Fluxo GitHub → VPS** para deploy contínuo

### ❌ O que evitar:
- **Dump SQL plano** (problemas de encoding UTF-16 vs UTF-8)
- **Redirecionamento >** (use --file=)
- **Esquecer permissões** após restauração
- **Deploy manual** (use Git)

---

## 🎯 ARQUIVOS IMPORTANTES

### Criados/Modificados:
- `backend/middleware/auth.js` - Convertido para PostgreSQL
- `backend/routes/auth.js` - Corrigido photoUrl → photourl
- `backend/server.js` - Ordem correta das rotas
- `rh_final_20260430.dump` - Backup completo (56MB)

### Scripts Úteis:
- `ajustar-postgres-local.js` - Ajustes automáticos
- Vários scripts de migração (não usados no final)

---

## 🔄 MANUTENÇÃO FUTURA

### Backup Automático (Recomendado):
```bash
# Script de backup diário
0 2 * * * pg_dump -U postgres -h localhost -d rh --format=custom --compress=9 --file=/backups/rh_$(date +\%Y\%m\%d).dump
```

### Monitoramento:
- Verificar espaço em disco: `df -h`
- Verificar logs PostgreSQL: `/var/log/postgresql/`
- Verificar status PM2: `pm2 status`

---

## ✅ STATUS FINAL

**🎉 MIGRAÇÃO 100% BEM-SUCEDIDA!**

- **Banco clonado:** 48 tabelas, dados completos
- **Sistema funcional:** Login, autenticação, permissões OK
- **Deploy automatizado:** PC → GitHub → VPS
- **Backup disponível:** rh_final_20260430.dump (56MB)

---

**Próximo passo:** Manter fluxo Git para atualizações futuras.

---

*Documentado por: Cascade AI*  
*Data: 30/04/2026*  
*Status: Produção - Sistema funcional*

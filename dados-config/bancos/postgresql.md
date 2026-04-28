# 🗄️ POSTGRESQL - CONFIGURAÇÃO COMPLETA

**Data:** 28/04/2026  
**VPS:** srv1566743 (147.93.10.11)  
**Status:** 🔄 Para instalar

---

## 📋 **PLANO DE INSTALAÇÃO**

### **1. Instalação PostgreSQL 15**
```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar PostgreSQL 15
apt install -y postgresql postgresql-contrib

# Iniciar e habilitar serviço
systemctl start postgresql
systemctl enable postgresql

# Verificar instalação
psql --version
systemctl status postgresql
```

### **2. Configuração Básica**
```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Verificar status
\l  -- Listar bancos
\du -- Listar usuários
\q  -- Sair
```

---

## 🏗️ **ESTRUTURA DE BANCOS**

### **Bancos Principais**
| Banco | Sistema | Finalidade | Tamanho Estimado |
|-------|---------|-------------|------------------|
| `rh` | RH+ | Sistema de gestão de RH | ~100MB |
| `pesquisa_clima` | Pesquisa Clima | Pesquisas de clima | ~50MB |
| `pop` | POP | Sistema POP | ~80MB |
| `prd` | PRD | Sistema PRD | ~80MB |
| `matriz` | Matriz | Sistema Matriz | ~60MB |
| `template1` | Template | Template PostgreSQL | ~5MB |

### **Usuários e Permissões**
| Usuário | Senha | Bancos | Permissões |
|---------|-------|--------|------------|
| `postgres` | 12Nordeste34+ | Todos | Superusuário |
| `rhplus_user` | 12Nordeste34+ | rh | Dono do banco (local) |
| `rh_user` | RhPlus2026!Secure | rh | Dono do banco (VPS) |
| `clima_user` | Clima2026!Secure | pesquisa_clima | Dono do banco |
| `pop_user` | Pop2026!Secure | pop | Dono do banco |
| `prd_user` | Prd2026!Secure | prd | Dono do banco |
| `matriz_user` | Matriz2026!Secure | matriz | Dono do banco |

---

## 🔧 **SCRIPTS DE CRIAÇÃO**

### **Script Principal - Criar Tudo**
```bash
#!/bin/bash
# criar-postgres-multi.sh

echo "🚀 Criando estrutura PostgreSQL multi-bancos..."

# Senhas (alterar em produção)
RH_PASSWORD="RhPlus2026!Secure"
CLIMA_PASSWORD="Clima2026!Secure"
POP_PASSWORD="Pop2026!Secure"
PRD_PASSWORD="Prd2026!Secure"
MATRIZ_PASSWORD="Matriz2026!Secure"

# Criar bancos e usuários
sudo -u postgres psql << EOF
-- Criar bancos
CREATE DATABASE rh;
CREATE DATABASE pesquisa_clima;
CREATE DATABASE pop;
CREATE DATABASE prd;
CREATE DATABASE matriz;

-- Criar usuários
CREATE USER rh_user WITH PASSWORD '$RH_PASSWORD';
CREATE USER clima_user WITH PASSWORD '$CLIMA_PASSWORD';
CREATE USER pop_user WITH PASSWORD '$POP_PASSWORD';
CREATE USER prd_user WITH PASSWORD '$PRD_PASSWORD';
CREATE USER matriz_user WITH PASSWORD '$MATRIZ_PASSWORD';

-- Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE rh TO rh_user;
GRANT ALL PRIVILEGES ON DATABASE pesquisa_clima TO clima_user;
GRANT ALL PRIVILEGES ON DATABASE pop TO pop_user;
GRANT ALL PRIVILEGES ON DATABASE prd TO prd_user;
GRANT ALL PRIVILEGES ON DATABASE matriz TO matriz_user;

-- Mostrar resultado
\l
\du
EOF

echo "✅ PostgreSQL configurado com sucesso!"
```

### **Script Individual - RH+**
```bash
#!/bin/bash
# setup-banco-rh.sh

sudo -u postgres psql << EOF
-- Criar banco RH (se não existir)
SELECT 'CREATE DATABASE rh'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'rh')\gexec

-- Criar usuário RH (se não existir)
DO
\$do\$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'rh_user') THEN

      CREATE ROLE rh_user LOGIN PASSWORD 'RhPlus2026!Secure';
   END IF;
END
\$do\$;

-- Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE rh TO rh_user;
EOF
```

---

## 🔐 **CONFIGURAÇÕES DE SEGURANÇA**

### **1. Configurar Acesso Local**
```bash
# Editar postgresql.conf
nano /etc/postgresql/15/main/postgresql.conf

# Alterar:
listen_addresses = 'localhost'
port = 5432
max_connections = 100
shared_buffers = 128MB
```

### **2. Configurar pg_hba.conf**
```bash
# Editar pg_hba.conf
nano /etc/postgresql/15/main/pg_hba.conf

# Adicionar/configurar:
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

### **3. Reiniciar PostgreSQL**
```bash
systemctl restart postgresql
systemctl status postgresql
```

---

## 📊 **CONFIGURAÇÕES DE PERFORMANCE**

### **postgresql.conf - Otimizações**
```ini
# Memória
shared_buffers = 128MB
effective_cache_size = 4GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Conexões
max_connections = 100
superuser_reserved_connections = 3

# Logs
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'all'
log_min_duration_statement = 1000

# Performance
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

---

## 🔄 **BACKUP E RESTAURAÇÃO**

### **Backup Individual**
```bash
# Backup banco RH
pg_dump -h localhost -U rh_user -d rh > rh_backup_$(date +%Y%m%d).sql

# Backup todos os bancos
pg_dumpall > full_backup_$(date +%Y%m%d).sql

# Backup compactado
pg_dump -h localhost -U rh_user -d rh | gzip > rh_backup_$(date +%Y%m%d).sql.gz
```

### **Restauração**
```bash
# Restaurar banco específico
psql -h localhost -U rh_user -d rh < rh_backup_20260428.sql

# Restaurar compactado
gunzip -c rh_backup_20260428.sql.gz | psql -h localhost -U rh_user -d rh
```

---

## 🔍 **MONITORAMENTO E MANUTENÇÃO**

### **Verificações Diárias**
```bash
# Status do serviço
systemctl status postgresql

# Conexões ativas
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Tamanho dos bancos
sudo -u postgres psql -c "
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database;"

# Locks ativos
sudo -u postgres psql -c "SELECT * FROM pg_locks;"
```

### **Manutenção Semanal**
```bash
# VACUUM ANALYZE todos os bancos
sudo -u postgres psql -c "SELECT 'VACUUM ANALYZE ' || datname || ';' FROM pg_database WHERE datname NOT LIKE 'template%';" | sudo -u postgres psql

# Rebuild índices (se necessário)
REINDEX DATABASE rh;
```

---

## 📈 **MÉTRICAS E LIMITES**

### **Limites Recomendados**
| Sistema | Conexões Simultâneas | RAM Estimada | Disco Estimado |
|---------|---------------------|--------------|----------------|
| RH+ | 20 | ~200MB | ~100MB |
| Pesquisa Clima | 10 | ~100MB | ~50MB |
| POP | 15 | ~150MB | ~80MB |
| PRD | 15 | ~150MB | ~80MB |
| Matriz | 10 | ~100MB | ~60MB |

### **Monitoramento de Performance**
```sql
-- Queries lentas
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Tamanho das tabelas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🚨 **TROUBLESHOOTING**

### **Problemas Comuns**
```bash
# PostgreSQL não inicia
systemctl status postgresql
tail -f /var/log/postgresql/postgresql-15-main.log

# Conexão negada
sudo -u postgres psql -c "SELECT * FROM pg_user;"
sudo -u postgres psql -c "SELECT * FROM pg_database;"

# Performance lenta
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Disco cheio
df -h
du -sh /var/lib/postgresql/*
```

### **Comandos de Emergência**
```bash
# Parar PostgreSQL
systemctl stop postgresql

# Iniciar em modo seguro
pg_ctl -D /var/lib/postgresql/15/main start

# Verificar configuração
sudo -u postgres psql -c "SHOW all;"
```

---

## 📚 **REFERÊNCIAS E LINKS**

- **Documentação PostgreSQL:** https://www.postgresql.org/docs/15/
- **Configuração de Performance:** https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server
- **Backup e Recovery:** https://www.postgresql.org/docs/15/backup.html

---

*Última atualização: 28/04/2026*  
*Status: Configuração preparada, aguardando instalação*

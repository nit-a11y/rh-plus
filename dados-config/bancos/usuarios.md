# 🔐 USUÁRIOS E SENHAS - NIT SYSTEMS

**Data:** 28/04/2026  
**VPS:** srv1566743 (147.93.10.11)  
**Acesso:** Restrito e documentado

---

## 🔑 **CREDENCIAIS PRINCIPAIS**

### **Acesso VPS**
```bash
SSH: ssh root@147.93.10.11
Usuário: root
Senha: [VERIFICAR COM ADMINISTRADOR]
Porta: 22
```

### **PostgreSQL - Superusuário**
```bash
Usuário: postgres
Senha: [MESMA SENHA DO ROOT VPS]
Bancos: TODOS (superusuário)
Acesso: localhost apenas
```

---

## 👥 **USUÁRIOS DOS SISTEMAS**

### **RH+ - Sistema de Gestão**
```bash
Usuário: rh_user
Senha: RhPlus2026!Secure
Banco: rh
Permissões: ALL PRIVILEGES
Acesso: localhost
```

### **RH+ - Ambiente Local (Senha Unificada)**
```bash
Usuário: postgres
Senha: 12Nordeste34+
Banco: Todos os bancos
Permissões: Superuser
Acesso: localhost

Usuário: rhplus_user
Senha: 12Nordeste34+
Banco: rh
Permissões: ALL PRIVILEGES
Acesso: localhost
```

### **Pesquisa Clima**
```bash
Usuário: clima_user
Senha: Clima2026!Secure
Banco: pesquisa_clima
Permissões: ALL PRIVILEGES
Acesso: localhost
```

### **POP Sistema**
```bash
Usuário: pop_user
Senha: Pop2026!Secure
Banco: pop
Permissões: ALL PRIVILEGES
Acesso: localhost
```

### **PRD Sistema**
```bash
Usuário: prd_user
Senha: Prd2026!Secure
Banco: prd
Permissões: ALL PRIVILEGES
Acesso: localhost
```

### **Matriz Sistema**
```bash
Usuário: matriz_user
Senha: Matriz2026!Secure
Banco: matriz
Permissões: ALL PRIVILEGES
Acesso: localhost
```

---

## 🔒 **POLÍTICAS DE SENHAS**

### **Padrão de Senhas**
- **Tamanho mínimo:** 16 caracteres
- **Complexidade:** Letras maiúsculas, minúsculas, números, símbolos
- **Expiração:** A cada 6 meses
- **Histórico:** Não repetir últimas 5 senhas

### **Exemplo de Senha Segura**
```
Formato: SistemaAno2026!Secure
Exemplo: RhPlus2026!Secure
```

---

## 🛡️ **SEGURANÇA DE ACESSO**

### **PostgreSQL - pg_hba.conf**
```
# Acesso local apenas
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

### **Firewall UFW**
```bash
# Portas permitidas
22/tcp    # SSH
80/tcp    # HTTP
443/tcp   # HTTPS
5432/tcp  # PostgreSQL (localhost apenas)
```

### **SSH - Segurança**
```bash
# /etc/ssh/sshd_config
Port 22
PermitRootLogin yes
PasswordAuthentication yes
PubkeyAuthentication yes
```

---

## 📋 **COMANDOS DE GERENCIAMENTO**

### **Criar Novo Usuário**
```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar usuário
CREATE USER novo_user WITH PASSWORD 'NovaSenha2026!Secure';

# Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE nome_banco TO novo_user;

# Listar usuários
\du
```

### **Alterar Senha**
```bash
# Alterar senha de usuário
ALTER USER nome_user PASSWORD 'NovaSenha2026!Secure';

# Alterar senha postgres
\password postgres
```

### **Remover Usuário**
```bash
# Remover permissões
REVOKE ALL PRIVILEGES ON DATABASE nome_banco FROM nome_user;

# Remover usuário
DROP USER nome_user;
```

---

## 🔍 **VERIFICAÇÃO DE SEGURANÇA**

### **Auditoria de Usuários**
```sql
-- Listar todos os usuários
SELECT 
    usename,
    usecreatedb,
    usesuper,
    usecatupd,
    passwduntil
FROM pg_user;

-- Verificar conexões ativas
SELECT 
    datname,
    usename,
    client_addr,
    state
FROM pg_stat_activity;
```

### **Verificar Permissões**
```sql
-- Permissões por banco
SELECT 
    datname,
    has_database_privilege(usename, datname, 'CONNECT') as connect,
    has_database_privilege(usename, datname, 'CREATE') as create,
    has_database_privilege(usename, datname, 'TEMPORARY') as temp
FROM pg_database, pg_user
WHERE datname NOT LIKE 'template%';
```

---

## 🚨 **PROCEDIMENTOS DE EMERGÊNCIA**

### **Senha Comprometida**
1. **Imediatamente:**
   ```bash
   # Bloquear acesso SSH temporariamente
   ufw deny 22/tcp
   
   # Alterar senha PostgreSQL
   ALTER USER compromised_user PASSWORD 'NovaSenhaEmergencia2026!';
   ```

2. **Investigação:**
   ```bash
   # Verificar logs de acesso
   tail -f /var/log/auth.log
   tail -f /var/log/postgresql/postgresql-15-main.log
   ```

3. **Recuperação:**
   ```bash
   # Reabilitar SSH
   ufw allow 22/tcp
   
   # Notificar equipe sobre nova senha
   ```

### **Acesso Bloqueado**
```bash
# Resetar senha postgres
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'NovaSenhaRoot2026!';"

# Resetar senha root
passwd root
```

---

## 📚 **ARMAZENAMENTO DE SENHAS**

### **Local Seguro**
- **Arquivo criptografado:** `/root/.ssh/credentials.gpg`
- **Backup offline:** Gerente de senhas externo
- **Equipe:** Apenas administradores autorizados

### **Nunca Armazenar**
- ❌ Plain text em arquivos .env
- ❌ Commit no Git
- ❌ Emails ou chat
- ❌ Post-its ou documentos físicos

---

## 🔄 **ROTAÇÃO DE SENHAS**

### **Agenda Recomendada**
| Tipo | Frequência | Responsável |
|------|-----------|-------------|
| Root VPS | Trimestral | Admin VPS |
| PostgreSQL | Semestral | DBA |
| Sistemas | Semestral | DevOps |
| SSH Keys | Anual | Security |

### **Processo de Rotação**
1. **Planejamento:** Agendar janela de manutenção
2. **Backup:** Backup completo antes de alterar
3. **Alteração:** Mudar senhas em ambiente de teste primeiro
4. **Validação:** Testar acesso com novas credenciais
5. **Documentação:** Atualizar documentação
6. **Comunicação:** Notificar equipe sobre novas senhas

---

## 📞 **CONTATOS DE SEGURANÇA**

### **Emergência**
- **Admin VPS:** [Contato direto]
- **DBA:** [Contato direto]
- **Security Team:** [Contato direto]

### **Suporte**
- **Hostinger:** Painel VPS
- **PostgreSQL:** Documentação oficial
- **Ubuntu:** Community support

---

## ⚠️ **AVISO IMPORTANTE**

**ESTE ARQUIVO CONTÉM INFORMAÇÕES SENSÍVEIS**
- Manter em local seguro
- Acesso restrito a pessoal autorizado
- Atualizar imediatamente após qualquer alteração
- Destruir cópias não autorizadas

---

*Última atualização: 28/04/2026*  
*Classificação: CONFIDENCIAL*  
*Acesso: Nível Administrador*

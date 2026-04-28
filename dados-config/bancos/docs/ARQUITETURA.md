# 🏗️ Arquitetura Profissional RH+

> **Versão**: 2.0.0  
> **Stack**: Node.js + Express + PostgreSQL  
> **Última atualização**: Abril 2026

---

## 📁 Estrutura de Pastas Profissional

```
RH+/
├── 📁 backend/
│   ├── 📁 config/              ← NOVO: Configurações centralizadas
│   │   ├── database.js          ← Conexão multi-ambiente PostgreSQL
│   │   └── index.js             ← Configurações globais do sistema
│   ├── 📁 routes/               ← API endpoints
│   ├── 📁 middleware/           ← Auth, validações
│   ├── 📁 migrations/            ← Scripts de migração do banco
│   ├── 📁 utils/                ← Funções utilitárias
│   ├── server.js                ← Entry point
│   └── .env                     ← Variáveis de ambiente (não commitar!)
│
├── 📁 public/                   ← Frontend estático
│   ├── 📁 js/
│   ├── 📁 css/
│   └── *.html
│
├── 📁 scripts/                  ← NOVO: Scripts de automação
│   ├── setup.js                 ← Setup inicial do projeto
│   ├── db-manager.js            ← Gerenciador de banco
│   └── deploy-check.js          ← Verificação pré-deploy
│
├── 📁 logs/                     ← NOVO: Logs da aplicação
├── 📁 backups/                  ← NOVO: Backups automáticos
├── 📁 PostgreSQL/               ← Documentação e schemas
│
├── .env.example                 ← Template de configuração
├── package.json                 ← Scripts e dependências
└── README.md                    ← Documentação principal
```

---

## 🔄 Fluxo de Desenvolvimento

### Ambientes Suportados

| Ambiente | Banco | Uso |
|----------|-------|-----|
| `development` | `rh` | Desenvolvimento local |
| `test` | `rh_test` | Testes automatizados |
| `production` | `rh` | VPS/Cloud |

### Troca de Ambiente

```bash
# Desenvolvimento (padrão)
npm run dev

# Produção (VPS)
NODE_ENV=production npm start

# Testes
NODE_ENV=test npm test
```

---

## 🔧 Configuração por Variáveis

### Arquivo `.env` (criar a partir de `.env.example`)

```bash
# Escolha o ambiente
NODE_ENV=development

# Banco Principal
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rh
DB_USER=rhplus_user
DB_PASSWORD=12Nordeste34+

# Banco de Teste (isolated)
TEST_DB_HOST=localhost
TEST_DB_NAME=rh_test

# Banco de Produção (VPS)
PROD_DB_HOST=seu-vps-ip
PROD_DB_USER=rhplus_prod
PROD_DB_PASSWORD=senha-segura-aqui

# Segurança
JWT_SECRET=chave-secreta-minimo-32-caracteres-aqui

# Servidor
PORT=3001
```

### Prioridade de Configuração

1. `DATABASE_URL` (variável completa) - **prioridade máxima**
2. Variáveis específicas do ambiente (`PROD_DB_*`, `TEST_DB_*`)
3. Variáveis padrão (`DB_*`)
4. Valores default no código

---

## 🗄️ Gerenciamento do Banco

### Comandos Disponíveis

```bash
# Ver status da conexão
npm run db:status

# Executar migrações
npm run db:migrate

# Popular com dados de teste
npm run db:seed

# Backup
npm run db:backup

# Reset (⚠️ cuidado!)
npm run db:reset
```

### Exemplo: Trocar para Banco de Teste

```bash
# 1. Configurar .env
TEST_DB_NAME=rh_test

# 2. Rodar comandos no ambiente de teste
NODE_ENV=test npm run db:migrate
NODE_ENV=test npm run db:seed

# 3. Testar aplicação
NODE_ENV=test npm start
```

---

## 🚀 Deploy para VPS

### 1. Preparação Local

```bash
# Verificar se está tudo ok
npm run deploy:check

# Criar .env de produção
cp .env .env.production
# Editar .env.production com dados do VPS
```

### 2. Estrutura no VPS

```
/var/www/rhplus/
├── 📁 app/                    ← Código da aplicação
├── 📁 logs/                   ← Logs
├── 📁 backups/               ← Backups diários
└── 📄 .env                   ← Configuração de produção
```

### 3. Checklist de Deploy

- [ ] `NODE_ENV=production` definido
- [ ] `JWT_SECRET` seguro (32+ caracteres)
- [ ] Banco PostgreSQL configurado no VPS
- [ ] Firewall liberando porta 3001 (ou usar Nginx)
- [ ] PM2 ou systemd para manter app rodando
- [ ] SSL configurado (Let's Encrypt)

---

## 🛡️ Segurança

### Boas Práticas

1. **Nunca commite o `.env`** - está no `.gitignore`
2. **Senhas fortes** - mínimo 20 caracteres em produção
3. **JWT_SECRET** - mínimo 32 caracteres, gerado aleatoriamente
4. **Banco isolado** - use banco de teste para desenvolvimento
5. **Backups regulares** - configure `cron` para backup diário

### Gerar JWT_SECRET Seguro

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 } | ForEach-Object { [byte]$_ }))
```

---

## 📊 Monitoramento

### Logs

```bash
# Ver logs em tempo real
npm run logs

# Ou diretamente
tail -f logs/app.log
```

### Status do Sistema

```bash
# Status completo
npm run db:status
```

Saída esperada:
```
📊 Status do Banco de Dados

✅ Conectado: SIM
🕐 Timestamp: 2026-04-14T10:30:00Z
🐘 Versão: PostgreSQL 15.2
🌍 Ambiente: production

📋 Tabelas encontradas: 25
   1. companies
   2. employees
   3. users
   ...
```

---

## 🆘 Troubleshooting

### Erro: "Cannot connect to PostgreSQL"

```bash
# 1. Verificar se PostgreSQL está rodando
pg_isready

# 2. Verificar credenciais no .env
cat .env | grep DB_

# 3. Testar conexão manual
psql -U rhplus_user -h localhost -d rh

# 4. Ver logs detalhados
DEBUG=* npm run db:status
```

### Erro: "database does not exist"

```bash
# Criar banco manualmente
psql -U postgres -c "CREATE DATABASE rh;"
psql -U postgres -c "CREATE USER rhplus_user WITH PASSWORD '12Nordeste34+';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE rh TO rhplus_user;"
```

---

## 📞 Suporte

| Recurso | Local |
|---------|-------|
| Documentação PostgreSQL | `PostgreSQL/PostgreSQL_Geral.md` |
| Configuração | `PostgreSQL/Configuracao_PostgreSQL.md` |
| Schema do Banco | `PostgreSQL/schema_sqlite_completo.txt` |
| Script de Setup | `scripts/setup.js` |

---

## 📝 Changelog

### v2.0.0 (Abril 2026)
- ✅ Migração completa para PostgreSQL
- ✅ Sistema multi-ambiente (dev/test/prod)
- ✅ Configuração via variáveis de ambiente
- ✅ Scripts de automação (setup, db-manager, deploy-check)
- ✅ Pool de conexões profissional
- ✅ Transações suportadas
- ✅ Documentação completa de arquitetura

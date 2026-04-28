# 🚀 RH+ - Sistema Profissional de Gestão de RH

> **Versão**: 2.0.0  
> **Stack**: Node.js + Express + PostgreSQL  
> **Empresa**: Nordeste Locações

---

## 📋 Requisitos

- **Node.js**: >= 16.0.0
- **PostgreSQL**: >= 14
- **npm**: >= 8.0.0

---

## ⚡ Instalação Rápida

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd RH+

# 2. Execute o setup automático
npm run setup

# 3. Configure o .env
cp .env.example .env
# Edite .env com suas configurações

# 4. Crie o banco de dados
psql -U postgres -c "CREATE DATABASE rh;"
psql -U postgres -c "CREATE USER rhplus_user WITH PASSWORD '12Nordeste34+';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE rh TO rhplus_user;"

# 5. Execute migrações
npm run db:migrate

# 6. Inicie o servidor
npm run dev
```

Acesse: **http://localhost:3001**

---

## 🗄️ Comandos de Banco

```bash
# Ver status da conexão
npm run db:status

# Executar migrações
npm run db:migrate

# Popular dados de teste
npm run db:seed

# Backup
npm run db:backup
```

---

## 🔧 Ambientes

### Desenvolvimento (padrão)
```bash
npm run dev
# ou
NODE_ENV=development npm start
```

### Testes
```bash
NODE_ENV=test npm run db:migrate
NODE_ENV=test npm start
```

### Produção
```bash
npm run deploy:check  # Verifica se está tudo ok
NODE_ENV=production npm start
```

---

## 📁 Estrutura

```
RH+/
├── backend/           # API Node.js + Express
│   ├── config/       # Configurações
│   ├── routes/       # Endpoints API
│   └── server.js     # Entry point
├── public/           # Frontend HTML/CSS/JS
├── scripts/          # Scripts de automação
├── logs/            # Logs da aplicação
└── PostgreSQL/      # Documentação
```

---

## 🚀 Deploy para VPS

Veja: [`PostgreSQL/DEPLOY_VPS.md`](PostgreSQL/DEPLOY_VPS.md)

Resumo:
1. Configure `.env` com dados do VPS
2. Execute `npm run deploy:check`
3. Use PM2: `pm2 start backend/server.js --name rhplus`

---

## 📊 Health Check

```bash
curl http://localhost:3001/health
```

Retorno:
```json
{
  "status": "ok",
  "environment": "production",
  "database": "connected",
  "version": "2.0.0"
}
```

---

## 🛡️ Segurança

- ✅ Helmet headers
- ✅ Rate limiting (100 req/15min em prod)
- ✅ CORS configurável
- ✅ Compressão gzip
- ✅ Logs de acesso
- ✅ JWT authentication
- ✅ Variáveis de ambiente (.env)

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [`PostgreSQL/ARQUITETURA.md`](PostgreSQL/ARQUITETURA.md) | Arquitetura do sistema |
| [`PostgreSQL/PostgreSQL_Geral.md`](PostgreSQL/PostgreSQL_Geral.md) | Guia PostgreSQL |
| [`PostgreSQL/DEPLOY_VPS.md`](PostgreSQL/DEPLOY_VPS.md) | Deploy em VPS |
| `.env.example` | Template de configuração |

---

## 🆘 Suporte

**Problemas comuns:**

**Erro de conexão PostgreSQL**
```bash
# Verificar se está rodando
pg_isready

# Ver logs
npm run db:status
```

**Porta ocupada**
```bash
# Altere no .env
PORT=3002
```

---

## 📝 Changelog

### v2.0.0 (2026-04)
- ✅ Arquitetura profissional multi-ambiente
- ✅ PostgreSQL com pool de conexões
- ✅ Scripts de automação
- ✅ Sistema de health check
- ✅ Segurança reforçada (helmet, rate-limit)

---

**Desenvolvido por**: Nordeste Locações  
**Licença**: PRIVATE

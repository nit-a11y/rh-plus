# 🌍 GUIA DE AMBIENTES - RH+ SISTEMA

## 📋 Visão Geral

Sistema profissional de ambientes configurado para desenvolvimento seguro e deploy eficiente.

## 🗂️ Estrutura de Arquivos

```
/
├── .env.development          # Ambiente local (Windows)
├── .env.test                 # Testes automatizados  
├── .env.production           # Produção (VPS) - NÃO COMMITAR
├── .env.example              # Template geral
├── .env.development.example  # Template dev
├── .env.production.example   # Template produção
└── .gitignore               # Protege arquivos sensíveis
```

## 🚀 Comandos Disponíveis

### Alternar Ambientes (Local)
```bash
# Switch manual
npm run env:switch development
npm run env:switch test  
npm run env:switch production

# Atalhos
npm run env:dev    # → development
npm run env:test   # → test
npm run env:prod   # → production
```

### Iniciar Servidor
```bash
# Desenvolvimento (usa .env.development)
npm run dev

# Testes (usa .env.test)
npm test

# Produção (usa .env.production)
npm start
```

### Deploy para VPS
```powershell
# PowerShell Windows
.\scripts\deploy-env.ps1 -Environment production

# Com backup automático
.\scripts\deploy-env.ps1 -Environment production -SkipBackup:$false
```

## 🔧 Configuração por Ambiente

### Development (.env.development)
- **Database**: PostgreSQL local (Windows)
- **Porta**: 3001
- **Host**: localhost
- **Logs**: debug (verboso)
- **CORS**: http://localhost:3000

### Test (.env.test)
- **Database**: rh_test (banco isolado)
- **Porta**: 3002
- **Logs**: error (mínimo)
- **Auto-cleanup**: true
- **Reset automático**: true

### Production (.env.production)
- **Database**: PostgreSQL VPS (147.93.10.11)
- **Porta**: 3001
- **Host**: 0.0.0.0
- **Logs**: warn (produção)
- **CORS**: https://rh.nordesteloc.cloud

## 🛡️ Segurança

### Arquivos Protegidos (.gitignore)
- `.env` (link ativo)
- `.env.production` (senhas reais)
- `.env.local` (config local)

### Arquivos Permitidos
- `.env.development` (sem senhas sensíveis)
- `.env.test` (ambiente de testes)
- `.env.*.example` (templates)

## 🔄 Fluxo de Trabalho

### 1. Desenvolvimento Local
```bash
# 1. Garantir ambiente development
npm run env:dev

# 2. Iniciar servidor
npm run dev

# 3. Debug com logs detalhados
# Logs aparecem no console (LOG_LEVEL=debug)
```

### 2. Testes
```bash
# 1. Switch para testes
npm run env:test

# 2. Rodar testes
npm test

# 3. Banco limpo automaticamente
```

### 3. Deploy Produção
```bash
# 1. Criar .env.production (baseado no .example)
cp .env.production.example .env.production
# EDITAR com senhas reais

# 2. Deploy para VPS
.\scripts\deploy-env.ps1 -Environment production

# 3. Sistema restart automático
```

## 🐛 Debug e Troubleshooting

### Verificar Ambiente Atual
```bash
node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"
node -e "console.log('DB:', process.env.DB_NAME)"
```

### Testar Conexão com Banco
```bash
npm run db:status
```

### Logs em Tempo Real
```bash
npm run logs
```

### Verificar Configuração
```bash
# Mostrar arquivo .env ativo
ls -la .env*

# Verificar conteúdo
cat .env
```

## 📝 Melhores Práticas

### ✅ FAZER
- Sempre usar `npm run env:switch` para mudar ambiente
- Manter `.env.production` apenas na VPS
- Usar ambiente `test` para testes automatizados
- Fazer backup antes de deploy

### ❌ NÃO FAZER
- Commitar `.env.production` no Git
- Usar banco de produção para desenvolvimento
- Esquecer de resetar ambiente após testes
- Deploy sem testar ambiente local

## 🚨 Emergência

### Rollback Rápido
```bash
# Voltar para ambiente development
npm run env:dev
npm run dev
```

### Restaurar Backup na VPS
```bash
ssh root@147.93.10.11
cd /root/rh-plus
cp .env.backup.YYYYMMDD_HHMMSS .env
pm2 restart rh-plus
```

## 📈 Próximos Passos

1. **Configurar CI/CD** para deploy automático
2. **Adicionar ambiente staging** (intermediário)
3. **Implementar health checks** por ambiente
4. **Monitoramento** específico por ambiente

---
description: Workflow de Deploy NIT - Multi Sistemas (Local → GitHub → VPS + PM2 + PostgreSQL)
---

# 🚀 WORKFLOW NIT — Deploy Profissional Multi-Sistemas

## 🧠 Visão Geral da Arquitetura


[LOCAL DEV]
↓
[GIT PUSH]
↓
[GITHUB]
↓
[VPS]
├── /var/www/sistemas/
│ ├── sistema-1/
│ ├── sistema-2/
│ ├── sistema-3/
│
├── PM2 (gerenciador de processos)
│
└── PostgreSQL (banco central)


---

# 📦 Estrutura Padrão (OBRIGATÓRIA)

```bash
/var/www/sistemas/
   ├── pesquisa-clima/
   ├── rh-system/
   ├── financeiro/
   └── outro-sistema/
⚙️ PM2 — Gerenciamento Centralizado (Ecosystem)
📄 Arquivo Global

Caminho:

/var/www/sistemas/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "pesquisa-clima",
      script: "./server.js",
      cwd: "/var/www/sistemas/pesquisa-clima",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    },
    {
      name: "rh-system",
      script: "./server.js",
      cwd: "/var/www/sistemas/rh-system",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3002
      }
    }
  ]
}
🚀 Workflow de Deploy
🔹 PASSO 1 — LOCAL (DESENVOLVIMENTO)
# Verificar alterações
git status

# Adicionar alterações
git add .

# Criar commit
git commit -m "feat: descrição clara da alteração"

# Enviar para GitHub
git push origin main
🔹 PASSO 2 — VPS (DEPLOY)
🔥 Deploy por sistema (padrão)
ssh root@SEU_IP "cd /var/www/sistemas/NOME_DO_SISTEMA && git pull && pm2 restart NOME_DO_SISTEMA"
🔥 Exemplos reais
# Pesquisa Clima
ssh root@147.93.10.11 "cd /var/www/sistemas/pesquisa-clima && git pull && pm2 restart pesquisa-clima"

# Sistema RH
ssh root@147.93.10.11 "cd /var/www/sistemas/rh-system && git pull && pm2 restart rh-system"
⚡ Deploy Inteligente (Script Global)
Criar comando universal
nano /usr/local/bin/deploy
#!/bin/bash

APP=$1

cd /var/www/sistemas/$APP || exit

echo "🚀 Iniciando deploy de $APP..."

git pull

pm2 restart $APP

echo "✅ Deploy concluído para $APP"
Dar permissão
chmod +x /usr/local/bin/deploy
🚀 Uso
ssh root@147.93.10.11 "deploy pesquisa-clima"
ssh root@147.93.10.11 "deploy rh-system"
🧠 Banco de Dados — PostgreSQL (Padrão NIT)
📌 Estrutura recomendada
1 servidor PostgreSQL
1 banco por sistema
postgresql
 ├── pesquisa_clima_db
 ├── rh_db
 ├── financeiro_db
🔐 Variáveis de ambiente (.env)

Cada sistema deve ter seu .env:

DATABASE_URL=postgresql://usuario:senha@localhost:5432/nome_do_banco
📋 Checklist de Deploy
Antes do deploy
 Código testado localmente
 Variáveis .env configuradas
 Banco preparado (migrações)
Durante o deploy
 git push realizado
 deploy executado
 PM2 reiniciado
Pós-deploy
 Verificar status:
pm2 status
 Ver logs:
pm2 logs NOME_DO_SISTEMA --lines 20
 Testar sistema no navegador
 Validar conexão com banco
🔄 Rollback (Segurança)
cd /var/www/sistemas/NOME_DO_SISTEMA

# Ver histórico
git log --oneline -5

# Voltar versão
git reset --hard HEAD~1

# Reiniciar
pm2 restart NOME_DO_SISTEMA
⚡ Comando Turbo (Deploy Rápido)
git add . && git commit -m "update" && git push origin main && ssh root@147.93.10.11 "deploy NOME_DO_SISTEMA"
📍 Informações do Ambiente
Tipo	Valor
VPS IP	147.93.10.11
Base Path	/var/www/sistemas
Gerenciador	PM2
Banco	PostgreSQL
🧠 Boas Práticas NIT
Um sistema = uma pasta
Um sistema = uma porta
Um sistema = um banco
Nunca compartilhar .env
Sempre usar PM2 (nunca node direto)
Sempre validar logs após deploy
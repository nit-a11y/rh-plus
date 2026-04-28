# 📁 PROPOSTA DE REORGANIZAÇÃO - DADOS-CONFIG

**Data:** 28/04/2026  
**Status:** Proposta para reorganização completa

---

## 🎯 **ESTRUTURA LIMPA PROPOSTA**

```
dados-config/
├── README.md                           ← Visão geral atualizada
├── GUIA-CENTRAL.md                     ← Guia mestre (mantido)
├── .env.example                        ← Config base (mantido)
│
├── 📁 vps/                             ← INFRAESTRUTURA
│   ├── hardware.md                     ← Specs VPS
│   ├── software.md                     ← Softwares instalados
│   ├── acesso.md                       ← SSH e acesso remoto
│   └── diagnostico.sh                  ← Script diagnóstico
│
├── 📁 bancos/                          ← BANCOS DE DADOS
│   ├── README.md                       ← Visão geral dos bancos
│   ├── postgresql.md                   ← Setup completo PostgreSQL
│   ├── sqlite.md                       ← Config SQLite existente
│   ├── usuarios.md                     ← Credenciais unificadas
│   ├── CREDENCIAIS-UNIFICADAS.md       ← Documentação oficial
│   └── scripts/                        ← Scripts de banco
│       ├── setup-postgres.sql          ← Setup inicial
│       └── backup-postgres.sh          ← Backup automático
│
├── 📁 sistemas/                        ← SISTEMAS APLICATIVOS
│   ├── README.md                       ← Visão geral dos sistemas
│   ├── rh-plus/                        ← Sistema RH+
│   │   ├── README.md                   ← Config completa
│   │   ├── .env.example                ← Config RH+
│   │   ├── package.json                ← Dependências
│   │   └── docs/                       ← Documentação RH+
│   │       ├── ARQUITETURA.md          ← Arquitetura
│   │       ├── MIGRACAO.md             ← Migração SQLite→PG
│   │       └── DEPLOY.md               ← Deploy específico
│   ├── pesquisa-clima/                 ← Sistema Pesquisa Clima
│   │   ├── README.md                   ← Config completa
│   │   └── docs/                       ← Documentação
│   └── outros/                         ← POP, PRD, Matriz
│       ├── pop.md
│       ├── prd.md
│       └── matriz.md
│
├── 📁 deploy/                          ← DEPLOY AUTOMAÇÃO
│   ├── README.md                       ← Visão geral dos deploys
│   ├── scripts/                        ← Scripts de deploy
│   │   ├── deploy-rh-plus.sh           ← Deploy RH+ principal
│   │   ├── deploy-rh-plus-provisorio.sh ← Deploy domínio provisório
│   │   ├── setup-postgres-vps.sh       ← Setup PostgreSQL VPS
│   │   └── deploy-todos.sh             ← Deploy todos sistemas
│   └── docs/                           ← Documentação de deploy
│       ├── checklist-deploy.md         ← Checklist completo
│       └── troubleshooting.md          ← Problemas comuns
│
├── 📁 dominios/                        ← DOMÍNIOS E DNS
│   ├── README.md                       ← Visão geral dos domínios
│   ├── dns-hostinger.md                ← Config DNS Hostinger
│   ├── dns-provisorio.md               ← Domínios provisórios
│   ├── nginx/                          ← Configs Nginx
│   │   ├── README.md                   ← Visão geral Nginx
│   │   ├── rh-nordesteloc.cloud.conf   ← Config RH+
│   │   ├── pesquisadeclima.conf        ← Config Pesquisa Clima
│   │   └── setup-nginx.sh              ← Script setup
│   └── ssl/                            ← Certificados SSL
│       ├── README.md                   ← Visão geral SSL
│       ├── setup-certbot.sh            ← Setup Let's Encrypt
│       └── renovacao-automatica.md      ← Renovação SSL
│
├── 📁 migracao/                        ← MIGRAÇÃO DE DADOS
│   ├── README.md                       ← Visão geral da migração
│   ├── plano-migracao.md               ← Plano completo
│   ├── scripts/                        ← Scripts de migração
│   │   ├── backup-local-rh.bat         ← Backup Windows
│   │   ├── migrar-dados-vps.sh         ← Migração VPS
│   │   └── verificar-integridade.sh    ← Verificação pós-migração
│   └── docs/                           ← Documentação
│       ├── backup-manual.md            ← Backup passo a passo
│       └── rollback.md                 ← Plano de rollback
│
├── 📁 backup/                          ← BACKUP E MONITORAMENTO
│   ├── README.md                       ← Visão geral do backup
│   ├── scripts/                        ← Scripts de backup
│   │   ├── backup-diario-vps.sh        ← Backup diário VPS
│   │   ├── backup-bancos.sh            ← Backup bancos
│   │   └── sync-google-drive.sh        ← Sync nuvem
│   └── docs/                           ← Documentação
│       ├── politica-backup.md           ← Política de backup
│       └── restauracao.md              ← Processo de restauração
│
├── 📁 logs/                            ← LOGS E MONITORAMENTO
│   ├── README.md                       ← Visão geral dos logs
│   ├── analise/                        ← Análises de logs
│   └── monitoramento/                  ← Config monitoramento
│
└── 📁 arquivos-antigos/                 ← ARQUIVOS LEGADOS
    ├── DEPLOY-RH-COMPLETO-2026.md      ← Mantido como referência
    ├── SCRIPT-DEPLOY-AUTOMATICO.sh     ← Mantido como referência
    ├── GUIA_DEPLOY_VPS.md              ← Mantido como referência
    └── PostgreSQL-rh+/                 ← Pasta antiga
```

---

## 🔄 **AÇÕES DE REORGANIZAÇÃO**

### **1. Consolidar Arquivos Duplicados**
- Mover melhores versões para estrutura nova
- Eliminar cópias redundantes
- Manter apenas versões atualizadas

### **2. Criar Subpastas Lógicas**
- `scripts/` para cada área
- `docs/` para documentação específica
- `arquivos-antigos/` para legados

### **3. Unificar Documentação**
- Consolidar informações de PostgreSQL
- Unificar credenciais em um só lugar
- Criar READMEs para cada área

### **4. Padronizar Nomenclatura**
- Nomes de arquivos consistentes
- Estrutura de pastas lógica
- Documentação padronizada

---

## ✅ **BENEFÍCIOS DA REORGANIZAÇÃO**

1. **Clareza:** Estrutura lógica e intuitiva
2. **Manutenibilidade:** Fácil encontrar e atualizar
3. **Consolidação:** Sem duplicação de informação
4. **Escalabilidade:** Fácil adicionar novos sistemas
5. **Documentação:** Cada área bem documentada

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Criar nova estrutura** de pastas
2. **Mover arquivos** para locais corretos
3. **Consolidar documentação** duplicada
4. **Atualizar READMEs** principais
5. **Testar nova estrutura** para garantir funcionamento

---

## 📋 **CHECKLIST DE REORGANIZAÇÃO**

- [ ] Criar estrutura de pastas proposta
- [ ] Mover arquivos de PostgreSQL para `bancos/`
- [ ] Consolidar scripts de deploy em `deploy/scripts/`
- [ ] Mover documentação RH+ para `sistemas/rh-plus/docs/`
- [ ] Unificar scripts de migração em `migracao/scripts/`
- [ ] Criar READMEs para cada pasta principal
- [ ] Mover arquivos antigos para `arquivos-antigos/`
- [ ] Atualizar README principal
- [ ] Testar acesso a todos os arquivos

---

**Status:** Proposta aguardando aprovação  
**Complexidade:** Média (reorganização de ~50 arquivos)  
**Tempo estimado:** 30-45 minutos  
**Risco:** Baixo (apenas reorganização, sem perda de dados)

# 🗄️ DADOS DE CONFIGURAÇÃO - NIT SYSTEMS
**VPS:** 147.93.10.11 (srv1566743.hstgr.cloud)  
**Data:** 28/04/2026  
**SO:** Ubuntu 24.04.4 LTS  

---

## 📊 **ESTADO ATUAL DA VPS**

### **Hardware**
- **CPU:** Multi-core (detalhes em hardware.md)
- **Memória:** 7.8GB total, 622MB usada
- **Disco:** 96GB total, 2.6GB usado (94GB livre)

### **Software Instalado**
- ✅ **Nginx:** Ativo (portas 80, 443)
- ✅ **PM2:** Ativo
- ✅ **PostgreSQL:** Instalado e configurado (v18)
- ❌ **Node.js:** Não detectado

### **Sistemas Ativos**
- ✅ **pesquisa-clima:** Rodando na porta 3000 (PM2 id: 0)

### **Firewall UFW**
- Portas abertas: 22 (SSH), 80 (HTTP), 443 (HTTPS)

---

## 🎯 **SISTEMAS PLANEJADOS**

| Sistema | Domínio | Porta | Status | Banco |
|---------|---------|-------|--------|-------|
| RH+ | rh.nordesteloc.com.br | 3001 | ✅ PostgreSQL Instalado | PostgreSQL |
| Pesquisa Clima | pesquisadeclima.nordesteloc.com.br | 3000 | ✅ Online | SQLite |
| POP | pop.nordesteloc.com.br | 3002 | 📋 Planejado | PostgreSQL |
| PRD | prd.nordesteloc.com.br | 3003 | 📋 Planejado | PostgreSQL |
| Matriz | matriz.nordesteloc.com.br | 3004 | 📋 Planejado | PostgreSQL |

---

## 📁 **ESTRUTURA ORGANIZADA**

```
dados-config/
├── README.md                           ← Este arquivo
├── GUIA-CENTRAL.md                     ← Guia mestre do sistema
├── .env.example                        ← Configuração base
├── ESTRUTURA-REORGANIZADA.md          ← Proposta de estrutura
│
├── 📁 vps/                             ← INFRAESTRUTURA
│   ├── README.md                       ← Visão geral VPS
│   ├── hardware.md                     ← Specs completas
│   ├── software.md                     ← Softwares instalados
│   └── scripts/                        ← Scripts VPS
│       └── comando-diagnostico-vps.sh  ← Diagnóstico completo
│
├── 📁 bancos/                          ← BANCOS DE DADOS
│   ├── README.md                       ← Visão geral dos bancos
│   ├── postgresql.md                   ← Setup PostgreSQL
│   ├── usuarios.md                     ← Senhas e permissões
│   ├── CREDENCIAIS-UNIFICADAS.md       ← Credenciais oficiais
│   ├── scripts/                        ← Scripts de banco
│   │   └── setup-postgres.sql          ← Setup inicial
│   └── docs/                           ← Documentação PostgreSQL
│       ├── ARQUITETURA.md              ← Arquitetura RH+
│       ├── Configuracao_PostgreSQL.md  ← Config básica
│       ├── Configuracao_PostgreSQL_Completa.md ← Config completa
│       ├── PostgreSQL_Geral.md         ← Guia geral
│       ├── PostgreSQL_RHPlus_Migracao.md ← Migração SQLite→PG
│       └── schema_sqlite_completo.txt  ← Schema do banco
│
├── 📁 sistemas/                        ← SISTEMAS APLICATIVOS
│   ├── rh-plus/                        ← Sistema RH+
│   │   └── docs/                       ← Documentação RH+
│   │       └── README.md               ← Config completa RH+
│   └── pesquisa-clima/                 ← Sistema Pesquisa Clima
│       └── docs/                       ← Documentação
│
├── 📁 deploy/                          ← DEPLOY AUTOMAÇÃO
│   ├── README.md                       ← Visão geral dos deploys
│   └── scripts/                        ← Scripts de deploy
│       ├── deploy-rh-plus.sh           ← Deploy RH+ principal
│       └── deploy-rh-plus-provisorio.sh ← Deploy domínio provisório
│
├── 📁 dominios/                        ← DOMÍNIOS E DNS
│   ├── docs/                           ← Documentação DNS
│   ├── nginx/                          ← Configs Nginx
│   │   └── nginx-configs-provisorio.md ← Config domínios provisórios
│   └── ssl/                            ← Certificados SSL
│
├── 📁 migracao/                        ← MIGRAÇÃO DE DADOS
│   ├── README.md                       ← Visão geral da migração
│   ├── scripts/                        ← Scripts de migração
│   │   ├── backup-local-rh.bat         ← Backup Windows
│   │   ├── backup-local-rh-final.bat   ← Backup final
│   │   └── migrar-dados-vps.sh         ← Migração VPS
│   └── docs/                           ← Documentação
│       ├── MIGRACAO-POSTGRESQL-SEGURO.md ← Plano seguro
│       ├── backup-manual.md            ← Backup manual
│       └── backup-usando-config-existente.md ← Backup config existente
│
├── 📁 backup/                          ← BACKUP E MONITORAMENTO
│   ├── scripts/                        ← Scripts de backup
│   └── docs/                           ← Documentação de backup
│
├── 📁 logs/                            ← LOGS E MONITORAMENTO
│   ├── analise/                        ← Análises de logs
│   └── monitoramento/                  ← Config monitoramento
│
└── 📁 arquivos-antigos/                 ← ARQUIVOS LEGADOS
    ├── DEPLOY-RH-COMPLETO-2026.md      ← Deploy antigo
    ├── SCRIPT-DEPLOY-AUTOMATICO.sh     ← Script antigo
    ├── GUIA_DEPLOY_VPS.md              ← Guia antigo
    └── DOCUMENTACAO_POSTGRESQL.md      ← Doc antiga
```

---

## 🚀 **PRÓXIMOS PASSOS**

1. ✅ **Instalar PostgreSQL** - CONCLUÍDO (v18 configurado)
2. **Deploy RH+** (ver `sistemas/rh-plus/`)
3. **Configurar domínios** (ver `dominios/`)
4. **Setup backup** (ver `backup/`)
5. **Migrar dados** (ver `migracao/`)
6. **Configurar SSL** (certificado Let's Encrypt)

## 🎯 **RESUMO DO QUE FOI CONCLUÍDO:**
- ✅ **PostgreSQL 18** instalado e configurado na VPS
- ✅ **Banco `rh`** criado com usuário `rh_user`
- ✅ **Autenticação segura** (scram-sha-256)
- ✅ **Performance otimizada** (256MB shared_buffers, 6GB cache)
- ✅ **Conexões testadas** (localhost funcionando)
- ✅ **Criação de tabelas** funcionando
- ✅ **Repositório GitHub** criado (`nit-a11y/rh-plus`)
- ✅ **Versionamento ativo** com .gitignore seguro
- ✅ **Push inicial** concluído
- ✅ **Documentação atualizada** com status real

## 📋 **ESTADO ATUAL DO PROJETO:**
- **PostgreSQL:** ✅ PRONTO para produção
- **Código:** ✅ PRONTO no GitHub
- **Deploy:** 🔄 PRONTO para executar
- **Migração:** 🔄 PRONTA para executar
- **SSL:** 🔄 PRONTO para configurar

**Sistema RH+ está 100% pronto para ir para produção!** 🎉

---

## 🔐 **CREDENCIAIS IMPORTANTES**

**Acesso VPS:**
- SSH: `ssh root@147.93.10.11`
- Usuário: `root`
- Senha: [ver arquivo `bancos/usuarios.md`]

**Bancos de Dados:**
- PostgreSQL: [ver `bancos/postgresql.md`] - ✅ INSTALADO E CONFIGURADO (v18)
- Senhas: [ver `bancos/usuarios.md`]

---

## 📞 **SUPORTE**

- **VPS:** Hostinger Painel
- **Domínios:** Painel registrador
- **Documentação:** Esta pasta `dados-config/`

---

*Última atualização: 28/04/2026*  
*Status: PostgreSQL instalado e configurado - Pronto para deploy*

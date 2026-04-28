# 🚀 GUIA COMPLETA - DEPLOY E ATUALIZAÇÕES RH+ V2.0.0

**Data:** 28/04/2026  
**Versão:** 2.0.0  
**Status:** ✅ Produção Pronta

---

## 📋 **RESUMO DO PROJETO ATUAL**

### **🎯 O QUE ESTÁ PRONTO:**
- ✅ **PostgreSQL 18** instalado e configurado na VPS
- ✅ **Banco `rh`** criado com usuário `rh_user`
- ✅ **Repositório GitHub** `nit-a11y/rh-plus` ativo
- ✅ **Versionamento** configurado com .gitignore seguro
- ✅ **Documentação** atualizada com status real

### **🔗 ESTRUTURA:**
```
GitHub: https://github.com/nit-a11y/rh-plus
VPS: 147.93.10.11 (srv1566743)
Domínio: rh.nordesteloc.cloud
```

---

## 🎯 **FLUXO DE TRABALHO IDEAL**

### **📝 CICLO DE DESENVOLVIMENTO:**
```
1. 📝 Desenvolvimento Local
   ├── Fazer alterações no código
   ├── Testar funcionalidades
   └── Commit das mudanças

2. 🚀 Deploy para Produção
   ├── Push das alterações para GitHub
   ├── Deploy automático na VPS
   └── Testes em produção

3. 🔄 Atualizações e Manutenção
   ├── Correções de bugs
   ├── Novas funcionalidades
   └── Melhorias de performance
```

---

## 📋 **GUIA PASSO A PASSO - COMANDOS PRINCIPAIS**

### **🔧 1. AMBIENTE LOCAL - DESENVOLVIMENTO**

#### **📁 Estrutura de Pastas:**
```
C:\Users\NL - NIT\Desktop\GG\
├── backend/                    # Código backend (Node.js + Express)
├── public/                     # Frontend (HTML + CSS + JS)
├── dados-config/               # Configurações e scripts
├── scripts/                    # Scripts utilitários
├── package.json               # Dependências do projeto
└── .env.example               # Template de configuração
```

#### **🔄 Comandos do Dia a Dia:**

**Para fazer alterações no código:**
```bash
# 1. Acessar pasta do projeto
cd "C:\Users\NL - NIT\Desktop\GG"

# 2. Verificar status do Git
git status

# 3. Adicionar arquivos modificados
git add .

# 4. Fazer commit das alterações
git commit -m "feat: descrição clara da alteração"

# 5. Enviar para GitHub
git push origin main
```

**Exemplos de commits:**
```bash
# Nova funcionalidade
git commit -m "feat: adicionar módulo de relatórios"

# Correção de bug
git commit -m "fix: corrigir erro de validação de formulário"

# Melhoria de performance
git commit -m "perf: otimizar consulta de funcionários"

# Atualização de documentação
git commit -m "docs: atualizar README com novas instruções"
```

#### **🧪 Testes Locais:**
```bash
# Iniciar servidor de desenvolvimento
cd "C:\Users\NL - NIT\Desktop\GG"
npm install
npm start

# Acessar aplicação
# Abrir navegador: http://localhost:3001
```

---

### **🚀 2. DEPLOY AUTOMÁTICO - PRODUÇÃO**

#### **📋 Pré-requisitos:**
- ✅ PostgreSQL configurado na VPS
- ✅ Código no GitHub
- ✅ Domínio configurado
- ✅ SSH configurado

#### **🔄 Comandos de Deploy:**

**Opção A: Deploy Completo (Recomendado)**
```bash
# Na VPS - executar script completo
./dados-config/deploy/scripts/deploy-rh-plus.sh
```

**Opção B: Deploy Manual (Passo a Passo)**
```bash
# 1. Conectar à VPS
ssh root@147.93.10.11

# 2. Navegar para o diretório
cd /var/www/

# 3. Fazer backup do código atual (se existir)
cp -r rh-plus rh-plus-backup-$(date +%Y%m%d_%H%M%S)

# 4. Clonar repositório atualizado
git clone https://github.com/nit-a11y/rh-plus.git rh-plus-temp

# 5. Instalar dependências
cd rh-plus-temp
npm install --production

# 6. Parar aplicação atual
pm2 stop rh-plus

# 7. Substituir código
cp -r rh-plus-temp/* /var/www/rh-plus/
cd /var/www/rh-plus

# 8. Iniciar nova versão
pm2 start ecosystem.config.js

# 9. Limpar pasta temporária
rm -rf rh-plus-temp

# 10. Verificar status
pm2 status
pm2 logs rh-plus --lines 20
```

#### **🔧 Verificação Pós-Deploy:**
```bash
# Verificar se aplicação está rodando
curl -I http://localhost:3001/health

# Verificar logs de erro
pm2 logs rh-plus --err

# Verificar conexão com banco
PGPASSWORD='12Nordeste34+' psql -h localhost -U rh_user -d rh -c "SELECT 1;"
```

---

### **🔄 3. ATUALIZAÇÕES E MANUTENÇÃO**

#### **📅 Rotina Diária:**
```bash
# Verificar logs da aplicação
pm2 logs rh-plus --lines 50

# Verificar espaço em disco
df -h

# Verificar uso de memória
free -h

# Verificar status do PostgreSQL
systemctl status postgresql

# Backup automático (já configurado)
ls -la /var/backups/postgresql/
```

#### **🔄 Comandos de Atualização:**

**Para atualizar o sistema:**
```bash
# Local - fazer alterações
cd "C:\Users\NL - NIT\Desktop\GG"
# ... fazer suas alterações ...
git add .
git commit -m "feat: descrição da alteração"
git push origin main

# VPS - aplicar atualizações
ssh root@147.93.10.11
cd /var/www/rh-plus
git pull origin main
pm2 restart rh-plus
```

#### **🔧 Comandos de Manutenção:**
```bash
# Reiniciar aplicação
pm2 restart rh-plus

# Parar aplicação
pm2 stop rh-plus

# Limpar logs
pm2 flush rh-plus

# Verificar performance
pm2 monit

# Backup manual
pg_dump -h localhost -U rh_user -d rh > backup-manual-$(date +%Y%m%d).sql
```

---

### **🌐 4. AMBIENTE DE PRODUÇÃO**

#### **📊 URLs de Acesso:**
```
Principal: https://rh.nordesteloc.cloud
Admin:    https://rh.nordesteloc.cloud/health
API:      https://rh.nordesteloc.cloud/api
Login:     https://rh.nordesteloc.cloud/login
```

#### **🔐 Credenciais de Produção:**
```
Banco de Dados:
- Host: localhost
- Porta: 5432
- Banco: rh
- Usuário: rh_user
- Senha: 12Nordeste34+

Aplicação:
- Domínio: rh.nordesteloc.cloud
- Porta: 3001 (interna)
- SSL: Let's Encrypt
- Process Manager: PM2
```

#### **📋 Monitoramento e Logs:**
```bash
# Status da aplicação
pm2 status

# Logs em tempo real
pm2 logs rh-plus

# Logs do sistema
tail -f /var/log/nginx/access.log

# Logs do PostgreSQL
tail -f /var/log/postgresql/postgresql-18-main.log

# Monitoramento de recursos
htop
```

---

### **🚨 5. SOLUÇÃO DE PROBLEMAS COMUNS**

#### **🔍 Problemas de Aplicação:**
```bash
# Se aplicação não responder
curl -I http://localhost:3001

# Se houver erro 500
pm2 logs rh-plus --lines 20

# Reiniciar aplicação
pm2 restart rh-plus
```

#### **🗄️ Problemas de Banco de Dados:**
```bash
# Testar conexão
PGPASSWORD='12Nordeste34+' psql -h localhost -U rh_user -d rh -c "SELECT 1;"

# Verificar se PostgreSQL está rodando
systemctl status postgresql

# Reiniciar PostgreSQL
systemctl restart postgresql
```

#### **🌐 Problemas de Rede/DNS:**
```bash
# Verificar se domínio está apontando
nslookup rh.nordesteloc.cloud

# Testar conectividade
ping 147.93.10.11

# Verificar configuração Nginx
nginx -t
systemctl reload nginx
```

---

### **📋 6. FLUXO DE TRABALHO RECOMENDADO**

#### **🔄 Semanal:**
1. **Segunda-feira:** Planejar mudanças da semana
2. **Terça-feira:** Desenvolver e testar localmente
3. **Quarta-feira:** Fazer deploy para homologação
4. **Quinta-feira:** Testes em produção
5. **Sexta-feira:** Correções e ajustes finais
6. **Sábado:** Manutenção e monitoramento
7. **Domingo:** Backup e documentação

#### **🎯 Metodologia:**
- **Desenvolver local** → **Testar completo** → **Commit claro** → **Push para GitHub** → **Deploy na VPS** → **Testar produção**

---

### **📚 7. DOCUMENTAÇÃO E REFERÊNCIAS**

#### **📖 Arquivos Importantes:**
- `dados-config/README.md` - Visão geral do projeto
- `dados-config/bancos/usuarios.md` - Credenciais de acesso
- `dados-config/deploy/scripts/deploy-rh-plus.sh` - Script de deploy automático
- `.env.example` - Template de configuração de ambiente

#### **🔗 Links Úteis:**
- **GitHub:** https://github.com/nit-a11y/rh-plus
- **VPS Painel:** https://hstgr.cloud:2083/
- **Documentação:** Esta pasta `dados-config/`
- **Ajuda PostgreSQL:** https://www.postgresql.org/docs/

---

### **💡 8. DICAS E BOAS PRÁTICAS**

#### **🎯 Commits Eficientes:**
- Use prefixos padrão: `feat:`, `fix:`, `docs:`, `perf:`, `refactor:`
- Descreva o que foi feito e porquê
- Um commit por funcionalidade/bug

#### **🔧 Segurança:**
- Nunca fazer commit com senhas ou dados sensíveis
- Usar branches para desenvolvimento (feature/nome-da-feature)
- Fazer pull requests para código em produção

#### **📦 Performance:**
- Monitorar tempo de resposta da API
- Usar cache sempre que possível
- Otimizar queries do banco de dados

#### **🔄 Backup:**
- Backup diário automático já configurado
- Backup manual antes de atualizações importantes
- Manter backup no GitHub (versionamento)

---

## 🎯 **PRÓXIMOS PASSOS**

1. **IMEDIATO:** Executar migração de dados do PostgreSQL local para VPS
2. **HOJE:** Fazer deploy completo do sistema RH+ na VPS
3. **AMANHÃ:** Configurar SSL no domínio rh.nordesteloc.cloud
4. **SEMANA:** Iniciar testes e ajustes finais

**Sistema RH+ v2.0.0 pronto para produção e escala!** 🚀

---

*Última atualização: 28/04/2026*  
*Status: Guia completa de deploy e atualizações*

# 🤖 PROMPT DE CONTEXTO - AGENTE IA DADOS-CONFIG

**Data:** 28/04/2026  
**Versão:** 1.0  
**Aplicação:** Todos os agentes IA que trabalham com dados-config

---

## 🎯 **CONTEXTUALIZAÇÃO OBRIGATÓRIA**

Você está trabalhando na pasta `dados-config/`, que contém **configurações de múltiplos sistemas em produção compartilhando a mesma infraestrutura**.

---

## 📊 **AMBIENTE MULTI-SISTEMA**

### **Sistemas em Produção**
- **Pesquisa Clima:** ✅ ONLINE - https://pesquisadeclima.nordesteloc.cloud
- **RH+:** 🔄 EM DEPLOY - https://rh.nordesteloc.cloud
- **POP/PRD/Matriz:** 📋 PLANEJADOS

### **Infraestrutura Compartilhada**
- **VPS:** 147.93.10.11 (Hostinger Ubuntu 24.04)
- **PostgreSQL:** Múltiplos bancos (rh, pesquisa_clima, etc.)
- **Nginx:** Múltiplos virtual hosts
- **PM2:** Múltiplos processos
- **SSL:** Múltiplos certificados Let's Encrypt

---

## 🚨 **REGRAS FUNDAMENTAIS - NÃO QUEBRAR!**

### **🔒 REGRA DE OURO: NÃO SOBRESCREVER**
```
PROIBIDO:
- Substituir arquivos existentes
- Alterar configurações de outros sistemas
- Assumir que é o único sistema

PERMITIDO:
- Adicionar novas configurações
- Complementar sistemas existentes
- Documentar alterações
- Criar backups
```

### **🔍 REGRA DE ANÁLISE: VERIFICAR SEMPRE**
```
OBRIGATÓRIO ANTES DE QUALQUER AÇÃO:
1. pm2 status (verificar processos ativos)
2. curl -s https://pesquisadeclima.nordesteloc.cloud/health
3. curl -s https://rh.nordesteloc.cloud/health
4. sudo -u postgres psql -l (verificar bancos)
5. sudo nginx -t (verificar Nginx)
```

### **📝 REGRA DE DOCUMENTAÇÃO: REGISTRAR TUDO**
```
OBRIGATÓRIO APÓS QUALQUER AÇÃO:
1. O que foi alterado?
2. Por que foi alterado?
3. Qual sistema foi afetado?
4. Como preservar outros sistemas?
```

---

## 🎯 **PROMPT PRINCIPAL (COPIAR E COLAR)**

```
# CONTEXTO OBRIGATÓRIO - DADOS-CONFIG MULTI-SISTEMA

Você está na pasta dados-config/, que gerencia MÚLTIPLOS SISTEMAS em produção:

🔥 SISTEMAS ATIVOS:
- Pesquisa Clima: ✅ ONLINE em https://pesquisadeclima.nordesteloc.cloud
- RH+: 🔄 EM DEPLOY em https://rh.nordesteloc.cloud
- Outros: 📋 Planejados (POP, PRD, Matriz)

🔥 INFRAESTRUTURA COMPARTILHADA:
- VPS: 147.93.10.11 (Ubuntu 24.04)
- PostgreSQL: Múltiplos bancos compartilhados
- Nginx: Múltiplos hosts virtuais
- PM2: Múltiplos processos ativos
- SSL: Múltiplos domínios certificados

🚨 REGRAS FUNDAMENTAIS:
1. NUNCA sobrescrever configurações existentes
2. SEMPRE verificar sistemas ativos antes de alterar
3. PRESERVAR configurações de outros sistemas
4. ADICIONAR apenas, nunca substituir
5. ISOLAR alterações por sistema

🔍 VERIFICAÇÕES OBRIGATÓRIAS ANTES DE AÇÃO:
- pm2 status (processos ativos)
- curl -s https://pesquisadeclima.nordesteloc.cloud/health
- curl -s https://rh.nordesteloc.cloud/health
- sudo -u postgres psql -l (bancos)
- sudo nginx -t (config Nginx)

📝 AÇÕES PERMITIDAS:
✅ Adicionar novas configurações na pasta do sistema específico
✅ Complementar sem substituir arquivos existentes
✅ Criar documentação específica do sistema
✅ Fazer backup antes de alterar
✅ Verificar impacto em outros sistemas

🚫 AÇÕES PROIBIDAS:
❌ Sobrescrever arquivos de outros sistemas
❌ Alterar configurações de infraestrutura compartilhada
❌ Modificar sistemas em produção sem verificação
❌ Assumir que é o único sistema na VPS
❌ Substituir configurações existentes

🎯 PERGUNTAS OBRIGATÓRIAS ANTES DE AÇÃO:
1. Qual sistema está sendo alterado?
2. Este sistema está em produção?
3. Quais outros sistemas podem ser afetados?
4. Como preservar configurações existentes?
5. Como isolar esta alteração?

📋 ESTRUTURA DE PASTAS:
- dados-config/sistemas/[nome]/ ← Configurações específicas do sistema
- dados-config/deploy/ ← Scripts de deploy (compartilhado)
- dados-config/bancos/ ← Configurações de bancos (compartilhado)
- dados-config/dominios/ ← DNS e SSL (compartilhado)
- dados-config/vps/ ← Infraestrutura (compartilhado)

🔄 PROCESSO SEGURO:
1. Identificar sistema atual
2. Verificar sistemas ativos
3. Fazer backup
4. Analisar impacto
5. Alterar de forma isolada
6. Validar todos os sistemas
7. Documentar alterações

⚠️ SE ALGO DER ERRADO:
- Parar imediatamente
- Restaurar do backup
- Verificar todos os sistemas
- Documentar o problema

AGUARDE INSTRUÇÕES ESPECÍFICAS DO USUÁRIO...
```

---

## 🎯 **PROMPTS ESPECÍFICOS POR SISTEMA**

### **Prompt para RH+**
```
# CONTEXTO ESPECÍFICO - SISTEMA RH+

🎯 SISTEMA: RH+ (Gestão de RH)
📁 PASTA: dados-config/sistemas/rh-plus/
🔗 URL: https://rh.nordesteloc.cloud
🗄️ BANCO: PostgreSQL (rh)
⚙️ PORTA: 3001
📊 STATUS: 🔄 EM DEPLOY

🔥 IMPACTO EM OUTROS SISTEMAS:
- Pesquisa Clima: Usa mesma VPS, portas diferentes
- Infraestrutura: Comparte PostgreSQL, Nginx, PM2, SSL

🚨 REGRAS ESPECÍFICAS:
1. Trabalhar apenas em dados-config/sistemas/rh-plus/
2. Não alterar configurações do Pesquisa Clima
3. Preservar PostgreSQL existente
4. Não modificar Nginx compartilhado
5. Verificar se Pesquisa Clima continua online após alterações

🔍 VERIFICAÇÕES ESPECÍFICAS:
- curl -s https://rh.nordesteloc.cloud/health
- curl -s https://pesquisadeclima.nordesteloc.cloud/health
- sudo -u postgres psql rh -c "SELECT 1;"
- pm2 status | grep rh-plus

📝 AÇÕES PERMITIDAS:
✅ Adicionar configurações em sistemas/rh-plus/
✅ Complementar deploy sem afetar outros sistemas
✅ Documentar especificamente para RH+

🚫 AÇÕES PROIBIDAS:
❌ Alterar configurações do Pesquisa Clima
❌ Modificar PostgreSQL compartilhado
❌ Sobrescrever Nginx existente
❌ Usar portas de outros sistemas
```

### **Prompt para Pesquisa Clima**
```
# CONTEXTO ESPECÍFICO - SISTEMA PESQUISA CLIMA

🎯 SISTEMA: Pesquisa Clima
📁 PASTA: dados-config/sistemas/pesquisa-clima/
🔗 URL: https://pesquisadeclima.nordesteloc.cloud
🗄️ BANCO: SQLite
⚙️ PORTA: 3000
📊 STATUS: ✅ ONLINE - NÃO TOCAR!

🚨 REGRAS EXTREMAS:
1. SISTEMA ESTÁ EM PRODUÇÃO - NÃO ALTERAR
2. NÃO MODIFICAR NENHUMA CONFIGURAÇÃO
3. NÃO SOBRESCREVER ARQUIVOS
4. PRESERVAR FUNCIONAMENTO EXISTENTE
5. QUALQUER ALTERAÇÃO PRECISA DE APROVAÇÃO EXPLÍCITA

🔥 IMPACTO CRÍTICO:
- Sistema está ONLINE e funcionando
- Usuários ativos usando o sistema
- Qualquer alteração pode afetar usuários reais

🚫 AÇÕES ABSOLUTAMENTE PROIBIDAS:
❌ MODIFICAR QUALQUER CONFIGURAÇÃO
❌ SOBRESCREVER ARQUIVOS
❌ ALTERAR BANCO DE DADOS
❌ MODIFICAR PORTAS OU DOMÍNIOS
❌ RESTARTAR SERVIÇOS

✅ AÇÕES PERMITIDAS (COM APROVAÇÃO):
✅ Ler configurações existentes
✅ Documentar estado atual
✅ Criar backups
✅ Sugerir melhorias (sem implementar)
```

### **Prompt para Infraestrutura Compartilhada**
```
# CONTEXTO ESPECÍFICO - INFRAESTRUTURA COMPARTILHADA

🎯 ÁREA: Infraestrutura Compartilhada
📁 PASTAS: dados-config/vps/, dados-config/bancos/, dados-config/dominios/
🔥 IMPACTO: AFETA TODOS OS SISTEMAS

🚨 REGRAS CRÍTICAS:
1. QUALQUER ALTERAÇÃO AFETA TODOS OS SISTEMAS
2. NÃO MODIFICAR SEM VERIFICAÇÃO COMPLETA
3. PRESERVAR FUNCIONAMENTO DE SISTEMAS ATIVOS
4. TESTAR IMPACTO EM TODOS OS SISTEMAS

🔥 SISTEMAS AFETADOS:
- Pesquisa Clima: ✅ ONLINE
- RH+: 🔄 EM DEPLOY
- Outros: 📋 PLANEJADOS

🔍 VERIFICAÇÕES OBRIGATÓRIAS:
- pm2 status (todos os processos)
- curl -s https://pesquisadeclima.nordesteloc.cloud/health
- curl -s https://rh.nordesteloc.cloud/health
- sudo -u postgres psql -l (todos os bancos)
- sudo nginx -t (todas as configurações)

📝 AÇÕES PERMITIDAS:
✅ Adicionar novas configurações sem substituir
✅ Complementar configurações existentes
✅ Criar documentação adicional
✅ Fazer backup completo antes de alterar

🚫 AÇÕES PROIBIDAS:
❌ Sobrescrever configurações existentes
❌ Modificar sistemas em produção
❌ Alterar portas ou domínios existentes
❌ Remover configurações de sistemas ativos
```

---

## 📋 **CHECKLIST DE SEGURANÇA PARA AGENTE**

### **Antes de Qualquer Ação**
- [ ] Identificar o sistema específico
- [ ] Verificar se está em produção
- [ ] Analisar impacto em outros sistemas
- [ ] Fazer backup completo
- [ ] Documentar plano de ação

### **Durante a Ação**
- [ ] Trabalhar apenas na pasta do sistema
- [ ] Adicionar sem substituir
- [ ] Monitorar outros sistemas
- [ ] Verificar impacto em tempo real

### **Após a Ação**
- [ ] Validar sistema alterado
- [ ] Verificar outros sistemas
- [ ] Documentar alterações
- [ ] Manter backup por 7 dias

---

## 🆘 **PROCEDIMENTO DE EMERGÊNCIA**

### **Se Algo Der Errado**
```
1. PARAR IMEDIATAMENTE
2. RESTAURAR DO BACKUP
3. VERIFICAR TODOS OS SISTEMAS
4. DOCUMENTAR O PROBLEMA
5. AGUARDAR INSTRUÇÕES
```

### **Comandos de Verificação**
```bash
# Verificar todos os sistemas
pm2 status
curl -s https://pesquisadeclima.nordesteloc.cloud/health
curl -s https://rh.nordesteloc.cloud/health
sudo -u postgres psql -l
sudo nginx -t
```

---

## ✅ **RESUMO DAS REGRAS**

1. **NUNCA** sobrescrever configurações existentes
2. **SEMPRE** verificar contexto multi-sistema
3. **SEMPRE** fazer backup antes de alterar
4. **SEMPRE** isolar alterações por sistema
5. **SEMPRE** documentar mudanças
6. **NUNCA** assumir que é o único sistema
7. **SEMPRE** preservar sistemas em produção

---

**Status:** ✅ Prompts configurados  
**Prioridade:** Máxima - Proteger sistemas existentes  
**Aplicação:** Todos os agentes IA que trabalham com dados-config

---

*Use estes prompts em todas as interações com dados-config/*

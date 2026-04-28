# 🔄 GUIA DE ATUALIZAÇÃO SEGURA - DADOS-CONFIG

**Data:** 28/04/2026  
**Status:** Regras para atualização sem conflitos  
**Prioridade:** Máxima - Não sobrescrever sistemas existentes

---

## 🎯 **OBJETIVO**

Este documento estabelece regras claras para atualizar a pasta `dados-config/` **sem sobrescrever** ou **interferir** nos sistemas já existentes em produção.

---

## 📋 **PRINCÍPIOS FUNDAMENTAIS**

### **1. NÃO SOBRESCREVER**
- ✅ **Preservar** configurações existentes
- ✅ **Adicionar** novas configurações sem substituir
- ✅ **Complementar** sistemas existentes
- ❌ **Nunca** substituir arquivos de sistemas ativos

### **2. CONTEXTO MULTI-SISTEMA**
- ✅ **Reconhecer** múltiplos sistemas convivendo
- ✅ **Respeitar** configurações de cada sistema
- ✅ **Isolar** alterações por sistema
- ❌ **Nunca** assumir que é o único sistema

### **3. ANÁLISE SEGURA**
- ✅ **Identificar** o sistema atual antes de alterar
- ✅ **Verificar** impactos em outros sistemas
- ✅ **Documentar** todas as mudanças
- ❌ **Nunca** alterar sem entender o contexto

---

## 🔍 **CONTEXTOS DE SISTEMAS**

### **Sistemas Atuais em Produção**
| Sistema | Status | Pasta | Banco | URL |
|---------|--------|-------|-------|-----|
| Pesquisa Clima | ✅ Online | `sistemas/pesquisa-clima/` | SQLite | https://pesquisadeclima.nordesteloc.cloud |
| RH+ | 🔄 Deploy | `sistemas/rh-plus/` | PostgreSQL | https://rh.nordesteloc.cloud |
| POP | 📋 Planejado | `sistemas/outros/` | PostgreSQL | - |
| PRD | 📋 Planejado | `sistemas/outros/` | PostgreSQL | - |
| Matriz | 📋 Planejado | `sistemas/outros/` | PostgreSQL | - |

### **Infraestrutura Compartilhada**
- **VPS:** 147.93.10.11 (Hostinger)
- **PostgreSQL:** Múltiplos bancos
- **Nginx:** Multiple virtual hosts
- **PM2:** Múltiplos processos
- **SSL:** Múltiplos domínios

---

## 🚨 **REGRAS DE OURO**

### **🔒 REGRA 1: VERIFICAR ANTES DE ALTERAR**
```bash
# SEMPRE verificar o sistema atual
pm2 status
systemctl status nginx
sudo -u postgres psql -l
```

### **🔒 REGRA 2: ISOLAR ALTERAÇÕES**
```bash
# Criar backup antes de qualquer alteração
cp -r dados-config dados-config-backup-$(date +%Y%m%d_%H%M%S)
```

### **🔒 REGRA 3: NÃO AFETAR OUTROS SISTEMAS**
```bash
# Verificar impacto em outros sistemas
curl -s https://pesquisadeclima.nordesteloc.cloud/health
curl -s https://rh.nordesteloc.cloud/health
```

### **🔒 REGRA 4: DOCUMENTAR MUDANÇAS**
```bash
# Registrar alterações
echo "$(date): Alteração no sistema X - Motivo: Y" >> dados-config/CHANGELOG.md
```

---

## 📝 **PROMPTS PARA AGENTE IA**

### **Prompt Principal de Contexto**
```
Você está trabalhando na pasta dados-config/, que contém configurações de MÚLTIPLOS SISTEMAS em produção.

CONTEXTOS ATUAIS:
- VPS: 147.93.10.11 (Hostinger)
- Sistemas ativos: Pesquisa Clima (online), RH+ (em deploy)
- Infraestrutura compartilhada: PostgreSQL, Nginx, PM2, SSL

REGRAS FUNDAMENTAIS:
1. NUNCA sobrescrever configurações de sistemas existentes
2. SEMPRE verificar se sistema está em produção antes de alterar
3. PRESERVAR configurações de outros sistemas
4. ADICIONAR apenas, nunca substituir
5. ISOLAR alterações por sistema

ANÁLISE OBRIGATÓRIA:
- Qual sistema está sendo alterado?
- Quais outros sistemas podem ser afetados?
- Como preservar as configurações existentes?

AÇÃO PERMITIDA:
- Adicionar novas configurações
- Complementar sistemas existentes
- Documentar alterações
- Criar backups

AÇÃO PROIBIDA:
- Sobrescrever arquivos existentes
- Alterar configurações de outros sistemas
- Assumir que é o único sistema
- Modificar sistemas em produção sem verificação
```

### **Prompt por Sistema**
```
SISTEMA: [NOME_DO_SISTEMA]
STATUS: [ATIVO/EM DEPLOY/PLANEJADO]
PASTA: dados-config/sistemas/[nome]/
IMPACTO: [quais outros sistemas podem ser afetados]

VERIFICAÇÕES OBRIGATÓRIAS:
1. Sistema está em produção?
2. Outros sistemas dependem desta configuração?
3. Como preservar configurações existentes?

AÇÕES PERMITIDAS:
- Adicionar novas configurações na pasta do sistema
- Complementar sem substituir
- Criar documentação específica

AÇÕES PROIBIDAS:
- Alterar configurações de outros sistemas
- Sobrescrever arquivos existentes
- Modificar infraestrutura compartilhada
```

---

## 🔄 **PROCESSO DE ATUALIZAÇÃO SEGURA**

### **ETAPA 1: ANÁLISE DE CONTEXTO**
```bash
# 1. Identificar sistemas ativos
pm2 status

# 2. Verificar saúde dos sistemas
curl -s https://pesquisadeclima.nordesteloc.cloud/health
curl -s https://rh.nordesteloc.cloud/health

# 3. Analisar infraestrutura
sudo -u postgres psql -l
sudo nginx -t
```

### **ETAPA 2: BACKUP DE SEGURANÇA**
```bash
# Backup completo
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp -r dados-config dados-config-backup-$TIMESTAMP

# Backup específico do sistema
cp -r dados-config/sistemas/[sistema] dados-config/sistemas/[sistema]-backup-$TIMESTAMP
```

### **ETAPA 3: ANÁLISE DE IMPACTO**
```bash
# Verificar dependências
grep -r "nome_do_sistema" dados-config/
grep -r "porta_do_sistema" dados-config/
grep -r "banco_do_sistema" dados-config/
```

### **ETAPA 4: ALTERAÇÃO CONTROLADA**
```bash
# Trabalhar apenas na pasta do sistema
cd dados-config/sistemas/[sistema]/

# Adicionar sem substituir
echo "nova_configuracao=valor" >> config.txt

# Verificar impacto
pm2 status
curl -s https://outro-sistema.com/health
```

### **ETAPA 5: VALIDAÇÃO**
```bash
# Testar sistema alterado
curl -s https://sistema-alterado.com/health

# Verificar outros sistemas
curl -s https://pesquisadeclima.nordesteloc.cloud/health
curl -s https://rh.nordesteloc.cloud/health

# Verificar infraestrutura
pm2 status
sudo nginx -t
```

---

## 📋 **CHECKLIST DE SEGURANÇA**

### **Antes de Qualquer Alteração**
- [ ] Backup completo criado
- [ ] Sistemas ativos identificados
- [ ] Impacto em outros sistemas analisado
- [ ] Configurações existentes preservadas
- [ ] Documentação preparada

### **Durante a Alteração**
- [ ] Trabalhando apenas na pasta do sistema
- [ ] Adicionando sem substituir
- [ ] Verificando impacto em tempo real
- [ ] Monitorando outros sistemas

### **Após a Alteração**
- [ ] Sistema alterado validado
- [ ] Outros sistemas verificados
- [ ] Infraestrutura testada
- [ ] Alterações documentadas
- [ ] Backup mantido por 7 dias

---

## 🆘 **PLANO DE ROLLBACK**

### **Se Algo Der Errado**
```bash
# 1. Parar alterações imediatamente
# 2. Restaurar do backup
cp -r dados-config-backup-[TIMESTAMP]/* dados-config/

# 3. Reiniciar serviços
pm2 restart all
sudo systemctl reload nginx

# 4. Verificar tudo
pm2 status
curl -s https://pesquisadeclima.nordesteloc.cloud/health
curl -s https://rh.nordesteloc.cloud/health
```

---

## 📞 **SUPORTE E MONITORAMENTO**

### **Logs de Alterações**
```bash
# Criar log de alterações
echo "$(date): [SISTEMA] [AÇÃO] [DETALHES]" >> dados-config/CHANGELOG.md
```

### **Monitoramento Contínuo**
```bash
# Verificar saúde geral
watch -n 30 'pm2 status && curl -s https://pesquisadeclima.nordesteloc.cloud/health && curl -s https://rh.nordesteloc.cloud/health'
```

---

## ✅ **RESUMO DAS REGRAS**

1. **NUNCA** sobrescrever configurações existentes
2. **SEMPRE** verificar contexto multi-sistema
3. **SEMPRE** fazer backup antes de alterar
4. **SEMPRE** isolar alterações por sistema
5. **SEMPRE** documentar mudanças
6. **SEMPRE** validar impacto em outros sistemas
7. **NUNCA** assumir que é o único sistema
8. **SEMPRE** preservar sistemas em produção

---

**Status:** ✅ Regras estabelecidas  
**Prioridade:** Máxima - Proteger sistemas existentes  
**Próximo:** Aplicar regras em todas as atualizações

---

*Última atualização: 28/04/2026*  
*Aplicável a: Todas as atualizações em dados-config/*  
*Responsável: Agentes IA e desenvolvedores*

# 📋 REGRAS DE ATUALIZAÇÃO - DADOS-CONFIG

**Data:** 28/04/2026  
**Status:** Regras oficiais para atualização segura  
**Aplicável:** Todas as atualizações em dados-config/

---

## 🚨 **REGRAS FUNDAMENTAIS (NÃO NEGOCIÁVEIS)**

### **1. NÃO SOBRESCREVER SISTEMAS EXISTENTES**
```
PROIBIDO:
- Substituir arquivos de sistemas ativos
- Alterar configurações de produção
- Assumir que é o único sistema

OBRIGATÓRIO:
- Preservar configurações existentes
- Adicionar sem substituir
- Respeitar sistemas em produção
```

### **2. VERIFICAR CONTEXTO MULTI-SISTEMA**
```
VERIFICAR SEMPRE:
- pm2 status (processos ativos)
- curl -s https://pesquisadeclima.nordesteloc.cloud/health
- curl -s https://rh.nordesteloc.cloud/health
- sudo -u postgres psql -l (bancos ativos)
- sudo nginx -t (configurações Nginx)
```

### **3. ISOLAR ALTERAÇÕES POR SISTEMA**
```
TRABALHAR APENAS EM:
- dados-config/sistemas/[nome]/ ← Config específicas
- dados-config/deploy/scripts/ ← Scripts (compartilhado)
- dados-config/migracao/scripts/ ← Scripts (compartilhado)

NÃO ALTERAR:
- Configurações de outros sistemas
- Infraestrutura compartilhada sem verificação
- Sistemas em produção sem aprovação
```

---

## 🎯 **SISTEMAS E SEUS STATUS**

### **Sistemas em Produção**
| Sistema | Status | Regras Especiais |
|---------|--------|----------------|
| Pesquisa Clima | ✅ ONLINE | **NÃO TOCAR** - Sistema crítico |
| RH+ | 🔄 EM DEPLOY | Cuidado com infraestrutura |
| POP/PRD/Matriz | 📋 PLANEJADOS | Pode configurar do zero |

### **Infraestrutura Compartilhada**
| Componente | Impacto | Regras |
|-----------|---------|--------|
| PostgreSQL | ALTO | Não alterar bancos existentes |
| Nginx | ALTO | Não sobrescrever configs |
| PM2 | ALTO | Não parar processos ativos |
| SSL | ALTO | Não modificar certificados |

---

## 📝 **PROCESSO DE ATUALIZAÇÃO SEGURA**

### **PASSO 1: ANÁLISE DE CONTEXTO**
```bash
# Identificar sistemas ativos
pm2 status

# Verificar saúde dos sistemas
curl -s https://pesquisadeclima.nordesteloc.cloud/health
curl -s https://rh.nordesteloc.cloud/health

# Analisar infraestrutura
sudo -u postgres psql -l
sudo nginx -t
```

### **PASSO 2: BACKUP OBRIGATÓRIO**
```bash
# Backup completo
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp -r dados-config dados-config-backup-$TIMESTAMP

# Backup específico se necessário
cp -r dados-config/sistemas/[sistema] dados-config/sistemas/[sistema]-backup-$TIMESTAMP
```

### **PASSO 3: ANÁLISE DE IMPACTO**
```bash
# Verificar dependências
grep -r "nome_do_sistema" dados-config/
grep -r "porta_do_sistema" dados-config/
grep -r "banco_do_sistema" dados-config/
```

### **PASSO 4: ALTERAÇÃO CONTROLADA**
```bash
# Trabalhar apenas na pasta do sistema
cd dados-config/sistemas/[sistema]/

# Adicionar sem substituir
echo "nova_configuracao=valor" >> config.txt

# Verificar impacto em tempo real
pm2 status
curl -s https://outro-sistema.com/health
```

### **PASSO 5: VALIDAÇÃO COMPLETA**
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

## 🚨 **REGRAS ESPECÍFICAS POR SISTEMA**

### **Pesquisa Clima (CRÍTICO - NÃO TOCAR)**
```
STATUS: ✅ ONLINE - SISTEMA CRÍTICO
REGRA: NÃO MODIFICAR NADA SEM APROVAÇÃO EXPLÍCITA

PERMITIDO:
✅ Ler configurações existentes
✅ Documentar estado atual
✅ Criar backups
✅ Sugerir melhorias (sem implementar)

PROIBIDO:
❌ MODIFICAR QUALQUER CONFIGURAÇÃO
❌ SOBRESCREVER ARQUIVOS
❌ ALTERAR BANCO DE DADOS
❌ MODIFICAR PORTAS OU DOMÍNIOS
```

### **RH+ (EM DEPLOY - CUIDADO)**
```
STATUS: 🔄 EM DEPLOY - SENSÍVEL
REGRA: TRABALHAR APENAS EM PASTA ESPECÍFICA

PERMITIDO:
✅ Adicionar configurações em sistemas/rh-plus/
✅ Complementar deploy sem afetar outros sistemas
✅ Documentar especificamente para RH+

PROIBIDO:
❌ Alterar configurações do Pesquisa Clima
❌ Modificar PostgreSQL compartilhado
❌ Sobrescrever Nginx existente
❌ Usar portas de outros sistemas
```

### **Sistemas Planejados (POP/PRD/Matriz)**
```
STATUS: 📋 PLANEJADOS - LIBERADO PARA CONFIG
REGRA: PODE CONFIGURAR DO ZERO

PERMITIDO:
✅ Criar configurações do zero
✅ Definir portas e bancos próprios
✅ Documentar completamente
✅ Preparar para deploy futuro

PROIBIDO:
❌ Usar recursos de outros sistemas
❌ Sobrescrever configurações existentes
❌ Modificar infraestrutura compartilhada
```

---

## 🔧 **REGRAS DE INFRAESTRUTURA COMPARTILHADA**

### **PostgreSQL**
```
REGRA: NÃO ALTERAR BANCOS EXISTENTES

PERMITIDO:
✅ Criar novos bancos
✅ Adicionar novos usuários
✅ Documentar configurações

PROIBIDO:
❌ Modificar bancos existentes
❌ Alterar senhas de usuários ativos
❌ Remover bancos ou tabelas existentes
```

### **Nginx**
```
REGRA: NÃO SOBRESCREVER CONFIGS EXISTENTES

PERMITIDO:
✅ Adicionar novos virtual hosts
✅ Complementar configurações
✅ Criar configs para novos sistemas

PROIBIDO:
❌ Sobrescrever configs existentes
❌ Modificar hosts de sistemas ativos
❌ Remover configurações de produção
```

### **PM2**
```
REGRA: NÃO PARAR PROCESSOS ATIVOS

PERMITIDO:
✅ Adicionar novos processos
✅ Iniciar novos sistemas
✅ Monitorar processos existentes

PROIBIDO:
❌ Parar processos ativos
❌ Reiniciar sistemas em produção sem motivo
❌ Remover configurações existentes
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

## 🆘 **PLANO DE EMERGÊNCIA**

### **Se Algo Der Errado**
```bash
# 1. Parar imediatamente
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

### **Comandos de Verificação**
```bash
# Verificar saúde geral
pm2 status
curl -s https://pesquisadeclima.nordesteloc.cloud/health
curl -s https://rh.nordesteloc.cloud/health
sudo -u postgres psql -l
sudo nginx -t
```

---

## 📊 **IMPACTO DE VIOLAÇÃO DAS REGRAS**

### **Se Sobrescrever Sistema Existente**
- ❌ Perda de configurações de produção
- ❌ Sistema pode parar de funcionar
- ❌ Usuários afetados
- ❌ Dados podem ser perdidos

### **Se Alterar Infraestrutura Compartilhada**
- ❌ Múltiplos sistemas afetados
- ❌ Downtime em cascata
- ❌ Recuperação complexa
- ❌ Perda de dados possível

---

## ✅ **RESUMO DAS REGRAS**

1. **NUNCA** sobrescrever configurações existentes
2. **SEMPRE** verificar contexto multi-sistema
3. **SEMPRE** fazer backup antes de alterar
4. **SEMPRE** isolar alterações por sistema
5. **SEMPRE** documentar mudanças
6. **NUNCA** assumir que é o único sistema
7. **SEMPRE** preservar sistemas em produção
8. **NUNCA** alterar sistemas críticos sem aprovação

---

**Status:** ✅ Regras estabelecidas e documentadas  
**Prioridade:** Máxima - Proteger sistemas existentes  
**Aplicação:** Obrigatória para todas as atualizações

---

*Qualquer violação dessas regras pode resultar em perda de dados e indisponibilidade de sistemas críticos.*

*Última atualização: 28/04/2026*

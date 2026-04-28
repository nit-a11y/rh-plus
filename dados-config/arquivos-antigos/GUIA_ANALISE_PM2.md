# 📊 Guia de Análise e Monitoramento - Pesquisa de Clima

> **Sistema:** Pesquisa de Clima Organizacional  
> **Domínio:** https://pesquisadeclima.nordesteloc.cloud  
> **Atualizado:** 08/04/2026

---

## 🖥️ Comandos PM2 - Monitoramento

### Status e Processos

```bash
# Ver status de todos os sistemas
pm2 status

# Monitorar em tempo real (CPU, memória)
pm2 monit

# Ver logs em tempo real
pm2 logs

# Ver logs de um sistema específico
pm2 logs pesquisa-clima

# Ver últimas 100 linhas de log
pm2 logs pesquisa-clima --lines 100
```

### Controle de Processos

```bash
# Iniciar sistema
pm2 start pesquisa-clima

# Reiniciar sistema
pm2 restart pesquisa-clima

# Parar sistema
pm2 stop pesquisa-clima

# Remover do PM2 (não apaga arquivos)
pm2 delete pesquisa-clima

# Salvar configuração atual
pm2 save

# Configurar inicialização automática
pm2 startup systemd
```

---

## 📈 Análise de Respostas da Pesquisa

### Acessar Dados via API

```bash
# Listar todas as respostas
curl https://pesquisadeclima.nordesteloc.cloud/api/responses

# Estatísticas agregadas
curl https://pesquisadeclima.nordesteloc.cloud/api/stats

# Health check
curl https://pesquisadeclima.nordesteloc.cloud/health
```

### Acessar Banco SQLite Diretamente (VPS)

```bash
# Instalar sqlite3 client
apt install -y sqlite3

# Acessar banco
cd /var/data/databases
sqlite3 pesquisa-clima.db

# Comandos SQL úteis
.tables                          # Listar tabelas
.schema survey_responses         # Ver estrutura
SELECT * FROM survey_responses;  # Ver todas as respostas
SELECT COUNT(*) FROM survey_responses;  # Contar respostas
.quit                            # Sair
```

### Exportar Dados

```bash
# Exportar para CSV (via sqlite3)
sqlite3 /var/data/databases/pesquisa-clima.db <<EOF
.headers on
.mode csv
.output /tmp/respostas.csv
SELECT * FROM survey_responses;
.quit
EOF

# Transferir para PC local
scp root@147.93.10.11:/tmp/respostas.csv ./
```

---

## 🔍 Logs e Diagnóstico

### Logs do Sistema (Node.js)

```bash
# Logs de saída
pm2 logs pesquisa-clima --out

# Logs de erro
pm2 logs pesquisa-clima --err

# Arquivos de log físicos
cat /var/log/pm2/pesquisa-clima-out.log
cat /var/log/pm2/pesquisa-clima-error.log
cat /root/.pm2/logs/pesquisa-clima-out.log
```

### Logs do Nginx

```bash
# Erros do Nginx
tail -f /var/log/nginx/error.log

# Acessos
tail -f /var/log/nginx/access.log

# Filtrar por domínio específico
grep "pesquisadeclima" /var/log/nginx/access.log
```

### Logs do Sistema Operacional

```bash
# Logs gerais do sistema
journalctl -xe

# Logs do PM2
journalctl -u pm2-root

# Uso de recursos
htop
free -h
df -h
du -sh /var/www/sistemas/*
```

---

## 📋 Checklist de Saúde do Sistema

Execute periodicamente:

```bash
# 1. Verificar se sistema está online
curl -s https://pesquisadeclima.nordesteloc.cloud/health | jq .

# 2. Status PM2
pm2 status

# 3. Testar banco de dados
sqlite3 /var/data/databases/pesquisa-clima.db "SELECT COUNT(*) FROM survey_responses;"

# 4. Verificar SSL (validade do certificado)
echo | openssl s_client -servername pesquisadeclima.nordesteloc.cloud -connect pesquisadeclima.nordesteloc.cloud:443 2>/dev/null | openssl x509 -noout -dates

# 5. Espaço em disco
df -h /var

# 6. Atualizações pendentes
apt list --upgradable
```

---

## 🚨 Troubleshooting Rápido

### Sistema Offline (502 Bad Gateway)

```bash
# Verificar se processo está rodando
pm2 status

# Se estiver "errored"
pm2 logs pesquisa-clima --lines 50

# Reiniciar
pm2 restart pesquisa-clima

# Verificar se porta está em uso
lsof -i :3000

# Se necessário, matar processo na porta
kill -9 $(lsof -t -i:3000)
pm2 restart pesquisa-clima
```

### Erro no Banco de Dados

```bash
# Verificar permissões
ls -la /var/data/databases/

# Ajustar permissões
chown -R root:root /var/data
chmod -R 755 /var/data

# Verificar espaço em disco
df -h

# Testar conexão
sqlite3 /var/data/databases/pesquisa-clima.db ".tables"
```

### Problemas de SSL/HTTPS

```bash
# Testar renovação
 certbot renew --dry-run

# Forçar renovação
certbot renew --force-renewal

# Verificar configuração Nginx
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

---

## 📊 Dashboard e Monitoramento

### PM2 Plus (Opcional - Web)

```bash
# Configurar monitoramento web (opcional)
pm2 plus

# Linkar conta
pm2 link <secret> <public>
```

### Scripts de Monitoramento Automático

**Criar `~/check-health.sh`:**

```bash
#!/bin/bash
# Script de verificação de saúde

HEALTH=$(curl -s https://pesquisadeclima.nordesteloc.cloud/health | grep -o '"status":"ok"')

if [ -z "$HEALTH" ]; then
    echo "$(date): Sistema offline!" >> /var/log/health-check.log
    pm2 restart pesquisa-clima
fi
```

**Agendar no cron:**

```bash
# Editar crontab
crontab -e

# Adicionar (verificar a cada 5 minutos)
*/5 * * * * /root/check-health.sh
```

---

## 💾 Backup e Restore

### Backup Automático do Banco

```bash
# Criar pasta de backups
mkdir -p /var/backups/pesquisa-clima

# Script de backup
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/data/databases/pesquisa-clima.db /var/backups/pesquisa-clima/backup_$DATE.db

# Manter apenas últimos 7 backups
ls -t /var/backups/pesquisa-clima/backup_*.db | tail -n +8 | xargs rm -f
```

### Backup do Código

```bash
# Criar backup do código
cd /var/www/sistemas
tar -czf /var/backups/pesquisa-clima-code-$(date +%Y%m%d).tar.gz pesquisa-clima/
```

### Restore do Banco

```bash
# Parar sistema
pm2 stop pesquisa-clima

# Restaurar backup
cp /var/backups/pesquisa-clima/backup_20250408_120000.db /var/data/databases/pesquisa-clima.db

# Iniciar sistema
pm2 start pesquisa-clima
```

---

## 🔗 Links e Recursos

| Recurso | URL/Comando |
|---------|-------------|
| **Sistema** | https://pesquisadeclima.nordesteloc.cloud |
| **GitHub** | https://github.com/nit-a11y/pesquisa-clima-vanilla |
| **VPS SSH** | `ssh root@147.93.10.11` |
| **PM2 Docs** | https://pm2.keymetrics.io/docs/usage/quick-start/ |
| **Certbot** | https://certbot.eff.org/ |

---

**Documento criado em:** 08/04/2026  
**Responsável:** NIT - Núcleo de Inteligência e Tecnologia

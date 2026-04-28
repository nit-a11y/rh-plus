#!/bin/bash

echo "🔍 DIAGNÓSTICO COMPLETO DA VPS - NIT SYSTEMS"
echo "============================================"
echo ""

echo "📊 INFORMAÇÕES DO SISTEMA:"
echo "---------------------------"
echo "Hostname: $(hostname)"
echo "IP Externo: $(curl -s ifconfig.me)"
echo "IP Interno: $(hostname -I | awk '{print $1}')"
echo "SO: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "Kernel: $(uname -r)"
echo "Uptime: $(uptime -p)"
echo ""

echo "💾 RECURSOS DO HARDWARE:"
echo "------------------------"
echo "CPU: $(nproc) cores"
echo "Memória Total: $(free -h | grep Mem | awk '{print $2}')"
echo "Memória Usada: $(free -h | grep Mem | awk '{print $3}')"
echo "Disco Total: $(df -h / | tail -1 | awk '{print $2}')"
echo "Disco Usado: $(df -h / | tail -1 | awk '{print $3}')"
echo "Disco Livre: $(df -h / | tail -1 | awk '{print $4}')"
echo ""

echo "🔥 SERVIÇOS RODANDO:"
echo "--------------------"
systemctl list-units --type=service --state=running | grep -E "(nginx|postgresql|pm2|node|apache|mysql)" | awk '{print $1 " | " $4 " | " $5}'
echo ""

echo "📦 SOFTWARE INSTALADO:"
echo "---------------------"
echo "Node.js: $(node -v 2>/dev/null || echo 'Não instalado')"
echo "NPM: $(npm -v 2>/dev/null || echo 'Não instalado')"
echo "PM2: $(pm2 -v 2>/dev/null || echo 'Não instalado')"
echo "PostgreSQL: $(psql --version 2>/dev/null || echo 'Não instalado')"
echo "Nginx: $(nginx -v 2>&1 | cut -d' ' -f3 2>/dev/null || echo 'Não instalado')"
echo "Git: $(git --version 2>/dev/null || echo 'Não instalado')"
echo ""

echo "🔌 PORTAS ABERTAS:"
echo "-----------------"
echo "Portas TCP em escuta:"
ss -tuln | grep LISTEN | awk '{print $5}' | cut -d':' -f2 | sort -n | tr '\n' ' '
echo ""
echo ""

echo "🗄️ BANCOS POSTGRESQL:"
echo "--------------------"
if command -v psql &> /dev/null; then
    echo "Bancos existentes:"
    sudo -u postgres psql -l | grep -E "^\s+\w+" | awk '{print $1}' | tr '\n' ' '
    echo ""
    echo "Usuários:"
    sudo -u postgres psql -c "SELECT usename FROM pg_user;" | grep -v "usename" | grep -v "\-\-\-\-" | grep -v "\(" | tr '\n' ' '
    echo ""
else
    echo "PostgreSQL não instalado"
fi
echo ""

echo "🌐 DOMÍNIOS CONFIGURADOS (NGINX):"
echo "---------------------------------"
if [ -d "/etc/nginx/sites-enabled" ]; then
    ls -la /etc/nginx/sites-enabled/ | grep -v "total" | awk '{print $9}' | grep -v "^$" | tr '\n' ' '
    echo ""
else
    echo "Nginx não configurado"
fi
echo ""

echo "🔒 FIREWALL UFW:"
echo "---------------"
ufw status verbose | head -20
echo ""

echo "📁 PASTAS IMPORTANTES:"
echo "---------------------"
echo "Projetos web:"
ls -la /var/www/ 2>/dev/null | head -10
echo ""
echo "Logs do sistema:"
ls -la /var/log/ | grep -E "(nginx|postgresql|pm2)" | head -10
echo ""

echo "🚀 APLICAÇÕES PM2:"
echo "-----------------"
if command -v pm2 &> /dev/null; then
    pm2 list 2>/dev/null || echo "PM2 não iniciado"
else
    echo "PM2 não instalado"
fi
echo ""

echo "📋 CERTIFICADOS SSL:"
echo "------------------"
if [ -d "/etc/letsencrypt/live" ]; then
    ls -la /etc/letsencrypt/live/ | grep -v "total" | awk '{print $9}' | grep -v "^$" | tr '\n' ' '
    echo ""
else
    echo "Nenhum certificado SSL encontrado"
fi
echo ""

echo "🔍 ÚLTIMOS LOGS (20 linhas):"
echo "----------------------------"
echo "System log:"
tail -20 /var/log/syslog 2>/dev/null | tail -5
echo ""
echo "Nginx error (se existir):"
tail -5 /var/log/nginx/error.log 2>/dev/null || echo "Sem log nginx"
echo ""

echo "✅ DIAGNÓSTICO CONCLUÍDO!"
echo "========================="
echo "Data: $(date)"
echo "Este diagnóstico foi salvo em: /tmp/diagnostico-vps-$(date +%Y%m%d).txt"

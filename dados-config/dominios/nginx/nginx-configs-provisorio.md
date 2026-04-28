# 🌐 NGINX - CONFIGURAÇÕES DOMÍNIOS PROVISÓRIOS

**Data:** 28/04/2026  
**Domínio:** nordesteloc.cloud  
**VPS:** 147.93.10.11  

---

## 📋 **CONFIGURAÇÕES ATIVAS**

### **Sistemas Configurados**
| Sistema | Domínio Provisório | Porta | Status |
|---------|-------------------|-------|--------|
| RH+ | rh.nordesteloc.cloud | 3001 | 🔄 Para configurar |
| Pesquisa Clima | pesquisadeclima.nordesteloc.cloud | 3000 | ✅ Ativo |
| Site Principal | nordesteloc.cloud | - | ✅ Ativo (externo) |

---

## 🔧 **CONFIGURAÇÃO NGINX - RH+**

### **Arquivo:** `/etc/nginx/sites-available/rh.nordesteloc.cloud`

```nginx
server {
    listen 80;
    server_name rh.nordesteloc.cloud;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rh.nordesteloc.cloud;
    
    # SSL será configurado pelo Certbot
    # ssl_certificate /etc/letsencrypt/live/rh.nordesteloc.cloud/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/rh.nordesteloc.cloud/privkey.pem;
    
    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains; preload" always;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts para uploads grandes
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
    
    # Limite de upload (50MB)
    client_max_body_size 50M;
}
```

---

## 🔧 **CONFIGURAÇÃO NGINX - PESQUISA CLIMA**

### **Arquivo:** `/etc/nginx/sites-available/pesquisadeclima.nordesteloc.cloud`

```nginx
server {
    listen 80;
    server_name pesquisadeclima.nordesteloc.cloud;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pesquisadeclima.nordesteloc.cloud;
    
    # SSL será configurado pelo Certbot
    # ssl_certificate /etc/letsencrypt/live/pesquisadeclima.nordesteloc.cloud/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/pesquisadeclima.nordesteloc.cloud/privkey.pem;
    
    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains; preload" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
    
    client_max_body_size 50M;
}
```

---

## 🚀 **SCRIPT DE CONFIGURAÇÃO AUTOMÁTICA**

### **Arquivo:** `/usr/local/bin/setup-nginx-provisorio.sh`

```bash
#!/bin/bash

# Configuração Nginx para domínios provisórios
echo "🌐 Configurando Nginx para domínios provisórios..."

# Criar configuração RH+
cat > /etc/nginx/sites-available/rh.nordesteloc.cloud << 'EOF'
server {
    listen 80;
    server_name rh.nordesteloc.cloud;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rh.nordesteloc.cloud;
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains; preload" always;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
    
    client_max_body_size 50M;
}
EOF

# Criar configuração Pesquisa Clima
cat > /etc/nginx/sites-available/pesquisadeclima.nordesteloc.cloud << 'EOF'
server {
    listen 80;
    server_name pesquisadeclima.nordesteloc.cloud;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pesquisadeclima.nordesteloc.cloud;
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains; preload" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
    
    client_max_body_size 50M;
}
EOF

# Ativar sites
ln -sf /etc/nginx/sites-available/rh.nordesteloc.cloud /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/pesquisadeclima.nordesteloc.cloud /etc/nginx/sites-enabled/

# Remover default se existir
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx

echo "✅ Nginx configurado para domínios provisórios!"
```

---

## 🔍 **COMANDOS DE GERENCIAMENTO**

### **Verificar Configurações**
```bash
# Testar configuração Nginx
nginx -t

# Verificar sites ativos
ls -la /etc/nginx/sites-enabled/

# Verificar configuração específica
cat /etc/nginx/sites-available/rh.nordesteloc.cloud
```

### **Logs Nginx**
```bash
# Logs de acesso
tail -f /var/log/nginx/rh.nordesteloc.cloud.access.log
tail -f /var/log/nginx/pesquisadeclima.nordesteloc.cloud.access.log

# Logs de erro
tail -f /var/log/nginx/error.log

# Logs gerais
journalctl -u nginx -f
```

### **Reiniciar e Recarregar**
```bash
# Testar e recarregar
nginx -t && systemctl reload nginx

# Reiniciar completo
systemctl restart nginx

# Verificar status
systemctl status nginx
```

---

## 🔒 **SSL LET'S ENCRYPT**

### **Instalação para Domínios Provisórios**
```bash
# SSL para RH+
certbot --nginx -d rh.nordesteloc.cloud --agree-tos --email nit@nordesteloc.com.br

# SSL para Pesquisa Clima
certbot --nginx -d pesquisadeclima.nordesteloc.cloud --agree-tos --email nit@nordesteloc.com.br

# SSL múltiplos ao mesmo tempo
certbot --nginx -d rh.nordesteloc.cloud -d pesquisadeclima.nordesteloc.cloud --agree-tos --email nit@nordesteloc.com.br

# Verificar renovação
certbot renew --dry-run
```

### **Verificar Certificados**
```bash
# Listar certificados
certbot certificates

# Verificar certificado específico
openssl x509 -in /etc/letsencrypt/live/rh.nordesteloc.cloud/cert.pem -text -noout

# Data de expiração
certbot certificates | grep 'Expiry Date'
```

---

## 🔄 **MIGRAÇÃO FUTURA (.cloud → .com.br)**

### **Script de Migração**
```bash
#!/bin/bash
# migrar-nginx-dominios.sh

echo "🔄 Migrando configurações Nginx .cloud → .com.br"

# Backup das configurações atuais
mkdir -p /etc/nginx/backup-$(date +%Y%m%d)
cp /etc/nginx/sites-available/*.cloud /etc/nginx/backup-$(date +%Y%m%d)/

# Criar novas configurações .com.br
for config in /etc/nginx/sites-available/*.cloud; do
    domain=$(basename "$config" .cloud)
    new_domain="$domain.nordesteloc.com.br"
    
    # Criar nova configuração
    sed "s/$domain\.nordesteloc\.cloud/$new_domain/g" "$config" > "/etc/nginx/sites-available/$new_domain"
    
    # Ativar nova configuração
    ln -sf "/etc/nginx/sites-available/$new_domain" /etc/nginx/sites-enabled/
    
    # Desativar antiga
    rm -f "/etc/nginx/sites-enabled/$domain.nordesteloc.cloud"
done

# Testar e reiniciar
nginx -t && systemctl restart nginx

echo "✅ Migração Nginx concluída!"
```

---

## 📊 **MONITORAMENTO**

### **Verificar Acesso**
```bash
# Testar acesso HTTP
curl -I http://rh.nordesteloc.cloud
curl -I http://pesquisadeclima.nordesteloc.cloud

# Testar acesso HTTPS
curl -I https://rh.nordesteloc.cloud
curl -I https://pesquisadeclima.nordesteloc.cloud

# Verificar redirecionamento
curl -L http://rh.nordesteloc.cloud
```

### **Status dos Sistemas**
```bash
# Verificar se aplicações respondem
curl http://localhost:3000/health
curl http://localhost:3001/health

# Verificar PM2
pm2 status

# Verificar portas
ss -tuln | grep -E ':(3000|3001|80|443)'
```

---

## ⚠️ **TROUBLESHOOTING**

### **Problemas Comuns**
```bash
# Nginx não inicia
nginx -t
tail -f /var/log/nginx/error.log

# 502 Bad Gateway
pm2 status
curl http://localhost:3001/health

# SSL não funciona
certbot certificates
systemctl restart nginx

# Domínio não resolve
nslookup rh.nordesteloc.cloud
dig rh.nordesteloc.cloud
```

### **Comandos de Emergência**
```bash
# Reset completo Nginx
systemctl stop nginx
rm -f /etc/nginx/sites-enabled/*
cp /etc/nginx/sites-available/default /etc/nginx/sites-enabled/
systemctl start nginx

# Restaurar backup
cp /etc/nginx/backup-20260428/* /etc/nginx/sites-available/
systemctl restart nginx
```

---

## ✅ **CHECKLIST FINAL**

### **Para cada sistema:**
- [ ] Configuração Nginx criada
- [ ] Site ativado
- [ ] SSL instalado
- [ ] HTTP → HTTPS redirecionando
- [ ] Aplicação respondendo
- [ ] Logs funcionando

### **Verificação final:**
```bash
# Testar tudo
curl -I https://rh.nordesteloc.cloud
curl -I https://pesquisadeclima.nordesteloc.cloud
pm2 status
nginx -t
```

---

*Última atualização: 28/04/2026*  
*Status: Configurações pronta para domínios provisórios*

# 💻 HARDWARE DA VPS - srv1566743.hstgr.cloud

**Data:** 28/04/2026  
**IP:** 147.93.10.11  
**Hostname:** srv1566743

---

## 📊 **ESPECIFICAÇÕES COMPLETAS**

### **Processador (CPU)**
- **Modelo:** Detectar com `lscpu`
- **Cores:** Multi-core (verificar exato)
- **Arquitetura:** x86_64
- **Threads:** Verificar com `nproc`

### **Memória RAM**
- **Total:** 7.8GB
- **Usada:** 622MB (8%)
- **Disponível:** 7.1GB
- **Swap:** 0B (não configurado)

### **Armazenamento**
- **Disco Principal:** /dev/sda1
- **Capacidade Total:** 96GB
- **Usado:** 2.6GB (3%)
- **Livre:** 94GB
- **Filesystem:** ext4

### **Partições**
```
/dev/sda1        96G  2.6G   94G   3% /
tmpfs           795M  1.1M  794M   1% /run
/dev/sda16      881M  117M  703M  15% /boot
/dev/sda15      105M  6.2M   99M   6% /boot/efi
tmpfs           3.9G     0  3.9G   0% /dev/shm
```

### **Rede**
- **IPv4:** 147.93.10.11
- **IPv6:** 2a02:4780:14:fa9f::1
- **Interface:** eth0
- **Gateway:** Detectar com `ip route`

### **Sistema Operacional**
- **Distribuição:** Ubuntu 24.04.4 LTS
- **Kernel:** 6.8.0-107-generic
- **Arquitetura:** 64-bit
- **Virtualização:** KVM

---

## 🔍 **COMANDOS PARA VERIFICAÇÃO**

```bash
# CPU detalhada
lscpu
cat /proc/cpuinfo

# Memória detalhada
free -h
cat /proc/meminfo

# Disco detalhado
df -h
lsblk
fdisk -l

# Rede detalhada
ip addr show
ip route show
ethtool eth0

# Sistema
uname -a
cat /etc/os-release
lshw
```

---

## 📈 **PERFORMANCE ATUAL**

### **Uso de Recursos**
- **CPU Load:** 0.0 (baixo)
- **Memória:** 8% (ótimo)
- **Disco:** 3% (excelente)
- **Processos:** 115 rodando

### **Temperatura** (se disponível)
```bash
sensors
cat /sys/class/thermal/thermal_zone*/temp
```

---

## 💡 **RECOMENDAÇÕES**

### **Para Sistemas Atuais**
- ✅ **Performance:** Excelente para múltiplos sistemas Node.js
- ✅ **Memória:** Suficiente para PostgreSQL + 4-5 sistemas
- ✅ **Disco:** Amplo para projetos e backups

### **Para Expansão Futura**
- **Swap:** Configurar 2GB para segurança
- **Monitoramento:** Instalar htop, iotop
- **Backup:** Configurar backup para disco externo

---

## ⚠️ **LIMITES E CONSIDERAÇÕES**

### **Capacidade**
- **Sistemas Node.js:** 5-10 simultâneos
- **PostgreSQL:** 3-4 bancos médios
- **Conexões:** ~100 simultâneas

### **Recursos por Sistema**
- **Node.js:** ~50-100MB RAM cada
- **PostgreSQL:** ~200-500MB RAM
- **Nginx:** ~10-20MB RAM

---

## 🔄 **MONITORAMENTO**

### **Scripts Úteis**
```bash
# Monitor em tempo real
watch -n 1 'free -h && df -h && ps aux --sort=-%cpu | head -10'

# Top processos
htop
top

# Uso de disco por pasta
du -sh /var/www/*
du -sh /var/log/*
```

---

*Última atualização: 28/04/2026*  
*Status: Hardware verificado*

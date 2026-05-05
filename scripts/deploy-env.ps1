# ==========================================
# 🚀 SCRIPT DEPLOY AMBIENTES - RH+ SISTEMA
# PowerShell - Windows para VPS Ubuntu
# ==========================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "test", "production")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [string]$VpsIP = "147.93.10.11",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBackup
)

Write-Host "🚀 Iniciando deploy para ambiente: $Environment" -ForegroundColor Green

# Configurações
$EnvFile = ".env.$Environment"
$RemotePath = "/root/rh-plus"
$BackupPath = "/root/backups"

# Verificar se arquivo de ambiente existe
if (-not (Test-Path $EnvFile)) {
    Write-Host "❌ Arquivo $EnvFile não encontrado!" -ForegroundColor Red
    Write-Host "📝 Crie o arquivo com base em $EnvFile.example" -ForegroundColor Yellow
    exit 1
}

# Backup do ambiente atual (se não for pulado)
if (-not $SkipBackup -and $Environment -eq "production") {
    Write-Host "💾 Criando backup do ambiente atual..." -ForegroundColor Blue
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupName = "env_backup_$Timestamp.tar.gz"
    
    ssh root@$VpsIP "cd $RemotePath && tar -czf $BackupPath/$BackupName .env.* 2>/dev/null || echo 'Sem arquivos .env para backup'"
    Write-Host "✅ Backup criado: $BackupName" -ForegroundColor Green
}

# Upload do arquivo de ambiente
Write-Host "📤 Enviando $EnvFile para VPS..." -ForegroundColor Blue
scp $EnvFile root@$VpsIP:$RemotePath/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao enviar arquivo!" -ForegroundColor Red
    exit 1
}

# Configurar permissões e restart
Write-Host "⚙️ Configurando ambiente na VPS..." -ForegroundColor Blue

ssh root@$VpsIP @"
cd $RemotePath

# Parar PM2
pm2 stop rh-plus || echo 'App não estava rodando'

# Backup do .env atual (se existir)
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Criar link simbólico para o ambiente correto
rm -f .env
ln -s $EnvFile .env

# Verificar configuração
echo "🔍 Verificando configuração:"
echo "Ambiente: \$(grep NODE_ENV .env)"
echo "Database: \$(grep DB_NAME .env)"

# Restart PM2
pm2 restart rh-plus || pm2 start backend/server.js --name rh-plus

# Status
pm2 status
pm2 logs rh-plus --lines 10
"@

Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "🌐 Ambiente $Environment configurado e restart realizado" -ForegroundColor Cyan

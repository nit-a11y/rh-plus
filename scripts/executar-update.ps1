# PowerShell Script para executar atualização VPS
# Uso: .\scripts\executar-update.ps1

Write-Host "==========================================" -ForegroundColor Green
Write-Host "Atualização RH+ - VPS PostgreSQL + Deploy" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "scripts\update-vps-database-and-deploy.sh")) {
    Write-Host "ERRO: Script não encontrado em scripts\update-vps-database-and-deploy.sh" -ForegroundColor Red
    Write-Host "Execute este script a partir da raiz do projeto (c:\Users\NL - NIT\Desktop\GG)" -ForegroundColor Red
    exit 1
}

# Verificar se Git Bash está disponível
$gitBashPath = "C:\Program Files\Git\bin\bash.exe"
if (-not (Test-Path $gitBashPath)) {
    Write-Host "ERRO: Git Bash não encontrado em $gitBashPath" -ForegroundColor Red
    Write-Host "Instale Git for Windows ou verifique o caminho" -ForegroundColor Red
    exit 1
}

Write-Host "Verificando conexão SSH com VPS..." -ForegroundColor Yellow

# Testar conexão SSH
$sshTest = & $gitBashPath -c "ssh -o ConnectTimeout=10 -o BatchMode=yes root@147.93.10.11 'echo SSH OK'" 2>$null
if ($sshTest -ne "SSH OK") {
    Write-Host "ERRO: Não foi possível conectar via SSH à VPS 147.93.10.11" -ForegroundColor Red
    Write-Host "Verifique:" -ForegroundColor Yellow
    Write-Host "1. Se sua chave SSH está configurada" -ForegroundColor Yellow
    Write-Host "2. Se a VPS está acessível" -ForegroundColor Yellow
    Write-Host "3. Se você tem permissão de acesso" -ForegroundColor Yellow
    exit 1
}

Write-Host "Conexão SSH OK!" -ForegroundColor Green
Write-Host ""

Write-Host "Iniciando script de atualização..." -ForegroundColor Yellow
Write-Host ""

# Executar o script bash
try {
    & $gitBashPath -c "./scripts/update-vps-database-and-deploy.sh"
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "Processo concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Acessos:" -ForegroundColor Cyan
    Write-Host "- Sistema: https://rh.nordesteloc.cloud" -ForegroundColor Cyan
    Write-Host "- Health: https://rh.nordesteloc.cloud/health" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Comandos úteis:" -ForegroundColor Cyan
    Write-Host "- PM2 status: ssh root@147.93.10.11 'pm2 status'" -ForegroundColor Gray
    Write-Host "- Logs: ssh root@147.93.10.11 'pm2 logs rh-plus'" -ForegroundColor Gray
    Write-Host "- Banco: ssh root@147.93.10.11 'sudo -u postgres psql rh'" -ForegroundColor Gray
    Write-Host "==========================================" -ForegroundColor Green
    
} catch {
    Write-Host "ERRO durante execução:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

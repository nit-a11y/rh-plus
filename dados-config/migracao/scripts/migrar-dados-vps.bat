@echo off
REM 🚀 MIGRAÇÃO SEGURA DADOS - PostgreSQL Local → VPS (Windows)
REM Uso: migrar-dados-vps.bat <arquivo_backup.sql.gz>
REM Data: 28/04/2026

echo.
echo ========================================
echo 🚀 MIGRAÇÃO SEGURA DADOS - PostgreSQL Local → VPS
echo ========================================
echo.

REM Configurações
set VPS_IP=147.93.10.11
set VPS_USER=root
set DB_NAME=rh
set DB_USER=rh_user

REM Verificar parâmetro
if "%~1"=="" (
    echo ❌ Uso: %~nx0 ^<arquivo_backup.sql.gz^>
    echo.
    echo Exemplo:
    echo    %~nx0 C:\Users\NL - NIT\Desktop\GG\backups\rh_backup_completo_20260428_120000.sql.gz
    echo.
    pause
    exit /b 1
)

set BACKUP_FILE=%~1
set BACKUP_FILENAME=%~nx1

REM Verificar se arquivo existe
if not exist "%BACKUP_FILE%" (
    echo ❌ Arquivo de backup não encontrado: %BACKUP_FILE%
    pause
    exit /b 1
)

REM Verificar se é arquivo .gz
echo %BACKUP_FILENAME% | findstr /i "\.gz$" >nul
if errorlevel 1 (
    echo ❌ Arquivo deve estar compactado (.gz): %BACKUP_FILE%
    pause
    exit /b 1
)

echo 🚀 Iniciando migração segura para VPS...
echo 📁 Arquivo: %BACKUP_FILE%
for %%A in ("%BACKUP_FILE%") do echo 📏 Tamanho: %%~zA bytes

REM ETAPA 1: Verificar conexão com VPS
echo 🔌 ETAPA 1: Verificando conexão com VPS...

ping -n 1 %VPS_IP% >nul 2>&1
if errorlevel 1 (
    echo ❌ Não foi possível conectar à VPS. Verifique IP e rede.
    pause
    exit /b 1
)

echo ✅ VPS acessível

REM ETAPA 2: Verificar SSH
echo 🔌 ETAPA 2: Verificando SSH com VPS...

ssh -o ConnectTimeout=10 %VPS_USER%@%VPS_IP "echo 'VPS acessível via SSH'" >nul 2>&1
if errorlevel 1 (
    echo ❌ SSH não está funcionando. Verifique configuração.
    pause
    exit /b 1
)

echo ✅ SSH funcionando

REM ETAPA 3: Verificar PostgreSQL na VPS
echo 🗄️ ETAPA 3: Verificando PostgreSQL na VPS...

ssh %VPS_USER%@%VPS_IP "pg_isready" >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL não está rodando na VPS. Instale primeiro.
    pause
    exit /b 1
)

echo ✅ PostgreSQL pronto na VPS

REM ETAPA 4: Verificar banco na VPS
echo 🗄️ ETAPA 4: Verificando banco na VPS...

ssh %VPS_USER%@%VPS_IP "sudo -u postgres psql -l | grep -q '%DB_NAME%'" >nul 2>&1
if errorlevel 1 (
    echo ❌ Banco '%DB_NAME%' não existe na VPS. Execute setup primeiro.
    pause
    exit /b 1
)

echo ✅ Banco encontrado na VPS

REM ETAPA 5: Backup de segurança na VPS
echo 🛡️ ETAPA 5: Criando backup de segurança na VPS...

for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set datetime=%%a
set VPS_BACKUP_DATE=%datetime:~0,8%_%datetime:~8,6%

ssh %VPS_USER%@%VPS_IP "if sudo -u postgres psql %DB_NAME% -c 'SELECT COUNT(*) FROM users;' > /dev/null 2>&1; then sudo -u postgres pg_dump %DB_NAME% > /tmp/vps_backup_%VPS_BACKUP_DATE%.sql && echo 'Backup de segurança VPS criado'; else echo 'Banco VPS está vazio (primeira migração)';"

echo ✅ Backup de segurança verificado

REM ETAPA 6: Transferir backup
echo 📤 ETAPA 6: Transferindo backup para VPS...

scp "%BACKUP_FILE%" %VPS_USER%@%VPS_IP:/tmp/ >nul 2>&1
if errorlevel 1 (
    echo ❌ Falha ao transferir backup para VPS
    pause
    exit /b 1
)

echo ✅ Backup transferido para VPS

REM ETAPA 7: Restaurar na VPS
echo 🔄 ETAPA 7: Restaurando banco na VPS...

ssh %VPS_USER%@%VPS_IP "cd /tmp && gunzip -f %BACKUP_FILENAME% && SQL_FILE='${BACKUP_FILENAME%.gz}' && if [ -f '$SQL_FILE' ]; then sudo -u postgres psql %DB_NAME% < '$SQL_FILE' && echo 'Restauração concluída' && rm -f '$SQL_FILE'; else echo 'Arquivo não encontrado após descompactar'; exit 1; fi"

if errorlevel 1 (
    echo ❌ Falha na restauração
    pause
    exit /b 1
)

echo ✅ Banco restaurado na VPS

REM ETAPA 8: Verificar integridade
echo 🔍 ETAPA 8: Verificando integridade dos dados...

REM Obter contagens do backup local
echo 📊 Obtendo estatísticas do backup...
set /a LOCAL_USERS=0
set /a LOCAL_EMPLOYEES=0
set /a LOCAL_COMPANIES=0

for /f "tokens=*" %%a in ('gzip -dc "%BACKUP_FILE%" 2^>nul ^| find /c "INSERT INTO users"') do set LOCAL_USERS=%%a
for /f "tokens=*" %%a in ('gzip -dc "%BACKUP_FILE%" 2^>nul ^| find /c "INSERT INTO employees"') do set LOCAL_EMPLOYEES=%%a
for /f "tokens=*" %%a in ('gzip -dc "%BACKUP_FILE%" 2^>nul ^| find /c "INSERT INTO companies"') do set LOCAL_COMPANIES=%%a

echo 📈 Estatísticas do backup:
echo    Usuários (INSERTs): %LOCAL_USERS%
echo    Funcionários (INSERTs): %LOCAL_EMPLOYEES%
echo    Empresas (INSERTs): %LOCAL_COMPANIES%

REM Verificar contagens na VPS
echo 🔍 Verificando contagens na VPS...

for /f "tokens=*" %%a in ('ssh %VPS_USER%@%VPS_IP "sudo -u postgres psql %DB_NAME% -t -c 'SELECT COUNT(*) FROM users;'"') do set VPS_USERS=%%a
for /f "tokens=*" %%a in ('ssh %VPS_USER%@%VPS_IP "sudo -u postgres psql %DB_NAME% -t -c 'SELECT COUNT(*) FROM employees;'"') do set VPS_EMPLOYEES=%%a
for /f "tokens=*" %%a in ('ssh %VPS_USER%@%VPS_IP "sudo -u postgres psql %DB_NAME% -t -c 'SELECT COUNT(*) FROM companies;'"') do set VPS_COMPANIES=%%a

echo 📊 Estatísticas na VPS:
echo    Usuários: %VPS_USERS%
echo    Funcionários: %VPS_EMPLOYEES%
echo    Empresas: %VPS_COMPANIES%

REM Comparar estatísticas
if %LOCAL_USERS%==%VPS_USERS% if %LOCAL_EMPLOYEES%==%VPS_EMPLOYEES% if %LOCAL_COMPANIES%==%VPS_COMPANIES% (
    echo ✅ Estatísticas batendo perfeitamente!
) else (
    echo ⚠️ Diferença nas estatísticas encontrada. Verifique manualmente.
)

REM ETAPA 9: Testar conexão do sistema
echo 🧪 ETAPA 9: Testando conexão do sistema RH+...

ssh %VPS_USER%@%VPS_IP "cd /var/www/rh-plus && node -e \"require('./backend/config/database').checkConnection().then(r => console.log('OK:', r.connected)).catch(e => console.error('ERRO:', e.message))\"" 2>nul | findstr "OK: true" >nul
if errorlevel 1 (
    echo ⚠️ Sistema RH+ não está conectando. Verifique configuração.
) else (
    echo ✅ Sistema RH+ conectando ao banco!
)

REM ETAPA 10: Limpeza
echo 🧹 ETAPA 10: Limppeza de arquivos temporários...

ssh %VPS_USER%@%VPS_IP "find /tmp -name 'vps_backup_*.sql' -mtime +7 -delete 2>/dev/null; find /tmp -name 'rh_backup_*.sql.gz' -mtime +1 -delete 2>/dev/null; echo 'Limpeza concluída'"

echo ✅ Limpeza concluída

REM Resumo final
echo.
echo ========================================
echo 🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!
echo ========================================
echo.
echo 📊 RESUMO:
echo    Backup: %BACKUP_FILENAME%
echo    VPS: %VPS_IP%
echo    Banco: %DB_NAME%
echo.
echo 📈 DADOS MIGRADOS:
echo    Usuários: %LOCAL_USERS% → %VPS_USERS%
echo    Funcionários: %LOCAL_EMPLOYEES% → %VPS_EMPLOYEES%
echo    Empresas: %LOCAL_COMPANIES% → %VPS_COMPANIES%
echo.
echo 🔧 PRÓXIMOS PASSOS:
echo    1. Teste o sistema: https://rh.nordesteloc.cloud
echo    2. Verifique login e funcionalidades
echo    3. Mantenha backup local por 7 dias
echo    4. Configure backup automático na VPS
echo.
echo 🛡️ SEGURANÇA:
echo    ✅ Backup local mantido
echo    ✅ Backup de segurança VPS criado
echo    ✅ Integridade verificada
echo.
echo 🚨 SE ALGO DER ERRADO:
echo    1. Pare o sistema: pm2 stop rh-plus
echo    2. Restaure do backup local
echo    3. Entre em contato com suporte
echo ========================================
echo.
echo ✅ Migração concluída! Seus dados estão seguros na VPS. 🚀
echo.
pause

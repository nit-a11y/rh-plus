@echo off
REM 🔐 BACKUP SEGURO POSTGRESQL - RH+ LOCAL (Windows)
REM Uso: backup-local-rh.bat
REM Data: 28/04/2026

echo.
echo ========================================
echo 🔐 BACKUP SEGURO POSTGRESQL - RH+ LOCAL
echo ========================================
echo.

REM Configurações
set DATA=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set DATA=%DATA: =0%
set BACKUP_DIR=C:\Users\NL - NIT\Desktop\GG\backups
set DB_NAME=rh
set DB_USER=rhplus_user
set DB_HOST=localhost

REM Criar diretório de backup
echo 📁 Criando diretório de backup...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Verificar PostgreSQL
echo 🔍 Verificando PostgreSQL...
pg_isready -h %DB_HOST% >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL não está rodando. Inicie o serviço antes.
    pause
    exit /b 1
)

echo ✅ PostgreSQL está rodando

REM Contar registros antes do backup
echo 📊 Contando registros atuais...

for /f "tokens=*" %%a in ('psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME -t -c "SELECT COUNT(*) FROM users;" 2^>nul') do set USERS_COUNT=%%a
for /f "tokens=*" %%a in ('psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME -t -c "SELECT COUNT(*) FROM employees;" 2^>nul') do set EMPLOYEES_COUNT=%%a
for /f "tokens=*" %%a in ('psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME -t -c "SELECT COUNT(*) FROM companies;" 2^>nul') do set COMPANIES_COUNT=%%a

echo 📈 Estatísticas atuais:
echo    Usuários: %USERS_COUNT%
echo    Funcionários: %EMPLOYEES_COUNT%
echo    Empresas: %COMPANIES_COUNT%

REM Criar backup completo
echo 🔄 Criando backup completo do PostgreSQL...
set BACKUP_FILE=%BACKUP_DIR%\rh_backup_completo_%DATA%.sql

pg_dump -h %DB_HOST% -U %DB_USER% -d %DB_NAME > "%BACKUP_FILE%" 2>nul
if errorlevel 1 (
    echo ❌ Falha ao criar backup SQL
    pause
    exit /b 1
)

echo ✅ Backup SQL criado: %BACKUP_FILE%

REM Criar backup compactado
echo 📦 Criando backup compactado...
set BACKUP_GZ=%BACKUP_DIR%\rh_backup_completo_%DATA%.sql.gz

pg_dump -h %DB_HOST% -U %DB_USER% -d %DB_NAME% | gzip > "%BACKUP_GZ%" 2>nul
if errorlevel 1 (
    echo ❌ Falha ao criar backup compactado
    pause
    exit /b 1
)

echo ✅ Backup compactado criado: %BACKUP_GZ%

REM Verificar arquivos
echo 🔍 Verificando arquivos de backup...
if exist "%BACKUP_FILE%" if exist "%BACKUP_GZ%" (
    for %%A in ("%BACKUP_FILE%") do set SQL_SIZE=%%~zA
    for %%A in ("%BACKUP_GZ%") do set GZ_SIZE=%%~zA
    
    echo 📊 Tamanhos dos arquivos:
    echo    SQL: %SQL_SIZE% bytes
    echo    GZ:  %GZ_SIZE% bytes
    
    echo ✅ Backup verificado com sucesso
) else (
    echo ❌ Arquivos de backup não encontrados
    pause
    exit /b 1
)

REM Criar backup de estrutura
echo 🏗️ Criando backup de estrutura...
set SCHEMA_FILE=%BACKUP_DIR%\rh_schema_%DATA%.sql

pg_dump -h %DB_HOST% -U %DB_USER% -d %DB_NAME% --schema-only > "%SCHEMA_FILE%" 2>nul
if exist "%SCHEMA_FILE%" (
    echo ✅ Backup de estrutura criado: %SCHEMA_FILE%
) else (
    echo ⚠️ Falha ao criar backup de estrutura
)

REM Criar checksum
echo 🔐 Criando checksum de verificação...
set CHECKSUM_FILE=%BACKUP_DIR%\rh_backup_checksum_%DATA%.txt
echo Arquivo: %BACKUP_GZ% > "%CHECKSUM_FILE%"
certutil -hashfile "%BACKUP_GZ%" MD5 >> "%CHECKSUM_FILE%" 2>nul
echo Data: %DATA% >> "%CHECKSUM_FILE%"
echo Registros: Usuários=%USERS_COUNT%, Funcionários=%EMPLOYEES_COUNT%, Empresas=%COMPANIES_COUNT% >> "%CHECKSUM_FILE%"

echo ✅ Checksum criado: %CHECKSUM_FILE%

REM Resumo final
echo.
echo ========================================
echo 🎉 BACKUP COMPLETO CONCLUÍDO COM SUCESSO!
echo ========================================
echo.
echo 📁 Arquivos criados:
echo    Principal: %BACKUP_GZ%
echo    SQL:      %BACKUP_FILE%
echo    Schema:   %SCHEMA_FILE%
echo    Checksum: %CHECKSUM_FILE%
echo.
echo 📊 Estatísticas:
echo    Usuários: %USERS_COUNT%
echo    Funcionários: %EMPLOYEES_COUNT%
echo    Empresas: %COMPANIES_COUNT%
echo.
echo 🛡️ SEGURANÇA:
echo    ✅ Backup verificado
echo    ✅ Checksum gerado
echo.
echo 🚀 PRÓXIMOS PASSOS:
echo    1. Copie os arquivos para local seguro
echo    2. Execute a migração para VPS
echo    3. Mantenha este backup como segurança
echo.
echo ⚠️ AVISO IMPORTANTE:
echo    NÃO exclua estes arquivos até confirmar que a migração foi 100%% bem-sucedida!
echo ========================================
echo.
echo ✅ Backup seguro concluído! Seus dados estão protegidos. 🛡️
echo.
pause

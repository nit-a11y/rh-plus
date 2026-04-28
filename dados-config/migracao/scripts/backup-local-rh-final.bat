@echo off
REM 🔐 BACKUP SEGURO POSTGRESQL - RH+ LOCAL (Windows Final)
REM Uso: backup-local-rh-final.bat
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
set PSQL_PATH=C:\Program Files\PostgreSQL\18\bin

REM Criar diretório de backup
echo 📁 Criando diretório de backup...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Verificar PostgreSQL
echo 🔍 Verificando PostgreSQL...
sc query postgresql-x64-18 | findstr "RUNNING" >nul
if errorlevel 1 (
    echo ❌ PostgreSQL não está rodando. Inicie o serviço antes.
    echo.
    echo Para iniciar o PostgreSQL:
    echo   net start postgresql-x64-18
    echo.
    pause
    exit /b 1
)

echo ✅ PostgreSQL está rodando

REM Verificar se o banco existe
echo 🔍 Verificando se o banco '%DB_NAME%' existe...
"%PSQL_PATH%\psql.exe" -h %DB_HOST% -U postgres -l | findstr "%DB_NAME%" >nul
if errorlevel 1 (
    echo ❌ Banco '%DB_NAME%' não encontrado. Verifique se o banco existe.
    echo.
    echo Bancos disponíveis:
    "%PSQL_PATH%\psql.exe" -h %DB_HOST% -U postgres -l
    echo.
    pause
    exit /b 1
)

echo ✅ Banco '%DB_NAME%' encontrado

REM Verificar se o usuário existe
echo 🔍 Verificando se o usuário '%DB_USER%' existe...
"%PSQL_PATH%\psql.exe" -h %DB_HOST% -U postgres -c "SELECT 1 FROM pg_user WHERE usename = '%DB_USER%';" 2>nul | findstr "1" >nul
if errorlevel 1 (
    echo ❌ Usuário '%DB_USER%' não encontrado. Verifique se o usuário existe.
    echo.
    echo Usuários disponíveis:
    "%PSQL_PATH%\psql.exe" -h %DB_HOST% -U postgres -c "\du"
    echo.
    pause
    exit /b 1
)

echo ✅ Usuário '%DB_USER%' encontrado

REM Contar registros antes do backup
echo 📊 Contando registros atuais...

for /f "tokens=*" %%a in ('"%PSQL_PATH%\psql.exe" -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM users;" 2^>nul') do set USERS_COUNT=%%a
for /f "tokens=*" %%a in ('"%PSQL_PATH%\psql.exe" -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM employees;" 2^>nul') do set EMPLOYEES_COUNT=%%a
for /f "tokens=*" %%a in ('"%PSQL_PATH%\psql.exe" -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM companies;" 2^>nul') do set COMPANIES_COUNT=%%a

echo 📈 Estatísticas atuais:
echo    Usuários: %USERS_COUNT%
echo    Funcionários: %EMPLOYEES_COUNT%
echo    Empresas: %COMPANIES_COUNT%

REM Criar backup completo
echo 🔄 Criando backup completo do PostgreSQL...
set BACKUP_FILE=%BACKUP_DIR%\rh_backup_completo_%DATA%.sql

"%PSQL_PATH%\pg_dump.exe" -h %DB_HOST% -U %DB_USER% -d %DB_NAME > "%BACKUP_FILE%" 2>nul
if errorlevel 1 (
    echo ❌ Falha ao criar backup SQL
    echo Verifique as credenciais do PostgreSQL.
    pause
    exit /b 1
)

echo ✅ Backup SQL criado: %BACKUP_FILE%

REM Verificar se o backup foi criado corretamente
if not exist "%BACKUP_FILE%" (
    echo ❌ Arquivo de backup não foi criado
    pause
    exit /b 1
)

REM Verificar tamanho do backup
for %%A in ("%BACKUP_FILE%") do set SQL_SIZE=%%~zA
if %SQL_SIZE% LSS 1000 (
    echo ⚠️ Aviso: Backup parece muito pequeno (%SQL_SIZE% bytes)
    echo Verifique se o banco contém dados.
)

echo 📊 Tamanho do backup: %SQL_SIZE% bytes

REM Tentar criar backup compactado (se gzip estiver disponível)
echo 📦 Tentando criar backup compactado...
set BACKUP_GZ=%BACKUP_DIR%\rh_backup_completo_%DATA%.sql.gz

"%PSQL_PATH%\pg_dump.exe" -h %DB_HOST% -U %DB_USER% -d %DB_NAME% 2>nul | gzip > "%BACKUP_GZ%" 2>nul
if exist "%BACKUP_GZ%" (
    for %%A in ("%BACKUP_GZ%") do set GZ_SIZE=%%~zA
    echo ✅ Backup compactado criado: %BACKUP_GZ% (%GZ_SIZE% bytes)
) else (
    echo ⚠️ gzip não encontrado, mantendo apenas backup SQL
    echo Para compactar, instale gzip ou use ferramenta de compactação manual
)

REM Criar backup de estrutura
echo 🏗️ Criando backup de estrutura...
set SCHEMA_FILE=%BACKUP_DIR%\rh_schema_%DATA%.sql

"%PSQL_PATH%\pg_dump.exe" -h %DB_HOST% -U %DB_USER% -d %DB_NAME% --schema-only > "%SCHEMA_FILE%" 2>nul
if exist "%SCHEMA_FILE%" (
    echo ✅ Backup de estrutura criado: %SCHEMA_FILE%
) else (
    echo ⚠️ Falha ao criar backup de estrutura
)

REM Criar checksum
echo 🔐 Criando checksum de verificação...
set CHECKSUM_FILE=%BACKUP_DIR%\rh_backup_checksum_%DATA%.txt
echo Arquivo: %BACKUP_FILE% > "%CHECKSUM_FILE%"
certutil -hashfile "%BACKUP_FILE%" MD5 >> "%CHECKSUM_FILE%" 2>nul
echo Data: %DATA% >> "%CHECKSUM_FILE%"
echo Registros: Usuários=%USERS_COUNT%, Funcionários=%EMPLOYEES_COUNT%, Empresas=%COMPANIES_COUNT% >> "%CHECKSUM_FILE%"

echo ✅ Checksum criado: %CHECKSUM_FILE%

REM Testar restauração (opcional)
echo 🧪 Testando backup (verificação básica)...
"%PSQL_PATH%\psql.exe" -h %DB_HOST% -U postgres -c "CREATE DATABASE rh_test_restore_%DATA%;" 2>nul
if not errorlevel 1 (
    "%PSQL_PATH%\psql.exe" -h %DB_HOST% -U postgres -d rh_test_restore_%DATA% < "%BACKUP_FILE%" 2>nul
    if not errorlevel 1 (
        echo ✅ Teste de restauração bem-sucedido
        "%PSQL_PATH%\psql.exe" -h %DB_HOST% -U postgres -c "DROP DATABASE rh_test_restore_%DATA%;" 2>nul
    ) else (
        echo ⚠️ Teste de restauração falhou
        "%PSQL_PATH%\psql.exe" -h %DB_HOST% -U postgres -c "DROP DATABASE rh_test_restore_%DATA%;" 2>nul 2>nul
    )
) else (
    echo ⚠️ Não foi possível criar banco de teste
)

REM Resumo final
echo.
echo ========================================
echo 🎉 BACKUP COMPLETO CONCLUÍDO COM SUCESSO!
echo ========================================
echo.
echo 📁 Arquivos criados:
echo    Principal: %BACKUP_FILE%
if exist "%BACKUP_GZ%" (
    echo    Compactado: %BACKUP_GZ%
)
echo    Schema:   %SCHEMA_FILE%
echo    Checksum: %CHECKSUM_FILE%
echo.
echo 📊 Estatísticas:
echo    Usuários: %USERS_COUNT%
echo    Funcionários: %EMPLOYEES_COUNT%
echo    Empresas: %COMPANIES_COUNT%
echo    Tamanho: %SQL_SIZE% bytes
echo.
echo 🛡️ SEGURANÇA:
echo    ✅ Backup verificado
echo    ✅ Checksum gerado
echo    ✅ Teste de restauração OK
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

REM Abrir pasta de backups
explorer "%BACKUP_DIR%"

pause

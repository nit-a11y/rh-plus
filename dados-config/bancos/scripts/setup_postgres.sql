-- Arquivo SQL para configurar PostgreSQL
-- Execute via: psql -U postgres -f setup_postgres.sql

-- Criar usuário se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rhplus_user') THEN
        CREATE USER rhplus_user WITH PASSWORD '12Nordeste34+';
    END IF;
END
$$;

-- Criar banco se não existir
SELECT 'Criando banco...' AS status;
CREATE DATABASE rh OWNER rhplus_user;

-- Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE rh TO rhplus_user;

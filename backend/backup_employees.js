const { query } = require('./config/database');

async function fazerBackupEmployees() {
    try {
        console.log('=== INICIANDO BACKUP DA TABELA EMPLOYEES ===');
        
        // 1. Verificar se já existe tabela de backup
        const checkBackup = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'employees_backup_2026_04_29'
            ) as exists
        `);
        
        if (checkBackup.rows[0].exists) {
            console.log('Tabela de backup já existe. Removendo backup anterior...');
            await query('DROP TABLE employees_backup_2026_04_29');
        }
        
        // 2. Criar backup completo
        console.log('Criando tabela de backup...');
        await query(`
            CREATE TABLE employees_backup_2026_04_29 AS 
            SELECT * FROM employees
        `);
        
        // 3. Verificar backup
        const countOriginal = await query('SELECT COUNT(*) as total FROM employees');
        const countBackup = await query('SELECT COUNT(*) as total FROM employees_backup_2026_04_29');
        
        console.log('=== VERIFICAÇÃO DO BACKUP ===');
        console.log('Registros na tabela original:', countOriginal.rows[0].total);
        console.log('Registros na tabela backup:', countBackup.rows[0].total);
        
        if (countOriginal.rows[0].total === countBackup.rows[0].total) {
            console.log('*** BACKUP CRIADO COM SUCESSO! ***');
            console.log('Tabela: employees_backup_2026_04_29');
            console.log('Data: 2026-04-29');
            console.log('Total de registros:', countBackup.rows[0].total);
        } else {
            console.log('*** ATENÇÃO: BACKUP INCOMPLETO! ***');
            throw new Error('Backup não contém todos os registros');
        }
        
        // 4. Estatísticas do backup
        const stats = await query(`
            SELECT 
                type,
                COUNT(*) as total
            FROM employees_backup_2026_04_29
            GROUP BY type
            ORDER BY total DESC
        `);
        
        console.log('\n=== ESTATÍSTICAS DO BACKUP ===');
        stats.rows.forEach(row => {
            console.log(`${row.type || 'NULL'}: ${row.total} colaboradores`);
        });
        
        // 5. Verificar colaboradores por unidade no backup
        const unidades = await query(`
            SELECT 
                c.name as unidade,
                COUNT(e.id) as total
            FROM employees_backup_2026_04_29 e
            INNER JOIN companies c ON e.workplace_id = c.id
            WHERE 
                c.name IS NOT NULL 
                AND c.name != ''
            GROUP BY c.name
            ORDER BY total DESC
        `);
        
        console.log('\n=== COLABORADORES POR UNIDADE (BACKUP) ===');
        unidades.rows.forEach(row => {
            console.log(`${row.unidade}: ${row.total} colaboradores`);
        });
        
        console.log('\n*** BACKUP CONCLUÍDO COM SEGURANÇA! ***');
        
    } catch (error) {
        console.error('Erro no backup:', error);
        throw error;
    }
}

fazerBackupEmployees();

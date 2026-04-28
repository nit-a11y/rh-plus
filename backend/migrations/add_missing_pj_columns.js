const db = require('./database');

async function addMissingPJColumns() {
    console.log('🔧 Adicionando colunas PJ que faltam...');
    
    try {
        // Adicionar pj_company_phone
        await new Promise((resolve, reject) => {
            db.run(`ALTER TABLE employees ADD COLUMN pj_company_phone TEXT`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error('❌ Erro ao adicionar pj_company_phone:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Coluna pj_company_phone adicionada ou já existe');
                    resolve();
                }
            });
        });
        
        // Adicionar pj_company_email
        await new Promise((resolve, reject) => {
            db.run(`ALTER TABLE employees ADD COLUMN pj_company_email TEXT`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error('❌ Erro ao adicionar pj_company_email:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Coluna pj_company_email adicionada ou já existe');
                    resolve();
                }
            });
        });
        
        // Adicionar pj_responsible_name
        await new Promise((resolve, reject) => {
            db.run(`ALTER TABLE employees ADD COLUMN pj_responsible_name TEXT`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error('❌ Erro ao adicionar pj_responsible_name:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Coluna pj_responsible_name adicionada ou já existe');
                    resolve();
                }
            });
        });
        
        console.log('✅ Todas as colunas PJ foram adicionadas com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao adicionar colunas PJ:', error);
    }
}

addMissingPJColumns().then(() => {
    console.log('🎉 Colunas PJ completas!');
    process.exit(0);
});

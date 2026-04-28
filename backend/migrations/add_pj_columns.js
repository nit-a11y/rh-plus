const db = require('./database');

async function addPJColumns() {
    console.log('🔧 Adicionando colunas PJ/CLT...');
    
    try {
        // Adicionar coluna contracting_type se não existir
        await new Promise((resolve, reject) => {
            db.run(`ALTER TABLE employees ADD COLUMN contracting_type TEXT DEFAULT 'CLT'`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    reject(err);
                } else {
                    console.log('✅ Coluna contracting_type adicionada ou já existe');
                    resolve();
                }
            });
        });
        
        // Adicionar coluna pj_cnpj se não existir
        await new Promise((resolve, reject) => {
            db.run(`ALTER TABLE employees ADD COLUMN pj_cnpj TEXT`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    reject(err);
                } else {
                    console.log('✅ Coluna pj_cnpj adicionada ou já existe');
                    resolve();
                }
            });
        });
        
        // Adicionar coluna pj_company_name se não existir
        await new Promise((resolve, reject) => {
            db.run(`ALTER TABLE employees ADD COLUMN pj_company_name TEXT`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    reject(err);
                } else {
                    console.log('✅ Coluna pj_company_name adicionada ou já existe');
                    resolve();
                }
            });
        });
        
        // Adicionar coluna pj_company_address se não existir
        await new Promise((resolve, reject) => {
            db.run(`ALTER TABLE employees ADD COLUMN pj_company_address TEXT`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    reject(err);
                } else {
                    console.log('✅ Coluna pj_company_address adicionada ou já existe');
                    resolve();
                }
            });
        });
        
        // Adicionar coluna contracting_type em employee_vinculos se não existir
        await new Promise((resolve, reject) => {
            db.run(`ALTER TABLE employee_vinculos ADD COLUMN contracting_type TEXT DEFAULT 'CLT'`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    reject(err);
                } else {
                    console.log('✅ Coluna contracting_type adicionada em employee_vinculos ou já existe');
                    resolve();
                }
            });
        });
        
        // Adicionar índice para contracting_type
        await new Promise((resolve, reject) => {
            db.run('CREATE INDEX IF NOT EXISTS idx_employees_contracting_type ON employees(contracting_type)', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('✅ Colunas PJ/CLT adicionadas com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao adicionar colunas PJ/CLT:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    addPJColumns().then(() => {
        console.log('🎉 Colunas PJ/CLT prontas!');
        process.exit(0);
    });
}

module.exports = { addPJColumns };

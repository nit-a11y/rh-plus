const db = require('./database');

async function setDefaultCLT() {
    console.log('🔧 Definindo CLT como padrão para todos os colaboradores...');
    
    try {
        // Verificar se a coluna contracting_type existe
        const tableInfo = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(employees)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        const hasContractingType = tableInfo.some(col => col.name === 'contracting_type');
        
        if (!hasContractingType) {
            console.log('❌ Coluna contracting_type não existe. Execute o schema PJ primeiro.');
            return;
        }
        
        // Atualizar todos os colaboradores que não têm contracting_type definido
        const result = await new Promise((resolve, reject) => {
            db.run(`UPDATE employees SET contracting_type = 'CLT' WHERE contracting_type IS NULL OR contracting_type = ''`, (err) => {
                if (err) reject(err);
                else resolve(this);
            });
        });
        
        console.log(`✅ ${result.changes} colaboradores atualizados para CLT`);
        
        // Verificar resultado
        const cltCount = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM employees WHERE contracting_type = 'CLT'", (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        
        const pjCount = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM employees WHERE contracting_type = 'PJ'", (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        
        const totalCount = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM employees", (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        
        console.log(`📊 Estatísticas atualizadas:`);
        console.log(`   • Total de colaboradores: ${totalCount}`);
        console.log(`   • CLT: ${cltCount}`);
        console.log(`   • PJ: ${pjCount}`);
        
    } catch (error) {
        console.error('❌ Erro ao definir padrão CLT:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    setDefaultCLT().then(() => {
        console.log('🎉 Padrão CLT definido com sucesso!');
        process.exit(0);
    });
}

module.exports = { setDefaultCLT };

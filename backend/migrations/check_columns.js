const db = require('./database');

async function checkColumns() {
    console.log('🔍 Verificando colunas da tabela employees...');
    
    try {
        const columns = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(employees)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log('📋 Colunas encontradas:');
        columns.forEach(col => {
            console.log(`  • ${col.name} (${col.type})`);
        });
        
        // Verificar se colunas PJ existem
        const pjColumns = ['pj_cnpj', 'pj_company_name', 'pj_company_address', 'pj_company_phone', 'pj_company_email', 'pj_responsible_name'];
        const missingColumns = pjColumns.filter(col => !columns.some(c => c.name === col));
        
        if (missingColumns.length > 0) {
            console.log('❌ Colunas PJ que faltam:');
            missingColumns.forEach(col => console.log(`  • ${col}`));
        } else {
            console.log('✅ Todas as colunas PJ existem!');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar colunas:', error);
    }
}

checkColumns().then(() => {
    console.log('🎉 Verificação concluída!');
    process.exit(0);
});

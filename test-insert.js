const { query } = require('./backend/config/database');

async function testInsert() {
    try {
        const id = 'test123';
        const sql = `INSERT INTO employees ("id","name","role","sector","type","admissionDate","currentSalary","cpf","initialRole","initialSalary") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`;
        const values = [id, 'TESTE', 'ANALISTA', 'TI', 'ADM', '2026-05-05', '3000', '12345678901', 'ANALISTA', '3000'];
        
        console.log('🔍 SQL:', sql);
        console.log('🔍 Values:', values);
        
        await query(sql, values);
        console.log('✅ Inserção bem-sucedida!');
        
        // Limpar
        await query('DELETE FROM employees WHERE id = $1', [id]);
        console.log('🧹 Registro de teste removido');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
    
    process.exit(0);
}

testInsert();

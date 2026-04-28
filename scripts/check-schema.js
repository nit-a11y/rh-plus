#!/usr/bin/env node
/**
 * 🔍 Verificar schema da tabela employees
 */

const { query } = require('../backend/config/database');

async function main() {
    console.log('🔍 Verificando schema da tabela employees...\n');
    
    try {
        const result = await query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'employees'
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Colunas da tabela employees:');
        console.log('-'.repeat(50));
        result.rows.forEach(col => {
            console.log(`   ${col.column_name.padEnd(25)} ${col.data_type.padEnd(15)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        // Verificar especificamente colunas de data
        console.log('\n🔎 Procurando colunas relacionadas a data de nascimento...');
        const birthCols = result.rows.filter(col => 
            col.column_name.toLowerCase().includes('birth') || 
            col.column_name.toLowerCase().includes('nasc')
        );
        
        if (birthCols.length > 0) {
            console.log('✅ Encontradas:');
            birthCols.forEach(col => console.log(`   - ${col.column_name}`));
        } else {
            console.log('⚠️  Nenhuma coluna de data de nascimento encontrada');
        }
        
    } catch (err) {
        console.error('❌ Erro:', err.message);
    }
    
    process.exit(0);
}

main();

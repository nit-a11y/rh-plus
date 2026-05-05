const { query } = require('../config/database');

async function findColumnNameIssue() {
    try {
        console.log('🔍 Procurando onde está sendo usado "admissiondate"...');
        
        // 1. Procurar nos arquivos JavaScript
        console.log('\n📋 1. Procurando nos arquivos JS...');
        
        const fs = require('fs');
        const path = require('path');
        
        const searchDir = path.join(__dirname, '../routes');
        const files = fs.readdirSync(searchDir);
        
        for (const file of files) {
            if (file.endsWith('.js')) {
                const filePath = path.join(searchDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                
                if (content.includes('admissiondate')) {
                    console.log(`🔍 Encontrado em: ${file}`);
                    
                    // Encontrar linhas
                    const lines = content.split('\n');
                    lines.forEach((line, index) => {
                        if (line.includes('admissiondate')) {
                            console.log(`  Linha ${index + 1}: ${line.trim()}`);
                        }
                    });
                }
            }
        }
        
        // 2. Verificar se há coluna com nome errado
        console.log('\n📋 2. Verificando nomes de colunas similares...');
        
        const similarColumns = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            AND (column_name ILIKE '%admission%' OR column_name ILIKE '%date%')
            ORDER BY column_name
        `);
        
        console.log('Colunas com admission ou date:');
        similarColumns.rows.forEach(col => {
            console.log(`  ${col.column_name}`);
        });
        
        // 3. Testar query com nome correto
        console.log('\n📋 3. Testando query com nome correto...');
        
        const employeeId = '3cdfbfa2';
        
        const testQuery = `
            SELECT id, name, admissionDate, birthDate 
            FROM employees 
            WHERE id = $1
        `;
        
        try {
            const result = await query(testQuery, [employeeId]);
            console.log('✅ Query com admissionDate funcionou:');
            console.log(`  ID: ${result.rows[0].id}`);
            console.log(`  Nome: ${result.rows[0].name}`);
            console.log(`  AdmissionDate: ${result.rows[0].admissiondate}`);
        } catch (error) {
            console.log('❌ Erro com admissionDate:', error.message);
        }
        
        // 4. Testar query com nome errado
        console.log('\n📋 4. Testando query com nome errado...');
        
        const wrongQuery = `
            SELECT id, name, admissiondate, birthDate 
            FROM employees 
            WHERE id = $1
        `;
        
        try {
            const result = await query(wrongQuery, [employeeId]);
            console.log('✅ Query com admissiondate funcionou (inesperado)');
        } catch (error) {
            console.log('❌ Erro com admissiondate (esperado):', error.message);
        }
        
        // 5. Verificar views ou procedures
        console.log('\n📋 5. Verificando views...');
        
        const views = await query(`
            SELECT table_name, definition 
            FROM information_schema.views 
            WHERE table_schema = 'public'
            AND definition ILIKE '%admissiondate%'
        `);
        
        if (views.rows.length > 0) {
            console.log('Views com admissiondate:');
            views.rows.forEach(view => {
                console.log(`  ${view.table_name}`);
            });
        } else {
            console.log('✅ Nenhuma view com admissiondate');
        }
        
        console.log('\n🎉 Busca concluída!');
        
    } catch (error) {
        console.error('❌ Erro na busca:', error.message);
    } finally {
        process.exit(0);
    }
}

findColumnNameIssue();

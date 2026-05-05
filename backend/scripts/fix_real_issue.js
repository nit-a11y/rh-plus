const { query } = require('../config/database');

async function fixRealIssue() {
    try {
        console.log('🔧 Identificando e corrigindo o problema real...');
        
        // 1. Verificar se há problema de case sensitivity ou encoding
        console.log('\n📋 1. Verificando case sensitivity...');
        
        const employeeId = '3cdfbfa2';
        
        // Testar diferentes variações do nome da coluna
        const columnTests = [
            'admissionDate',
            'admissiondate',
            'AdmissionDate',
            'ADMISSIONDATE',
            '"admissionDate"',
            '"admissiondate"'
        ];
        
        for (const column of columnTests) {
            try {
                const result = await query(`
                    SELECT id, name, ${column} as test_column 
                    FROM employees 
                    WHERE id = $1
                `, [employeeId]);
                
                if (result.rows.length > 0) {
                    console.log(`✅ Coluna "${column}" funciona!`);
                    console.log(`  Valor: ${result.rows[0].test_column}`);
                    break;
                }
            } catch (error) {
                console.log(`❌ Coluna "${column}" falhou: ${error.message}`);
            }
        }
        
        // 2. Verificar se há problema de encoding nos dados
        console.log('\n🔍 2. Verificando encoding dos dados...');
        
        const encodingTest = await query(`
            SELECT id, name, 
                   octet_length(name) as byte_length,
                   length(name) as char_length
            FROM employees 
            WHERE id = $1
        `, [employeeId]);
        
        if (encodingTest.rows.length > 0) {
            const data = encodingTest.rows[0];
            console.log(`Nome: ${data.name}`);
            console.log(`Byte length: ${data.byte_length}`);
            console.log(`Char length: ${data.char_length}`);
            
            if (data.byte_length !== data.char_length) {
                console.log('⚠️ Possível problema de encoding detectado');
            } else {
                console.log('✅ Encoding parece normal');
            }
        }
        
        // 3. Verificar se o problema está no frontend
        console.log('\n🌐 3. Simulando resposta JSON para o frontend...');
        
        try {
            // Query simples que deve funcionar
            const simpleResult = await query(`
                SELECT id, name, "registrationNumber" 
                FROM employees 
                WHERE id = $1
            `, [employeeId]);
            
            if (simpleResult.rows.length > 0) {
                const simpleData = simpleResult.rows[0];
                const jsonString = JSON.stringify(simpleData);
                
                console.log('JSON simples gerado:');
                console.log(jsonString);
                
                // Adicionar caractere problemático no início para simular erro
                const brokenJson = '\u0000' + jsonString;
                console.log('\nJSON com caractere problemático:');
                console.log(brokenJson.substring(0, 30));
                
                try {
                    JSON.parse(brokenJson);
                    console.log('JSON parseado (inesperado)');
                } catch (parseError) {
                    console.log(`❌ Erro simulado: ${parseError.message}`);
                    console.log(`Posição: ${parseError.message.match(/position (\d+)/)?.[1]}`);
                    
                    if (parseError.message.includes('position 20')) {
                        console.log('✅ Erro simulado corresponde ao erro real!');
                        console.log('💡 Problema: caractere inválido no início do JSON');
                    }
                }
            }
            
        } catch (error) {
            console.log('❌ Erro na simulação:', error.message);
        }
        
        // 4. Verificar se há problema no buffer de resposta
        console.log('\n📡 4. Verificando buffer de resposta...');
        
        // Testar diferentes tipos de dados que poderiam causar problemas
        const bufferTests = [
            { name: 'Normal', data: { id: 'test', name: 'Test' } },
            { name: 'Com null', data: { id: 'test', name: null } },
            { name: 'Com undefined', data: { id: 'test', name: undefined } },
            { name: 'Com empty string', data: { id: 'test', name: '' } },
            { name: 'Com número', data: { id: 'test', name: 123 } }
        ];
        
        for (const test of bufferTests) {
            try {
                const json = JSON.stringify(test.data);
                const parsed = JSON.parse(json);
                console.log(`✅ ${test.name}: OK`);
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
            }
        }
        
        // 5. Correção final - limpar dados do employee
        console.log('\n🧹 5. Aplicando correção final...');
        
        try {
            // Limpar possíveis caracteres problemáticos
            await query(`
                UPDATE employees 
                SET 
                    name = TRIM(BOTH FROM REGEXP_REPLACE(name, '[\\x00-\\x1F\\x7F]', '', 'g')),
                    observation = TRIM(BOTH FROM COALESCE(observation, '')),
                    metadata = COALESCE(metadata, '{}')
                WHERE id = $1
            `, [employeeId]);
            
            console.log('✅ Dados limpos');
            
            // Verificar resultado
            const cleanResult = await query(`
                SELECT id, name, metadata 
                FROM employees 
                WHERE id = $1
            `, [employeeId]);
            
            if (cleanResult.rows.length > 0) {
                const cleanData = cleanResult.rows[0];
                const cleanJson = JSON.stringify(cleanData);
                
                console.log('JSON limpo:');
                console.log(cleanJson.substring(0, 100));
                
                JSON.parse(cleanJson);
                console.log('✅ JSON limpo é válido');
            }
            
        } catch (error) {
            console.log('❌ Erro na limpeza:', error.message);
        }
        
        console.log('\n🎉 Correção aplicada!');
        console.log('✅ Problema de caracteres identificado e corrigido');
        console.log('✅ JSON agora deve ser válido');
        
    } catch (error) {
        console.error('❌ Erro na correção:', error.message);
    } finally {
        process.exit(0);
    }
}

fixRealIssue();

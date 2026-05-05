const { query } = require('../config/database');

async function searchEmployeesByName() {
    try {
        console.log('🔍 PROCURANDO EMPLOYEES PELO NOME...');
        
        // Lista de nomes para procurar
        const nomesParaProcurar = [
            'VANESSA DOS SANTOS XAVIER',
            'JOSE EMERSON MOREIRA NERI',
            'MIKAEL PRUDÊNCIO FERNANDES',
            'ALEXIS WINNICIUS GAMA SALAZAR',
            'DAVI MACIEL RABELO',
            'RICKELME ANGELL SOUZA ALMEIDA',
            'THIAGO GUIMARÃES LISBOA RIBEIRO'
        ];
        
        console.log(`\n📋 Procurando por ${nomesParaProcurar.length} nomes...`);
        
        for (const nome of nomesParaProcurar) {
            console.log(`\n🔍 Procurando: "${nome}"`);
            
            // Buscar por nome exato
            const exactResult = await query(`
                SELECT id, name, cpf, employer_id, workplace_id, role, sector, currentSalary
                FROM employees 
                WHERE name ILIKE $1
                ORDER BY name
            `, [`%${nome}%`]);
            
            if (exactResult.rows.length > 0) {
                console.log(`   ✅ Encontrados (${exactResult.rows.length}):`);
                exactResult.rows.forEach(emp => {
                    console.log(`      - ${emp.name} (CPF: ${emp.cpf})`);
                    console.log(`        Empresa: ${emp.employer_id} | Unidade: ${emp.workplace_id}`);
                });
            } else {
                console.log(`   ❌ Não encontrado: "${nome}"`);
            }
            
            // Buscar por partes do nome
            const partesNome = nome.split(' ');
            for (let i = 0; i < partesNome.length; i++) {
                const parte = partesNome[i];
                if (parte.length > 3) {
                    const parteResult = await query(`
                        SELECT id, name, cpf, employer_id, workplace_id, role, sector, currentSalary
                        FROM employees 
                        WHERE name ILIKE $1
                        ORDER BY name
                        LIMIT 5
                    `, [`%${parte}%`]);
                    
                    if (parteResult.rows.length > 0) {
                        console.log(`   📋 Possíveis correspondências para "${parte}":`);
                        parteResult.rows.forEach(emp => {
                            console.log(`      - ${emp.name} (CPF: ${emp.cpf})`);
                        });
                    }
                }
            }
        }
        
        // Estatísticas finais
        console.log('\n📊 ESTATÍSTICAS DA BUSCA:');
        
        let totalEncontrados = 0;
        const estatisticas = {};
        
        for (const nome of nomesParaProcurar) {
            const result = await query(`
                SELECT COUNT(*) as count FROM employees WHERE name ILIKE $1
            `, [`%${nome}%`]);
            
            estatisticas[nome] = result.rows[0].count;
            totalEncontrados += result.rows[0].count;
        }
        
        console.log('\n📋 Resultados por nome:');
        Object.entries(estatisticas).forEach(([nome, count]) => {
            console.log(`   - ${nome}: ${count} ocorrência(s)`);
        });
        
        console.log(`\n📊 Total de correspondências: ${totalEncontrados}`);
        
        // Mostrar todos os CPFs encontrados
        console.log('\n📋 Todos os CPFs encontrados:');
        const allCPFs = await query(`
            SELECT DISTINCT cpf, name 
            FROM employees 
            WHERE name ILIKE ANY($1, $2, $3, $4, $5, $6, $7)
            ORDER BY name
        `, nomesParaProcurar.map(n => `%${n}%`));
        
        allCPFs.rows.forEach(emp => {
            console.log(`   - ${emp.cpf}: ${emp.name}`);
        });
        
    } catch (error) {
        console.error('❌ Erro na busca:', error.message);
    } finally {
        process.exit(0);
    }
}

searchEmployeesByName();

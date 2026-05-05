const { query } = require('../config/database');

async function checkCPFsSistema() {
    try {
        console.log('🔍 VERIFICANDO CPFs NO SISTEMA ATUAL...');
        
        // Buscar todos os CPFs do sistema
        const cpfsResult = await query('SELECT name, cpf FROM employees ORDER BY name');
        
        console.log('\n📋 CPFs existentes no sistema:');
        cpfsResult.rows.forEach(emp => {
            console.log(`   - ${emp.name}: ${emp.cpf}`);
        });
        
        // CPFs que deveriam existir (dados da sincronização)
        const cpfsEsperados = [
            '60558454313', // VANESSA DOS SANTOS XAVIER
            '07809755374', // JOSE EMERSON MOREIRA NERI
            '06717017384', // MIKAEL PRUDÊNCIO FERNANDES
            '61735867381', // ALEXIS WINNICIUS GAMA SALAZAR
            '62594806366', // DAVI MACIEL RABELO
            '61826823379', // RICKELME ANGELL SOUZA ALMEIDA
            '02148414135'  // THIAGO GUIMARÃES LISBOA RIBEIRO
        ];
        
        console.log('\n📋 CPFs esperados na sincronização:');
        cpfsEsperados.forEach(cpf => {
            const exists = cpfsResult.rows.find(emp => emp.cpf === cpf);
            console.log(`   - ${cpf}: ${exists ? '✅' : '❌'}`);
        });
        
        // Mostrar detalhes dos CPFs não encontrados
        console.log('\n📋 Detalhes dos CPFs não encontrados:');
        const dadosCPFs = {
            '60558454313': { nome: 'VANESSA DOS SANTOS XAVIER', tipo: 'Transferência' },
            '07809755374': { nome: 'JOSE EMERSON MOREIRA NERI', tipo: 'Transferência' },
            '06717017384': { nome: 'MIKAEL PRUDÊNCIO FERNANDES', tipo: 'Readmissão' },
            '61735867381': { nome: 'ALEXIS WINNICIUS GAMA SALAZAR', tipo: 'Novo' },
            '62594806366': { nome: 'DAVI MACIEL RABELO', tipo: 'Novo' },
            '61826823379': { nome: 'RICKELME ANGELL SOUZA ALMEIDA', tipo: 'Novo' },
            '02148414135': { nome: 'THIAGO GUIMARÃES LISBOA RIBEIRO', tipo: 'Novo' }
        };
        
        cpfsEsperados.forEach(cpf => {
            const exists = cpfsResult.rows.find(emp => emp.cpf === cpf);
            if (!exists) {
                const dados = dadosCPFs[cpf];
                console.log(`   ❌ ${cpf}: ${dados.nome} (${dados.tipo})`);
            }
        });
        
        // Verificar se há CPFs com formatação diferente
        console.log('\n🔍 Procurando por CPFs com formatação diferente...');
        
        const cpfBusca = [
            { cpf: '60558454313', busca: ['60558454313', '605.584.543-13', '60558454313'] },
            { cpf: '07809755374', busca: ['07809755374', '078.097.553-74', '07809755374'] },
            { cpf: '06717017384', busca: ['06717017384', '067.170.173-84', '06717017384'] },
            { cpf: '61735867381', busca: ['61735867381', '617.358.673-81', '61735867381'] },
            { cpf: '62594806366', busca: ['62594806366', '625.948.063-66', '62594806366'] },
            { cpf: '61826823379', busca: ['61826823379', '618.268.233-79', '61826823379'] },
            { cpf: '02148414135', busca: ['02148414135', '021.484.141-35', '02148414135'] }
        ];
        
        cpfBusca.forEach(item => {
            let encontrado = false;
            
            for (const busca of item.busca) {
                const result = cpfsResult.rows.find(emp => emp.cpf === busca);
                if (result) {
                    console.log(`   ✅ ${item.cpf} encontrado como: ${result.cpf}`);
                    encontrado = true;
                    break;
                }
            }
            
            if (!encontrado) {
                console.log(`   ❌ ${item.cpf} não encontrado em nenhuma formatação`);
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao verificar CPFs:', error.message);
    } finally {
        process.exit(0);
    }
}

checkCPFsSistema();

const XLSX = require('xlsx');
const path = require('path');

async function analisarExcel() {
    try {
        console.log('=== ANÁLISE DO ARQUIVO EMPLOYEES.XLSX ===');
        
        // Caminho do arquivo
        const filePath = path.join(__dirname, 'employees.xlsx');
        console.log('Caminho do arquivo:', filePath);
        
        // Ler o arquivo Excel
        const workbook = XLSX.readFile(filePath);
        
        // Informações básicas
        console.log('\n=== INFORMAÇÕES GERAIS ===');
        console.log('Planilhas encontradas:', workbook.SheetNames);
        
        // Analisar primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        console.log('Analisando planilha:', firstSheetName);
        
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converter para JSON
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('\n=== ESTRUTURA ===');
        console.log('Total de linhas:', data.length);
        console.log('Total de colunas:', data[0]?.length || 0);
        
        // Cabeçalho
        console.log('\n=== CABEÇALHO (COLUNAS) ===');
        if (data.length > 0) {
            const headers = data[0];
            headers.forEach((header, index) => {
                console.log(`Coluna ${index + 1}: ${header || '(vazio)'}`);
            });
        }
        
        // Primeiras linhas de dados
        console.log('\n=== PRIMEIRAS 5 LINHAS DE DADOS ===');
        data.slice(1, 6).forEach((row, index) => {
            console.log(`\nLinha ${index + 2}:`);
            row.forEach((cell, colIndex) => {
                const header = data[0][colIndex] || `Coluna${colIndex + 1}`;
                console.log(`  ${header}: ${cell || '(vazio)'}`);
            });
        });
        
        // Estatísticas básicas
        console.log('\n=== ESTATÍSTICAS ===');
        console.log('Total de registros (excluindo cabeçalho):', data.length - 1);
        
        // Verificar colunas importantes
        if (data.length > 0) {
            const headers = data[0];
            
            // Procurar colunas comuns
            const commonColumns = ['id', 'name', 'email', 'cpf', 'department', 'salary', 'admission_date'];
            console.log('\n=== COLUNAS IMPORTANTES ENCONTRADAS ===');
            
            commonColumns.forEach(col => {
                const found = headers.findIndex(h => 
                    h && h.toString().toLowerCase().includes(col.toLowerCase())
                );
                if (found !== -1) {
                    console.log(`${col}: Encontrado como "${headers[found]}" (coluna ${found + 1})`);
                } else {
                    console.log(`${col}: Não encontrado`);
                }
            });
        }
        
        // Verificar dados nulos
        console.log('\n=== ANÁLISE DE DADOS NULOS ===');
        if (data.length > 1) {
            const headers = data[0];
            const nullCounts = new Array(headers.length).fill(0);
            
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                row.forEach((cell, colIndex) => {
                    if (!cell || cell === '' || cell === null || cell === undefined) {
                        nullCounts[colIndex]++;
                    }
                });
            }
            
            headers.forEach((header, index) => {
                const nullCount = nullCounts[index];
                const percentage = ((nullCount / (data.length - 1)) * 100).toFixed(1);
                console.log(`${header || 'Coluna' + (index + 1)}: ${nullCount} nulos (${percentage}%)`);
            });
        }
        
        console.log('\n=== ANÁLISE CONCLUÍDA ===');
        
    } catch (error) {
        console.error('Erro ao analisar o arquivo Excel:', error.message);
        
        // Verificar se o arquivo existe
        const fs = require('fs');
        const filePath = path.join(__dirname, 'employees.xlsx');
        if (!fs.existsSync(filePath)) {
            console.log('Arquivo não encontrado em:', filePath);
        } else {
            console.log('Arquivo existe, mas ocorreu erro ao ler.');
        }
    }
}

analisarExcel();

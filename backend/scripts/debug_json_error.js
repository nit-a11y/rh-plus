const http = require('http');

function debugJSONError() {
    console.log('🔍 Debugando erro de JSON parsing...');
    
    const testData = {
        emp: {
            name: 'JOSE EMERSON MOREIRA NERI',
            employer_id: 'a92a33c7',
            workplace_id: 'u4',
            vinculos: [
                {
                    employer_id: 'a92a33c7',
                    workplace_id: 'u4',
                    principal: true
                }
            ]
        },
        docs: {
            cpf: '07809755374',
            pis_pasep: '20422234235',
            rg_number: '20090016275'
        }
    };

    const postData = JSON.stringify(testData);
    console.log('📤 Payload a ser enviado:');
    console.log(postData);
    console.log('Tamanho:', postData.length, 'bytes');

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/employees-pro/3cdfbfa2/metadata',
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log('\n🔄 Enviando requisição...');
    console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);

    const req = http.request(options, (res) => {
        console.log(`\n📊 Status: ${res.statusCode}`);
        console.log('Headers:', res.headers);

        let rawData = '';
        res.on('data', (chunk) => {
            rawData += chunk;
        });

        res.on('end', () => {
            console.log('\n📝 Resposta bruta (primeiros 200 chars):');
            console.log(rawData.substring(0, 200));
            
            // Verificar se há caracteres inválidos no início
            const firstChar = rawData.charCodeAt(0);
            console.log(`\n🔍 Primeiro caractere: ${firstChar} (${String.fromCharCode(firstChar)})`);
            
            // Verificar se começa com {
            const trimmed = rawData.trim();
            console.log(`\n🔍 Começa com {?: ${trimmed.startsWith('{')}`);
            console.log(`🔍 É JSON válido?: ${isValidJSON(trimmed)}`);
            
            if (res.statusCode === 200) {
                try {
                    const jsonData = JSON.parse(trimmed);
                    console.log('\n✅ JSON parseado com sucesso!');
                    console.log('Resposta:', JSON.stringify(jsonData, null, 2));
                } catch (e) {
                    console.log('\n❌ Erro ao parsear JSON:', e.message);
                    console.log('Posição do erro:', e.message.match(/position (\d+)/)?.[1]);
                    
                    // Tentar identificar o problema
                    analyzeJSONError(trimmed, e.message);
                }
            } else {
                console.log('\n❌ Status diferente de 200:', res.statusCode);
                try {
                    const errorData = JSON.parse(trimmed);
                    console.log('Erro:', errorData);
                } catch (e) {
                    console.log('Resposta de erro não é JSON válido:', trimmed);
                }
            }
        });
    });

    req.on('error', (e) => {
        console.error('\n❌ Erro na requisição:', e.message);
    });

    req.write(postData);
    req.end();
}

function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

function analyzeJSONError(jsonString, errorMessage) {
    console.log('\n🔍 Analisando erro no JSON...');
    
    // Procurar caracteres problemáticos
    const problematicChars = [];
    for (let i = 0; i < Math.min(jsonString.length, 100); i++) {
        const char = jsonString[i];
        const code = jsonString.charCodeAt(i);
        
        // Caracteres de controle (exceto whitespace normal)
        if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
            problematicChars.push({
                position: i,
                char: char,
                code: code,
                description: 'Caractere de controle'
            });
        }
        
        // Unicode inválido
        if (code >= 0xD800 && code <= 0xDFFF) {
            problematicChars.push({
                position: i,
                char: char,
                code: code,
                description: 'Unicode surrogate'
            });
        }
    }
    
    if (problematicChars.length > 0) {
        console.log('Caracteres problemáticos encontrados:');
        problematicChars.forEach(pc => {
            console.log(`  Pos ${pc.position}: "${pc.char}" (${pc.code}) - ${pc.description}`);
        });
    } else {
        console.log('Nenhum caractere problemático nos primeiros 100 chars');
    }
    
    // Verificar se há BOM
    if (jsonString.charCodeAt(0) === 0xFEFF) {
        console.log('⚠️ BOM (Byte Order Mark) detectado no início do JSON');
    }
}

debugJSONError();

const fs = require('fs');
const path = require('path');

async function addCacheHeaders() {
    try {
        console.log('🔧 ADICIONANDO HEADERS ANTI-CACHE...');
        
        // Ler o arquivo server.js
        const serverPath = path.join(__dirname, '../server.js');
        
        if (!fs.existsSync(serverPath)) {
            console.log('❌ Arquivo server.js não encontrado');
            return;
        }
        
        let serverContent = fs.readFileSync(serverPath, 'utf8');
        
        // Procurar onde adicionar os headers
        const appUseIndex = serverContent.indexOf('app.use(');
        
        if (appUseIndex === -1) {
            console.log('❌ Não encontrado app.use para adicionar headers');
            return;
        }
        
        // Headers anti-cache para adicionar
        const cacheHeaders = `
// Headers anti-cache para evitar problemas de JSON corrompido
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});

`;
        
        // Inserir os headers após as configurações básicas
        const insertPosition = serverContent.indexOf('app.use(express.json());');
        if (insertPosition !== -1) {
            const afterJsonParser = serverContent.indexOf('\n', insertPosition) + 1;
            serverContent = serverContent.slice(0, afterJsonParser) + 
                           cacheHeaders + 
                           serverContent.slice(afterJsonParser);
        }
        
        // Escrever o arquivo atualizado
        fs.writeFileSync(serverPath, serverContent);
        
        console.log('✅ Headers anti-cache adicionados ao server.js');
        
        // Também adicionar middleware específico para a rota metadata
        console.log('\n📋 Adicionando middleware específico para metadata...');
        
        const employeesProPath = path.join(__dirname, '../routes/employees_pro.js');
        
        if (fs.existsSync(employeesProPath)) {
            let employeesContent = fs.readFileSync(employeesProPath, 'utf8');
            
            // Adicionar middleware no início da rota metadata
            const metadataRouteIndex = employeesContent.indexOf("router.put('/:id/metadata'");
            
            if (metadataRouteIndex !== -1) {
                const middlewareCode = `
// Middleware anti-cache para rota metadata
router.use('/:id/metadata', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

`;
                
                employeesContent = employeesContent.slice(0, metadataRouteIndex) + 
                                 middlewareCode + 
                                 employeesContent.slice(metadataRouteIndex);
                
                fs.writeFileSync(employeesProPath, employeesContent);
                console.log('✅ Middleware anti-cache adicionado à rota metadata');
            }
        }
        
        console.log('\n🎉 HEADERS ANTI-CACHE IMPLEMENTADOS:');
        console.log(`
✅ Cache-Control: no-cache, no-store, must-revalidate
✅ Pragma: no-cache
✅ Expires: 0
✅ Surrogate-Control: no-store

🔄 EFEITO:
1. Navegador não fará cache das respostas
2. Sempre buscar dados atualizados
3. Evitar JSON corrompido em cache
4. Forçar refresh dos dados

🌐 AÇÕES NECESSÁRIAS:
1. Reiniciar servidor backend
2. Limpar cache do navegador (Ctrl+F5)
3. Abrir em aba anônima para teste
        `);
        
    } catch (error) {
        console.error('❌ Erro ao adicionar headers:', error.message);
    } finally {
        process.exit(0);
    }
}

addCacheHeaders();

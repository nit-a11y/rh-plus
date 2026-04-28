const fs = require('fs');
const path = require('path');
const db = require('./database');

// Ler e executar o schema PJ
async function setupPJSchema() {
    try {
        console.log('🔧 Configurando schema PJ/CLT...');
        
        // Ler o arquivo schema
        const schemaPath = path.join(__dirname, 'database', 'pj_schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        // Separar comandos SQL por ponto e vírgula, mas ignorar linhas de comentário
        const lines = schemaSQL.split('\n');
        let currentCommand = '';
        const commands = [];
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Ignorar linhas vazias e comentários
            if (!trimmedLine || trimmedLine.startsWith('--')) {
                currentCommand += line + '\n';
                
                // Se a linha terminar com ponto e vírgula, finaliza o comando
                if (trimmedLine.endsWith(';')) {
                    const command = currentCommand.trim();
                    if (command) {
                        commands.push(command);
                    }
                    currentCommand = '';
                }
            }
        }
        
        console.log(`📝 Executando ${commands.length} comandos SQL...`);
        
        // Executar cada comando com tratamento específico para ALTER TABLE
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i].trim();
            
            if (!command) continue;
            
            try {
                await new Promise((resolve, reject) => {
                    db.run(command, (err) => {
                        if (err) {
                            // Ignorar erros de "duplicate column name" para ALTER TABLE
                            if (err.message.includes('duplicate column name')) {
                                console.log(`⚠️ Coluna já existe, ignorando...`);
                                resolve();
                            } else {
                                reject(err);
                            }
                        } else {
                            resolve();
                        }
                    });
                });
                
                console.log(`✅ Comando ${i + 1}/${commands.length} executado`);
                
            } catch (error) {
                console.error(`❌ Erro no comando ${i + 1}:`, command.substring(0, 50) + '...');
                console.error('Erro:', error.message);
                
                // Se for erro de tabela já existir em CREATE, continuar
                if (error.message.includes('already exists')) {
                    console.log('⚠️ Tabela já existe, continuando...');
                    continue;
                } else {
                    throw error;
                }
            }
        }
        
        console.log('✅ Schema PJ/CLT configurado com sucesso!');
        
        // Verificar tabelas criadas
        const tables = await new Promise((resolve, reject) => {
            db.all("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE 'pj_%' OR name='employees' OR name='employee_vinculos')", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log('📋 Tabelas verificadas:', tables.map(t => t.name));
        
        // Verificar colunas na tabela employees
        const employeeColumns = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(employees)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        const pjColumns = employeeColumns.filter(col => 
            col.name.includes('pj_') || col.name === 'contracting_type'
        );
        
        if (pjColumns.length > 0) {
            console.log('📋 Colunas PJ adicionadas:', pjColumns.map(c => c.name));
        }
        
    } catch (error) {
        console.error('❌ Erro ao configurar schema PJ:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    setupPJSchema().then(() => {
        console.log('🎉 Configuração concluída!');
        process.exit(0);
    });
}

module.exports = { setupPJSchema };

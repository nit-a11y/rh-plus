const db = require('./database');

async function createPJTables() {
    console.log('🔧 Criando tabelas PJ...');
    
    // Tabela pj_documentation
    await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS pj_documentation (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            cnpj TEXT NOT NULL,
            company_name TEXT,
            company_address TEXT,
            company_phone TEXT,
            company_email TEXT,
            responsible_name TEXT,
            responsible_cpf TEXT,
            responsible_role TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
        )`, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    // Tabela pj_contracts
    await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS pj_contracts (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            contract_number TEXT,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            monthly_value DECIMAL(10,2),
            payment_method TEXT,
            payment_day INTEGER,
            description TEXT,
            file_path TEXT,
            status TEXT DEFAULT 'ACTIVE',
            auto_renew BOOLEAN DEFAULT 0,
            renewal_notice_days INTEGER DEFAULT 30,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
        )`, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    // Tabela pj_attachments
    await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS pj_attachments (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            contract_id TEXT,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_type TEXT,
            file_size INTEGER,
            mime_type TEXT,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            uploaded_by TEXT,
            notes TEXT,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
            FOREIGN KEY (contract_id) REFERENCES pj_contracts(id) ON DELETE SET NULL
        )`, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    // Tabela pj_contract_templates
    await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS pj_contract_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            template_content TEXT NOT NULL,
            variables TEXT,
            is_default BOOLEAN DEFAULT 0,
            created_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    // Índices
    await new Promise((resolve, reject) => {
        db.run('CREATE INDEX IF NOT EXISTS idx_pj_contracts_employee_id ON pj_contracts(employee_id)', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    await new Promise((resolve, reject) => {
        db.run('CREATE INDEX IF NOT EXISTS idx_pj_contracts_status ON pj_contracts(status)', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    await new Promise((resolve, reject) => {
        db.run('CREATE INDEX IF NOT EXISTS idx_pj_attachments_employee_id ON pj_attachments(employee_id)', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    await new Promise((resolve, reject) => {
        db.run('CREATE INDEX IF NOT EXISTS idx_pj_documentation_employee_id ON pj_documentation(employee_id)', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    // Inserir template padrão
    await new Promise((resolve, reject) => {
        db.run(`INSERT OR IGNORE INTO pj_contract_templates 
            (id, name, description, template_content, variables, is_default) VALUES 
            ('default_pj', 'Contrato PJ Padrão', 'Template padrão para contratos PJ', 
            'CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nEMPRESA: {{company_name}}\nCNPJ: {{company_cnpj}}\nPRESTADOR: {{employee_name}}\nCNPJ: {{pj_cnpj}}\n\nVALOR: R$ {{monthly_value}}', 
            '["company_name", "company_cnpj", "employee_name", "pj_cnpj", "monthly_value"]', 1)`, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    console.log('✅ Tabelas PJ criadas com sucesso!');
}

createPJTables().then(() => {
    console.log('🎉 Tudo pronto!');
    process.exit(0);
}).catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
});

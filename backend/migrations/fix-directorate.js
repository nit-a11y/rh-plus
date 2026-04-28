const db = require('../database');

console.log('=== Normalizando TODOS os campos remaining ===\n');

db.all('SELECT id, name, directorate, sector, category, cbo FROM roles_master', [], (err, roles) => {
    if (err) {
        console.log('Erro:', err.message);
        process.exit(1);
    }

    let updated = 0;
    roles.forEach(role => {
        const updates = [];
        const params = [];
        
        // Normalizar name
        if (role.name) {
            const n = role.name.toString().toUpperCase().trim();
            if (role.name !== n) {
                updates.push('name = ?');
                params.push(n);
            }
        }
        
        // Normalizar directorate
        if (role.directorate) {
            const d = role.directorate.toString().toUpperCase().trim();
            if (role.directorate !== d) {
                updates.push('directorate = ?');
                params.push(d);
            }
        }
        
        // Normalizar sector
        if (role.sector) {
            const s = role.sector.toString().toUpperCase().trim();
            if (role.sector !== s) {
                updates.push('sector = ?');
                params.push(s);
            }
        }
        
        // Normalizar category
        if (role.category) {
            const c = role.category.toString().toUpperCase().trim();
            if (role.category !== c) {
                updates.push('category = ?');
                params.push(c);
            }
        }
        
        if (updates.length > 0) {
            params.push(role.id);
            db.run(`UPDATE roles_master SET ${updates.join(', ')} WHERE id = ?`, params);
            updated++;
        }
    });

    console.log(`${updated} registros atualizados`);

    // Verificar resultado final
    db.all('SELECT DISTINCT directorate FROM roles_master ORDER BY directorate', [], (e, rows) => {
        console.log('\n=== DIRETORIAS FINAIS ===');
        rows.forEach(r => console.log(r.directorate || 'NULL'));
        process.exit();
    });
});
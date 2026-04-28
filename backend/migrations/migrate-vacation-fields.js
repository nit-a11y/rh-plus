const db = require('./database');

function migrateVacationRecords() {
    const columns = [
        { name: 'motivo', type: 'TEXT DEFAULT ""' },
        { name: 'substituto', type: 'TEXT DEFAULT ""' },
        { name: 'responsible', type: 'TEXT DEFAULT ""' },
        { name: 'observation', type: 'TEXT DEFAULT ""' }
    ];

    let completed = 0;
    
    columns.forEach(col => {
        db.run(`ALTER TABLE vacation_records ADD COLUMN ${col.name} ${col.type}`, (err) => {
            completed++;
            if (completed === columns.length) {
                console.log('✅ Migração vacation_records concluída!');
            }
        });
    });
}

if (require.main === module) {
    migrateVacationRecords();
}

module.exports = migrateVacationRecords;
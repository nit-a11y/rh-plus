
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const dbPath = path.resolve(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const csvData = `5,PC0002-T3,Intel Core i5-1235U,238GB SSD,16,2,2x 8GB,Notebook NIT - Caique,T3,ALOCADO,21,FORTALEZA/CE,,2026-03-10T17:05:19.330Z,2026-03-06T16:35:04.766Z,1,notebook,estoque,,,,2026-03-16 11:52:16
7,PC0003-T1,Intel Core i3-8145U,238GB SSD,8,2,2x 4GB,Notebook destinado ao estagiário de manutenção,T1,DISPONIVEL,,ESTOQUE,,,,0,notebook,estoque,,,,2026-03-16 11:52:16
10,PC0004-T2,Intel Core i3-1005G1,238GB SSD,8,2,2x 4GB,Equipamento apto para uso,T1,DISPONIVEL,,ESTOQUE,,2026-03-06T19:48:55.061Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
11,PC0005-T2,Intel Core i3-1005G1,220GB SSD,8,2,2x 4GB,Equipamento apto para uso,T1,DISPONIVEL,,ESTOQUE,,2026-03-10T17:00:05.791Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
12,PC0006-T1,Intel Core i3-6006U,238GB SSD,8,2,2x 4GB,Equipamento apto para uso,T1,DISPONIVEL,,ESTOQUE,,,,0,notebook,estoque,,,,2026-03-16 11:52:16
13,PC0007-T1,Intel Core i3-8130U,119GB SSD,8,1,1x 8GB,Equipamento apto para uso,T1,ALOCADO,9,,,2026-03-09T12:39:09.223Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
18,PC0008-T1,Intel Core i3-8145U,240GB SSD,8,2,2x 4GB,,T1,ALOCADO,11,,,2026-03-09T14:33:59.464Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
19,PC0009-T2,Intel Core i3-1005G1,240GB SSD,8,1,1x 8GB,,T1,ALOCADO,12,,,2026-03-09T14:56:35.340Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
20,PC0010-T2,Intel Core i3-1115G4,240GB SSD,8,1,1x 8GB,Notebook Erika,T1,ALOCADO,13,,,2026-03-09T18:17:41.434Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
21,PC0011-T3,Intel Core i5-1235U,480GB SSD,16,2,2x 8GB,,T3,ALOCADO,14,,,2026-03-09T18:27:19.635Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
22,PC0012-T2,Intel Core i3-1005G1,240GB SSD,8,1,1x 8GB,,T1,ALOCADO,15,Fortaleza - CE,,2026-03-10T14:34:29.758Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
23,PC0013-T2,Intel Core i3-1115G4,240GB SSD,8,2,2x 4GB,,T1,ALOCADO,16,,,2026-03-10T14:38:52.715Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
24,PC0014-T2,Intel Core i3-1115G4,240GB SSD,8,1,1x 8GB,,T1,ALOCADO,17,,,2026-03-10T14:44:51.241Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
25,PC0015-T2,Intel Core i3-1115G4,240GB SSD,8,1,1x 8GB,,T1,ALOCADO,18,,,2026-03-10T14:48:56.190Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
26,PC0016-T2,Intel Core i3-1115G4,240GB SSD,8,1,1x 8GB,,T1,ALOCADO,19,,,2026-03-10T14:56:37.091Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
27,PC0017-T2,Intel Core i3-1005G1,240GB SSD,8,2,2x 4GB,,T1,ALOCADO,22,,,2026-03-10T17:20:11.353Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
28,PC0018-T2,Intel Core i3-1005G1,128GB SSD,8,1,1x 4GB,Necessita upgrade de RAM para padronização,T1,ALOCADO,23,,,2026-03-11T17:56:40.128Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
29,PC0019-T2,Intel Core i3-1005G1,240GB SSD,12,2,1x 8GB + 1x 4GB,,T1,ALOCADO,24,,,2026-03-11T19:23:47.031Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
30,PC0020-T3,Intel Core i5-1340P,480GB SSD,16,2,2x 8GB,,T3,ALOCADO,25,,,2026-03-12T14:10:31.290Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
31,PC0021-T2,Intel Core i3-1115G4,240GB SSD,8,1,1x 8GB,,T1,ALOCADO,26,,,2026-03-12T14:27:30.374Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
32,PC0022-T2,Intel Core i3-1005G1,240GB SSD,4,1,1x 4GB,,T1,ALOCADO,27,,,2026-03-12T14:31:49.547Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
33,PC0023-T2,Intel Core i3-1215U,240GB SSD,8,1,1x 8GB,,T1,ALOCADO,28,,,2026-03-12T14:36:22.329Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
34,PC0024-T2,Intel Core i3-1115G4,240GB SSD,8,1,1x 8GB,,T1,ALOCADO,29,,,2026-03-12T14:39:19.601Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
35,PC0025-T2,Intel Core i3-1115G4,240GB SSD,8,1,1x 8GB,,T1,ALOCADO,30,,,2026-03-12T14:42:54.018Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
36,PC0026-T2,Intel Core i3-1005G1,240GB SSD,8,2,2x 8GB,,T1,ALOCADO,31,,,2026-03-12T14:50:34.839Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
37,PC0027-T2,Intel Core i3-1115G4,240GB SSD,8,1,1x 8GB,,T1,ALOCADO,32,,,2026-03-12T14:56:09.867Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
38,PC0028-T2,Intel Core i3-8130U,240GB SSD,12,2,1x 4GB + 1x 8GB,,T1,ALOCADO,33,,,2026-03-12T15:00:51.489Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
39,PC0029-T2,Intel Core i3-1005G1,240GB SSD,8,2,2x 4GB,,T1,ALOCADO,34,,,2026-03-12T15:27:03.317Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
40,PC0030-T2,Intel Core i3-1115G4,240GB SSD,8,1,1x 8GB,,T1,ALOCADO,35,,,2026-03-12T17:52:59.436Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
41,PC0031-T2,Intel Core i3-6006U,240GB SSD,8,2,2x 4GB,,T1,ALOCADO,36,,,2026-03-12T18:04:03.406Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
42,PC0032-T2,Intel Core i3-1215U,240GB SSD,8,1,1x 8GB,,T1,ALOCADO,37,,,2026-03-12T18:09:48.807Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
43,PC0033-T2,Intel Core i5-8265U,240GB SSD,8,1,1x 8GB,,T3,ALOCADO,38,,,2026-03-12T18:28:05.928Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
44,PC0034-T2,Intel Core i3-1005G1,240GB SSD,8,1,1x 8GB,,T1,ALOCADO,39,,,2026-03-12T19:19:17.198Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
45,PC0035-T3,Intel Core i5-1340P,,16,2,2x 8GB,,T3,ALOCADO,40,,,2026-03-12T19:30:34.428Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
46,PC0036-T3,Intel Core i5-1135G7,240GB SSD,16,2,2x 8GB,,T3,ALOCADO,41,,,2026-03-12T19:35:17.587Z,,0,notebook,estoque,,,,2026-03-16 11:52:16
47,PC0037-T2,Intel Core i3-1115G4,240GB SSD,8,1,1x 8GB,,T1,ALOCADO,42,,,2026-03-12T19:41:45.811Z,,0,notebook,estoque,,,,2026-03-16 11:52:16`;

const lines = csvData.trim().split('\n');
const generateId = () => crypto.randomBytes(4).toString('hex');

db.serialize(() => {
    // Criação forçada
    db.run(`CREATE TABLE IF NOT EXISTS tool_items (
            id TEXT PRIMARY KEY,
            employee_id TEXT,
            type TEXT,
            brand TEXT,
            model TEXT,
            serial_number TEXT,
            patrimonio TEXT,
            accessories TEXT,
            storage TEXT,
            ram TEXT,
            slots TEXT,
            tier TEXT,
            date_given TEXT,
            status TEXT DEFAULT 'Em uso'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tool_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tool_id TEXT,
            employee_id TEXT,
            action TEXT,
            status_item TEXT,
            observation TEXT,
            data_hora TEXT DEFAULT (datetime('now', 'localtime')),
            responsavel TEXT
    )`);

    // Ingestão
    db.all("SELECT id, name FROM employees", [], (err, employees) => {
        if (err) { console.error("Erro funcionários:", err); return; }

        lines.forEach(line => {
            const parts = line.split(',');
            const pat = parts[1];
            const cpu = parts[2];
            const storage = parts[3];
            const ram = parts[4];
            const slotsCount = parts[5];
            const slotsDetail = parts[6];
            const details = parts[7];
            const tier = parts[8];
            const status = parts[9];
            const data_given = parts[13] || parts[14] || new Date().toISOString();

            let targetName = "";
            if (details.includes('-')) targetName = details.split('-').pop().trim();
            else if (details.toLowerCase().includes('notebook')) targetName = details.split(' ').pop().trim();

            let employee = employees.find(e => e.name.toLowerCase().includes(targetName.toLowerCase()) && targetName.length > 2);
            if (!employee && targetName.toLowerCase() === "erika") employee = employees.find(e => e.name.toLowerCase().includes("erika"));
            if (!employee && targetName.toLowerCase() === "caique") employee = employees.find(e => e.name.toLowerCase().includes("caique"));
            
            const employee_id = employee ? employee.id : null;
            const finalStatus = status === 'ALOCADO' ? 'Em uso' : 'Disponível';
            const itemId = crypto.randomBytes(4).toString('hex');

            const sql = "INSERT INTO tool_items (id, employee_id, type, brand, model, serial_number, patrimonio, accessories, storage, ram, slots, tier, date_given, status) VALUES (?, ?, 'Notebook', 'NIT / HP', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            db.run(sql, [itemId, employee_id, cpu, 'SN-'+pat, pat, slotsDetail, storage, ram+'GB', slotsCount+' Slots', tier, data_given, finalStatus], function(err) {
                if(err) console.log("Erro " + pat + ": " + err.message);
                else console.log("OK: " + pat);
            });
        });
    });
});

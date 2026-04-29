const { query } = require('../config/database');

async function listUpdatedUnits() {
  try {
    const result = await query(`
      SELECT DISTINCT o.employee_id, o.nome, o.unidade as unidade_atualizada, e.name as nome_funcionario, wp.name as unidade_vinculo
      FROM overtime_records o
      LEFT JOIN employees e ON o.employee_id = e.id
      LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
      LEFT JOIN companies wp ON ev.workplace_id = wp.id
      WHERE o.unidade IS NOT NULL AND o.unidade != ''
      ORDER BY o.nome
    `);
    
    console.log('📋 Colaboradores que tiveram unidades atualizadas:');
    console.log('━'.repeat(80));
    console.log('NOME'.padEnd(40) + 'UNIDADE ATUALIZADA'.padEnd(35) + 'UNIDADE VÍNCULO');
    console.log('━'.repeat(80));
    
    const uniqueEmployees = {};
    result.rows.forEach(row => {
      if (!uniqueEmployees[row.employee_id]) {
        uniqueEmployees[row.employee_id] = row;
      }
    });
    
    Object.values(uniqueEmployees).forEach(row => {
      const nome = (row.nome || row.nome_funcionario || 'N/A').substring(0, 38);
      const unidade = (row.unidade_atualizada || 'N/A').substring(0, 33);
      const vinculo = (row.unidade_vinculo || 'N/A').substring(0, 33);
      console.log(`${nome.padEnd(40)}${unidade.padEnd(35)}${vinculo}`);
    });
    
    console.log('━'.repeat(80));
    console.log(`Total: ${Object.keys(uniqueEmployees).length} colaboradores`);
    
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

listUpdatedUnits();

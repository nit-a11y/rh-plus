const { query } = require('../config/database');

async function listActiveEmployeesWithoutWorkplace() {
  try {
    // Buscar colaboradores ativos que não têm workplace/vínculo
    const result = await query(`
      SELECT DISTINCT 
        e.id as employee_id,
        e.name as nome,
        e."registrationNumber" as matricula,
        e.role as cargo,
        e.sector as setor,
        e.type as tipo,
        e."admissionDate" as data_admissao
      FROM employees e
      LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id
      WHERE 
        (e.type IS NULL OR e.type != 'Desligado')
        AND (ev.workplace_id IS NULL OR ev.workplace_id = '')
      ORDER BY e.name
    `);
    
    console.log('📋 Colaboradores ATIVOS sem Workplace/Vínculo:');
    console.log('━'.repeat(100));
    console.log('NOME'.padEnd(45) + 'MATRÍCULA'.padEnd(12) + 'CARGO'.padEnd(25) + 'SETOR'.padEnd(20) + 'TIPO'.padEnd(12) + 'ADMISSÃO');
    console.log('━'.repeat(100));
    
    if (result.rows.length === 0) {
      console.log('✅ Todos os colaboradores ativos possuem workplace!');
      return;
    }
    
    result.rows.forEach((row, index) => {
      const nome = (row.nome || 'N/A').substring(0, 43);
      const matricula = (row.matricula || 'N/A').substring(0, 10);
      const cargo = (row.cargo || 'N/A').substring(0, 23);
      const setor = (row.setor || 'N/A').substring(0, 18);
      const tipo = (row.tipo || 'N/A').substring(0, 10);
      const admissao = (row.data_admissao || 'N/A').substring(0, 10);
      
      console.log(`${nome.padEnd(45)}${matricula.padEnd(12)}${cargo.padEnd(25)}${setor.padEnd(20)}${tipo.padEnd(12)}${admissao}`);
    });
    
    console.log('━'.repeat(100));
    console.log(`Total: ${result.rows.length} colaboradores ativos sem workplace`);
    
    // Estatísticas adicionais
    const stats = await query(`
      SELECT 
        COUNT(*) as total_colaboradores,
        COUNT(CASE WHEN type IS NULL OR type != 'Desligado' THEN 1 END) as ativos,
        COUNT(CASE WHEN type = 'Desligado' THEN 1 END) as desligados
      FROM employees
    `);
    
    const totalStats = stats.rows[0];
    console.log('\n📈 Estatísticas Gerais:');
    console.log(`   - Total de colaboradores: ${totalStats.total_colaboradores}`);
    console.log(`   - Colaboradores ativos: ${totalStats.ativos}`);
    console.log(`   - Colaboradores desligados: ${totalStats.desligados}`);
    console.log(`   - Ativos sem workplace: ${result.rows.length} (${((result.rows.length / totalStats.ativos) * 100).toFixed(1)}%)`);
    
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

listActiveEmployeesWithoutWorkplace();

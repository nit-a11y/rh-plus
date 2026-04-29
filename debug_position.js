const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'rh',
  user: 'rhplus_user',
  password: '12Nordeste34+'
});

async function debugPosition() {
  try {
    const monthNumber = 1; // JANEIRO
    const year = 2026;
    
    // Query exata do endpoint count com filtros
    let query = `
      SELECT 
        c.name as unidade,
        COUNT(*) as total_colaboradores,
        COUNT(CASE WHEN e."terminationDate" IS NULL THEN 1 END) as ativos,
        COUNT(CASE WHEN e."terminationDate" IS NOT NULL THEN 1 END) as inativos
      FROM employees e
      INNER JOIN companies c ON e.workplace_id = c.id
      WHERE c.name = $1
    `;
    
    const params = ['NORDESTE LOCACOES - FORTALEZA'];
    let paramIndex = 2;

    if (monthNumber && year) {
      query += ` AND EXTRACT(MONTH FROM TO_DATE(e."admissionDate", 'YYYY-MM-DD')) = $${paramIndex} AND EXTRACT(YEAR FROM TO_DATE(e."admissionDate", 'YYYY-MM-DD')) = $${paramIndex + 1}`;
      params.push(monthNumber, year);
      paramIndex += 2;
    } else if (year) {
      query += ` AND EXTRACT(YEAR FROM TO_DATE(e."admissionDate", 'YYYY-MM-DD')) = $${paramIndex}`;
      params.push(year);
      paramIndex += 1;
    }

    query += ` GROUP BY c.name`;
    
    console.log('Query final:');
    console.log(query);
    console.log('Params:', params);
    console.log('Query length:', query.length);
    
    // Mostrar caractere na posição 409
    if (query.length > 409) {
      console.log('Caractere na posição 409:', query.charAt(409));
      console.log('Contexto around 409:', query.substring(400, 420));
    }
    
    const result = await pool.query(query, params);
    
    console.log('Resultado:', JSON.stringify(result.rows, null, 2));
    
    await pool.end();
  } catch (err) {
    console.error('Erro:', err.message);
    console.error('Position:', err.position);
    if (err.position) {
      console.log('Caractere na posição do erro:', query.charAt(err.position - 1));
      console.log('Contexto around erro:', query.substring(err.position - 10, err.position + 10));
    }
  }
}

debugPosition();

/**
 * Contar colaboradores ativos em um período específico
 * Versão completamente reescrita e simplificada
 */

const { query } = require('../config/database');

/**
 * Contar colaboradores ativos em um período específico
 * Versão com lógica de intersecção de períodos e regras de quinzena
 */
async function countActiveEmployees(filterMonth, filterYear, filterUnit) {
    try {
        // Base SQL - contar colaboradores na unidade
        let sql = `
            SELECT COUNT(DISTINCT e.id) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE 1=1
        `;
        const params = [];
        
        // Adicionar filtro de unidade
        if (filterUnit) {
            sql += ` AND c.name = $1`;
            params.push(filterUnit);
        }
        
        // Se há filtro de período, aplicar lógica de intersecção
        if (filterMonth || filterYear) {
            let targetMonth = '';
            let targetYear = '';
            
            if (filterMonth) {
                targetMonth = filterMonth;
            }
            
            if (filterYear) {
                targetYear = filterYear;
            }
            
            // Converter mês para número
            const monthMap = {
                'JANEIRO': '01', 'FEVEREIRO': '02', 'MARCO': '03', 'ABRIL': '04',
                'MAIO': '05', 'JUNHO': '06', 'JULHO': '07', 'AGOSTO': '08',
                'SETEMBRO': '09', 'OUTUBRO': '10', 'NOVEMBRO': '11', 'DEZEMBRO': '12'
            };
            
            const monthNum = monthMap[targetMonth.toUpperCase()] || '';
            
            if (targetYear && monthNum) {
                // Período específico: YYYY-MM-DD
                const startDate = `${targetYear}-${monthNum}-01`;
                const endDate = `${targetYear}-${monthNum}-31`;
                
                // Lógica de intersecção de períodos com regras de quinzena
                sql += ` AND (
                    -- Condição 1: Intersecção básica de períodos
                    -- Colaborador estava ativo em algum momento do período filtrado
                    (e."admissionDate" <= $${params.length + 1} OR e."admissionDate" IS NULL)
                    AND (e.type IS NULL OR e.type != 'Desligado' OR 
                         e."terminationDate" IS NULL OR 
                         e."terminationDate" = '' OR 
                         e."terminationDate" >= $${params.length + 2})
                    
                    -- Condição 2: Regras especiais para admissões no período
                    AND (
                        -- Caso 1: Admitido antes do período (sempre conta)
                        OR (e."admissionDate" < $${params.length + 2})
                        
                        -- Caso 2: Admitido no período (só se primeira quinzena)
                        OR (e."admissionDate" BETWEEN $${params.length + 2} AND $${params.length + 1}
                            AND EXTRACT(DAY FROM TO_DATE(e."admissionDate", 'YYYY-MM-DD')) <= 15)
                    )
                    
                    -- Condição 3: Regras especiais para desligamentos no período
                    AND (
                        -- Sem desligamento ou desligado após o período
                        OR (e."terminationDate" IS NULL OR e."terminationDate" = '' OR e."terminationDate" > $${params.length + 1})
                        
                        -- Desligado no período (só se primeira quinzena)
                        OR (e."terminationDate" BETWEEN $${params.length + 2} AND $${params.length + 1}
                            AND EXTRACT(DAY FROM TO_DATE(e."terminationDate", 'YYYY-MM-DD')) <= 15)
                    )
                )`;
                
                params.push(endDate, startDate);
            } else if (targetYear) {
                // Apenas ano
                sql += ` AND (e."admissionDate" <= $${params.length + 1} OR e."admissionDate" IS NULL)`;
                params.push(`${targetYear}-12-31`);
            }
        } else {
            // Sem filtro específico, contar apenas colaboradores ativos
            sql += ` AND (e.type IS NULL OR e.type != 'Desligado')`;
        }
        
        const result = await query(sql, params);
        return parseInt(result.rows[0]?.count || 0);
        
    } catch (error) {
        console.error('Erro ao contar colaboradores ativos no período:', error);
        return 0;
    }
}

module.exports = {
    countActiveEmployees
};

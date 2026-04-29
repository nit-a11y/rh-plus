/**
 * API DE CONTADOR DE COLABORADORES
 * Retorna número de colaboradores por unidade/mês/ano
 * ALGORITMO CORRETO: Contagem de existência no período
 */

const { query } = require('../config/database');

class EmployeeCounterService {
    
    /**
     * Converter mês para número
     * @param {string} month - Nome do mês
     * @returns {number} - Número do mês
     */
    monthToNumber(month) {
        const monthMap = {
            'JANEIRO': 1, 'FEVEREIRO': 2, 'MARÇO': 3, 'ABRIL': 4,
            'MAIO': 5, 'JUNHO': 6, 'JULHO': 7, 'AGOSTO': 8,
            'SETEMBRO': 9, 'OUTUBRO': 10, 'NOVEMBRO': 11, 'DEZEMBRO': 12
        };
        return monthMap[month?.toUpperCase()] || 1;
    }
    
    /**
     * Converter período para datas reais
     * @param {string} year - Ano
     * @param {string} month - Mês
     * @returns {Object} - Datas do período
     */
    parsePeriodDates(year, month) {
        const monthNum = this.monthToNumber(month);
        const yearNum = parseInt(year) || new Date().getFullYear();
        
        // EXEMPLO: JANEIRO 2026
        // periodStart = 2026-01-01
        // periodEnd = 2026-01-31
        
        const periodStart = new Date(yearNum, monthNum - 1, 1);
        const periodEnd = new Date(yearNum, monthNum, 0); // último dia do mês
        
        return {
            periodStart: periodStart.toISOString().split('T')[0],
            periodEnd: periodEnd.toISOString().split('T')[0]
        };
    }
    
    /**
     * Contar colaboradores por unidade em um período específico
     * ALGORITMO CORRETO: Contagem de quem EXISTE no período
     * @param {string} unit - Nome da unidade
     * @param {string} year - Ano (ex: "2026")
     * @param {string} month - Mês (ex: "JANEIRO")
     * @returns {Object} - Contagem de colaboradores
     */
    async countEmployeesByUnit(unit, year, month) {
        try {
            const dates = this.parsePeriodDates(year, month);
            
            // ALGORITMO MENTAL CORRETO:
            // Um colaborador EXISTE no período se:
            // 1. Ele entrou antes do fim do período (admission_date <= fim)
            // 2. Ele não saiu antes do início (termination_date é nulo OU >= início)
            
            const sql = `
                SELECT COUNT(e.id) as total_colaboradores
                FROM employees e
                INNER JOIN companies c ON e.workplace_id = c.id
                WHERE 
                    c.name = $1
                    AND c.name IS NOT NULL 
                    AND c.name != ''
                    AND e.type != 'Desligado'
                    AND e.admissionDate <= $2
                    AND (
                        e.terminationDate IS NULL 
                        OR e.terminationDate = '' 
                        OR e.terminationDate >= $3
                    )
            `;
            
            const result = await query(sql, [unit, dates.periodEnd, dates.periodStart]);
            const count = parseInt(result.rows[0]?.total_colaboradores || 0);
            
            console.log(`📊 Headcount ${unit} ${month} ${year}: ${count} colaboradores`);
            
            return {
                unidade: unit,
                ano: year,
                mes: month,
                total_colaboradores: count,
                capacidade_horas: count * 220,
                data_consulta: new Date().toISOString(),
                // Adicionando workplace_id para debug
                workplace_id: unit
            };
            
        } catch (error) {
            console.error('Erro em countEmployeesByUnit:', error);
            throw error;
        }
    }
    
    /**
     * Contar colaboradores para múltiplas unidades em um período
     * ALGORITMO CORRETO: Contagem de quem EXISTE no período
     * @param {Array} units - Lista de unidades
     * @param {string} year - Ano
     * @param {string} month - Mês
     * @returns {Array} Lista de contagens
     */
    async countEmployeesByUnits(units, year, month) {
        try {
            const dates = this.parsePeriodDates(year, month);
            
            // ALGORITMO CORRETO: Buscar todos os colaboradores das unidades
            // e aplicar a regra de existência no período
            const sql = `
                SELECT 
                    c.name as unidade,
                    COUNT(e.id) as colaboradores
                FROM employees e
                INNER JOIN companies c ON e.workplace_id = c.id
                WHERE 
                    c.name IN (${units.map((_, i) => `$${i + 1}`).join(',')})
                    AND c.name IS NOT NULL 
                    AND c.name != ''
                    AND e.type != 'Desligado'
                    AND e."admissionDate" <= '${dates.periodEnd}'
                    AND (
                        e."terminationDate" IS NULL 
                        OR e."terminationDate" = '' 
                        OR e."terminationDate" >= '${dates.periodStart}'
                    )
                GROUP BY c.name
                ORDER BY colaboradores DESC
            `;
            
            const result = await query(sql, []);
            const unidades = result.rows.map(row => ({
                unidade: row.unidade,
                colaboradores: parseInt(row.colaboradores),
                periodo: `${month} ${year}`,
                workplace_id: row.unidade // Adicionando workplace_id para debug
            }));
            
            console.log(`📊 Headcount múltiplas unidades ${month} ${year}: ${unidades.length} unidades, ${unidades.reduce((sum, u) => sum + u.colaboradores, 0)} colaboradores totais`);
            
            return {
                periodo: `${month} ${year}`,
                total_unidades: unidades.length,
                total_colaboradores: unidades.reduce((sum, item) => sum + item.colaboradores, 0),
                unidades: unidades
            };
            
        } catch (error) {
            console.error('Erro em countEmployeesByUnits:', error);
            throw error;
        }
    }
    
    /**
     * Contar colaboradores para todos os meses de um ano
     * ALGORITMO CORRETO: Contagem de existência no período
     * @param {string} unit - Nome da unidade
     * @param {string} year - Ano
     * @returns {Array} Contagem mensal
     */
    async countEmployeesMonthly(unit, year) {
        try {
            const months = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 
                          'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
            
            const promises = months.map(month => 
                this.countEmployeesByUnit(unit, year, month)
            );
            
            const results = await Promise.all(promises);
            
            const totalAnual = results.reduce((sum, item) => sum + item.total_colaboradores, 0);
            
            console.log(`📊 Headcount mensal ${unit} ${year}: média anual ${Math.round(totalAnual / 12)} colaboradores`);
            
            return {
                unidade: unit,
                ano: year,
                media_anual: Math.round(totalAnual / 12),
                total_anual: totalAnual,
                meses: results
            };
            
        } catch (error) {
            console.error('Erro em countEmployeesMonthly:', error);
            throw error;
        }
    }
    
    /**
     * Converter período para datas CORRETAS
     * @param {string} year - Ano
     * @param {string} month - Mês
     * @returns {Object} Datas do período
     */
    parsePeriodDates(year, month) {
        const monthMap = {
            'JANEIRO': 1, 'FEVEREIRO': 2, 'MARÇO': 3, 'ABRIL': 4,
            'MAIO': 5, 'JUNHO': 6, 'JULHO': 7, 'AGOSTO': 8,
            'SETEMBRO': 9, 'OUTUBRO': 10, 'NOVEMBRO': 11, 'DEZEMBRO': 12
        };
        
        const monthNum = monthMap[month?.toUpperCase()] || 1;
        const yearNum = parseInt(year) || new Date().getFullYear();
        
        // EXEMPLO: JANEIRO 2026
        // periodStart = 2026-01-01
        // periodEnd = 2026-01-31
        
        const periodStart = new Date(yearNum, monthNum - 1, 1);
        const periodEnd = new Date(yearNum, monthNum, 0); // último dia do mês
        
        return {
            periodStart: periodStart.toISOString().split('T')[0],
            periodEnd: periodEnd.toISOString().split('T')[0]
        };
    }
}

module.exports = new EmployeeCounterService();

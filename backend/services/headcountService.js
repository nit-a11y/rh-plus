/**
 * SERVIÇO ESPECIALIZADO: Headcount por Unidade e Período
 * Fonte de dados: Employees + Companies
 * Objetivo: Contagem total de colaboradores por unidade em determinado período
 */

const { query } = require('../config/database');

class HeadcountService {
    
    /**
     * Função principal: Obter colaboradores por unidade no período
     * Conta TODOS os colaboradores (inclusive desligados) presentes no período
     * 
     * @param {string} periodYear - Ano do período (ex: "2026")
     * @param {string} periodMonth - Mês do período (ex: "JANEIRO")
     * @param {string} unitFilter - Filtro opcional por unidade
     * @returns {Array} Lista de unidades com contagem de colaboradores
     */
    async getColaboradoresPorUnidade(periodYear, periodMonth, unitFilter = null) {
        try {
            // Converter período para datas específicas
            const periodDates = this.parsePeriodDates(periodYear, periodMonth);
            
            let sql = `
                SELECT 
                    c.name as unidade_funcional,
                    COUNT(DISTINCT e.id) as total_colaboradores,
                    COUNT(DISTINCT e.id) * 220 as capacidade_horas_mensal
                FROM employees e
                INNER JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
                INNER JOIN companies c ON ev.workplace_id = c.id
                WHERE 
                    c.name IS NOT NULL 
                    AND c.name != ''
                    AND (e."admissionDate" <= $1 OR e."admissionDate" IS NULL)
                    AND (
                        e.type IS NULL OR 
                        e.type != 'Desligado' OR 
                        e."terminationDate" IS NULL OR 
                        e."terminationDate" = '' OR 
                        e."terminationDate" >= $2
                    )
            `;
            
            const params = [periodDates.periodEnd, periodDates.periodStart];
            let paramIndex = 2;
            
            if (unitFilter) {
                paramIndex++;
                sql += ` AND c.name = $${paramIndex}`;
                params.push(unitFilter);
            }
            
            sql += ` GROUP BY c.name ORDER BY total_colaboradores DESC`;
            
            const result = await query(sql, params);
            
            return result.rows.map(row => ({
                unidade_funcional: row.unidade_funcional,
                total_colaboradores: parseInt(row.total_colaboradores || 0),
                capacidade_horas_mensal: parseInt(row.capacidade_horas_mensal || 0),
                periodo_analise: `${periodMonth} ${periodYear}`,
                data_referencia: new Date().toISOString()
            }));
            
        } catch (error) {
            console.error('Erro em getColaboradoresPorUnidade:', error);
            throw error;
        }
    }
    
    /**
     * Converter período (ano/mês) para datas de consulta
     * @param {string} year - Ano (ex: "2026")
     * @param {string} month - Mês (ex: "JANEIRO")
     * @returns {Object} Datas de início e fim do período
     */
    parsePeriodDates(year, month) {
        const monthMap = {
            'JANEIRO': 1, 'FEVEREIRO': 2, 'MARÇO': 3, 'ABRIL': 4,
            'MAIO': 5, 'JUNHO': 6, 'JULHO': 7, 'AGOSTO': 8,
            'SETEMBRO': 9, 'OUTUBRO': 10, 'NOVEMBRO': 11, 'DEZEMBRO': 12
        };
        
        const monthNum = monthMap[month?.toUpperCase()] || 1;
        const yearNum = parseInt(year) || new Date().getFullYear();
        
        // Data de início: primeiro dia do mês
        const periodStart = new Date(yearNum, monthNum - 1, 1);
        
        // Data de fim: último dia do mês
        const periodEnd = new Date(yearNum, monthNum, 0);
        
        return {
            periodStart: periodStart.toISOString().split('T')[0],
            periodEnd: periodEnd.toISOString().split('T')[0]
        };
    }
    
    /**
     * Obter contagem específica para uma unidade
     * @param {string} unitName - Nome da unidade
     * @param {string} periodYear - Ano
     * @param {string} periodMonth - Mês
     * @returns {Object} Dados da unidade específica
     */
    async getContagemUnidadeEspecifica(unitName, periodYear, periodMonth) {
        try {
            const result = await this.getColaboradoresPorUnidade(periodYear, periodMonth, unitName);
            return result.find(r => r.unidade_funcional === unitName) || {
                unidade_funcional: unitName,
                total_colaboradores: 0,
                capacidade_horas_mensal: 0,
                periodo_analise: `${periodMonth} ${periodYear}`,
                data_referencia: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erro em getContagemUnidadeEspecifica:', error);
            throw error;
        }
    }
    
    /**
     * Mapear unidades diferentes (ajuste de nomes)
     * Para igualar nomes entre diferentes tabelas/fontes
     * @param {Array} unidades - Lista de unidades para mapeamento
     * @returns {Object} Mapa de mapeamento
     */
    criarMapaUnidades(unidades) {
        const mapa = {};
        
        unidades.forEach(unidade => {
            const nomeNormalizado = unidade.toLowerCase().trim();
            
            // Mapeamentos comuns (ajustar conforme necessário)
            const mapeamentos = {
                'nordeste locacoes fortaleza': 'nordeste locações fortaleza',
                'nordeste locações': 'nordeste locações fortaleza',
                'fortaleza': 'nordeste locações fortaleza',
                // Adicionar outros mapeamentos conforme necessidade
            };
            
            mapa[nomeNormalizado] = mapeamentos[nomeNormalizado] || unidade;
        });
        
        return mapa;
    }
}

module.exports = new HeadcountService();

/**
 * 🏗️ CAMADA DE SERVIÇO ANALÍTICO TRANSVERSAL
 * Fonte de verdade: Employees → Companies
 * Não depende de módulos específicos, consulta múltiplas tabelas
 */

const { query } = require('../config/database');

class AnalyticsService {
        
    /**
     * ⏰ FUNÇÃO: Obter horas extras por unidade no período
     * Fonte de verdade: Overtime Records → Employees → Companies
     */
    async getOvertimeByUnit(periodYear, periodMonth, unitFilter = null) {
        try {
            let sql = `
                SELECT 
                    COALESCE(c.name, 'Sem Unidade') as unidade,
                    COUNT(*) as total_registros,
                    COUNT(DISTINCT o.employee_id) as colaboradores_com_horas,
                    COALESCE(SUM(
                        CASE 
                            WHEN o.extra ~ '^[0-9]{1,2}:[0-9]{2}$' THEN
                                CAST(SPLIT_PART(o.extra, ':', 1) AS INTEGER) * 60 +
                                CAST(SPLIT_PART(o.extra, ':', 2) AS INTEGER)
                            ELSE 0
                        END
                    ), 0) as total_minutos,
                    COALESCE(SUM(o.valor), 0) as valor_total
                FROM overtime_records o
                JOIN employees e ON o.employee_id = e.id
                LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
                LEFT JOIN companies c ON ev.workplace_id = c.id
                WHERE 1=1
            `;
            
            const params = [];
            let paramIndex = 0;
            
            if (periodYear) {
                paramIndex++;
                sql += ` AND o.mes ILIKE $${paramIndex}`;
                params.push(`%${periodYear}%`);
            }
            
            if (periodMonth) {
                paramIndex++;
                sql += ` AND o.mes ILIKE $${paramIndex}`;
                params.push(`%${periodMonth}%`);
            }
            
            if (unitFilter) {
                paramIndex++;
                sql += ` AND c.name = $${paramIndex}`;
                params.push(unitFilter);
            }
            
            sql += ` GROUP BY c.name ORDER BY total_minutos DESC`;
            
            const result = await query(sql, params);
            
            return result.rows.map(row => ({
                unidade: row.unidade,
                registros: parseInt(row.total_registros),
                colaboradores_com_horas: parseInt(row.colaboradores_com_horas),
                horas_totais_decimal: parseFloat(row.total_minutos) / 60,
                horas_totais_formatadas: row.total_minutos ? 
                    `${Math.floor(row.total_minutos / 60).toString().padStart(2, '0')}:${(row.total_minutos % 60).toString().padStart(2, '0')}` 
                    : '00:00',
                valor_total: parseFloat(row.valor_total)
            }));
            
        } catch (error) {
            console.error('Erro em getOvertimeByUnit:', error);
            throw error;
        }
    }
    
    /**
     * @description
     * Função simplificada: Mostrador de quantidade de colaboradores por unidade
     */
    async getHoursVsEmployeesAnalysis(periodYear, periodMonth, unitFilter = null) {
        try {
            // Buscar contagem de colaboradores via API
            const employeeCounterService = require('./employeeCounterService');
            
            if (unitFilter) {
                // Consulta individual para unidade específica
                const result = await employeeCounterService.countEmployeesByUnit(unitFilter, periodYear, periodMonth);
                return {
                    data: [{
                        unidade: result.unidade,
                        colaboradores: result.total_colaboradores,
                        periodo: `${periodMonth} ${periodYear}`
                    }],
                    meta: {
                        total_unidades: 1,
                        total_colaboradores: result.total_colaboradores,
                        period: `${periodMonth || 'Todos'} ${periodYear || 'Todos'}`.trim()
                    }
                };
            } else {
                // Consulta para todas as unidades disponíveis
                const units = ['NORDESTE LOCAÇÕES - EUSÉBIO', 'NORDESTE LOCACOES - FORTALEZA', 
                             'NORDESTE LOCAÇÕES - JUAZEIRO DO NORTE', 'NORDESTE LOCAÇÕES - SÃO LUÍS'];
                
                const batchResult = await employeeCounterService.countEmployeesByUnits(units, periodYear, periodMonth);
                
                const results = batchResult.unidades.map(unit => ({
                    unidade: unit.unidade,
                    colaboradores: unit.total_colaboradores,
                    periodo: `${periodMonth} ${periodYear}`
                }));
                
                return {
                    data: results,
                    meta: {
                        total_unidades: results.length,
                        total_colaboradores: results.reduce((sum, item) => sum + item.colaboradores, 0),
                        period: `${periodMonth || 'Todos'} ${periodYear || 'Todos'}`.trim()
                    }
                };
            }
            
        } catch (error) {
            console.error('Erro em getHoursVsEmployeesAnalysis:', error);
            throw error;
        }
    }
    
    /**
     * 📅 FUNÇÃO AUXILIAR: Converter período para data de início
     */
    parsePeriodStart(year, month) {
        if (!year) return '1900-01-01';
        
        const monthMap = {
            'JANEIRO': '01', 'FEVEREIRO': '02', 'MARÇO': '03', 'ABRIL': '04',
            'MAIO': '05', 'JUNHO': '06', 'JULHO': '07', 'AGOSTO': '08',
            'SETEMBRO': '09', 'OUTUBRO': '10', 'NOVEMBRO': '11', 'DEZEMBRO': '12'
        };
        
        const monthNum = month ? monthMap[month.toUpperCase()] || '01' : '01';
        return `${year}-${monthNum}-01`;
    }
    
    /**
     * 📅 FUNÇÃO AUXILIAR: Converter período para data de fim
     */
    parsePeriodEnd(year, month) {
        if (!year) return '2099-12-31';
        
        const monthMap = {
            'JANEIRO': '01', 'FEVEREIRO': '02', 'MARÇO': '03', 'ABRIL': '04',
            'MAIO': '05', 'JUNHO': '06', 'JULHO': '07', 'AGOSTO': '08',
            'SETEMBRO': '09', 'OUTUBRO': '10', 'NOVEMBRO': '11', 'DEZEMBRO': '12'
        };
        
        const monthNum = month ? monthMap[month.toUpperCase()] || '12' : '12';
        
        // Último dia do mês
        const lastDay = new Date(year, monthNum, 0).getDate();
        return `${year}-${monthNum}-${lastDay}`;
    }
    
    /**
     * 🏷️ FUNÇÃO AUXILIAR: Classificar status
     */
    classifyStatus(ratio) {
        if (ratio >= 1) return 'Acima do esperado';
        if (ratio >= 0.8) return 'Adequado';
        return 'Abaixo do esperado';
    }
    
    /**
     * 📊 FUNÇÃO: Obter unidades disponíveis
     */
    async getAvailableUnits() {
        try {
            const sql = `
                SELECT DISTINCT unidade
                FROM overtime_records
                WHERE unidade IS NOT NULL AND unidade != ''
                ORDER BY unidade
            `;
            
            const result = await query(sql);
            return result.rows.map(row => row.unidade);
            
        } catch (error) {
            console.error('Erro em getAvailableUnits:', error);
            throw error;
        }
    }
    
    /**
     * 📈 FUNÇÃO: Obter períodos disponíveis
     */
    async getAvailablePeriods() {
        try {
            const sql = `
                SELECT DISTINCT 
                    mes,
                    EXTRACT(YEAR FROM TO_DATE(SPLIT_PART(mes, ' ', 2), 'YYYY-MM-DD')) as ano,
                    EXTRACT(MONTH FROM TO_DATE(SPLIT_PART(mes, ' ', 2), 'YYYY-MM-DD')) as mes_num
                FROM overtime_records 
                WHERE mes IS NOT NULL
                ORDER BY ano DESC, mes_num DESC
            `;
            
            const result = await query(sql);
            return result.rows.map(row => ({
                mes: row.mes,
                ano: parseInt(row.ano),
                mes_num: parseInt(row.mes_num)
            }));
            
        } catch (error) {
            console.error('Erro em getAvailablePeriods:', error);
        }
        
        if (unit) {
            paramIndex++;
            sql += ` AND unidade = $${paramIndex}`;
            params.push(unit);
            throw error;
        }
    }
    
    /**
     * CAMADA 1: Métricas de EVENTO (fonte: overtime_records)
     */
    async getEventMetrics(periodYear, periodMonth, unit) {
        try {
            let sql = `
                SELECT 
                    COUNT(*) as total_registros,
                    COUNT(DISTINCT employee_id) as colaboradores_distintos,
                    COALESCE(SUM(valor), 0) as total_valor,
                    COALESCE(SUM(
                        CASE 
                            WHEN extra ~ '^[0-9]{1,2}:[0-9]{2}$' THEN
                                CAST(SPLIT_PART(extra, ':', 1) AS INTEGER) * 60 +
                                CAST(SPLIT_PART(extra, ':', 2) AS INTEGER)
                            ELSE 0
                        END
                    ), 0) as total_minutos
                FROM overtime_records
                WHERE 1=1
            `;
            
            const params = [];
            let paramIndex = 0;
            
            if (periodYear) {
                paramIndex++;
                sql += ` AND mes ILIKE $${paramIndex}`;
                params.push(`%${periodYear}%`);
            }
            
            if (periodMonth) {
                paramIndex++;
                sql += ` AND mes ILIKE $${paramIndex}`;
                params.push(`%${periodMonth}%`);
            }
            
            if (unit) {
                paramIndex++;
                sql += ` AND unidade = $${paramIndex}`;
                params.push(unit);
            }
            
            const result = await query(sql, params);
            const data = result.rows[0] || {};
            
            return {
                total_registros: parseInt(data.total_registros || 0),
                colaboradores_distintos: parseInt(data.colaboradores_distintos || 0),
                total_valor: parseFloat(data.total_valor || 0),
                total_minutos: parseFloat(data.total_minutos || 0),
                total_horas_decimal: parseFloat(data.total_minutos || 0) / 60,
                total_horas_formatadas: data.total_minutos ? 
                    `${Math.floor(data.total_minutos / 60).toString().padStart(2, '0')}:${(data.total_minutos % 60).toString().padStart(2, '0')}` 
                    : '00:00'
            };
            
        } catch (error) {
            console.error('Erro em getEventMetrics:', error);
            throw error;
        }
    }
    
    /**
     * CAMADA 2: Métricas de POPULAÇÃO (fonte: employees)
     * HEADCOUNT REAL - não "colaboradores que fizeram hora extra"
     */
    async getPopulationMetrics(periodStart, periodEnd, unit) {
        try {
            let sql = `
                SELECT COUNT(*) as total_colaboradores
                FROM employees e
                WHERE 
                    (e."admissionDate" <= $1 OR e."admissionDate" IS NULL)
                    AND (e.type IS NULL OR e.type != 'Desligado' OR 
                         e."terminationDate" IS NULL OR 
                         e."terminationDate" = '' OR 
                         e."terminationDate" >= $2)
            `;
            
            const params = [periodEnd, periodStart];
            let paramIndex = 2;
            
            if (unit) {
                paramIndex++;
                sql += ` AND e.employer_id IN (
                    SELECT id FROM companies WHERE name = $${paramIndex}
                )`;
                params.push(unit);
            }
            
            const result = await query(sql, params);
            
            return {
                total_colaboradores: parseInt(result.rows[0]?.total_colaboradores || 0)
            };
            
        } catch (error) {
            console.error('Erro em getPopulationMetrics:', error);
            throw error;
        }
    }
    
    /**
     * CAMADA 3: Métricas de PERÍODO (fonte: overtime_records)
     * Encontra mês com mais registros e mês de maior valor
     */
    async getPeriodMetrics(periodYear, periodMonth, unit) {
        try {
            let sql = `
                SELECT 
                    mes,
                    COUNT(*) as total_registros,
                    COALESCE(SUM(valor), 0) as total_valor
                FROM overtime_records
                WHERE 1=1
            `;
            
            const params = [];
            let paramIndex = 0;
            
            if (periodYear) {
                paramIndex++;
                sql += ` AND mes ILIKE $${paramIndex}`;
                params.push(`%${periodYear}%`);
            }
            
            if (periodMonth) {
                paramIndex++;
                sql += ` AND mes ILIKE $${paramIndex}`;
                params.push(`%${periodMonth}%`);
            }
            
            if (unit) {
                paramIndex++;
                sql += ` AND unidade = $${paramIndex}`;
                params.push(unit);
            }
            
            sql += ` GROUP BY mes ORDER BY total_registros DESC, total_valor DESC`;
            
            const result = await query(sql, params);
            
            let mesMaisRegistros = '-';
            let mesMaiorValor = '-';
            
            if (result.rows.length > 0) {
                // Encontrar mês com mais registros
                const maxRegistros = Math.max(...result.rows.map(r => parseInt(r.total_registros || 0)));
                const rowMaxRegistros = result.rows.find(r => parseInt(r.total_registros || 0) === maxRegistros);
                mesMaisRegistros = rowMaxRegistros ? rowMaxRegistros.mes : '-';
                
                // Encontrar mês com maior valor
                const maxValor = Math.max(...result.rows.map(r => parseFloat(r.total_valor || 0)));
                const rowMaxValor = result.rows.find(r => parseFloat(r.total_valor || 0) === maxValor);
                mesMaiorValor = rowMaxValor ? rowMaxValor.mes : '-';
            }
            
            return {
                mes_mais_registros: mesMaisRegistros,
                mes_maior_valor: mesMaiorValor
            };
            
        } catch (error) {
            console.error('Erro em getPeriodMetrics:', error);
            throw error;
        }
    }
    
    /**
     * DASHBOARD SIMPLIFICADO - Apenas dados de overtime_records
     */
    async getDashboard(periodYear, periodMonth, unit) {
        try {
            // Consulta direta à tabela overtime_records
            let sql = `
                SELECT 
                    COUNT(*) as total_registros,
                    COUNT(DISTINCT employee_id) as colaboradores_distintos,
                    COALESCE(SUM(valor), 0) as total_valor,
                    COALESCE(SUM(
                        CASE 
                            WHEN extra ~ '^[0-9]{1,2}:[0-9]{2}$' THEN
                                CAST(SPLIT_PART(extra, ':', 1) AS INTEGER) * 60 +
                                CAST(SPLIT_PART(extra, ':', 2) AS INTEGER)
                            ELSE 0
                        END
                    ), 0) as total_minutos
                FROM overtime_records
                WHERE 1=1
            `;
            
            const params = [];
            let paramIndex = 0;
            
            if (periodYear) {
                paramIndex++;
                sql += ` AND mes ILIKE $${paramIndex}`;
                params.push(`%${periodYear}%`);
            }
            
            if (periodMonth) {
                paramIndex++;
                sql += ` AND mes ILIKE $${paramIndex}`;
                params.push(`%${periodMonth}%`);
            }
            
            if (unit) {
                paramIndex++;
                sql += ` AND unidade = $${paramIndex}`;
                params.push(unit);
            }
            
            const result = await query(sql, params);
            const data = result.rows[0] || {};
            
            const total_registros = parseInt(data.total_registros || 0);
            const total_minutos = parseFloat(data.total_minutos || 0);
            const total_horas_decimal = total_minutos / 60;
            const total_valor = parseFloat(data.total_valor || 0);
            
            // Formatar horas
            const total_horas = total_minutos ? 
                `${Math.floor(total_minutos / 60).toString().padStart(2, '0')}:${(total_minutos % 60).toString().padStart(2, '0')}` 
                : '00:00';
            
            // Obter mês com mais registros e mês de maior valor
            const periodMetrics = await this.getPeriodMetrics(periodYear, periodMonth, unit);
            
            return {
                // Métricas principais
                total_registros: total_registros,
                total_valor: total_valor,
                total_horas: total_horas,
                total_hours_decimal: total_horas_decimal,
                
                // Métricas calculadas
                media_horas_por_registro: total_registros > 0 ? 
                    (total_horas_decimal / total_registros).toFixed(2) : 0,
                media_valor_por_hora: total_horas_decimal > 0 ? 
                    (total_valor / total_horas_decimal).toFixed(2) : 0,
                
                // Métricas de período
                mes_mais_registros: periodMetrics.mes_mais_registros,
                mes_maior_valor: periodMetrics.mes_maior_valor
            };
            
        } catch (error) {
            console.error('Erro em getDashboard:', error);
            throw error;
        }
    }
}

module.exports = new AnalyticsService();

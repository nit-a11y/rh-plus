/**
 * TIMELINE SIMPLES - MOSTRA APENAS ADMISSÕES E DESLIGAMENTOS REAIS
 * Abordagem direta: mostrar o que realmente aconteceu mês a mês
 */

const { query } = require('./config/database');

async function createSimpleTimeline() {
    try {
        console.log('Criando timeline simples...');
        
        // 1. Buscar todas as admissões por mês
        const admissions = await query(`
            SELECT 
                TO_DATE("admissionDate", 'YYYY-MM-DD') as month_date,
                DATE_TRUNC('month', TO_DATE("admissionDate", 'YYYY-MM-DD')) as month,
                COUNT(*) as admissions,
                array_agg(name ORDER BY name) as admitted_names
            FROM employees 
            WHERE "admissionDate" IS NOT NULL 
            AND "admissionDate" != ''
            GROUP BY DATE_TRUNC('month', TO_DATE("admissionDate", 'YYYY-MM-DD'))
            ORDER BY month ASC
        `);
        
        // 2. Buscar todos os desligamentos por mês
        const terminations = await query(`
            SELECT 
                TO_DATE("terminationDate", 'YYYY-MM-DD') as month_date,
                DATE_TRUNC('month', TO_DATE("terminationDate", 'YYYY-MM-DD')) as month,
                COUNT(*) as terminations,
                array_agg(name ORDER BY name) as terminated_names
            FROM employees 
            WHERE "terminationDate" IS NOT NULL 
            AND "terminationDate" != ''
            GROUP BY DATE_TRUNC('month', TO_DATE("terminationDate", 'YYYY-MM-DD'))
            ORDER BY month ASC
        `);
        
        console.log(`Encontrados ${admissions.rows.length} meses com admissões`);
        console.log(`Encontrados ${terminations.rows.length} meses com desligamentos`);
        
        // 3. Criar timeline combinado
        const timeline = [];
        const allMonths = new Set();
        
        // Coletar todos os meses
        admissions.rows.forEach(a => allMonths.add(a.month));
        terminations.rows.forEach(t => allMonths.add(t.month));
        
        // Para cada mês, criar entrada no timeline
        Array.from(allMonths).sort().forEach(month => {
            const monthAdmissions = admissions.rows.find(a => a.month.getTime() === month.getTime());
            const monthTerminations = terminations.rows.find(t => t.month.getTime() === month.getTime());
            
            timeline.push({
                month: month.toISOString().split('T')[0],
                month_formatted: month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                admissions: monthAdmissions?.admissions || 0,
                terminations: monthTerminations?.terminations || 0,
                net_change: (monthAdmissions?.admissions || 0) - (monthTerminations?.terminations || 0),
                admitted_names: monthAdmissions?.admitted_names || [],
                terminated_names: monthTerminations?.terminated_names || []
            });
        });
        
        // 4. Salvar em formato simples na tabela
        await saveSimpleTimeline(timeline);
        
        return timeline;
        
    } catch (error) {
        console.error('Erro ao criar timeline:', error);
        throw error;
    }
}

async function saveSimpleTimeline(timeline) {
    try {
        console.log('Salvando timeline simples...');
        
        // Limpar tabela
        await query('DELETE FROM population_history');
        
        // Inserir apenas dados agregados (não por unidade)
        let cumulativeTotal = 0;
        
        for (const monthData of timeline) {
            cumulativeTotal += monthData.net_change;
            
            await query(`
                INSERT INTO population_history 
                (id, record_date, unit_id, unit_name, total_employees, active_employees, inactive_employees, admissions_count, terminations_count, recorded_at)
                VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
            `, [
                require('crypto').randomBytes(4).toString('hex'),
                monthData.month,
                1, // Unit ID fixo para dados agregados
                'TODAS AS UNIDADES',
                Math.max(0, cumulativeTotal),
                Math.max(0, Math.floor(cumulativeTotal * 0.7)), // Estimativa de ativos
                Math.max(0, Math.floor(cumulativeTotal * 0.3)), // Estimativa de inativos
                monthData.admissions,
                monthData.terminations
            ]);
        }
        
        console.log(`Timeline salva: ${timeline.length} meses`);
        
    } catch (error) {
        console.error('Erro ao salvar timeline:', error);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    createSimpleTimeline()
        .then(timeline => {
            console.log('\nTimeline criada com sucesso!');
            console.log('Primeiros meses:');
            timeline.slice(0, 5).forEach(month => {
                console.log(`${month.month_formatted}: +${month.admissions} -${month.terminations} = ${month.net_change > 0 ? '+' : ''}${month.net_change}`);
            });
            console.log(`\nTotal de meses: ${timeline.length}`);
            process.exit(0);
        })
        .catch(error => {
            console.error('Falha:', error);
            process.exit(1);
        });
}

module.exports = { createSimpleTimeline };

/**
 * ROTAS ESPECIALIZADAS: Headcount por Unidade e Período
 * Serviço separado para contagem de colaboradores
 */

const express = require('express');
const router = express.Router();
const headcountService = require('../services/headcountService');

// ROTA: Obter colaboradores por unidade no período
router.get('/by-unit', async (req, res) => {
    try {
        const { year, month, unit } = req.query;
        
        console.log('Headcount Route - Parâmetros:', { year, month, unit });
        
        const result = await headcountService.getColaboradoresPorUnidade(year, month, unit);
        
        console.log('Headcount Route - Resultado:', result);
        
        res.json({
            success: true,
            data: result,
            meta: {
                period: `${month || 'Todos'} ${year || 'Todos'}`,
                total_units: result.length,
                total_employees: result.reduce((sum, item) => sum + item.total_colaboradores, 0)
            }
        });
    } catch (err) {
        console.error('Erro na rota headcount:', err);
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Teste específico para unidade "Nordeste Locações Fortaleza"
router.get('/test-fortaleza', async (req, res) => {
    try {
        const { year = '2026', month = 'JANEIRO' } = req.query;
        
        console.log(`Teste Headcount - Unidade: Nordeste Locações Fortaleza, Período: ${month} ${year}`);
        
        const result = await headcountService.getContagemUnidadeEspecifica(
            'Nordeste Locações Fortaleza', 
            year, 
            month
        );
        
        console.log('Teste Headcount - Resultado:', result);
        
        res.json({
            success: true,
            data: result,
            message: `Contagem de colaboradores para Nordeste Locações Fortaleza em ${month} ${year}`
        });
    } catch (err) {
        console.error('Erro no teste headcount:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

/**
 * 📋 ROTA DE CONSULTA COMPLETA DE COLABORADORES
 * Retorna todos os dados dos colaboradores (ativos e desligados)
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * GET /api/consulta-colaboradores
 * Retorna todos os colaboradores com informações completas
 */
router.get('/consulta-colaboradores', async (req, res) => {
    try {
        const sql = `
            SELECT 
                c.name as empresa,
                e.workplace_id as unidade,
                e.name as nome,
                e.cpf as cpf,
                e.gender as sexo,
                e."birthDate" as nascimento,
                CASE 
                    WHEN e."birthDate" IS NOT NULL AND e."birthDate" != '' THEN 
                        EXTRACT(YEAR FROM AGE(e."birthDate"::date))
                    ELSE NULL 
                END as idade,
                e.role as cargo,
                e."currentSalary" as salario_atual,
                e.sector as setor,
                e.hierarchy as diretoria,
                -- Último ASO (subconsulta para pegar o mais recente)
                (
                    SELECT MAX(ar.exam_date) 
                    FROM aso_records ar 
                    WHERE ar.employee_id = e.id
                ) as ultimo_aso,
                e.type as tipo,
                e."admissionDate" as admissao,
                e."terminationDate" as saida,
                CASE 
                    WHEN e."admissionDate" IS NOT NULL AND e."admissionDate" != '' THEN 
                        EXTRACT(YEAR FROM AGE(e."admissionDate"::date, CASE WHEN e."terminationDate" != '' AND e."terminationDate" IS NOT NULL THEN e."terminationDate"::date ELSE CURRENT_DATE END))
                    ELSE NULL 
                END as tempo_de_empresa,
                e."terminationReason" as motivo_da_saida
            FROM employees e
            LEFT JOIN companies c ON e.employer_id = c.id
            ORDER BY 
                CASE WHEN e."terminationDate" IS NULL THEN 0 ELSE 1 END,
                e.name
        `;

        const result = await query(sql);
        
        // Formatar dados para o frontend
        const colaboradores = result.rows.map(row => ({
            empresa: row.empresa || 'N/A',
            unidade: row.unidade || 'N/A',
            nome: row.nome || 'N/A',
            cpf: row.cpf || 'N/A',
            sexo: row.sexo || 'N/A',
            nascimento: row.nascimento || 'N/A',
            idade: row.idade ? Math.round(row.idade) : 'N/A',
            cargo: row.cargo || 'N/A',
            salario_atual: row.salario_atual ? `R$ ${parseFloat(row.salario_atual).toFixed(2).replace('.', ',')}` : 'N/A',
            setor: row.setor || 'N/A',
            diretoria: row.diretoria || 'N/A',
            ultimo_aso: row.ultimo_aso || 'N/A',
            tipo: row.tipo || 'N/A',
            admissao: row.admissao || 'N/A',
            saida: row.saida || 'Ativo',
            tempo_de_empresa: row.tempo_de_empresa ? `${Math.round(row.tempo_de_empresa)} anos` : 'N/A',
            motivo_da_saida: row.motivo_da_saida || (row.saida ? 'N/A' : 'Ativo')
        }));

        res.json({
            success: true,
            data: colaboradores,
            total: colaboradores.length,
            ativos: colaboradores.filter(c => c.saida === 'Ativo').length,
            desligados: colaboradores.filter(c => c.saida !== 'Ativo').length
        });

    } catch (error) {
        console.error('❌ Erro na consulta de colaboradores:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar dados dos colaboradores',
            details: error.message
        });
    }
});

/**
 * GET /api/consulta-colaboradores/export
 * Exporta dados para CSV
 */
router.get('/consulta-colaboradores/export', async (req, res) => {
    try {
        // Buscar dados
        const sql = `
            SELECT 
                c.name as empresa,
                e.workplace_id as unidade,
                e.name as nome,
                e.cpf as cpf,
                e.gender as sexo,
                e."birthDate" as nascimento,
                CASE 
                    WHEN e."birthDate" IS NOT NULL AND e."birthDate" != '' THEN 
                        EXTRACT(YEAR FROM AGE(e."birthDate"::date))
                    ELSE NULL 
                END as idade,
                e.role as cargo,
                e."currentSalary" as salario_atual,
                e.sector as setor,
                e.hierarchy as diretoria,
                (
                    SELECT MAX(ar.exam_date) 
                    FROM aso_records ar 
                    WHERE ar.employee_id = e.id
                ) as ultimo_aso,
                e.type as tipo,
                e."admissionDate" as admissao,
                e."terminationDate" as saida,
                CASE 
                    WHEN e."admissionDate" IS NOT NULL AND e."admissionDate" != '' THEN 
                        EXTRACT(YEAR FROM AGE(e."admissionDate"::date, CASE WHEN e."terminationDate" != '' AND e."terminationDate" IS NOT NULL THEN e."terminationDate"::date ELSE CURRENT_DATE END))
                    ELSE NULL 
                END as tempo_de_empresa,
                e."terminationReason" as motivo_da_saida
            FROM employees e
            LEFT JOIN companies c ON e.employer_id = c.id
            ORDER BY 
                CASE WHEN e."terminationDate" IS NULL THEN 0 ELSE 1 END,
                e.name
        `;

        const result = await query(sql);
        
        // Criar CSV
        const headers = [
            'Empresa', 'Unidade', 'Nome', 'CPF', 'Sexo', 'Nascimento', 'Idade',
            'Cargo', 'Salário atual', 'Setor', 'Diretoria', 'Último ASO',
            'Tipo', 'Admissão', 'Saída', 'Tempo de Empresa', 'Motivo da saída'
        ];
        
        const csvRows = result.rows.map(row => [
            row.empresa || '',
            row.unidade || '',
            row.nome || '',
            row.cpf || '',
            row.sexo || '',
            row.nascimento || '',
            row.idade || '',
            row.cargo || '',
            row.salario_atual || '',
            row.setor || '',
            row.diretoria || '',
            row.ultimo_aso || '',
            row.tipo || '',
            row.admissao || '',
            row.terminationDate || '',
            row.tempo_de_empresa || '',
            row.motivo_da_saida || ''
        ]);
        
        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Configurar headers para download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="colaboradores_${new Date().toISOString().split('T')[0]}.csv"`);
        
        // Adicionar BOM para Excel reconhecer caracteres especiais
        res.send('\uFEFF' + csvContent);
        
    } catch (error) {
        console.error('❌ Erro na exportação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao exportar dados',
            details: error.message
        });
    }
});

module.exports = router;

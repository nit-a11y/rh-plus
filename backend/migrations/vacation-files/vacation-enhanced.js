/* VACATION BACKEND ENHANCED - APIs Otimizadas para Novo Módulo */

const express = require('express');
const router = express.Router();
const db = require('../database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');

// GET /api/vacations/summary - Dashboard completo
router.get('/summary', async (req, res) => {
  try {
    // Busca todos os colaboradores
    const employees = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM employees ORDER BY name ASC', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Busca todas as férias
    const vacations = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM vacations ORDER BY start_date DESC', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Calcula estatísticas detalhadas
    const stats = calculateDetailedStats(employees, vacations);

    res.json({
      employees: employees,
      allVacations: vacations,
      stats: stats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro em /summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/vacations/employee/:id - Histórico de um colaborador
router.get('/employee/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    
    // Busca colaborador
    const employee = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM employees WHERE id = ?', [employeeId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!employee) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    // Busca férias do colaborador
    const vacations = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM vacations WHERE employee_id = ? ORDER BY start_date DESC', 
             [employeeId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Calcula saldo
    const balance = calculateEmployeeBalance(employee, vacations);

    res.json({
      employee: employee,
      vacations: vacations,
      balance: balance
    });

  } catch (error) {
    console.error('Erro em /employee/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/vacations/schedule - Agendamento de férias
router.post('/schedule', async (req, res) => {
  try {
    const { employeeId, periods, observations } = req.body;

    if (!employeeId || !periods || !Array.isArray(periods)) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    // Valida colaborador
    const employee = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM employees WHERE id = ?', [employeeId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!employee) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    // Processa cada período
    const results = [];
    
    for (const period of periods) {
      const vacationId = generateId();
      
      const vacationData = {
        id: vacationId,
        employee_id: employeeId,
        start_date: period.startDate,
        end_date: period.endDate,
        days_taken: period.totalDays,
        abono_days: period.abonoDays || 0,
        total_value: period.totalValue || 0,
        status: 'Planejado',
        observation: observations || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insere no banco
      await new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO vacations (
            id, employee_id, start_date, end_date, days_taken, 
            abono_days, total_value, status, observation, 
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.run(sql, [
          vacationData.id, vacationData.employee_id, vacationData.start_date,
          vacationData.end_date, vacationData.days_taken, vacationData.abono_days,
          vacationData.total_value, vacationData.status, vacationData.observation,
          vacationData.created_at, vacationData.updated_at
        ], function(err) {
          if (err) reject(err);
          else resolve({ id: vacationData.id, changes: this.changes });
        });
      });

      results.push(vacationData);
    }

    res.json({
      success: true,
      message: 'Férias agendadas com sucesso',
      vacations: results
    });

  } catch (error) {
    console.error('Erro em /schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/vacations/:id/approve - Aprovar férias
router.put('/:id/approve', async (req, res) => {
  try {
    const vacationId = req.params.id;
    const { approvedBy, observations } = req.body;

    await new Promise((resolve, reject) => {
      const sql = `
        UPDATE vacations 
        SET status = 'Aprovado', 
            approved_by = ?, 
            approved_at = ?,
            observations = ?,
            updated_at = ?
        WHERE id = ?
      `;
      
      db.run(sql, [
        approvedBy || 'Sistema',
        new Date().toISOString(),
        observations,
        new Date().toISOString(),
        vacationId
      ], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    res.json({
      success: true,
      message: 'Férias aprovadas com sucesso'
    });

  } catch (error) {
    console.error('Erro em /:id/approve:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/vacations/:id - Cancelar férias
router.delete('/:id', async (req, res) => {
  try {
    const vacationId = req.params.id;

    await new Promise((resolve, reject) => {
      db.run('UPDATE vacations SET status = "Cancelado", updated_at = ? WHERE id = ?', 
             [new Date().toISOString(), vacationId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    res.json({
      success: true,
      message: 'Férias canceladas com sucesso'
    });

  } catch (error) {
    console.error('Erro em /:id:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/vacations/calendar/:year - Calendário anual
router.get('/calendar/:year', async (req, res) => {
  try {
    const year = req.params.year;
    
    const vacations = await new Promise((resolve, reject) => {
      const sql = `
        SELECT v.*, e.name as employee_name, e.role 
        FROM vacations v
        JOIN employees e ON v.employee_id = e.id
        WHERE strftime('%Y', v.start_date) = ? 
           OR strftime('%Y', v.end_date) = ?
        ORDER BY v.start_date ASC
      `;
      
      db.all(sql, [year, year], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      year: year,
      vacations: vacations,
      totalPeriods: vacations.length
    });

  } catch (error) {
    console.error('Erro em /calendar/:year:', error);
    res.status(500).json({ error: error.message });
  }
});

// Funções auxiliares
function calculateDetailedStats(employees, vacations) {
  const now = new Date();
  const stats = {
    totalEmployees: employees.length,
    riskNow: 0,
    riskFuture: 0,
    planned: 0,
    active: 0,
    coverage: 0,
    totalVacations: vacations.length,
    upcomingVacations: 0
  };

  employees.forEach(employee => {
    const employeeVacations = vacations.filter(v => v.employee_id === employee.id);
    const balance = calculateEmployeeBalance(employee, employeeVacations);
    
    // Classifica status
    if (balance.warningPeriod.status === 'vencido') {
      stats.riskNow++;
    } else if (balance.warningPeriod.status === 'alerta') {
      stats.riskFuture++;
    } else if (balance.availableBalance >= 30) {
      stats.planned++;
    }
    
    // Verifica se está em gozo agora
    const isActive = employeeVacations.some(v => {
      const start = new Date(v.start_date);
      const end = new Date(v.end_date);
      return now >= start && now <= end && v.status === 'Em Gozo';
    });
    
    if (isActive) {
      stats.active++;
    }
  });

  // Calcula cobertura
  stats.coverage = Math.round(((employees.length - stats.active) / employees.length) * 100);
  
  // Próximas férias (próximos 30 dias)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  stats.upcomingVacations = vacations.filter(v => {
    const start = new Date(v.start_date);
    return start >= now && start <= thirtyDaysFromNow && v.status === 'Planejado';
  }).length;

  return stats;
}

function calculateEmployeeBalance(employee, vacations) {
  const admissionDate = new Date(employee.admissionDate);
  const currentDate = new Date();
  
  // Calcula tempo de serviço
  const serviceTime = Math.floor((currentDate - admissionDate) / (1000 * 60 * 60 * 24 * 365.25));
  
  // Calcula férias adquiridas
  const acquiredDays = Math.floor(serviceTime * 30);
  
  // Calcula dias já gozados
  const takenDays = vacations.reduce((total, vac) => {
    if (vac.status === 'Gozado' || vac.status === 'Em Gozo') {
      return total + (vac.days_taken || 0);
    }
    return total;
  }, 0);
  
  // Saldo disponível
  const availableDays = Math.max(0, acquiredDays - takenDays);
  
  // Determina status
  let status = 'apto';
  let message = 'Apto para gozo de férias';
  
  if (serviceTime < 1) {
    status = 'carencia';
    message = 'Em período de carência';
  } else if (availableDays < 30 && availableDays > 0) {
    status = 'alerta';
    message = `Apenas ${availableDays} dias disponíveis`;
  } else if (availableDays === 0) {
    status = 'vencido';
    message = 'Período de férias vencido';
  }
  
  return {
    totalAcquired: acquiredDays,
    totalTaken: takenDays,
    availableBalance: availableDays,
    serviceTime: serviceTime,
    warningPeriod: {
      status: status,
      message: message
    }
  };
}

module.exports = router;

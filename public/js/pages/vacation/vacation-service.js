/* VACATION SERVICE - Lógica Centralizada de Cálculos CLT */

class VacationService {
  // Constantes CLT
  static DAYS_PER_YEAR = 30;
  static MONTHS_FOR_ACQUISITION = 12;
  static MAX_CONSECUTIVE_DAYS = 30;
  static MIN_ADVANCE_NOTICE = 30; // dias de aviso prévio
  static FRACTION_MIN_DAYS = 10; // dias mínimos para fracionar
  
  /**
   * Calcula saldo de férias disponível
   * @param {Object} employee - Dados do colaborador
   * @param {Array} vacations - Array de férias já gozadas
   * @returns {Object} Saldo detalhado
   */
  static calculateBalance(employee, vacations = []) {
    const admissionDate = new Date(employee.admissionDate);
    const currentDate = new Date();
    
    // Calcula tempo de serviço
    const serviceTime = this.calculateServiceTime(admissionDate, currentDate);
    
    // Calcula férias adquiridas no período
    const acquiredDays = Math.floor(serviceTime.years * this.DAYS_PER_YEAR);
    
    // Calcula dias já gozados
    const takenDays = vacations.reduce((total, vac) => {
      if (vac.status === 'Gozado' || vac.status === 'Em Gozo') {
        return total + (vac.days_taken || 0);
      }
      return total;
    }, 0);
    
    // Calcula dias disponíveis
    const availableDays = Math.max(0, acquiredDays - takenDays);
    
    // Calcula dias proporcionais do ano atual
    const proportionalDays = this.calculateProportionalDays(admissionDate, currentDate);
    
    // Verifica se tem direito a abono
    const canSellAbono = availableDays >= 10;
    const abonoDays = canSellAbono ? 10 : 0;
    const netVacationDays = canSellAbono ? availableDays - abonoDays : availableDays;
    
    return {
      totalAcquired: acquiredDays,
      totalTaken: takenDays,
      availableBalance: availableDays,
      netVacationDays: netVacationDays,
      abonoDays: abonoDays,
      canSellAbono: canSellAbono,
      proportionalDays: proportionalDays,
      serviceTime: serviceTime,
      nextAcquisitionDate: this.calculateNextAcquisitionDate(admissionDate, currentDate),
      warningPeriod: this.calculateWarningPeriod(employee, availableDays)
    };
  }
  
  /**
   * Calcula tempo de serviço
   * @param {Date} admissionDate 
   * @param {Date} currentDate
   * @returns {Object} Tempo de serviço detalhado
   */
  static calculateServiceTime(admissionDate, currentDate) {
    const diffTime = Math.abs(currentDate - admissionDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30.44);
    const diffYears = Math.floor(diffDays / 365.25);
    
    return {
      days: diffDays,
      months: diffMonths,
      years: diffYears,
      yearsMonthsDays: {
        years: diffYears,
        months: diffMonths % 12,
        days: diffDays % 30
      }
    };
  }
  
  /**
   * Calcula dias proporcionais
   * @param {Date} admissionDate 
   * @param {Date} currentDate
   * @returns {number} Dias proporcionais
   */
  static calculateProportionalDays(admissionDate, currentDate) {
    const currentYear = currentDate.getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);
    
    // Se admitido antes do início do ano, calcula período completo
    if (admissionDate <= yearStart) {
      return this.DAYS_PER_YEAR;
    }
    
    // Se admitido durante o ano, calcula período proporcional
    if (admissionDate <= yearEnd) {
      const serviceDaysInYear = Math.floor((currentDate - admissionDate) / (1000 * 60 * 60 * 24));
      return Math.floor((serviceDaysInYear / 365.25) * this.DAYS_PER_YEAR);
    }
    
    return 0;
  }
  
  /**
   * Calcula data da próxima aquisição
   * @param {Date} admissionDate 
   * @param {Date} currentDate
   * @returns {Date} Próxima aquisição
   */
  static calculateNextAcquisitionDate(admissionDate, currentDate) {
    const serviceTime = this.calculateServiceTime(admissionDate, currentDate);
    const nextAcquisition = new Date(admissionDate);
    nextAcquisition.setFullYear(nextAcquisition.getFullYear() + serviceTime.years + 1);
    return nextAcquisition;
  }
  
  /**
   * Calcula período de aviso/alerta
   * @param {Object} employee 
   * @param {number} availableDays
   * @returns {Object} Informações de alerta
   */
  static calculateWarningPeriod(employee, availableDays) {
    const currentDate = new Date();
    const serviceTime = this.calculateServiceTime(new Date(employee.admissionDate), currentDate);
    
    // Se tem menos de 11 meses, está em carência
    if (serviceTime.months < 11) {
      return {
        status: 'carencia',
        daysToAcquisition: this.MONTHS_FOR_ACQUISITION - serviceTime.months,
        message: 'Em período de carência'
      };
    }
    
    // Se tem menos de 30 dias disponíveis, alerta
    if (availableDays < 30 && availableDays > 0) {
      return {
        status: 'alerta',
        availableDays: availableDays,
        message: `Apenas ${availableDays} dias disponíveis`
      };
    }
    
    // Se tem 30+ dias, está apto
    if (availableDays >= 30) {
      return {
        status: 'apto',
        availableDays: availableDays,
        message: 'Apto para gozo de férias'
      };
    }
    
    // Se não tem dias disponíveis, vencido
    return {
      status: 'vencido',
      daysOverdue: Math.abs(availableDays),
      message: 'Período de férias vencido'
    };
  }
  
  /**
   * Valida período de férias
   * @param {Object} employee 
   * @param {Date} startDate 
   * @param {number} days 
   * @param {boolean} hasAbono 
   * @returns {Object} Resultado da validação
   */
  static validatePeriod(employee, startDate, days, hasAbono = false) {
    const errors = [];
    const warnings = [];
    
    // Validações básicas
    if (!startDate || isNaN(startDate.getTime())) {
      errors.push('Data de início inválida');
    }
    
    if (!days || days < 5 || days > 30) {
      errors.push('Quantidade de dias deve ser entre 5 e 30');
    }
    
    if (hasAbono && days < 20) {
      errors.push('Para vender abono, o período deve ter no mínimo 20 dias');
    }
    
    // Validações de regras CLT
    const balance = this.calculateBalance(employee);
    
    if (days > balance.availableBalance) {
      errors.push(`Saldo insuficiente. Disponível: ${balance.availableBalance} dias`);
    }
    
    // Validação de fracionamento
    if (days < this.FRACTION_MIN_DAYS && days < this.MAX_CONSECUTIVE_DAYS) {
      warnings.push('Período fracionado deve ter no mínimo 10 dias corridos');
    }
    
    // Validação de aviso prévio
    const today = new Date();
    const daysDifference = Math.floor((startDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysDifference < this.MIN_ADVANCE_NOTICE) {
      warnings.push(`Aviso prévio de ${this.MIN_ADVANCE_NOTICE} dias recomendado`);
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      canProceed: errors.length === 0
    };
  }
  
  /**
   * Calcula datas de período de férias
   * @param {Date} startDate 
   * @param {number} days 
   * @param {boolean} hasAbono 
   * @returns {Object} Datas calculadas
   */
  static calculatePeriodDates(startDate, days, hasAbono = false) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);
    
    const returnDate = new Date(endDate);
    returnDate.setDate(returnDate.getDate() + 1); // Dia seguinte ao retorno
    
    // Se vendeu abono, o retorno é 2 dias antes
    if (hasAbono) {
      returnDate.setDate(returnDate.getDate() - 2);
    }
    
    return {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
      returnDate: this.formatDate(returnDate),
      totalDays: days,
      workingDays: hasAbono ? days - 10 : days,
      abonoDays: hasAbono ? 10 : 0
    };
  }
  
  /**
   * Gera agenda de férias
   * @param {Object} employee 
   * @param {Array} periods 
   * @returns {Array} Agenda gerada
   */
  static generateSchedule(employee, periods) {
    const schedule = [];
    const balance = this.calculateBalance(employee);
    
    for (const period of periods) {
      const validation = this.validatePeriod(
        employee, 
        new Date(period.startDate), 
        period.days, 
        period.hasAbono
      );
      
      if (!validation.isValid) {
        schedule.push({
          ...period,
          status: 'invalid',
          errors: validation.errors,
          warnings: validation.warnings
        });
        continue;
      }
      
      const dates = this.calculatePeriodDates(
        new Date(period.startDate),
        period.days,
        period.hasAbono
      );
      
      schedule.push({
        ...period,
        ...dates,
        status: 'scheduled',
        warnings: validation.warnings
      });
    }
    
    return schedule;
  }
  
  /**
   * Formata data para padrão brasileiro
   * @param {Date} date 
   * @returns {string} Data formatada
   */
  static formatDate(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  /**
   * Calcula estatísticas para dashboard
   * @param {Array} employees 
   * @param {Array} vacations 
   * @returns {Object} Estatísticas
   */
  static calculateDashboardStats(employees, vacations) {
    const stats = {
      totalEmployees: employees.length,
      riskNow: 0,
      riskFuture: 0,
      planned: 0,
      active: 0,
      coverage: 0
    };
    
    for (const employee of employees) {
      const employeeVacations = vacations.filter(v => v.employee_id === employee.id);
      const balance = this.calculateBalance(employee, employeeVacations);
      const warning = balance.warningPeriod;
      
      switch (warning.status) {
        case 'vencido':
          stats.riskNow++;
          break;
        case 'alerta':
          stats.riskFuture++;
          break;
        case 'apto':
          if (balance.availableBalance >= 30) {
            stats.planned++;
          }
          break;
      }
      
      // Verifica se está em gozo agora
      const isActive = employeeVacations.some(v => {
        const now = new Date();
        const start = new Date(v.start_date);
        const end = new Date(v.end_date);
        return now >= start && now <= end && v.status === 'Em Gozo';
      });
      
      if (isActive) {
        stats.active++;
      }
    }
    
    // Calcula cobertura
    stats.coverage = Math.round(((employees.length - stats.active) / employees.length) * 100);
    
    return stats;
  }
  
  /**
   * Verifica conflitos de agenda
   * @param {Array} schedule 
   * @returns {Array} Conflitos encontrados
   */
  static findScheduleConflicts(schedule) {
    const conflicts = [];
    
    for (let i = 0; i < schedule.length; i++) {
      for (let j = i + 1; j < schedule.length; j++) {
        const period1 = schedule[i];
        const period2 = schedule[j];
        
        if (period1.employee_id !== period2.employee_id) continue;
        
        const start1 = new Date(period1.startDate);
        const end1 = new Date(period1.endDate);
        const start2 = new Date(period2.startDate);
        const end2 = new Date(period2.endDate);
        
        // Verifica sobreposição de períodos
        if (
          (start1 <= start2 && start2 <= end1) ||
          (start1 <= end2 && end2 <= end1)
        ) {
          conflicts.push({
            employee_id: period1.employee_id,
            period1: period1,
            period2: period2,
            conflictType: 'overlap'
          });
        }
      }
    }
    
    return conflicts;
  }
}

// Export para uso em módulos
export { VacationService };

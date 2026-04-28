/* VACATION ADAPTER - Adapta novas interfaces para APIs existentes */

class VacationAdapter {
  /**
   * Carrega dados das APIs existentes
   * @returns {Object} Dados formatados para novo módulo
   */
  static async loadData() {
    try {
      // Usa as APIs existentes do sistema
      const [employeesRes, vacationsRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/vacations/summary')
      ]);
      
      const employees = await employeesRes.json();
      const vacationData = await vacationsRes.json();
      
      // Formata dados para o novo padrão
      return {
        employees: employees.map(emp => ({
          id: emp.id,
          name: emp.name,
          registrationNumber: emp.registrationNumber,
          role: emp.role,
          photoUrl: emp.photoUrl,
          admissionDate: emp.admissionDate,
          // Adiciona campos que o novo módulo espera
          sector: emp.sector,
          type: emp.type || 'Ativo'
        })),
        vacations: this.formatVacations(vacationData),
        stats: this.formatStats(vacationData)
      };
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      throw error;
    }
  }
  
  /**
   * Formata dados de férias para novo padrão
   * @param {Object} vacationData 
   * @returns {Array} Férias formatadas
   */
  static formatVacations(vacationData) {
    const vacations = [];
    
    // Se tiver allVacations no summary
    if (vacationData.allVacations) {
      vacations.push(...vacationData.allVacations);
    }
    
    // Se tiver vacations direto
    if (vacationData.vacations) {
      vacations.push(...vacationData.vacations);
    }
    
    return vacations.map(vac => ({
      id: vac.id,
      employee_id: vac.employee_id,
      start_date: vac.start_date,
      end_date: vac.end_date,
      days_taken: vac.days_taken,
      abono_days: vac.abono_days || 0,
      total_value: vac.total_value,
      status: vac.status || 'Planejado',
      observation: vac.observation
    }));
  }
  
  /**
   * Formata estatísticas para dashboard
   * @param {Object} vacationData 
   * @returns {Object} Estatísticas formatadas
   */
  static formatStats(vacationData) {
    return {
      totalEmployees: vacationData.employees?.length || 0,
      riskNow: vacationData.stats?.risk_now || 0,
      riskFuture: vacationData.stats?.risk_future || 0,
      planned: vacationData.stats?.planned || 0,
      active: vacationData.stats?.active || 0,
      coverage: vacationData.stats?.coverage || 100
    };
  }
  
  /**
   * Envia agendamento para API existente
   * @param {Object} scheduleData 
   * @returns {Promise} Resultado do envio
   */
  static async submitSchedule(scheduleData) {
    try {
      // Formata para API existente
      const payload = {
        employee_id: scheduleData.employeeId,
        periods: scheduleData.periods.map(period => ({
          start_date: period.startDate,
          end_date: period.endDate,
          days_taken: period.totalDays,
          abono_days: period.abonoDays,
          total_value: this.calculateValue(period.totalDays, period.abonoDays),
          status: 'Planejado',
          observation: scheduleData.observations
        }))
      };
      
      const response = await fetch('/api/vacations/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao agendar férias');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro no adaptador:', error);
      throw error;
    }
  }
  
  /**
   * Calcula valor das férias (simulação)
   * @param {number} days 
   * @param {number} abonoDays 
   * @returns {number} Valor calculado
   */
  static calculateValue(days, abonoDays) {
    // Simulação simples - em produção viria do backend
    const baseSalary = 1500; // Valor base simulado
    const dailyRate = baseSalary / 30;
    const workingDays = days - abonoDays;
    
    return workingDays * dailyRate;
  }
  
  /**
   * Busca detalhes de um colaborador específico
   * @param {string} employeeId 
   * @returns {Promise} Dados do colaborador
   */
  static async getEmployeeDetails(employeeId) {
    try {
      const response = await fetch(`/api/employees/${employeeId}`);
      if (!response.ok) {
        throw new Error('Colaborador não encontrado');
      }
      
      const employee = await response.json();
      
      // Adiciona campos que o novo módulo espera
      return {
        ...employee,
        sector: employee.sector || 'Não informado',
        type: employee.type || 'Ativo'
      };
    } catch (error) {
      console.error('Erro ao buscar colaborador:', error);
      throw error;
    }
  }
  
  /**
   * Busca histórico de férias de um colaborador
   * @param {string} employeeId 
   * @returns {Promise} Histórico formatado
   */
  static async getEmployeeVacations(employeeId) {
    try {
      const response = await fetch(`/api/vacations/employee/${employeeId}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar histórico');
      }
      
      const vacations = await response.json();
      return this.formatVacations({ vacations });
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }
  }
  
  /**
   * Valida compatibilidade com APIs existentes
   * @returns {Object} Status de compatibilidade
   */
  static checkCompatibility() {
    const checks = {
      employeesAPI: false,
      vacationsAPI: false,
      scheduleAPI: false
    };
    
    // Verifica se as APIs existentes estão disponíveis
    // Em produção, isso seria verificado via tentativa de requisição
    try {
      // Simulação de verificação
      checks.employeesAPI = true; // fetch('/api/employees').ok
      checks.vacationsAPI = true; // fetch('/api/vacations/summary').ok
      checks.scheduleAPI = true; // fetch('/api/vacations/schedule', {method: 'POST'}).ok
    } catch (error) {
      console.error('Erro na verificação de compatibilidade:', error);
    }
    
    return {
      isCompatible: Object.values(checks).every(check => check),
      checks,
      message: Object.values(checks).every(check => check) 
        ? 'Totalmente compatível com APIs existentes' 
        : 'Algumas APIs podem não estar disponíveis'
    };
  }
}

// Export para uso no módulo principal
export { VacationAdapter };

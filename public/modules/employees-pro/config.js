
// ===================================
// CONFIGURAÇÃO DO MÓDULO EMPLOYEES-PRO
// System Architect Persona - .agent
// ===================================

export const ModuleConfig = {
    name: 'employees-pro',
    version: '2.0.0',
    description: 'Módulo de gestão de colaboradores',
    
    // Endpoints da API
    api: {
        base: '/api/employees-pro',
        employees: '/api/employees-pro',
        documents: '/api/employee-documents',
        benefits: '/api/employee-benefits',
        dependents: '/api/employee-dependents',
        emergency: '/api/emergency-contacts',
        companies: '/api/companies',
        roles: '/api/roles'
    },
    
    // Configurações de UI
    ui: {
        autoSaveDelay: 3000,
        itemsPerPage: 20,
        debounceDelay: 500,
        animationDuration: 300
    },
    
    // Campos válidos
    validFields: [
        'id', 'name', 'registrationNumber', 'role', 'sector', 'type', 'hierarchy',
        'admissionDate', 'birthDate', 'currentSalary', 'photoUrl', 'street',
        'city', 'neighborhood', 'state_uf', 'cep', 'employer_id', 'workplace_id',
        'fatherName', 'motherName', 'gender', 'maritalStatus', 'ethnicity',
        'educationLevel', 'placeOfBirth', 'personalEmail', 'personalPhone',
        'work_schedule', 'work_scale', 'cbo', 'criado_em', 'lat', 'lng',
        'initialRole', 'initialSalary', 'metadata', 'contracting_type'
    ],
    
    // Mapeamento de campos
    fieldMapping: {
        'emp-name': 'name',
        'emp-birth': 'birthDate',
        'emp-gender': 'gender',
        'emp-father': 'fatherName',
        'emp-mother': 'motherName',
        'emp-marital': 'maritalStatus',
        'emp-ethnicity': 'ethnicity',
        'emp-education': 'educationLevel',
        'emp-email': 'personalEmail',
        'emp-phone': 'personalPhone',
        'emp-street': 'street',
        'emp-number': 'street',
        'emp-complement': 'street',
        'emp-cep': 'cep',
        'emp-neighborhood': 'neighborhood',
        'emp-city': 'city',
        'emp-uf': 'state_uf',
        'emp-nat-city': 'placeOfBirth',
        'emp-nat-state': 'placeOfBirth',
        'emp-registration': 'registrationNumber',
        'emp-role': 'role',
        'emp-sector': 'sector',
        'emp-admission': 'admissionDate',
        'emp-type': 'type',
        'emp-salary': 'currentSalary',
        'emp-hierarchy': 'hierarchy',
        'emp-work-schedule': 'work_schedule',
        'emp-work-scale': 'work_scale',
        'emp-cbo': 'cbo',
        'emp-contracting-type': 'contracting_type',
        'emp-id': 'id',
        'emp-criado-em': 'criado_em',
        'emp-lat': 'lat',
        'emp-lng': 'lng',
        'emp-initial-role': 'initialRole',
        'emp-initial-salary': 'initialSalary',
        'emp-metadata': 'metadata',
        'emp-photo-url': 'photoUrl',
        'emp-employer-id': 'employer_id',
        'emp-workplace-id': 'workplace_id'
    },
    
    // Status válidos
    validStatus: ['ATIVO', 'DESLIGADO', 'FERIAS', 'AFASTADO'],
    
    // Tipos de contratação
    contractingTypes: ['CLT', 'PJ', 'ESTAGIARIO', 'AUTONOMO'],
    
    // Cores do tema
    colors: {
        primary: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#6B7280'
    }
};

export default ModuleConfig;

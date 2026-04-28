/**
 * 🎯 MÓDULO: Acompanhamento 90 Dias
 * Jornada de experiência do colaborador — do primeiro dia até os 90 dias
 */

// Estado global
let employees = [];
let selectedEmployeeId = null;
let filterStatus = 'active';
let onboardingSteps = [];
let currentCronogramaType = 'geral'; // 'geral' ou 'servicos_diversos'

// Cronograma GERAL (8 etapas)
const DEFAULT_STEPS = [
    {
        momento: 'Dia 1',
        nome_encontro: 'Onboarding\nBoas-Vindas Oficial',
        responsavel: 'Gente & Gestão (1 pessoa)',
        pauta_sugerida: 'Tour pela empresa\nApresentação da equipe e espaços\nEntrega de materiais\nCultura e valores da empresa',
        como_fazer: 'Presencial — integração formal\nDuração: 1h (max)',
        status: 'Pendente'
    },
    {
        momento: 'Dia 2',
        nome_encontro: 'Café com Gente & Gestão\nPrimeiras Impressões',
        responsavel: 'Gente & Gestão',
        pauta_sugerida: 'Como foi o primeiro dia?\nAlguma surpresa boa ou ruim?\nJá conheceu o time?',
        como_fazer: 'Copa — sem sala formal\nDuração: 10min',
        status: 'Pendente'
    },
    {
        momento: 'Dia 10',
        nome_encontro: 'Check-point 15 Dias\nConversa com o Colaborador',
        responsavel: 'Gente & Gestão (2 pessoas)',
        pauta_sugerida: 'Já se sente parte do time?\nA rotina está sendo como esperava?\nComo é sua relação com o gestor?\nAlgo que te incomoda ou preocupa?',
        como_fazer: 'Sala de reunião',
        status: 'Pendente'
    },
    {
        momento: 'Dia 10',
        nome_encontro: 'Check-point 15 Dias\nConversa com o Gestor',
        responsavel: 'Gestor G&G + Gestor',
        pauta_sugerida: 'Como o colaborador está se saindo?\nJá entendeu suas responsabilidades?\nAlgum ponto de atenção?\nPrecisa de apoio técnico ou de integração?',
        como_fazer: 'Não necessita de um momento formal',
        status: 'Pendente'
    },
    {
        momento: 'Dia 15',
        nome_encontro: 'Alinhamento',
        responsavel: 'Gestor + Colaborador',
        pauta_sugerida: 'Alinhamento do primeiro período.\nIdentificação de ajustes na rotina ou atividades (se necessário)\nFortalecimento do vínculo entre gestor e colaborador.',
        como_fazer: 'Não requer um momento formal, porém deve ser realizado individualmente.',
        status: 'Pendente'
    },
    {
        momento: 'Dia 45',
        nome_encontro: 'Avaliação de 45 Dias',
        responsavel: 'Gente & Gestão + Gestor (1 pessoa)',
        pauta_sugerida: 'Formulário de avaliação\nFeedback do gestor ao colaborador\nFeedback do colaborador',
        como_fazer: 'Sala de reunião\nUsar formulário padrão\nDuração: 15 - 30 min',
        status: 'Pendente'
    },
    {
        momento: 'Dia 60',
        nome_encontro: 'Check-point 60 Dias\nConversa de Meio Caminho',
        responsavel: 'Gente & Gestão (2 pessoas)',
        pauta_sugerida: 'Relacionamento com o time\nCrescimento\nExpectativas x Realidade\nAtividades',
        como_fazer: 'Sala de reunião',
        status: 'Pendente'
    },
    {
        momento: 'Dia 90',
        nome_encontro: 'Avaliação de 90 Dias',
        responsavel: 'Gente & Gestão + Gestor (1 pessoa)',
        pauta_sugerida: 'Avaliação completa\nFeedback final\nEfetivação\nAdesão de benefícios',
        como_fazer: 'Sala de reunião',
        status: 'Pendente'
    }
];

// Cronograma SERVIÇOS DIVERSOS (6 etapas) - para cargos do setor de serviços diversos
const SERVICOS_DIVERSOS_STEPS = [
    {
        momento: 'Dia 1',
        nome_encontro: 'Onboarding\nBoas-Vindas Oficial',
        responsavel: 'Gente & Gestão (1 pessoa)',
        pauta_sugerida: 'Tour pela empresa\nApresentação da equipe e espaços\nEntrega de materiais\nCultura e valores da empresa',
        como_fazer: 'Presencial — integração formal\nDuração: 1h (max)',
        status: 'Pendente'
    },
    {
        momento: 'Dia 2',
        nome_encontro: 'Café com Gente & Gestão\nPrimeiras Impressões',
        responsavel: 'Gente & Gestão',
        pauta_sugerida: 'Como foi o primeiro dia?\nAlguma surpresa boa ou ruim?\nJá conheceu o time?',
        como_fazer: 'Copa — sem sala formal\nDuração: 10min',
        status: 'Pendente'
    },
    {
        momento: 'Dia 10',
        nome_encontro: 'Check-point 15 Dias\nConversa com o Colaborador',
        responsavel: 'Gente & Gestão (2 pessoas)',
        pauta_sugerida: 'Já se sente parte do time?\nA rotina está sendo como esperava?\nComo é sua relação com o gestor?\nAlgo que te incomoda ou preocupa?',
        como_fazer: 'Sala de reunião',
        status: 'Pendente'
    },
    {
        momento: 'Dia 14',
        nome_encontro: 'Avaliação de 45 Dias',
        responsavel: 'Gente & Gestão + Gestor (1 pessoa)',
        pauta_sugerida: 'Formulário de avaliação\nFeedback do gestor ao colaborador\nFeedback do colaborador',
        como_fazer: 'Sala de reunião\nUsar formulário padrão\nDuração: 15 - 30 min',
        status: 'Pendente'
    },
    {
        momento: 'Dia 30',
        nome_encontro: 'Check-point 60 Dias\nConversa de Meio Caminho',
        responsavel: 'Gente & Gestão (2 pessoas)',
        pauta_sugerida: 'Relacionamento com o time\nCrescimento\nExpectativas x Realidade\nAtividades',
        como_fazer: 'Sala de reunião',
        status: 'Pendente'
    },
    {
        momento: 'Dia 60',
        nome_encontro: 'Avaliação de 90 Dias',
        responsavel: 'Gente & Gestão + Gestor (1 pessoa)',
        pauta_sugerida: 'Avaliação completa\nFeedback final\nEfetivação\nAdesão de benefícios',
        como_fazer: 'Sala de reunião',
        status: 'Pendente'
    }
];

// Detectar se é cronograma de Serviços Diversos
function isServicosDiversos(emp) {
    if (!emp) return false;
    const cargo = (emp.role || '').toLowerCase();
    const setor = (emp.sector || '').toLowerCase();
    return cargo.includes('serviço') || cargo.includes('servicos') || 
           setor.includes('serviço') || setor.includes('servicos') ||
           cargo.includes('diversos') || setor.includes('diversos');
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Módulo Acompanhamento 90 Dias inicializado');
    try {
        await loadEmployees();
        console.log('✅ Colaboradores carregados:', employees.length);
        renderSidebar();
    } catch (err) {
        console.error('❌ Erro na inicialização:', err);
    }
});

// Verificar status do período de experiência
function getExperienceStatus(admissionDate) {
    if (!admissionDate) return { type: null, days: 0 };
    const admission = new Date(admissionDate);
    const today = new Date();
    const diffTime = today - admission;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 90) {
        return { type: 'approved', days: diffDays }; // Verde - Aprovado
    } else if (diffDays >= 0) {
        return { type: 'probation', days: diffDays }; // Amarelo - Em experiência
    }
    return { type: null, days: 0 };
}

// Carregar colaboradores
async function loadEmployees() {
    try {
        const res = await fetch('/api/employees');
        if (!res.ok) throw new Error('Erro ao carregar colaboradores');
        const data = await res.json();
        console.log('📊 Resposta da API:', data);
        // A API pode retornar direto um array ou { employees: [...] }
        employees = Array.isArray(data) ? data : (data.employees || data.data || []);
        console.log('✅ Colaboradores carregados:', employees.length);
    } catch (err) {
        console.error('❌ Erro ao carregar:', err);
        employees = [];
    }
}

// Renderizar sidebar
window.renderSidebar = () => {
    const container = document.getElementById('employee-list');
    const search = document.getElementById('onboarding-search')?.value.toLowerCase() || '';
    
    console.log('📋 Renderizando sidebar, container:', container, 'employees:', employees.length);
    
    if (!container) {
        console.error('❌ Container employee-list não encontrado!');
        return;
    }
    
    const filtered = employees.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(search) || e.registrationNumber?.includes(search);
        const matchesStatus = filterStatus === 'active' ? e.type !== 'Desligado' : e.type === 'Desligado';
        return matchesSearch && matchesStatus;
    });

    container.innerHTML = filtered.map(e => {
        const status = getExperienceStatus(e.admissionDate);
        
        // Definir selo
        let badge = '';
        if (status.type === 'approved') {
            badge = `<div title="Aprovado - ${status.days} dias" class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>`;
        } else if (status.type === 'probation') {
            badge = `<div title="Em período de experiência - ${status.days} dias" class="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <span class="text-[7px] font-black text-white">${status.days}</span>
            </div>`;
        }
        
        return `
        <div class="emp-item ${selectedEmployeeId === e.id ? 'active' : ''}" onclick="window.selectEmployee('${e.id}')">
            <div class="relative">
                <img src="${e.photoUrl || 'https://ui-avatars.com/api/?name='+encodeURIComponent(e.name)}" class="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm">
                ${badge}
            </div>
            <div class="min-w-0 flex-1">
                <p class="text-[10px] font-black text-gray-800 uppercase truncate">${e.name}</p>
                <p class="text-[8px] text-gray-400 font-bold uppercase tracking-widest">${e.role || 'Sem Cargo'}</p>
            </div>
            ${e.type === 'Desligado' ? '<span class="text-[7px] bg-red-100 text-red-600 font-black px-2 py-0.5 rounded-full uppercase">Saiu</span>' : ''}
        </div>
    `}).join('') || `<p class="p-8 text-center text-gray-300 text-[9px] font-black uppercase tracking-widest">${filterStatus === 'active' ? 'Nenhum Ativo' : 'Pasta Vazia'}</p>`;
};

// Selecionar colaborador
window.selectEmployee = async (id) => {
    selectedEmployeeId = id;
    renderSidebar();
    
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    
    // Mostrar view
    document.getElementById('welcome-msg').classList.add('hidden');
    document.getElementById('onboarding-view').classList.remove('hidden');
    
    // Preencher header
    document.getElementById('view-photo').src = emp.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`;
    document.getElementById('view-name').innerText = emp.name;
    document.getElementById('view-role').innerText = emp.role || 'Sem Cargo';
    document.getElementById('view-admission').innerText = formatDateBR(emp.admissionDate) || '--';
    
    // Carregar etapas do onboarding
    await loadOnboardingSteps(id);
    
    // Atualizar indicador do tipo de cronograma
    updateCronogramaIndicator();
    
    renderTimeline();
};

// Carregar etapas do backend
async function loadOnboardingSteps(employeeId) {
    try {
        const res = await fetch(`/api/onboarding/${employeeId}`);
        if (res.ok) {
            const data = await res.json();
            onboardingSteps = data.steps || [];
            
            // Detectar tipo baseado no número de etapas
            currentCronogramaType = onboardingSteps.length === 6 ? 'servicos_diversos' : 'geral';
        } else {
            // Se não encontrou, verificar configuração salva do cargo
            const emp = employees.find(e => e.id === employeeId);
            let cronogramaTipo = 'geral';
            
            // Tentar buscar configuração salva
            try {
                const configRes = await fetch(`/api/onboarding/cargo-config/${encodeURIComponent(emp?.role || '')}`);
                if (configRes.ok) {
                    const config = await configRes.json();
                    cronogramaTipo = config.cronograma_tipo || 'geral';
                }
            } catch (e) {
                // Se não achou configuração, detecta automaticamente
                cronogramaTipo = isServicosDiversos(emp) ? 'servicos_diversos' : 'geral';
            }
            
            currentCronogramaType = cronogramaTipo;
            const stepsTemplate = cronogramaTipo === 'servicos_diversos' ? SERVICOS_DIVERSOS_STEPS : DEFAULT_STEPS;
            
            console.log(`📋 Usando cronograma: ${cronogramaTipo.toUpperCase()} para ${emp?.name || employeeId}`);
            
            onboardingSteps = stepsTemplate.map(step => ({
                ...step,
                employee_id: employeeId,
                data_prevista: calculateDateFromDay(step.momento, employeeId),
                data_realizada: '',
                anotacao: ''
            }));
        }
    } catch (err) {
        console.error('Erro ao carregar etapas:', err);
        onboardingSteps = [];
    }
}

// Calcular data prevista baseado no momento (ex: "Dia 1", "Dia 45")
function calculateDateFromDay(momento, employeeId) {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp?.admissionDate) return '';
    
    const admission = new Date(emp.admissionDate);
    const dayMatch = momento.match(/Dia (\d+)/);
    if (!dayMatch) return '';
    
    const days = parseInt(dayMatch[1]) - 1; // Dia 1 = admission date
    const result = new Date(admission);
    result.setDate(result.getDate() + days);
    
    return result.toISOString().split('T')[0];
}

// Renderizar timeline
function renderTimeline() {
    const container = document.getElementById('timeline-steps');
    if (!container) return;
    
    container.innerHTML = `
        <div class="timeline-line"></div>
        ${onboardingSteps.map((step, index) => {
            const statusClass = {
                'Pendente': 'status-pendente',
                'Agendado': 'status-agendado',
                'Realizado': 'status-realizado'
            }[step.status] || 'status-pendente';
            
            const statusSelectClass = {
                'Pendente': 'pendente',
                'Agendado': 'agendado',
                'Realizado': 'realizado'
            }[step.status] || 'pendente';
            
            return `
                <div class="step-card" data-index="${index}">
                    <div class="status-dot ${statusClass}"></div>
                    
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="text-[10px] font-black text-nordeste-red uppercase tracking-wider">${step.momento}</span>
                            <h4 class="text-sm font-black text-gray-800 mt-1 whitespace-pre-line">${step.nome_encontro}</h4>
                        </div>
                        <select class="status-select ${statusSelectClass}" onchange="window.updateStepStatus(${index}, this.value)">
                            <option value="Pendente" ${step.status === 'Pendente' ? 'selected' : ''}>❌ Pendente</option>
                            <option value="Agendado" ${step.status === 'Agendado' ? 'selected' : ''}>⏳ Agendado</option>
                            <option value="Realizado" ${step.status === 'Realizado' ? 'selected' : ''}>✅ Realizado</option>
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-3 text-xs">
                        <div>
                            <label class="pro-label">📅 Data Prevista</label>
                            <input type="date" class="pro-input text-xs" value="${step.data_prevista || ''}" onchange="window.updateStepField(${index}, 'data_prevista', this.value)">
                        </div>
                        <div>
                            <label class="pro-label">✅ Data Realizada</label>
                            <input type="date" class="pro-input text-xs" value="${step.data_realizada || ''}" onchange="window.updateStepField(${index}, 'data_realizada', this.value)">
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="pro-label">👤 Responsável</label>
                        <input type="text" class="pro-input text-xs" value="${step.responsavel}" onchange="window.updateStepField(${index}, 'responsavel', this.value)">
                    </div>
                    
                    <div class="grid grid-cols-1 gap-3 mb-3 text-xs">
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <p class="text-[9px] font-black text-gray-400 uppercase mb-1">📝 Pauta Sugerida</p>
                            <p class="text-gray-700 whitespace-pre-line">${step.pauta_sugerida}</p>
                        </div>
                        <div class="bg-blue-50 p-3 rounded-lg">
                            <p class="text-[9px] font-black text-blue-400 uppercase mb-1">💡 Como Fazer</p>
                            <p class="text-blue-700 whitespace-pre-line">${step.como_fazer}</p>
                        </div>
                    </div>
                    
                    <div>
                        <label class="pro-label">🗒️ Anotações</label>
                        <textarea class="pro-input text-xs h-16" placeholder="Adicione observações..." onchange="window.updateStepField(${index}, 'anotacao', this.value)">${step.anotacao || ''}</textarea>
                    </div>
                </div>
            `;
        }).join('')}
    `;
    
    updateProgress();
}

// Atualizar status do step
window.updateStepStatus = (index, newStatus) => {
    onboardingSteps[index].status = newStatus;
    renderTimeline();
};

// Atualizar campo do step
window.updateStepField = (index, field, value) => {
    onboardingSteps[index][field] = value;
    if (field === 'data_realizada' && value) {
        // Se preencheu data realizada, marca como realizado automaticamente
        onboardingSteps[index].status = 'Realizado';
        renderTimeline();
    }
};

// Atualizar barra de progresso
function updateProgress() {
    const total = onboardingSteps.length;
    const realizados = onboardingSteps.filter(s => s.status === 'Realizado').length;
    const percent = total > 0 ? Math.round((realizados / total) * 100) : 0;
    
    document.getElementById('progress-percent').innerText = `${percent}%`;
    document.getElementById('progress-bar').style.width = `${percent}%`;
}

// Salvar dados no backend
window.saveOnboardingData = async () => {
    if (!selectedEmployeeId) return;
    
    try {
        const res = await fetch(`/api/onboarding/${selectedEmployeeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ steps: onboardingSteps })
        });
        
        if (!res.ok) throw new Error('Erro ao salvar');
        
        alert('✅ Dados salvos com sucesso!');
        
        // Regenerar notificações automaticamente
        try {
            await fetch('/api/onboarding/generate-notifications', { method: 'POST' });
        } catch (e) {
            console.log('Notificações serão geradas na próxima carga');
        }
        
        await loadOnboardingSteps(selectedEmployeeId);
        renderTimeline();
    } catch (err) {
        console.error('Erro ao salvar:', err);
        alert('❌ Erro ao salvar: ' + err.message);
    }
};

// Filtro de status
window.setFilterStatus = (status) => {
    filterStatus = status;
    document.getElementById('tab-active').className = status === 'active' ? 'tab-btn active' : 'tab-btn inactive';
    document.getElementById('tab-inactive').className = status === 'inactive' ? 'tab-btn active' : 'tab-btn inactive';
    renderSidebar();
};

// Utilitários
function formatDateBR(dateStr) {
    if (!dateStr) return '--';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// Gerar PDF do cronograma
window.generatePDF = () => {
    if (!selectedEmployeeId || onboardingSteps.length === 0) {
        alert('Selecione um colaborador primeiro!');
        return;
    }
    
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configurações
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    
    // Header
    doc.setFillColor(211, 47, 47); // Nordeste Red
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PROGRAMA DE ACOMPANHAMENTO 90 DIAS', margin, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Nordeste Locações', margin, 30);
    
    // Info do colaborador
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Colaborador: ${emp.name}`, margin, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cargo: ${emp.role || 'N/A'}`, margin, 62);
    doc.text(`Setor: ${emp.sector || 'N/A'}`, margin, 68);
    doc.text(`Data de Admissão: ${formatDateBR(emp.admissionDate)}`, margin, 74);
    doc.text(`Matrícula: ${emp.registrationNumber || 'N/A'}`, margin, 80);
    
    // Tabela de etapas com pauta sugerida (sem status e data realizada)
    const tableData = onboardingSteps.map(step => [
        step.momento,
        step.nome_encontro.replace(/\n/g, ' '),
        step.pauta_sugerida.replace(/\n/g, ' | '),
        step.responsavel,
        formatDateBR(step.data_prevista)
    ]);
    
    doc.autoTable({
        startY: 90,
        head: [['Momento', 'Encontro', 'Pauta Sugerida', 'Responsavel', 'Data Prevista']],
        body: tableData,
        headStyles: {
            fillColor: [211, 47, 47],
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 8
        },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 45 },
            2: { cellWidth: 75 },
            3: { cellWidth: 35 },
            4: { cellWidth: 25 }
        },
        styles: {
            overflow: 'linebreak',
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        }
    });
    
    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(211, 47, 47);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} - Nordeste Locações RH+`, margin, pageHeight - 8);
    
    // Download
    const fileName = `Onboarding_90Dias_${emp.name.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
};

// Aprovar colaborador - Usa a API de career para efetivação
window.approveEmployee = async () => {
    if (!selectedEmployeeId) {
        alert('Selecione um colaborador primeiro!');
        return;
    }
    
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;
    
    if (!confirm(`Deseja APROVAR o colaborador ${emp.name}?\n\nEsta ação irá:\n\u2022 Efetivar o colaborador\n\u2022 Adicionar selo verde de verificado\n\u2022 Atualizar status para "Efetivado"`)) {
        return;
    }
    
    try {
        // Usar a API de career para efetivação
        const res = await fetch('/api/career', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employeeId: selectedEmployeeId,
                move_type: 'Efetivação',
                role: emp.role || '',
                sector: emp.sector || 'ADMINISTRATIVO',
                salary: emp.currentSalary || 'R$ 0,00',
                date: new Date().toLocaleString('sv-SE').replace('T', ' '),
                responsible: 'Sistema RH+ (Onboarding)',
                observation: 'EFETIVADO NO PROGRAMA DE PERÍODO DE EXPERIÊNCIA - ' + new Date().toLocaleDateString('pt-BR'),
                cbo: emp.cbo || ''
            })
        });
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Erro ao aprovar colaborador');
        }
        
        alert('â\x9c\x85 Colaborador APROVADO com sucesso!\n\nO selo verde será exibido na foto.');
        
        // Recarregar para atualizar o selo
        await loadEmployees();
        renderSidebar();
        
    } catch (err) {
        console.error('Erro ao aprovar:', err);
        alert('â\x9c\x85 Erro ao aprovar: ' + err.message);
    }
};

// Reprovar colaborador - Usa a mesma lógica do módulo career
window.rejectEmployee = async () => {
    if (!selectedEmployeeId) {
        alert('Selecione um colaborador primeiro!');
        return;
    }
    
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;
    
    // Confirmação dupla para evitar toque acidental
    const confirm1 = confirm(`⚠️ ATENÇÃO!\n\nVocê está prestes a REPROVAR e DESLIGAR o colaborador:\n${emp.name}\n\nEsta ação irá:\n• Desligar o colaborador\n• Adicionar observação de reprovação no período de experiência\n• Arquivar dados do colaborador\n\nDeseja continuar?`);
    
    if (!confirm1) return;
    
    const confirm2 = confirm(`Confirmação FINAL:\n\nTem certeza que deseja REPROVAR ${emp.name}?\n\nEsta ação não pode ser desfeita!`);
    
    if (!confirm2) return;
    
    try {
        // Usar a API de career como no módulo career
        const res = await fetch('/api/career', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employeeId: selectedEmployeeId,
                move_type: 'Desligamento',
                role: emp.role || '',
                sector: emp.sector || 'ADMINISTRATIVO',
                salary: emp.currentSalary || 'R$ 0,00',
                date: new Date().toLocaleString('sv-SE').replace('T', ' '),
                responsible: 'Sistema RH+ (Onboarding)',
                observation: 'REPROVADO NO PROGRAMA DE PERÍODO DE EXPERIÊNCIA - ' + new Date().toLocaleDateString('pt-BR'),
                cbo: emp.cbo || '',
                termination_reason: 'REPROVAÇÃO NO PERÍODO DE EXPERIÊNCIA',
                grrf_value: 0,
                rescisao_value: 0
            })
        });
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Erro ao desligar colaborador');
        }
        
        const result = await res.json();
        
        alert('✖️ Colaborador REPROVADO e DESLIGADO.\n\nMotivo: Reprovação no período de experiência\nObservação registrada automaticamente.\nID do Desligamento: ' + (result.terminationId || 'N/A'));
        
        // Recarregar e voltar para lista
        selectedEmployeeId = null;
        await loadEmployees();
        renderSidebar();
        
        // Voltar para tela de boas-vindas
        document.getElementById('welcome-msg').classList.remove('hidden');
        document.getElementById('onboarding-view').classList.add('hidden');
        
    } catch (err) {
        console.error('Erro ao reprovar:', err);
        alert('✖️ Erro ao reprovar: ' + err.message);
    }
};

// Atualizar indicador visual do tipo de cronograma
function updateCronogramaIndicator() {
    const badge = document.getElementById('cronograma-badge');
    if (!badge) return;
    
    if (currentCronogramaType === 'servicos_diversos') {
        badge.innerText = 'SERVIÇOS DIVERSOS';
        badge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-black uppercase';
    } else {
        badge.innerText = 'GERAL';
        badge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-black uppercase';
    }
}

// Alternar tipo de cronograma manualmente
window.toggleCronogramaType = () => {
    if (!selectedEmployeeId) return;
    
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;
    
    // Alternar tipo
    currentCronogramaType = currentCronogramaType === 'geral' ? 'servicos_diversos' : 'geral';
    
    console.log(`🔄 Cronograma alterado para: ${currentCronogramaType}`);
    
    // Recarregar etapas com novo tipo
    const stepsTemplate = currentCronogramaType === 'servicos_diversos' ? SERVICOS_DIVERSOS_STEPS : DEFAULT_STEPS;
    onboardingSteps = stepsTemplate.map(step => ({
        ...step,
        employee_id: selectedEmployeeId,
        data_prevista: calculateDateFromDay(step.momento, selectedEmployeeId),
        data_realizada: '',
        anotacao: ''
    }));
    
    // Atualizar UI
    updateCronogramaIndicator();
    renderTimeline();
    updateProgress();
};

// Salvar tipo de cronograma para o cargo (persistir para futuros colaboradores)
window.saveCronogramaType = async () => {
    if (!selectedEmployeeId) {
        alert('Selecione um colaborador primeiro!');
        return;
    }
    
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp || !emp.role) {
        alert('Colaborador não tem cargo definido!');
        return;
    }
    
    const tipoLabel = currentCronogramaType === 'servicos_diversos' ? 'SERVIÇOS DIVERSOS' : 'GERAL';
    
    if (!confirm(`Deseja salvar o cronograma "${tipoLabel}" para o cargo "${emp.role}"?\n\nTodos os futuros colaboradores com este cargo usarão este cronograma automaticamente.`)) {
        return;
    }
    
    try {
        const res = await fetch('/api/onboarding/cargo-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cargo: emp.role,
                cronograma_tipo: currentCronogramaType
            })
        });
        
        if (!res.ok) throw new Error('Erro ao salvar configuração');
        
        alert(`✅ Configuração salva!\n\nCargo: ${emp.role}\nCronograma: ${tipoLabel}\n\nFuturos colaboradores com este cargo usarão este cronograma automaticamente.`);
        
    } catch (err) {
        console.error('Erro ao salvar configuração:', err);
        alert('❌ Erro ao salvar: ' + err.message);
    }
};

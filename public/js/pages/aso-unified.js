import { DateFixer } from '../date-fixer.js';

let asoData = { employees: [], stats: {}, allAsos: [], allCertificates: [] };
let selectedEmployeeId = null;
let timelineFilter = 'all';
let filterStatus = 'active';

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    await loadDataFromServer();
    
    const urlParams = new URLSearchParams(window.location.search);
    const empId = urlParams.get('emp');
    if (empId) {
        const exists = asoData.employees?.find(e => e.id === empId);
        if (exists) {
            window.selectEmployee(empId);
        }
    }
}

window.setFilterStatus = (status) => {
    filterStatus = status;
    document.getElementById('tab-active')?.classList.toggle('active', status === 'active');
    document.getElementById('tab-inactive')?.classList.toggle('active', status === 'inactive');
    renderEmployeeList();
};

async function loadDataFromServer() {
    try {
        const res = await fetch(`/api/aso/dossier-summary?t=${Date.now()}`);
        if (!res.ok) throw new Error("Erro na rede");
        const data = await res.json();
        
        if (data.employees) {
           asoData.employees = data.employees;
        }
        if (data.allAsos) {
          asoData.allAsos = data.allAsos;
        }
        if (data.allCertificates) {
          asoData.allCertificates = data.allCertificates;
        }
        
        renderEmployeeList();
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
        loadFallbackData();
    }
}

async function loadFallbackData() {
    try {
        const res = await fetch(`/api/employees`);
        const employees = await res.json();
       asoData.employees = employees || [];
        
        const res2 = await fetch(`/api/aso/records`);
        const asos = await res2.json();
       asoData.allAsos = asos.records || [];

        const res3 = await fetch(`/api/aso/certificates`);
        const certs = await res3.json();
       asoData.allCertificates = certs.records || [];
        
        renderEmployeeList();
    } catch (e) {
        console.error("Erro fallback:", e);
    }
}

window.refreshData = loadDataFromServer;

// Expor funções globalmente para uso no HTML
window.renderEmployeeList = renderEmployeeList;

// Debounce para a barra de pesquisa
let searchTimeout;
window.debounceSearch = function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        renderEmployeeList();
    }, 300);
};

// Manipulador de teclas para a pesquisa
window.handleSearchKeydown = function(event) {
    if (event.key === 'Escape') {
        const searchInput = document.getElementById('dossier-search');
        if (searchInput) {
            searchInput.value = '';
            renderEmployeeList();
        }
    }
};

// === SIDEBAR ===

function renderEmployeeList() {
    const list = document.getElementById('dossier-employee-list');
    if (!list) return;

    const search = document.getElementById('dossier-search')?.value.toLowerCase() || '';
    
    const filtered = (asoData.employees || []).filter(e => {
        const name = (e.name || '').toLowerCase();
        const reg = (e.registrationNumber || e.reg || '0000').toLowerCase();
        const sector = (e.sector || '').toLowerCase();
        const role = (e.role || '').toLowerCase();
        const matchesSearch = !search || 
            name.includes(search) || 
            reg.includes(search) || 
            sector.includes(search) ||
            role.includes(search);
        const isActive = e.type !== 'Desligado';
        const matchesStatus = filterStatus === 'active' ? isActive : !isActive;
        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        list.innerHTML = `<div class="p-8 text-center text-gray-300 text-[9px] font-black uppercase italic">Nenhum colaborador</div>`;
        return;
    }

    list.innerHTML = filtered.map(emp => {
        const empAsos = (asoData.allAsos || []).filter(a => a.employee_id === emp.id || a.employeeId === emp.id);
        const latestAso = empAsos.sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date))[0];
        
        let badge = { bg: 'bg-gray-100', color: 'text-gray-500', text: 'Pendente' };
        
        if (latestAso) {
            const today = new Date();
            const expiry = latestAso.expiry_date ? new Date(latestAso.expiry_date) : null;
            
            if (!expiry || Number.isNaN(expiry.getTime())) {
                badge = { bg: 'bg-gray-100', color: 'text-gray-500', text: 'Pendente' };
            } else {
                const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                if (diffDays < 0) {
                    badge = { bg: 'bg-red-100', color: 'text-red-600', text: 'Vencido' };
                } else if (diffDays <= 45) {
                    badge = { bg: 'bg-amber-100', color: 'text-amber-600', text: 'Alerta 45d' };
                } else {
                    badge = { bg: 'bg-emerald-100', color: 'text-emerald-600', text: 'Em Dia' };
                }
            }
        }

        return `
            <div onclick="selectEmployee('${emp.id}')" class="emp-item ${selectedEmployeeId === emp.id ? 'active' : ''}">
                <img src="${emp.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=D32F2F&color=fff`}" class="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm">
                <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-black text-gray-800 uppercase truncate">${emp.name}</p>
                    <p class="text-[8px] text-gray-400 font-bold uppercase">${emp.registrationNumber || emp.reg || '---'} • ${emp.sector || '--'}</p>
                </div>
                <span class="text-[7px] font-black px-2 py-0.5 rounded-full uppercase ${badge.bg} ${badge.color}">${badge.text}</span>
            </div>
        `;
    }).join('');
}

// === SELECT EMPLOYEE ===

window.selectEmployee = (id) => {
    selectedEmployeeId = id;
    const emp = asoData.employees.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('welcome-msg').classList.add('hidden');
    document.getElementById('selection-view').classList.remove('hidden');

    const empAsos = (asoData.allAsos || []).filter(a => a.employee_id === emp.id || a.employeeId === emp.id);
    const latestAso = empAsos.sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date))[0];
    const lastDate = latestAso ? DateFixer.formatarDataParaExibicao(latestAso.exam_date) : '--';

    document.getElementById('view-photo').src = emp.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=D32F2F&color=fff`;
    document.getElementById('view-name').innerText = emp.name;
    document.getElementById('view-reg').innerText = `#${emp.registrationNumber || emp.reg || '0000'}`;
    document.getElementById('view-sector').innerText = emp.sector || '--';
    document.getElementById('view-admission').innerText = emp.admissionDate ? DateFixer.formatarDataParaExibicao(emp.admissionDate) : '--';
    document.getElementById('view-last-aso').innerText = lastDate;

    renderStats(emp);
    renderTimeline();
    renderEmployeeList();
};

function renderStats(emp) {
    const empAsos = (asoData.allAsos || []).filter(a => a.employee_id === emp.id || a.employeeId === emp.id);
    
    const total = empAsos.length;
    const latestAso = empAsos.sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date))[0];
    
    let statusText = 'Pendente';
    if (latestAso) {
        const today = new Date();
        const expiry = latestAso.expiry_date ? new Date(latestAso.expiry_date) : null;
        
        if (expiry && !Number.isNaN(expiry.getTime())) {
            const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) statusText = 'Vencido';
            else if (diffDays <= 45) statusText = 'Alerta';
            else statusText = 'Em Dia';
        } else {
            statusText = 'Pendente';
        }
    }

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-status').innerText = statusText;
}

// === TIMELINE ===

function renderTimeline() {
    const container = document.getElementById('aso-timeline');
    if (!container || !selectedEmployeeId) return;

    let asos = (asoData.allAsos || []).filter(a => a.employee_id === selectedEmployeeId || a.employeeId === selectedEmployeeId);
    let certificates = (asoData.allCertificates || []).filter(c => c.employee_id === selectedEmployeeId || c.employeeId === selectedEmployeeId);

    if (timelineFilter !== 'all') {
        if (timelineFilter === 'ASO') {
            certificates = [];
        } else if (timelineFilter === 'ATESTADO') {
            asos = [];
        } else {
            asos = asos.filter(a => a.exam_type === timelineFilter);
        }
    }

    const allItems = [
        ...asos.map(a => ({ ...a, type: 'ASO' })),
        ...certificates.map(c => ({ ...c, type: 'ATESTADO' }))
    ];

    allItems.sort((a, b) => {
        const dateA = a.exam_date || a.start_date;
        const dateB = b.exam_date || b.start_date;
        return new Date(dateB) - new Date(dateA);
    });

    if (allItems.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <p class="text-xs font-bold uppercase">Nenhum registro para este filtro</p>
            </div>
        `;
        return;
    }

    container.innerHTML = allItems.map(item => {
        if (item.type === 'ASO') {
            const status = getAsoStatus(item);
            const statusClass = status.key === 'vencido' ? 'bg-red-500' : status.key === 'alerta' ? 'bg-amber-500' : status.key === 'pendente' ? 'bg-gray-400' : 'bg-emerald-500';
            
            return `
                <div class="relative">
                    <div class="timeline-dot ${statusClass}"></div>
                    <div class="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer" onclick="editAso('${item.id}')">
                        <div class="flex justify-between items-start mb-2">
                            <span class="px-3 py-1 rounded-full text-[8px] font-black uppercase bg-nordeste-red/10 text-nordeste-red">🩺 ASO</span>
                            <span class="text-[9px] font-bold text-gray-400 uppercase">${item.exam_type || 'ASO'}</span>
                        </div>
                        <p class="text-xs font-black text-gray-800 uppercase">Data: ${DateFixer.formatarDataParaExibicao(item.exam_date)}</p>
                        <p class="text-[9px] text-gray-500 mt-1">Validade: ${item.expiry_date ? DateFixer.formatarDataParaExibicao(item.expiry_date) : 'Não definida'}</p>
                        <p class="text-[9px] font-bold text-nordeste-red mt-1">${item.result || 'Apto'}</p>
                    </div>
                </div>
            `;
        } else {
            const startDate = item.start_date || item.startDate;
            const endDate = item.end_date || item.endDate;
            const days = endDate && startDate ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1 : 0;
            
            return `
                <div class="relative">
                    <div class="timeline-dot bg-blue-500"></div>
                    <div class="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer" onclick="editCertificate('${item.id}')">
                        <div class="flex justify-between items-start mb-2">
                            <span class="px-3 py-1 rounded-full text-[8px] font-black uppercase bg-blue-100 text-blue-700">📋 Atestado</span>
                            <span class="text-[9px] font-bold text-gray-400 uppercase">${days} dias</span>
                        </div>
                        <p class="text-xs font-black text-gray-800 uppercase">Período: ${DateFixer.formatarDataParaExibicao(startDate)} - ${DateFixer.formatarDataParaExibicao(endDate)}</p>
                        <p class="text-[9px] text-gray-500 mt-1">CID: ${item.cid || 'Não informado'}</p>
                    </div>
                </div>
            `;
        }
    }).join('');
}

function getAsoStatus(aso) {
    const today = new Date();
    const expiry = aso.expiry_date ? new Date(aso.expiry_date) : null;
    
    if (!expiry || Number.isNaN(expiry.getTime())) return { key: 'pendente', label: 'Pendente' };
    
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { key: 'vencido', label: 'Vencido' };
    if (diffDays <= 45) return { key: 'alerta', label: 'Alerta 45d' };
    return { key: 'emdia', label: 'Em Dia' };
}

// === FILTER ===

window.setTimelineFilter = (filter, btn) => {
    timelineFilter = filter;
    document.querySelectorAll('.dossier-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTimeline();
};

// === MODAL ===

let currentAsoId = null;

window.openNewAsoModal = () => {
    currentAsoId = null;
    document.getElementById('aso-modal-title').innerText = 'Novo ASO';
    document.getElementById('aso-modal-subtitle').innerText = 'Preencha os dados do exame';
    document.getElementById('aso-id').value = '';
    document.getElementById('aso-type').value = 'PERIODICO';
    
    // Data padrão é hoje, mas pode ser alterada para datas retroativas
    document.getElementById('aso-exam-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('aso-periodicity').value = '12';
    document.getElementById('aso-result').value = 'Apto';
    document.getElementById('aso-cid').value = '';
    document.getElementById('aso-obs').value = '';
    document.getElementById('btn-delete-aso').classList.add('hidden');
    document.getElementById('aso-modal').classList.remove('hidden');
    
    // Adicionar listener para mudança de tipo de exame
    updateDateRestrictions();
};

window.editAso = (id) => {
    const aso = asoData.allAsos.find(a => a.id === id);
    if (!aso) return;
    
    currentAsoId = id;
    document.getElementById('aso-modal-title').innerText = 'Editar ASO';
    document.getElementById('aso-modal-subtitle').innerText = 'Atualize os dados do exame';
    document.getElementById('aso-id').value = aso.id;
    document.getElementById('aso-type').value = aso.exam_type || 'PERIODICO';
    document.getElementById('aso-exam-date').value = aso.exam_date ? aso.exam_date.split('T')[0] : '';
    document.getElementById('aso-periodicity').value = aso.periodicity || '12';
    document.getElementById('aso-result').value = aso.result || 'Apto';
    document.getElementById('aso-cid').value = aso.cid || '';
    document.getElementById('aso-obs').value = aso.observation || '';
    document.getElementById('btn-delete-aso').classList.remove('hidden');
    document.getElementById('aso-modal').classList.remove('hidden');
    
    // Aplicar restrições de data baseado no tipo
    updateDateRestrictions();
};

window.closeAsoModal = () => {
    document.getElementById('aso-modal').classList.add('hidden');
    currentAsoId = null;
};

// Função para atualizar restrições de data baseado no tipo de exame
function updateDateRestrictions() {
    const examType = document.getElementById('aso-type').value;
    const examDateInput = document.getElementById('aso-exam-date');
    const periodicitySelect = document.getElementById('aso-periodicity');
    
    if (examType === 'ADMISSAO') {
        // Para exames admissionais, permitir datas retroativas (até 5 anos antes da admissão)
        const employee = asoData.employees.find(e => e.id === selectedEmployeeId);
        if (employee && employee.admissionDate) {
            const admissionDate = new Date(employee.admissionDate);
            const minDate = new Date(admissionDate);
            minDate.setFullYear(minDate.getFullYear() - 5); // 5 anos antes da admissão
            
            examDateInput.min = minDate.toISOString().split('T')[0];
            examDateInput.max = new Date().toISOString().split('T')[0];
        } else {
            examDateInput.min = '';
            examDateInput.max = new Date().toISOString().split('T')[0];
        }
        // Sugerir data de admissão como padrão para admissional
        if (employee && employee.admissionDate) {
            examDateInput.value = employee.admissionDate.split('T')[0];
        }
    } else if (examType === 'DEMISSAO') {
        // Para demissionais, data não pode ser futura
        examDateInput.max = new Date().toISOString().split('T')[0];
        examDateInput.min = '';
    } else {
        // Para outros tipos (periódico, retorno, mudança), permitir datas retroativas razoáveis
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 2); // 2 anos no máximo
        examDateInput.min = minDate.toISOString().split('T')[0];
        examDateInput.max = '';
    }
    
    // Ajustar periodicidade padrão baseado no tipo
    if (examType === 'ADMISSAO') {
        periodicitySelect.value = '6'; // 6 meses para admissional
    } else if (examType === 'DEMISSAO') {
        periodicitySelect.value = '0'; // Não tem validade para demissional
        periodicitySelect.disabled = true;
    } else {
        periodicitySelect.value = '12'; // 12 meses para outros
        periodicitySelect.disabled = false;
    }
}

async function submitAso() {
    const payload = {
        employee_id: selectedEmployeeId,
        exam_type: document.getElementById('aso-type').value,
        exam_date: document.getElementById('aso-exam-date').value,
        periodicity: parseInt(document.getElementById('aso-periodicity').value),
        result: document.getElementById('aso-result').value,
        observation: document.getElementById('aso-obs').value
    };

    // Validações básicas
    if (!payload.exam_date) {
        alert('Por favor, preencha a data do exame.');
        return;
    }

    const examDate = new Date(payload.exam_date);
    const today = new Date();
    
    // Para exames admissionais, verificar se a data é razoável
    if (payload.exam_type === 'ADMISSAO') {
        const employee = asoData.employees.find(e => e.id === selectedEmployeeId);
        if (employee && employee.admissionDate) {
            const admissionDate = new Date(employee.admissionDate);
            const diffDays = Math.ceil((examDate - admissionDate) / (1000 * 60 * 60 * 24));
            
            // Permitir até 30 dias antes da admissão ou até 30 dias depois
            if (diffDays < -30 || diffDays > 30) {
                const confirmMsg = `A data do exame (${payload.exam_date}) está muito distante da data de admissão (${employee.admissionDate}). Deseja continuar?`;
                if (!confirm(confirmMsg)) {
                    return;
                }
            }
        }
    }

    // Calcular data de validade
    let expiryDate = null;
    if (payload.exam_type !== 'DEMISSAO' && payload.periodicity > 0) {
        expiryDate = new Date(examDate);
        expiryDate.setMonth(expiryDate.getMonth() + payload.periodicity);
    }

    try {
        let res;
        const requestData = { 
            ...payload, 
            expiry_date: expiryDate ? expiryDate.toISOString().split('T')[0] : null 
        };

        if (currentAsoId) {
            res = await fetch(`/api/aso/record/${currentAsoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
        } else {
            res = await fetch('/api/aso', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
        }

        if (res.ok) {
            closeAsoModal();
            await loadDataFromServer();
            selectEmployee(selectedEmployeeId);
        } else {
            const err = await res.json();
            alert('Erro ao salvar ASO: ' + (err.error || 'Desconhecido'));
        }
    } catch (e) {
        console.error(e);
        alert('Erro ao salvar ASO');
    }
}

async function deleteAso() {
    if (!currentAsoId || !confirm('Tem certeza que deseja excluir este ASO?')) return;
    
    try {
        const res = await fetch(`/api/aso/record/${currentAsoId}`, { method: 'DELETE' });
        if (res.ok) {
            closeAsoModal();
            await loadDataFromServer();
            selectEmployee(selectedEmployeeId);
        }
    } catch (e) {
        console.error(e);
    }
}

// === CERTIFICATE MODAL ===

let currentCertId = null;

window.openNewCertificateModal = () => {
    currentCertId = null;
    document.getElementById('cert-modal-title').innerText = 'Novo Atestado';
    document.getElementById('cert-modal-subtitle').innerText = 'Registre o atestado médico';
    document.getElementById('cert-id').value = '';
    document.getElementById('cert-start').value = new Date().toISOString().split('T')[0];
    document.getElementById('cert-end').value = '';
    document.getElementById('cert-cid').value = '';
    document.getElementById('cert-obs').value = '';
    document.getElementById('btn-delete-cert').classList.add('hidden');
    document.getElementById('certificate-modal').classList.remove('hidden');
};

window.editCertificate = (id) => {
    const cert = asoData.allCertificates.find(c => c.id === id);
    if (!cert) return;
    
    currentCertId = id;
    document.getElementById('cert-modal-title').innerText = 'Editar Atestado';
    document.getElementById('cert-modal-subtitle').innerText = 'Atualize o atestado';
    document.getElementById('cert-id').value = cert.id;
    document.getElementById('cert-start').value = cert.start_date ? cert.start_date.split('T')[0] : '';
    document.getElementById('cert-end').value = cert.end_date ? cert.end_date.split('T')[0] : '';
    document.getElementById('cert-cid').value = cert.cid || '';
    document.getElementById('cert-obs').value = cert.observation || '';
    document.getElementById('btn-delete-cert').classList.remove('hidden');
    document.getElementById('certificate-modal').classList.remove('hidden');
};

window.closeCertificateModal = () => {
    document.getElementById('certificate-modal').classList.add('hidden');
    currentCertId = null;
};

async function submitCertificate() {
    const payload = {
        employee_id: selectedEmployeeId,
        start_date: document.getElementById('cert-start').value,
        end_date: document.getElementById('cert-end').value,
        cid: document.getElementById('cert-cid').value,
        observation: document.getElementById('cert-obs').value
    };

    try {
        let res;
        if (currentCertId) {
            res = await fetch(`/api/aso/certificate/${currentCertId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch('/api/aso/certificate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (res.ok) {
            closeCertificateModal();
            await loadDataFromServer();
            selectEmployee(selectedEmployeeId);
        } else {
            const err = await res.json();
            alert('Erro ao salvar atestado: ' + (err.error || 'Desconhecido'));
        }
    } catch (e) {
        console.error(e);
        alert('Erro ao salvar atestado');
    }
}

async function deleteCertificate() {
    if (!currentCertId || !confirm('Tem certeza que deseja excluir este atestado?')) return;
    
    try {
        const res = await fetch(`/api/aso/certificate/${currentCertId}`, { method: 'DELETE' });
        if (res.ok) {
            closeCertificateModal();
            await loadDataFromServer();
            selectEmployee(selectedEmployeeId);
        }
    } catch (e) {
        console.error(e);
    }
}

// Expor todas as funções globalmente no final do módulo
window.refreshData = loadDataFromServer;
window.renderEmployeeList = renderEmployeeList;
window.debounceSearch = debounceSearch;
window.handleSearchKeydown = handleSearchKeydown;
window.submitAso = submitAso;
window.deleteAso = deleteAso;
window.closeAsoModal = closeAsoModal;
window.openNewAsoModal = openNewAsoModal;
window.editAso = editAso;
window.openNewCertificateModal = openNewCertificateModal;
window.editCertificate = editCertificate;
window.closeCertificateModal = closeCertificateModal;
window.submitCertificate = submitCertificate;
window.deleteCertificate = deleteCertificate;
window.selectEmployee = selectEmployee;
window.setFilterStatus = setFilterStatus;
window.setTimelineFilter = setTimelineFilter;
window.updateDateRestrictions = updateDateRestrictions;

console.log('Módulo ASO carregado e funções expostas globalmente');

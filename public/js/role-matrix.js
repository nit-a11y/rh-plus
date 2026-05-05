/**
 * JavaScript do Módulo Matriz de Cargos & CBO
 * Gerencia a interface e interações do frontend
 */

let roles = [];
let currentEditId = null;
let isLoading = false;

// Estado da aplicação
const state = {
    currentFilter: 'all',
    searchTerm: '',
    sortBy: 'name'
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadRoles();
    loadStats();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Form submission
    document.getElementById('roleForm').addEventListener('submit', handleFormSubmit);
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.searchTerm = e.target.value;
            applyFilters();
        }, 300);
    });
    
    // Modal close on overlay click
    document.getElementById('roleModal').addEventListener('click', (e) => {
        if (e.target.id === 'roleModal') {
            closeRoleModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeRoleModal();
        }
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            openNewRoleModal();
        }
    });
}

// Carregar cargos da API
async function loadRoles() {
    try {
        showLoading(true);
        const response = await fetch('/api/roles-matrix');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        roles = await response.json();
        applyFilters();
        loadStats();
    } catch (error) {
        console.error('Erro ao carregar cargos:', error);
        showError('Falha ao carregar cargos: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Carregar kits disponíveis
async function loadKits() {
    try {
        const response = await fetch('/api/roles-matrix/kits/available');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const kits = await response.json();
        const select = document.querySelector('[name="kit_id"]');
        
        // Limpar opções existentes (exceto a primeira)
        select.innerHTML = '<option value="">Selecione um kit (opcional)</option>';
        
        kits.forEach(kit => {
            const option = document.createElement('option');
            option.value = kit.id;
            option.textContent = kit.kit_name + (kit.role_name ? ` (Vinculado a: ${kit.role_name})` : '');
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar kits:', error);
    }
}

// Carregar estatísticas
async function loadStats() {
    try {
        const response = await fetch('/api/roles-matrix/stats/overview');
        if (response.ok) {
            const stats = await response.json();
            updateStatsDisplay(stats);
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Atualizar display de estatísticas
function updateStatsDisplay(stats) {
    document.getElementById('statTotal').textContent = `${stats.total_roles} cargos`;
    document.getElementById('statOP').textContent = `${stats.op_count} OP`;
    document.getElementById('statADM').textContent = `${stats.adm_count} ADM`;
}

// Aplicar filtros e busca
function applyFilters() {
    let filteredRoles = [...roles];
    
    // Filtrar por categoria
    if (state.currentFilter !== 'all') {
        filteredRoles = filteredRoles.filter(role => role.category === state.currentFilter);
    }
    
    // Filtrar por busca
    if (state.searchTerm) {
        const searchLower = state.searchTerm.toLowerCase();
        filteredRoles = filteredRoles.filter(role => 
            role.name.toLowerCase().includes(searchLower) ||
            role.cbo.includes(searchLower) ||
            (role.sector && role.sector.toLowerCase().includes(searchLower)) ||
            (role.director && role.director.toLowerCase().includes(searchLower))
        );
    }
    
    // Ordenar
    filteredRoles.sort((a, b) => {
        if (state.sortBy === 'name') {
            return a.name.localeCompare(b.name);
        } else if (state.sortBy === 'category') {
            return a.category.localeCompare(b.category);
        }
        return 0;
    });
    
    renderRoles(filteredRoles);
}

// Renderizar cards de cargos
function renderRoles(rolesToRender) {
    const grid = document.getElementById('rolesGrid');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    
    loadingState.classList.add('hidden');
    
    if (rolesToRender.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        updateRoleCount(0);
        return;
    }
    
    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    grid.innerHTML = rolesToRender.map(role => createRoleCard(role)).join('');
    updateRoleCount(rolesToRender.length);
}

// Criar HTML do card de cargo
function createRoleCard(role) {
    const hasEmployees = (role.employee_count || 0) > 0;
    const hasVacancies = (role.vacancy_count || 0) > 0;
    const hasKit = !!role.kit_id;
    const hasAssets = (role.asset_count || 0) > 0;
    
    return '<div class="role-card animate-fade" data-category="' + role.category + '" data-search="' + role.name + ' ' + role.cbo + ' ' + (role.sector || '') + '">' +
        '<span class="category-badge category-' + role.category.toLowerCase() + '">' + role.category + '</span>' +
        '<button class="delete-btn" onclick="deleteRole(\'' + role.id + '\', \'' + role.name + '\')" ' +
                'title="Remover cargo" ' + (hasEmployees || hasVacancies ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : '') + '>' +
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                '<path stroke-width="3" d="M6 18L18 6M6 6l12 12" />' +
            '</svg>' +
        '</button>' +
        '<div class="mb-3">' +
            '<div class="text-xs text-gray-500 font-bold">' + role.category + '</div>' +
            '<div class="text-sm text-gray-700">CBO: ' + role.cbo + '</div>' +
        '</div>' +
        '<div class="mb-3">' +
            '<h3 class="text-lg font-black text-gray-900">' + role.name + '</h3>' +
            '<div class="text-sm text-gray-600">' + (role.sector || 'Sem setor definido') + '</div>' +
        '</div>' +
        '<div class="border-t pt-3">' +
            '<div class="text-xs text-gray-500 mb-1">Diretoria / Gestão:</div>' +
            '<div class="text-sm font-bold text-gray-800">' + (role.directorate || 'Não definido') + '</div>' +
        '</div>' +
        '<div class="stats-mini mt-3">' +
            '<div class="stat-item" title="Colaboradores ativos">' +
                '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">' +
                    '<path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />' +
                '</svg>' +
                '<span>' + (role.employee_count || 0) + '</span>' +
            '</div>' +
            '<div class="stat-item" title="Vagas em aberto">' +
                '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">' +
                    '<path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clip-rule="evenodd" />' +
                '</svg>' +
                '<span>' + (role.vacancy_count || 0) + '</span>' +
            '</div>' +
            '<div class="stat-item" title="Kit de fardamento">' +
                '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">' +
                    '<path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />' +
                '</svg>' +
                '<span style="color: ' + (hasKit ? '#16a34a' : '#94a3b8') + '">' + (hasKit ? '✓' : '-') + '</span>' +
            '</div>' +
            '<div class="stat-item" title="Ativos associados">' +
                '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">' +
                    '<path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />' +
                '</svg>' +
                '<span style="color: ' + (hasAssets ? '#16a34a' : '#94a3b8') + '">' + (hasAssets ? role.asset_count : '-') + '</span>' +
            '</div>' +
        '</div>' +
        '<div class="mt-3 pt-3 border-t">' +
            '<button onclick="viewRoleEmployees(\'' + role.name + '\')" ' +
                    'class="w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all mb-2">' +
                '<span style="display: flex; align-items: center; justify-content: center; gap: 4px;">' +
                    '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                        '<path stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />' +
                    '</svg>' +
                    'Ver Colaboradores (' + (role.employee_count || 0) + ')' +
                '</span>' +
            '</button>' +
            '<button onclick="editRole(\'' + role.id + '\')" ' +
                    'class="w-full px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold transition-all">' +
                'Editar Cargo' +
            '</button>' +
        '</div>' +
    '</div>';
}

// Filtros por categoria
function filterByCategory(category) {
    state.currentFilter = category;
    
    // Atualizar botões
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category.toLowerCase()) {
            btn.classList.add('active');
        }
    });
    
    applyFilters();
}

// Busca
function searchRoles() {
    const searchInput = document.getElementById('searchInput');
    state.searchTerm = searchInput.value;
    applyFilters();
}

// Atualizar contador
function updateRoleCount(count) {
    document.getElementById('roleCount').textContent = count;
}

// Modal functions
function openNewRoleModal() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Novo Cargo';
    document.getElementById('submitBtnText').textContent = 'Salvar';
    document.getElementById('roleForm').reset();
    
    // Carregar kits disponíveis
    loadKits();
    
    document.getElementById('roleModal').classList.add('active');
    
    // Focus no primeiro campo
    setTimeout(() => {
        document.querySelector('[name="category"]').focus();
    }, 100);
}

// Editar cargo
async function editRole(id) {
    try {
        const response = await fetch(`/api/roles-matrix/${id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const role = await response.json();
        
        currentEditId = id;
        document.getElementById('modalTitle').textContent = 'Editar Cargo';
        document.getElementById('submitBtnText').textContent = 'Atualizar';
        document.getElementById('roleId').value = id;
        
        // Preencher formulário
        document.querySelector('[name="category"]').value = role.category || '';
        document.querySelector('[name="cbo"]').value = role.cbo || '';
        document.querySelector('[name="name"]').value = role.name || '';
        document.querySelector('[name="sector"]').value = role.sector || '';
        document.querySelector('[name="directorate"]').value = role.directorate || '';
        
        // Carregar kits e preencher seleção
        await loadKits();
        if (role.kit_id) {
            document.querySelector('[name="kit_id"]').value = role.kit_id;
        }
        
        // Preencher ativos (baseado no tipo de ferramentas associadas)
        if (role.asset_count > 0) {
            // Aqui poderíamos carregar os ativos específicos do cargo
            // Por enquanto, vamos deixar como placeholder
        }
        
        document.getElementById('roleModal').classList.add('active');
        
        // Focus no primeiro campo
        setTimeout(() => {
            document.querySelector('[name="category"]').focus();
        }, 100);
    } catch (error) {
        console.error('Erro ao carregar cargo para edição:', error);
        showError('Falha ao carregar cargo: ' + error.message);
    }
}

// Form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Validar CBO (deve ser numérico)
    if (data.cbo && !/^\d{6}$/.test(data.cbo)) {
        showError('CBO deve conter exatamente 6 dígitos numéricos');
        return;
    }
    
    // Coletar ativos selecionados
    const selectedAssets = [];
    if (data.assets_notebook) selectedAssets.push('Notebook');
    if (data.assets_smartphone) selectedAssets.push('Smartphone');
    
    // Remover campos de ativos do objeto principal
    delete data.assets_notebook;
    delete data.assets_smartphone;
    
    try {
        showLoading(true);
        
        let response;
        if (currentEditId) {
            // Atualizar cargo existente
            response = await fetch(`/api/roles-matrix/${currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Criar novo cargo
            response = await fetch('/api/roles-matrix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Processar vinculações se houver
        if (data.kit_id && result.id) {
            await fetch(`/api/roles-matrix/${result.id}/kit/${data.kit_id}`, {
                method: 'POST'
            });
        }
        
        // Processar ativos (placeholder - implementação futura)
        if (selectedAssets.length > 0 && result.id) {
            console.log('Ativos selecionados para o cargo:', selectedAssets);
            // TODO: Implementar lógica de vinculação de ativos
        }
        
        showSuccess(currentEditId ? 'Cargo atualizado com sucesso!' : 'Cargo criado com sucesso!');
        closeRoleModal();
        loadRoles();
        
    } catch (error) {
        console.error('Erro ao salvar cargo:', error);
        showError('Falha ao salvar cargo: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Deletar cargo
async function deleteRole(id, name) {
    const hasEmployees = roles.find(r => r.id === id)?.employee_count > 0;
    const hasVacancies = roles.find(r => r.id === id)?.vacancy_count > 0;
    
    let message = `Tem certeza que deseja remover o cargo "${name}"?`;
    
    if (hasEmployees) {
        message += '\n\n⚠️ Este cargo possui colaboradores ativos e não pode ser removido.';
        showError(message);
        return;
    }
    
    if (hasVacancies) {
        message += '\n\n⚠️ Este cargo possui vagas em aberto e não pode ser removido.';
        showError(message);
        return;
    }
    
    if (!confirm(message)) {
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch(`/api/roles-matrix/${id}`, { method: 'DELETE' });
        
        if (response.ok) {
            await loadRoles();
            showSuccess('Cargo removido com sucesso');
        } else {
            const error = await response.json();
            showError(error.error || 'Erro ao remover cargo');
        }
    } catch (error) {
        console.error('Erro ao remover cargo:', error);
        showError('Erro ao remover cargo: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Refresh roles
async function refreshRoles() {
    await loadRoles();
    showSuccess('Lista atualizada');
}

// Loading states
function showLoading(show) {
    isLoading = show;
    const overlay = document.getElementById('loadingOverlay');
    const loadingState = document.getElementById('loadingState');
    
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
        loadingState.classList.add('hidden');
    }
}

function showEmptyState() {
    document.getElementById('rolesGrid').classList.add('hidden');
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('loadingState').classList.add('hidden');
    updateRoleCount(0);
}

// Toast notifications
function showSuccess(message) {
    showToast(message, 'success');
}

function showError(message) {
    showToast(message, 'error');
}

function showToast(message, type = 'info') {
    // Remover toast existente
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast fixed top-4 right-4 px-6 py-3 rounded-lg text-sm font-bold shadow-lg z-50 animate-fade`;
    
    if (type === 'success') {
        toast.classList.add('bg-green-500', 'text-white');
    } else if (type === 'error') {
        toast.classList.add('bg-red-500', 'text-white');
    } else {
        toast.classList.add('bg-blue-500', 'text-white');
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Auto remover após 3 segundos
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Modal functions para colaboradores
function viewRoleEmployees(roleName) {
    document.getElementById('employeesModalTitle').textContent = 'Colaboradores: ' + roleName;
    document.getElementById('employeesModalSubtitle').textContent = 'Carregando...';
    document.getElementById('employeesModal').classList.add('active');
    
    // Mostrar loading
    document.getElementById('employeesLoading').classList.remove('hidden');
    document.getElementById('employeesList').classList.add('hidden');
    document.getElementById('employeesEmpty').classList.add('hidden');
    
    loadRoleEmployees(roleName);
}

function closeEmployeesModal() {
    document.getElementById('employeesModal').classList.remove('active');
}

async function loadRoleEmployees(roleName) {
    try {
        const response = await fetch(`/api/roles-matrix/${encodeURIComponent(roleName)}/employees`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        displayEmployees(data);
    } catch (error) {
        console.error('Erro ao carregar colaboradores:', error);
        showError('Falha ao carregar colaboradores: ' + error.message);
        closeEmployeesModal();
    }
}

function displayEmployees(data) {
    const { roleName, employeeCount, employees } = data;
    
    // Atualizar subtitle
    document.getElementById('employeesModalSubtitle').textContent = `Total: ${employeeCount} colaborador${employeeCount !== 1 ? 'es' : ''}`;
    
    // Esconder loading
    document.getElementById('employeesLoading').classList.add('hidden');
    
    if (employees.length === 0) {
        // Mostrar empty state
        document.getElementById('employeesEmpty').classList.remove('hidden');
        document.getElementById('employeesList').classList.add('hidden');
    } else {
        // Mostrar lista de colaboradores
        document.getElementById('employeesEmpty').classList.add('hidden');
        document.getElementById('employeesList').classList.remove('hidden');
        
        const tbody = document.getElementById('employeesTableBody');
        tbody.innerHTML = employees.map(emp => createEmployeeRow(emp)).join('');
    }
}

function createEmployeeRow(employee) {
    const photoUrl = employee.photoUrl || '/assets/default-avatar.png';
    const salary = employee.salaryFormatted || 'N/A';
    const admissionDate = employee.admissionDateFormatted || 'N/A';
    const employerName = employee.employer_name || 'N/A';
    
    // Determinar se é base64 ou URL
    const isBase64 = photoUrl.startsWith('data:image');
    const imgSrc = isBase64 ? photoUrl : (photoUrl.startsWith('http') ? photoUrl : '/assets/default-avatar.png');
    
    return '<tr class="border-b hover:bg-gray-50">' +
        '<td class="py-3">' +
            '<img src="' + imgSrc + '" alt="' + employee.name + '" ' +
                 'class="w-10 h-10 rounded-full object-cover" ' +
                 (isBase64 ? '' : 'onerror="this.src=\'/assets/default-avatar.png\'"') + '>' +
        '</td>' +
        '<td class="py-3">' +
            '<div class="font-bold text-sm">' + employee.name + '</div>' +
        '</td>' +
        '<td class="py-3 text-sm text-gray-600">' + (employee.registrationNumber || 'N/A') + '</td>' +
        '<td class="py-3 text-sm text-gray-600">' + (employee.sector || 'N/A') + '</td>' +
        '<td class="py-3 text-sm font-medium text-green-600">' + salary + '</td>' +
        '<td class="py-3 text-sm text-gray-600">' + admissionDate + '</td>' +
        '<td class="py-3 text-sm text-gray-600">' + employerName + '</td>' +
    '</tr>';
}

// Export functions para uso global
window.openNewRoleModal = openNewRoleModal;
window.editRole = editRole;
window.deleteRole = deleteRole;
window.filterByCategory = filterByCategory;
window.searchRoles = searchRoles;
window.refreshRoles = refreshRoles;
window.viewRoleEmployees = viewRoleEmployees;
window.closeEmployeesModal = closeEmployeesModal;

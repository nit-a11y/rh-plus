
import { state, getRefresher } from '../state.js';
import { calculateAge, getStatusColorClass } from '../utils.js';

let isArchivedView = false;

// Função auxiliar para status visual (Badge HTML)
function getStatusBadge(status) {
     switch (status) {
        case 'Em dia': return `<span class="badge badge-success">Em Dia</span>`;
        case 'Próximo do vencimento': return `<span class="badge badge-warning">Atenção</span>`;
        case 'Vencida': return `<span class="badge badge-danger">Vencido</span>`;
        case 'Sem itens': return `<span class="badge badge-neutral">Sem Itens</span>`;
        default: return `<span class="badge badge-neutral">${status}</span>`;
    }
}

export function renderEmployeeList() {
    const tbody = document.getElementById('employee-table-body');
    if (!tbody) return;
    const filterInput = document.getElementById('search-input').value.toLowerCase();
    
    tbody.innerHTML = '';
    
    // Filtro
    const filtered = state.employees.filter(emp => {
        const matchesText = emp.name.toLowerCase().includes(filterInput) || 
                            emp.registrationNumber.toLowerCase().includes(filterInput);
        const matchesStatus = isArchivedView ? emp.type === 'Desligado' : emp.type !== 'Desligado';
        return matchesText && matchesStatus;
    });

    // Fallback: Estado Vazio
    if (filtered.length === 0) {
        const msg = isArchivedView ? 'Nenhum colaborador arquivado.' : 'Nenhum colaborador ativo encontrado.';
        tbody.innerHTML = `
            <tr>
                <td colSpan="6" class="p-12 text-center">
                    <div class="flex flex-col items-center justify-center text-gray-400">
                        <svg class="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        <span class="font-medium">${msg}</span>
                    </div>
                </td>
            </tr>`;
        return;
    }

    filtered.forEach(emp => {
        // Lógica de Status Geral
        let overallStatus = 'Em dia';
        if (emp.items.length === 0) overallStatus = 'Sem itens';
        else if (emp.items.some(i => i.status === 'Vencida')) overallStatus = 'Vencida';
        else if (emp.items.some(i => i.status === 'Próximo do vencimento')) overallStatus = 'Próximo do vencimento';
        
        if (emp.type === 'Desligado') overallStatus = 'Inativo';

        // Badge Ocorrências
        const occCount = emp.occurrences ? emp.occurrences.length : 0;
        let occBadge = occCount > 0 
            ? `<div class="flex items-center justify-center gap-1 text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded-md border border-orange-100"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> ${occCount}</div>`
            : `<span class="text-gray-300">-</span>`;

        // Avatar Logic
        let avatarHtml;
        if (emp.photoUrl) {
            avatarHtml = `<img src="${emp.photoUrl}" 
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                class="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover group-hover:border-red-100 transition-colors" />
                <div class="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center text-gray-400" style="display:none">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
                </div>`;
        } else {
            avatarHtml = `
                <div class="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center text-gray-400 group-hover:border-red-100 transition-colors">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
                </div>`;
        }

        // CALCULO IDADE (Usando função importada)
        const age = calculateAge(emp.birthDate);

        const tr = document.createElement('tr');
        tr.className = `group cursor-pointer transition-colors hover:bg-gray-50 ${emp.type === 'Desligado' ? 'opacity-60 bg-gray-50' : ''}`;
        tr.onclick = () => window.navigateTo('detail', emp);
        
        tr.innerHTML = `
            <td>
                <div class="flex items-center gap-4">
                    <div class="relative">
                        ${avatarHtml}
                        ${emp.type === 'Desligado' ? '' : '<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>'}
                    </div>
                    <div>
                        <div class="font-bold text-gray-900 group-hover:text-red-700 transition-colors">${emp.name}</div>
                        <div class="text-xs text-gray-500 font-mono flex items-center gap-1">
                            ${emp.registrationNumber} • <span class="font-semibold text-gray-700">${age} anos</span> • <span class="uppercase">${emp.role}</span>
                        </div>
                    </div>
                </div>
            </td>
            <td>
                <span class="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold">${emp.sector}</span>
            </td>
            <td class="text-center">
                <div class="flex items-center justify-center gap-1 text-gray-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                    <span class="font-bold">${emp.items.length}</span>
                </div>
            </td>
            <td class="text-center">${occBadge}</td>
            <td class="text-center">
                ${getStatusBadge(overallStatus)}
            </td>
            <td class="text-right pr-6">
                <svg class="w-5 h-5 text-gray-300 group-hover:text-red-600 transition-colors transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Funções de Abas
export function showActive() {
    isArchivedView = false;
    updateTabStyles();
    renderEmployeeList();
}

export function showArchived() {
    isArchivedView = true;
    updateTabStyles();
    renderEmployeeList();
}

function updateTabStyles() {
    const btnActive = document.getElementById('btn-emp-active');
    const btnArchived = document.getElementById('btn-emp-archived');
    
    if (isArchivedView) {
        btnActive.className = "px-4 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 transition-all cursor-pointer";
        btnArchived.className = "px-4 py-1.5 rounded-md text-sm font-bold bg-white text-gray-800 shadow-sm transition-all border border-gray-200";
    } else {
        btnActive.className = "px-4 py-1.5 rounded-md text-sm font-bold bg-white text-gray-800 shadow-sm transition-all border border-gray-200";
        btnArchived.className = "px-4 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 transition-all cursor-pointer";
    }
}

// Preview da Imagem no Modal
export function previewNewEmployeeImage(input) {
    const preview = document.getElementById('new-emp-preview');
    const icon = preview.nextElementSibling; // O container do ícone SVG
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            if(icon) icon.style.display = 'none';
        }
        reader.readAsDataURL(input.files[0]);
    } else {
        // Reset se cancelar
        preview.src = '';
        preview.style.display = 'none';
        if(icon) icon.style.display = 'flex';
    }
}

// Modais (Mantidos e Atualizados)
export const openNewEmployeeModal = () => { 
    // Reset inputs
    ['new-emp-name','new-emp-reg','new-emp-date','new-emp-birth','new-emp-salary','new-emp-role','new-emp-sector'].forEach(id => {
        const el = document.getElementById(id); if(el) el.value = '';
    });
    // Reset foto
    const preview = document.getElementById('new-emp-preview');
    const icon = preview.nextElementSibling;
    preview.src = '';
    preview.style.display = 'none';
    if(icon) icon.style.display = 'flex';
    document.getElementById('new-emp-photo').value = '';

    const modal = document.getElementById('modal-new-employee');
    modal.classList.remove('hidden-custom');
    modal.querySelector('.bg-white').classList.add('modal-content'); 
};

export const closeNewEmployeeModal = () => { document.getElementById('modal-new-employee').classList.add('hidden-custom'); };

export const submitNewEmployee = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<div class="spinner border-white border-2 w-4 h-4"></div>`; 
    btn.disabled = true;
    
    const { loadData, renderApp } = getRefresher();
    
    // Obter imagem base64 se existir
    const preview = document.getElementById('new-emp-preview');
    const photoUrl = preview.src && preview.src.startsWith('data:image') ? preview.src : null;

    const payload = {
        name: document.getElementById('new-emp-name').value,
        registrationNumber: document.getElementById('new-emp-reg').value,
        admissionDate: document.getElementById('new-emp-date').value,
        birthDate: document.getElementById('new-emp-birth').value,
        currentSalary: document.getElementById('new-emp-salary').value,
        role: document.getElementById('new-emp-role').value,
        sector: document.getElementById('new-emp-sector').value,
        hierarchy: document.getElementById('new-emp-hierarchy').value,
        type: document.getElementById('new-emp-type').value,
        shirtSize: document.getElementById('new-emp-shirt').value,
        pantsSize: document.getElementById('new-emp-pants').value,
        shoeSize: document.getElementById('new-emp-shoe').value,
        photoUrl: photoUrl 
    };

    try {
        await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        await loadData();
        renderApp();
        closeNewEmployeeModal();
        alert('Colaborador cadastrado!');
    } catch (error) { 
        console.error(error); 
        alert('Erro ao cadastrar.'); 
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

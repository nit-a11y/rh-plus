// Estado Global da Aplicação
const state = {
    employees: [],
    currentView: 'dashboard',
    selectedEmployee: null,
    sidebarCollapsed: false,
    user: null, // Usuário logado
    currentTab: 'uniforms' // Tab ativa no detalhe
};

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar Autenticação
    const user = Auth.check();
    if (!user) return; // Auth.check já redireciona

    state.user = user;
    
    // Configurar Navegação
    setupNavigation();
    
    // Carregar Dados
    await loadData();
    
    // Renderizar view inicial
    renderApp();
});

// --- API ---
async function loadData() {
    try {
        const response = await fetch('/api/employees');
        state.employees = await response.json();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

// --- Roteamento Simples (View Switching) ---
function navigateTo(view, data = null) {
    state.currentView = view;
    state.selectedEmployee = data;
    if (view === 'detail') {
        state.currentTab = 'uniforms'; // Reset tab
    }
    renderApp();
}

function switchTab(tabName) {
    state.currentTab = tabName;
    renderEmployeeDetail(); // Re-renderiza para atualizar visibilidade das abas
}

function renderApp() {
    // Esconder todas as views
    document.getElementById('view-dashboard').classList.add('hidden-custom');
    document.getElementById('view-employees').classList.add('hidden-custom');
    document.getElementById('view-detail').classList.add('hidden-custom');
    document.getElementById('view-profile').classList.add('hidden-custom');
    
    // Atualizar título do header
    const pageTitle = document.getElementById('page-title');
    
    // Mostrar view atual
    if (state.currentView === 'dashboard') {
        document.getElementById('view-dashboard').classList.remove('hidden-custom');
        pageTitle.innerText = 'Dashboard';
        renderDashboard();
    } else if (state.currentView === 'employees') {
        document.getElementById('view-employees').classList.remove('hidden-custom');
        pageTitle.innerText = 'Colaboradores';
        renderEmployeeList();
    } else if (state.currentView === 'detail') {
        document.getElementById('view-detail').classList.remove('hidden-custom');
        pageTitle.innerText = 'Gestão Integrada';
        renderEmployeeDetail();
    } else if (state.currentView === 'profile') {
        document.getElementById('view-profile').classList.remove('hidden-custom');
        pageTitle.innerText = 'Meu Perfil';
        renderUserProfile();
    }
    
    // Atualizar estado ativo na sidebar
    updateSidebarActiveState();
}

// --- Renderizadores ---

function renderDashboard() {
    // Calcular estatísticas
    let expired = 0, warning = 0, ok = 0;
    
    state.employees.forEach(emp => {
        emp.items.forEach(item => {
            if (item.status === 'Vencida') expired++;
            else if (item.status === 'Próximo do vencimento') warning++;
            else ok++;
        });
    });
    
    // Atualizar Cards
    document.getElementById('stat-total-colab').innerText = state.employees.length;
    document.getElementById('stat-total-items').innerText = expired + warning + ok;
    document.getElementById('stat-ok').innerText = ok;
    document.getElementById('stat-expired').innerText = expired;
    document.getElementById('stat-warning').innerText = warning;
    
    // Renderizar Gráficos (Chart.js)
    renderCharts(ok, warning, expired);
}

function renderEmployeeList() {
    const tbody = document.getElementById('employee-table-body');
    const filterInput = document.getElementById('search-input').value.toLowerCase();
    
    tbody.innerHTML = '';
    
    const filtered = state.employees.filter(emp => 
        emp.name.toLowerCase().includes(filterInput) || 
        emp.registrationNumber.toLowerCase().includes(filterInput)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-500">Nenhum colaborador encontrado.</td></tr>`;
        return;
    }

    filtered.forEach(emp => {
        // Lógica de "pior status" fardamento
        let overallStatus = 'Em dia';
        if (emp.items.length === 0) overallStatus = 'Sem itens';
        else if (emp.items.some(i => i.status === 'Vencida')) overallStatus = 'Vencida';
        else if (emp.items.some(i => i.status === 'Próximo do vencimento')) overallStatus = 'Próximo do vencimento';
        
        const statusClass = getStatusColorClass(overallStatus);
        
        // Contagem de Ocorrências
        const occCount = emp.occurrences ? emp.occurrences.length : 0;
        let occBadge = '';
        if (occCount > 0) {
            const hasCritical = emp.occurrences.some(o => o.type === 'Suspensão' || o.type === 'Justa Causa');
            const color = hasCritical ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
            occBadge = `<span class="px-2 py-1 rounded text-xs font-bold ${color}">${occCount}</span>`;
        } else {
            occBadge = `<span class="text-gray-400 text-xs">-</span>`;
        }

        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100";
        tr.onclick = () => navigateTo('detail', emp);
        
        tr.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <img src="${emp.photoUrl}" class="w-10 h-10 rounded-full border border-gray-200 object-cover" />
                    <div>
                        <div class="font-bold text-gray-900">${emp.name}</div>
                        <div class="text-xs text-gray-500">${emp.registrationNumber} • ${emp.role}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">${emp.sector}</td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-1 text-gray-500">
                    <span class="text-sm font-bold">${emp.items.length}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-center">
                ${occBadge}
            </td>
            <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusClass}">
                    ${overallStatus}
                </span>
            </td>
            <td class="px-6 py-4 text-right">
                <svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderEmployeeDetail() {
    const emp = state.selectedEmployee;
    if (!emp) return;

    // --- Profile Info (Lateral Esquerda) ---
    document.getElementById('detail-photo').src = emp.photoUrl;
    document.getElementById('detail-name').innerText = emp.name;
    document.getElementById('detail-reg').innerText = emp.registrationNumber;
    document.getElementById('detail-role').innerText = emp.role;
    document.getElementById('detail-sector').innerText = emp.sector;
    document.getElementById('detail-adm').innerText = new Date(emp.admissionDate).toLocaleDateString('pt-BR');
    document.getElementById('size-shirt').innerText = `Camisa: ${emp.shirtSize || '-'}`;
    document.getElementById('size-pants').innerText = `Calça: ${emp.pantsSize || '-'}`;
    document.getElementById('size-shoe').innerText = `Pé: ${emp.shoeSize || '-'}`;

    // --- TAB MANAGEMENT ---
    const tabs = ['uniforms', 'occurrences', 'career'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        const content = document.getElementById(`content-${t}`);
        
        if (state.currentTab === t) {
            btn.classList.add('bg-white', 'border-t', 'border-l', 'border-r', 'border-gray-200', 'text-nordeste-red', 'shadow-sm');
            btn.classList.remove('bg-gray-50', 'text-gray-500');
            content.classList.remove('hidden-custom');
        } else {
            btn.classList.remove('bg-white', 'border-t', 'border-l', 'border-r', 'border-gray-200', 'text-nordeste-red', 'shadow-sm');
            btn.classList.add('bg-gray-50', 'text-gray-500');
            content.classList.add('hidden-custom');
        }
    });

    // --- TAB: FARDAMENTO (Renderização) ---
    if (state.currentTab === 'uniforms') {
        const grid = document.getElementById('items-grid');
        grid.innerHTML = '';
        
        if (emp.items.length === 0) {
            grid.innerHTML = `<div class="col-span-2 p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">Nenhum item ativo registrado para este colaborador.</div>`;
        } else {
            emp.items.forEach(item => {
                const style = getItemStyleClass(item.color);
                const statusColor = getStatusColorClass(item.status);
                const isExpired = item.status === 'Vencida';
                
                const card = document.createElement('div');
                card.className = "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow";
                card.innerHTML = `
                    <div class="h-2 ${style.bg}"></div>
                    <div class="p-5">
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center ${style.bg} ${style.text} border ${style.border}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2 13 3h-2L7 2 2.62 3.46a2 2 0 0 0-1.09 1.19l-1.2 6A2 2 0 0 0 3.61 12.91l.82 4.16A2 2 0 0 0 6.42 19l1.09 5.55A2 2 0 0 0 9.5 26h5a2 2 0 0 0 1.99-1.45l1.09-5.55a2 2 0 0 0 1.99-1.93l.82-4.16a2 2 0 0 0 3.28-2.26l-1.2-6a2 2 0 0 0-1.09-1.19z"/><path d="M9 3v13"/><path d="M15 3v13"/></svg>
                                </div>
                                <div>
                                    <h4 class="font-bold text-gray-800">${item.type}</h4>
                                    <p class="text-xs text-gray-500 uppercase font-bold">${item.color} • Tam ${item.size}</p>
                                </div>
                            </div>
                            <span class="px-2 py-1 rounded text-[10px] font-bold uppercase border ${statusColor}">
                                ${item.status}
                            </span>
                        </div>
                        <div class="space-y-2 text-sm text-gray-600 mb-4">
                            <div class="flex justify-between">
                                <span>Entrega:</span>
                                <span class="font-medium">${new Date(item.dateGiven).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Vencimento:</span>
                                <span class="font-medium ${isExpired ? 'text-red-600 font-bold' : ''}">
                                    ${new Date(item.nextExchangeDate).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="openExchangeModal('${item.id}')" class="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-nordeste-red transition-colors flex items-center justify-center gap-1">
                                Trocar
                            </button>
                            <button onclick="openReturnModal('${item.id}')" class="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center gap-1" title="Devolver Item">
                                Devolver
                            </button>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        // Histórico Fardamento
        const historyBody = document.getElementById('history-table-body');
        historyBody.innerHTML = '';
        if (!emp.history || emp.history.length === 0) {
            historyBody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-gray-400 text-sm">Nenhum histórico de movimentação registrado.</td></tr>`;
        } else {
            emp.history.forEach(h => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0";
                
                let typeColor = "text-gray-600 bg-gray-100";
                if (h.type.includes('Avaria')) typeColor = "text-red-700 bg-red-50";
                if (h.type.includes('Tempo')) typeColor = "text-green-700 bg-green-50";
                
                tr.innerHTML = `
                    <td class="px-4 py-3 text-gray-700 whitespace-nowrap">${new Date(h.date).toLocaleDateString('pt-BR')}</td>
                    <td class="px-4 py-3"><span class="px-2 py-1 rounded text-xs font-bold ${typeColor}">${h.type}</span></td>
                    <td class="px-4 py-3 text-gray-800 font-medium">${h.item_name} <span class="text-xs text-gray-500 font-normal">(${h.item_color})</span></td>
                    <td class="px-4 py-3 text-gray-600 truncate max-w-xs">${h.reason ? `<span class="font-bold text-red-600">${h.reason}</span> ` : ''}${h.observation || '-'}</td>
                `;
                historyBody.appendChild(tr);
            });
        }
    }

    // --- TAB: OCORRÊNCIAS (Renderização) ---
    if (state.currentTab === 'occurrences') {
        const occTimeline = document.getElementById('occurrences-timeline');
        occTimeline.innerHTML = '';

        if (!emp.occurrences || emp.occurrences.length === 0) {
            occTimeline.innerHTML = `
                <div class="text-center p-8 text-gray-400">
                    <p>Nenhuma ocorrência registrada.</p>
                </div>`;
        } else {
            emp.occurrences.forEach(occ => {
                let colorClass = 'border-l-4 ';
                let bgClass = 'bg-white';
                let icon = '⚠️';
                
                if (occ.type.includes('Verbal')) { colorClass += 'border-yellow-400'; bgClass = 'bg-yellow-50'; }
                else if (occ.type.includes('Escrito')) { colorClass += 'border-orange-500'; bgClass = 'bg-orange-50'; }
                else if (occ.type.includes('Suspensão')) { colorClass += 'border-red-600'; bgClass = 'bg-red-50'; icon = '🛑'; }
                else if (occ.type.includes('Justa Causa')) { colorClass += 'border-gray-900'; bgClass = 'bg-gray-100'; icon = '⚖️'; }

                const item = document.createElement('div');
                item.className = `relative pl-6 pb-6 border-l border-gray-200 last:pb-0`;
                item.innerHTML = `
                    <div class="absolute -left-3 top-0 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-xs">
                        ${icon}
                    </div>
                    <div class="${bgClass} p-4 rounded-lg shadow-sm ${colorClass}">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="font-bold text-gray-800">${occ.type}</h4>
                                <span class="text-xs text-gray-500 font-mono">${new Date(occ.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <span class="text-xs uppercase font-bold text-gray-400">${occ.status}</span>
                        </div>
                        <p class="mt-2 text-sm text-gray-700 font-medium">${occ.reason}</p>
                        ${occ.observation ? `<p class="mt-2 text-xs text-gray-500 border-t border-gray-200 pt-2 italic">"${occ.observation}"</p>` : ''}
                        <div class="mt-3 text-xs text-gray-400">
                            Registrado por: <strong>${occ.responsible}</strong>
                        </div>
                    </div>
                `;
                occTimeline.appendChild(item);
            });
        }
    }

    // --- TAB: CARREIRA (Renderização) ---
    if (state.currentTab === 'career') {
        const carTimeline = document.getElementById('career-timeline');
        carTimeline.innerHTML = '';

        if (!emp.career || emp.career.length === 0) {
            carTimeline.innerHTML = `<div class="text-center p-8 text-gray-400">Sem histórico de carreira.</div>`;
        } else {
            // Ordenar por data decrescente (mais recente primeiro)
            emp.career.forEach((car, index) => {
                const isFirst = index === emp.career.length - 1; // O item mais antigo (Admissão)
                const isLatest = index === 0;

                const cardStyle = isLatest ? 'border-l-4 border-blue-500 shadow-md' : 'border border-gray-200';
                
                const item = document.createElement('div');
                item.className = "flex gap-4 pb-8 relative";
                
                // Linha conectora (exceto para o último item visual - que é o primeiro cronológico)
                const line = !isFirst ? `<div class="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gray-200"></div>` : '';

                item.innerHTML = `
                    <div class="flex-shrink-0 relative z-10">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center ${isLatest ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 border border-gray-200'}">
                            ${isLatest ? '★' : '💼'}
                        </div>
                    </div>
                    ${line}
                    <div class="flex-1 bg-white p-4 rounded-lg ${cardStyle}">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h4 class="font-bold text-lg text-gray-800">${car.role}</h4>
                                <p class="text-sm text-gray-600">${car.sector}</p>
                            </div>
                            <span class="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded uppercase">${car.move_type}</span>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 text-sm mt-3">
                            <div>
                                <span class="block text-gray-400 text-xs">Salário</span>
                                <span class="font-medium text-gray-800">${car.salary}</span>
                            </div>
                            <div>
                                <span class="block text-gray-400 text-xs">Data Início</span>
                                <span class="font-medium text-gray-800">${new Date(car.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>

                        ${car.observation ? `<p class="mt-3 text-sm text-gray-500 bg-gray-50 p-2 rounded">"${car.observation}"</p>` : ''}
                    </div>
                `;
                carTimeline.appendChild(item);
            });
        }
    }
}

function renderUserProfile() {
    const user = state.user;
    
    document.getElementById('profile-name').value = user.name;
    document.getElementById('profile-username').value = user.username;
    document.getElementById('profile-img-preview').src = user.photoUrl;
    document.getElementById('profile-password').value = ''; // Limpar campo de senha
}

// --- Funções Auxiliares de UI ---

function setupNavigation() {
    // Botão Sidebar Colapse
    document.getElementById('toggle-sidebar-btn').addEventListener('click', () => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        const sidebar = document.getElementById('sidebar');
        const labels = document.querySelectorAll('.sidebar-label');
        const logoText = document.getElementById('logo-text');
        
        if (state.sidebarCollapsed) {
            sidebar.classList.remove('w-64');
            sidebar.classList.add('w-20');
            labels.forEach(l => l.classList.add('hidden-custom'));
            logoText.classList.add('hidden-custom');
        } else {
            sidebar.classList.remove('w-20');
            sidebar.classList.add('w-64');
            labels.forEach(l => l.classList.remove('hidden-custom'));
            logoText.classList.remove('hidden-custom');
        }
    });

    // Links da Sidebar
    document.getElementById('nav-dashboard').addEventListener('click', () => navigateTo('dashboard'));
    document.getElementById('nav-employees').addEventListener('click', () => navigateTo('employees'));
    
    // Pesquisa Colaboradores
    document.getElementById('search-input').addEventListener('input', renderEmployeeList);
}

function updateSidebarActiveState() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('bg-nordeste-red', 'text-white', 'shadow-lg');
        btn.classList.add('text-gray-400', 'hover:bg-gray-800', 'hover:text-white');
    });
    
    if (state.currentView === 'dashboard') {
        const btn = document.getElementById('nav-dashboard');
        btn.classList.add('bg-nordeste-red', 'text-white', 'shadow-lg');
        btn.classList.remove('text-gray-400', 'hover:bg-gray-800');
    } else if (state.currentView === 'employees' || state.currentView === 'detail') {
        const btn = document.getElementById('nav-employees');
        btn.classList.add('bg-nordeste-red', 'text-white', 'shadow-lg');
        btn.classList.remove('text-gray-400', 'hover:bg-gray-800');
    }
}

// --- PERFIL E UPLOAD ---

window.previewProfileImage = (input) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profile-img-preview').src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

window.submitProfileUpdate = async (e) => {
    e.preventDefault();
    
    const id = state.user.id;
    const name = document.getElementById('profile-name').value;
    const username = document.getElementById('profile-username').value;
    const password = document.getElementById('profile-password').value;
    
    // Pegar imagem atual (pode ter sido atualizada pelo preview)
    const photoUrl = document.getElementById('profile-img-preview').src;

    const payload = { name, username, password, photoUrl };

    try {
        const response = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            alert('Perfil atualizado com sucesso!');
            // Atualizar estado e localStorage
            state.user = data.user;
            Auth.updateSession(data.user);
            
            // Atualizar UI do header
            document.getElementById('user-name-display').innerText = state.user.name;
            document.getElementById('user-avatar-display').src = state.user.photoUrl;
        } else {
            alert('Erro ao atualizar: ' + data.error);
        }
    } catch (e) {
        console.error(e);
        alert('Erro de conexão ao atualizar perfil.');
    }
};

// --- GERAÇÃO DE PDF ---
async function getBase64ImageFromURL(url) {
    return new Promise((resolve, reject) => {
        var img = new Image();
        img.setAttribute("crossOrigin", "anonymous");
        img.onload = () => {
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            var dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
        };
        img.onerror = error => {
            console.warn("Erro ao carregar imagem para PDF:", error);
            resolve(null); // Retorna null para não quebrar o fluxo
        };
        img.src = url;
    });
}

window.downloadHistoryPDF = async () => {
    if (!state.selectedEmployee) return;

    const emp = state.selectedEmployee;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const logoUrl = 'assets/logo.png'; // Caminho relativo
    const logoBase64 = await getBase64ImageFromURL(logoUrl);

    // --- MARCA D'ÁGUA ---
    if (logoBase64) {
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.1 }));
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const imgWidth = 100;
        const imgHeight = 100;
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;
        doc.addImage(logoBase64, 'PNG', x, y, imgWidth, imgHeight);
        doc.restoreGraphicsState();
    }

    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("Nordeste Locações - RH", 14, 20);
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text("Histórico de Fardamento e Trocas", 14, 28);
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Colaborador: ${emp.name}`, 14, 40);
    doc.text(`Matrícula: ${emp.registrationNumber}`, 14, 45);
    doc.text(`Cargo: ${emp.role}`, 100, 40);
    doc.text(`Setor: ${emp.sector}`, 100, 45);
    
    const tableColumn = ["Data", "Tipo", "Item", "Motivo/Obs", "Responsável"];
    const tableRows = [];

    if (emp.history && emp.history.length > 0) {
        emp.history.forEach(h => {
            const date = new Date(h.date).toLocaleDateString('pt-BR');
            const itemDesc = `${h.item_name} (${h.item_color})`;
            let obs = h.observation || '';
            if (h.reason) obs = `${h.reason} - ${obs}`;
            tableRows.push([date, h.type, itemDesc, obs, h.responsible]);
        });
    } else {
        tableRows.push(["-", "-", "Nenhum histórico registrado", "-", "-"]);
    }

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 55,
        theme: 'striped',
        headStyles: { fillColor: [183, 28, 28] }, // Cor vermelha da Nordeste
        styles: { fontSize: 9, cellPadding: 3 },
    });

    doc.save(`Historico_Fardamento_${emp.registrationNumber}.pdf`);
};

// --- Gráficos (Chart.js) ---
let chartStatus = null;
let chartSetor = null;

function renderCharts(ok, warning, expired) {
    const ctxStatus = document.getElementById('chart-status').getContext('2d');
    const ctxSetor = document.getElementById('chart-sector').getContext('2d');
    
    if (chartStatus) chartStatus.destroy();
    if (chartSetor) chartSetor.destroy();
    
    chartStatus = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Em Dia', 'Atenção', 'Vencidos'],
            datasets: [{
                data: [ok, warning, expired],
                backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
    
    const sectors = {};
    state.employees.forEach(e => {
        if(!sectors[e.sector]) sectors[e.sector] = 0;
        sectors[e.sector] += e.items.length;
    });

    chartSetor = new Chart(ctxSetor, {
        type: 'bar',
        data: {
            labels: Object.keys(sectors),
            datasets: [{
                label: 'Qtd. Peças',
                data: Object.values(sectors),
                backgroundColor: '#D32F2F',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// --- Modais e Ações ---

// 1. TROCA
let currentItemExchangeId = null;

window.openExchangeModal = (itemId) => {
    currentItemExchangeId = itemId;
    document.getElementById('exchange-reason-container').classList.add('hidden-custom');
    document.getElementById('exchange-obs').value = '';
    document.getElementById('exchange-returned').checked = true;
    document.getElementById('modal-exchange').classList.remove('hidden-custom');
};

window.closeExchangeModal = () => {
    document.getElementById('modal-exchange').classList.add('hidden-custom');
    currentItemExchangeId = null;
};

window.setExchangeType = (type) => {
    const btnTime = document.getElementById('btn-type-time');
    const btnDamage = document.getElementById('btn-type-damage');
    const reasonContainer = document.getElementById('exchange-reason-container');
    
    document.getElementById('modal-exchange').dataset.type = type;
    
    if (type === 'Tempo') {
        btnTime.classList.add('bg-green-600', 'text-white', 'border-green-600');
        btnTime.classList.remove('bg-white', 'text-gray-600');
        btnDamage.classList.remove('bg-red-600', 'text-white', 'border-red-600');
        btnDamage.classList.add('bg-white', 'text-gray-600');
        reasonContainer.classList.add('hidden-custom');
    } else {
        btnDamage.classList.add('bg-red-600', 'text-white', 'border-red-600');
        btnDamage.classList.remove('bg-white', 'text-gray-600');
        btnTime.classList.remove('bg-green-600', 'text-white', 'border-green-600');
        btnTime.classList.add('bg-white', 'text-gray-600');
        reasonContainer.classList.remove('hidden-custom');
    }
};

window.submitExchange = async (e) => {
    e.preventDefault();
    if (!currentItemExchangeId) return;
    
    const type = document.getElementById('modal-exchange').dataset.type || 'Tempo';
    const reason = document.getElementById('exchange-reason').value;
    const obs = document.getElementById('exchange-obs').value;
    const returnedOld = document.getElementById('exchange-returned').checked;
    
    const emp = state.selectedEmployee;
    const today = new Date().toISOString().split('T')[0];
    const nextDate = calculateNextExchange(today, emp.type);
    const status = getUniformStatus(nextDate);
    
    const payload = {
        itemId: currentItemExchangeId,
        date: today,
        nextExchangeDate: nextDate,
        status: status,
        transactionType: type === 'Tempo' ? 'Tempo (Desgaste)' : 'Avaria',
        reason: type === 'Avaria' ? reason : null,
        observation: obs,
        responsible: state.user ? state.user.name : 'Admin RH',
        returnedOld: returnedOld
    };
    
    try {
        await fetch('/api/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        await loadData();
        state.selectedEmployee = state.employees.find(e => e.id === emp.id);
        renderEmployeeDetail();
        closeExchangeModal();
        alert('Troca realizada com sucesso!');
    } catch (error) {
        alert('Erro ao processar troca.');
    }
};

// 2. DEVOLUÇÃO ITEM
let currentItemReturnId = null;
window.openReturnModal = (itemId) => {
    currentItemReturnId = itemId;
    document.getElementById('return-obs').value = '';
    document.getElementById('modal-return').classList.remove('hidden-custom');
}
window.closeReturnModal = () => {
    document.getElementById('modal-return').classList.add('hidden-custom');
    currentItemReturnId = null;
}
window.submitReturn = async (e) => {
    e.preventDefault();
    if (!currentItemReturnId) return;
    const reason = document.getElementById('return-reason').value;
    const obs = document.getElementById('return-obs').value;
    const today = new Date().toISOString().split('T')[0];
    const payload = { itemId: currentItemReturnId, date: today, reason: reason, observation: obs, responsible: state.user ? state.user.name : 'Admin RH' };
    try {
        await fetch('/api/return', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        await loadData();
        if (state.selectedEmployee) state.selectedEmployee = state.employees.find(e => e.id === state.selectedEmployee.id);
        renderEmployeeDetail();
        closeReturnModal();
        alert('Item devolvido com sucesso!');
    } catch (error) { alert('Erro ao devolver item.'); }
}

// 3. DEVOLUÇÃO TOTAL
window.openReturnAllModal = () => {
    document.getElementById('return-all-obs').value = '';
    document.getElementById('modal-return-all').classList.remove('hidden-custom');
}
window.closeReturnAllModal = () => {
    document.getElementById('modal-return-all').classList.add('hidden-custom');
}
window.submitReturnAll = async (e) => {
    e.preventDefault();
    if (!state.selectedEmployee) return;
    const reason = document.getElementById('return-all-reason').value;
    const obs = document.getElementById('return-all-obs').value;
    const today = new Date().toISOString().split('T')[0];
    const payload = { employeeId: state.selectedEmployee.id, date: today, reason: reason, observation: obs, responsible: state.user ? state.user.name : 'Admin RH' };
    try {
        const res = await fetch('/api/return-all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        await loadData();
        if (state.selectedEmployee) state.selectedEmployee = state.employees.find(e => e.id === state.selectedEmployee.id);
        renderEmployeeDetail();
        closeReturnAllModal();
        alert(data.message);
    } catch (error) { alert('Erro ao processar devolução total.'); }
}

// 4. NOVO COLABORADOR
window.openNewEmployeeModal = () => { document.getElementById('modal-new-employee').classList.remove('hidden-custom'); };
window.closeNewEmployeeModal = () => { document.getElementById('modal-new-employee').classList.add('hidden-custom'); };
window.submitNewEmployee = async (e) => {
    e.preventDefault();
    const payload = {
        name: document.getElementById('new-emp-name').value,
        registrationNumber: document.getElementById('new-emp-reg').value,
        admissionDate: document.getElementById('new-emp-date').value,
        role: document.getElementById('new-emp-role').value,
        sector: document.getElementById('new-emp-sector').value,
        type: document.getElementById('new-emp-type').value,
        shirtSize: document.getElementById('new-emp-shirt').value,
        pantsSize: document.getElementById('new-emp-pants').value,
        shoeSize: document.getElementById('new-emp-shoe').value
    };
    try {
        await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        await loadData();
        renderEmployeeList();
        closeNewEmployeeModal();
        alert('Colaborador cadastrado!');
    } catch (error) { console.error(error); alert('Erro ao cadastrar.'); }
};

// 5. NOVO ITEM
window.openNewItemModal = () => { document.getElementById('modal-new-item').classList.remove('hidden-custom'); };
window.closeNewItemModal = () => { document.getElementById('modal-new-item').classList.add('hidden-custom'); };
window.submitNewItem = async (e) => {
    e.preventDefault();
    if (!state.selectedEmployee) return;
    const payload = {
        employeeId: state.selectedEmployee.id,
        type: document.getElementById('new-item-type').value,
        color: document.getElementById('new-item-color').value,
        size: document.getElementById('new-item-size').value,
        dateGiven: document.getElementById('new-item-date').value,
        responsible: state.user ? state.user.name : 'Admin RH'
    };
    try {
        await fetch('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        await loadData();
        state.selectedEmployee = state.employees.find(e => e.id === state.selectedEmployee.id);
        renderEmployeeDetail();
        closeNewItemModal();
        alert('Item adicionado!');
    } catch (error) { alert('Erro ao adicionar item.'); }
};

// 6. NOVA OCORRÊNCIA
window.openOccurrenceModal = () => {
    document.getElementById('occ-reason').value = '';
    document.getElementById('occ-obs').value = '';
    document.getElementById('modal-new-occurrence').classList.remove('hidden-custom');
};
window.closeOccurrenceModal = () => { document.getElementById('modal-new-occurrence').classList.add('hidden-custom'); };
window.submitOccurrence = async (e) => {
    e.preventDefault();
    if (!state.selectedEmployee) return;

    const payload = {
        employeeId: state.selectedEmployee.id,
        type: document.getElementById('occ-type').value,
        date: document.getElementById('occ-date').value,
        reason: document.getElementById('occ-reason').value,
        observation: document.getElementById('occ-obs').value,
        responsible: state.user ? state.user.name : 'Admin RH'
    };

    try {
        await fetch('/api/occurrences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        await loadData();
        state.selectedEmployee = state.employees.find(e => e.id === state.selectedEmployee.id);
        renderEmployeeDetail();
        closeOccurrenceModal();
        alert('Ocorrência registrada com sucesso.');
    } catch (error) { alert('Erro ao registrar ocorrência.'); }
};

// 7. NOVA MOVIMENTAÇÃO DE CARREIRA
window.openCareerModal = () => {
    // Tenta preencher cargo e setor atuais
    if (state.selectedEmployee) {
        document.getElementById('car-role').value = state.selectedEmployee.role;
        document.getElementById('car-sector').value = state.selectedEmployee.sector;
    }
    document.getElementById('car-salary').value = '';
    document.getElementById('car-obs').value = '';
    document.getElementById('modal-new-career').classList.remove('hidden-custom');
};
window.closeCareerModal = () => { document.getElementById('modal-new-career').classList.add('hidden-custom'); };
window.submitCareer = async (e) => {
    e.preventDefault();
    if (!state.selectedEmployee) return;

    const payload = {
        employeeId: state.selectedEmployee.id,
        move_type: document.getElementById('car-type').value,
        role: document.getElementById('car-role').value,
        sector: document.getElementById('car-sector').value,
        salary: document.getElementById('car-salary').value,
        date: document.getElementById('car-date').value,
        observation: document.getElementById('car-obs').value,
        responsible: state.user ? state.user.name : 'Admin RH'
    };

    try {
        await fetch('/api/career', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        await loadData();
        state.selectedEmployee = state.employees.find(e => e.id === state.selectedEmployee.id);
        renderEmployeeDetail();
        closeCareerModal();
        alert('Movimentação registrada com sucesso.');
    } catch (error) { alert('Erro ao registrar movimentação.'); }
};
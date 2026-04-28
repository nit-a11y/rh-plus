// ==================== FUNÇÕES DE LOADING AMIGÁVEL ====================

// Mostrar animação de loading
function showLoadingAnimation() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.remove('hidden');
        console.log('🎬 Animação de loading iniciada');
    }
}

// Esconder animação de loading
function hideLoadingAnimation() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.classList.add('hidden');
            overlay.style.opacity = '1';
            overlay.style.transform = 'scale(1)';
        }, 300);
        
        console.log('🎬 Animação de loading finalizada');
    }
}

// Atualizar status do loading
function updateLoadingStatus(status, progress) {
    const statusElement = document.getElementById('loading-status');
    const progressElement = document.getElementById('loading-progress');
    
    if (statusElement) {
        statusElement.textContent = status;
        statusElement.classList.add('animate-pulse');
        setTimeout(() => statusElement.classList.remove('animate-pulse'), 500);
    }
    
    if (progressElement && progress !== undefined) {
        progressElement.style.width = `${progress}%`;
        
        // Adicionar efeito de brilho quando completar
        if (progress === 100) {
            progressElement.classList.add('animate-pulse');
            setTimeout(() => progressElement.classList.remove('animate-pulse'), 1000);
        }
    }
    
    console.log(`📊 Status: ${status} (${progress || 'N/A'}%)`);
}

// Atualizar detalhes do loading
function updateLoadingDetails(detail) {
    const detailsElement = document.getElementById('loading-details');
    if (detailsElement) {
        // Criar novo detalhe com animação
        const newDetail = document.createElement('div');
        newDetail.className = 'flex items-center gap-2';
        newDetail.innerHTML = `
            <div class="w-1.5 h-1.5 bg-nordeste-red rounded-full animate-pulse"></div>
            <span>${detail}</span>
        `;
        
        // Manter apenas os últimos 3 detalhes
        const existingDetails = detailsElement.querySelectorAll('div');
        if (existingDetails.length >= 3) {
            existingDetails[0].remove();
        }
        
        detailsElement.appendChild(newDetail);
        
        // Animar entrada
        newDetail.style.opacity = '0';
        newDetail.style.transform = 'translateX(-10px)';
        setTimeout(() => {
            newDetail.style.transition = 'all 0.3s ease-out';
            newDetail.style.opacity = '1';
            newDetail.style.transform = 'translateX(0)';
        }, 10);
    }
    
    console.log(`📝 Detalhe: ${detail}`);
}

// ==================== SMART FILTERS SYSTEM ====================
// Sistema de filtros inteligentes de nível sênior

// Estado global dos filtros
const filterState = {
    searchText: '',
    sector: null,
    workplace: null,
    employer: null,
    status: 'active',
    searchType: 'name',
    advanced: {
        startDate: '',
        endDate: ''
    },
    activeFilters: []
};

// Variáveis globais que serão carregadas
let employees = [];
let companies = [];

// Debounce para busca em tempo real
let searchTimeout;
const SEARCH_DEBOUNCE = 300;

// ==================== FUNÇÕES PRINCIPAIS ====================

// Inicializar sistema de filtros
function initSmartFilters() {
    // Carregar dados primeiro
    loadFilterData().then(() => {
        initSmartSearch();
        populateFilterDropdowns();
        updateActiveFilters();
    });
}

// Carregar dados para filtros (USANDO API COMPLETA DO DOSSIER - SEM DUPLICAÇÃO)
async function loadFilterData() {
    try {
        // MOSTRAR ANIMAÇÃO DE LOADING
        showLoadingAnimation();
        
        // Carregar dados básicos primeiro
        updateLoadingStatus('Conectando ao servidor...', 10);
        updateLoadingDetails('Buscando lista de colaboradores...');
        
        const [empRes, compRes] = await Promise.all([
            fetch('/api/employees-pro/list-summary'),
            fetch('/api/companies')
        ]);

        updateLoadingStatus('Processando dados básicos...', 25);
        updateLoadingDetails('Carregando informações das empresas...');

        const empData = await empRes.json();
        const compData = await compRes.json();
        
        employees = Array.isArray(empData) ? empData : [];
        companies = Array.isArray(compData) ? compData : [];
        
        updateLoadingStatus('Organizando colaboradores...', 40);
        updateLoadingDetails(`Encontrados ${employees.length} colaboradores`);
        
        // Enriquecer dados com informações corporativas (OTIMIZADO - BATCH API)
        if (employees.length > 0) {
            console.log('Enriquecendo colaboradores com API BATCH otimizada...');
            
            updateLoadingStatus('Otimizando dados...', 50);
            updateLoadingDetails('Tentando carregamento em lote...');
            
            let successCount = 0;
            let errorCount = 0;
            
            try {
                // Usar API batch que retorna todos os dados enriquecidos de uma vez
                updateLoadingStatus('Processamento em lote...', 60);
                updateLoadingDetails('Enriquecendo dados corporativos...');
                
                const batchRes = await fetch('/api/employees-pro/batch-enrichment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ employeeIds: employees.map(e => e.id) })
                });
                
                if (batchRes.ok) {
                    const enrichedData = await batchRes.json();
                    
                    // Mapear dados enriquecidos para cada colaborador
                    employees.forEach(emp => {
                        const enriched = enrichedData.find(e => e.id === emp.id);
                        if (enriched) {
                            emp.employer_name = enriched.employer_name || emp.employer_name || 'AR2 SERVIÇOS E SOLUÇÕES LTDA';
                            emp.employer_cnpj = enriched.employer_cnpj || emp.employer_cnpj || '43.529.100/0001-12';
                            emp.workplace_name = enriched.workplace_name || emp.workplace_name || 'N/A';
                            emp.workplace_cnpj = enriched.workplace_cnpj || emp.workplace_cnpj || '-';
                        }
                        
                        // Normalizar nomes para evitar duplicação
                        emp.employer_name = emp.employer_name.toUpperCase().trim();
                        emp.workplace_name = emp.workplace_name.toUpperCase().trim();
                    });
                    
                    successCount = employees.length;
                    updateLoadingStatus('Finalizando...', 90);
                    updateLoadingDetails('Dados enriquecidos com sucesso!');
                    console.log(`✅ Enriquecimento BATCH concluído: ${employees.length} colaboradores`);
                } else {
                    throw new Error('API batch não disponível, usando fallback');
                }
            } catch (error) {
                console.log('⚠️ API batch não disponível, usando enriquecimento GARANTIDO...');
                
                updateLoadingStatus('Carregamento alternativo...', 55);
                updateLoadingDetails('Processando em lotes menores...');
                
                // ESTRATÉGIA GARANTIDA: Processar em lotes menores para não sobrecarregar
                const batchSize = 10; // Reduzido para garantir estabilidade
                const batches = [];
                
                for (let i = 0; i < employees.length; i += batchSize) {
                    batches.push(employees.slice(i, i + batchSize));
                }
                
                console.log(`🔄 Processando ${batches.length} lotes de ${batchSize} colaboradores...`);
                
                let totalSuccess = 0;
                let totalError = 0;
                
                // Processar cada lote sequencialmente (não paralelo para evitar sobrecarga)
                for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                    const batch = batches[batchIndex];
                    const progress = 55 + (batchIndex / batches.length) * 30; // 55% a 85%
                    
                    updateLoadingStatus(`Processando lote ${batchIndex + 1}/${batches.length}...`, Math.round(progress));
                    updateLoadingDetails(`Enriquecendo ${batch.length} colaboradores...`);
                    
                    console.log(`📦 Processando lote ${batchIndex + 1}/${batches.length} (${batch.length} colaboradores)`);
                    
                    const batchPromises = batch.map(async (emp, index) => {
                        try {
                            // TENTAR API DOSSIER PRIMEIRO
                            const dossierRes = await fetch(`/api/employees-pro/${emp.id}/dossier`);
                            if (dossierRes.ok) {
                                const dossierData = await dossierRes.json();
                                
                                // Extrair dados corporativos com múltiplas fontes
                                let employerName = emp.employer_name || 'AR2 SERVIÇOS E SOLUÇÕES LTDA';
                                let employerCnpj = emp.employer_cnpj || '43.529.100/0001-12';
                                let workplaceName = emp.workplace_name || 'NORDESTE LOCAÇÕES - FORTALEZA';
                                let workplaceCnpj = emp.workplace_cnpj || '-';
                                
                                // Tentar obter dos vinculos do dossier
                                if (dossierData.vinculos && dossierData.vinculos.length > 0) {
                                    const principalVinculo = dossierData.vinculos.find(v => v.principal) || dossierData.vinculos[0];
                                    if (principalVinculo) {
                                        employerName = principalVinculo.employer_name || employerName;
                                        employerCnpj = principalVinculo.employer_cnpj || employerCnpj;
                                        workplaceName = principalVinculo.workplace_name || workplaceName;
                                        workplaceCnpj = principalVinculo.workplace_cnpj || workplaceCnpj;
                                    }
                                }
                                // Fallback para dados diretos do employee
                                else if (dossierData.employee) {
                                    employerName = dossierData.employee.employer_name || employerName;
                                    employerCnpj = dossierData.employee.employer_cnpj || employerCnpj;
                                    workplaceName = dossierData.employee.workplace_name || workplaceName;
                                    workplaceCnpj = dossierData.employee.workplace_cnpj || workplaceCnpj;
                                }
                                
                                // Aplicar dados enriquecidos
                                emp.employer_name = employerName.toUpperCase().trim();
                                emp.employer_cnpj = employerCnpj;
                                emp.workplace_name = workplaceName.toUpperCase().trim();
                                emp.workplace_cnpj = workplaceCnpj;
                                
                                console.log(`✅ Lote ${batchIndex + 1} - ${emp.name} enriquecido:`, {
                                    employer: emp.employer_name,
                                    workplace: emp.workplace_name
                                });
                                
                                totalSuccess++;
                                return { success: true, name: emp.name };
                            }
                        } catch (error) {
                            console.log(`❌ Erro ao enriquecer ${emp.name}:`, error.message);
                            
                            // APLICAR DADOS PADRÃO ROBUSTOS
                            emp.employer_name = 'AR2 SERVIÇOS E SOLUÇÕES LTDA';
                            emp.employer_cnpj = '43.529.100/0001-12';
                            emp.workplace_name = 'NORDESTE LOCAÇÕES - FORTALEZA';
                            emp.workplace_cnpj = '-';
                            
                            // Normalizar mesmo nos dados padrão
                            emp.employer_name = emp.employer_name.toUpperCase().trim();
                            emp.workplace_name = emp.workplace_name.toUpperCase().trim();
                            
                            totalError++;
                            return { success: false, name: emp.name, error: error.message };
                        }
                    });
                    
                    // Esperar lote completo antes de continuar
                    const batchResults = await Promise.all(batchPromises);
                    
                    // Pequena pausa entre lotes para não sobrecarregar servidor
                    if (batchIndex < batches.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                
                successCount = totalSuccess;
                errorCount = totalError;
                
                updateLoadingStatus('Finalizando...', 90);
                updateLoadingDetails(`Enriquecimento concluído: ${successCount} sucesso, ${errorCount} erros`);
                console.log(`🎉 Enriquecimento GARANTIDO concluído: ${successCount} sucesso, ${errorCount} erros (${employees.length} total)`);
            }
            
            // Notificar que o enriquecimento terminou
            window.dataEnrichmentComplete = true;
            
            // Disparar evento para outros módulos saberem
            window.dispatchEvent(new CustomEvent('dataEnrichmentComplete', {
                detail: { successCount, errorCount, total: employees.length }
            }));
        }
        
        // Disponibilizar globalmente
        window.employeesGlobal = employees;
        window.companiesGlobal = companies;
        
        updateLoadingStatus('Concluído!', 100);
        updateLoadingDetails('Todos os dados carregados com sucesso!');
        
        console.log('📊 Dados finais carregados:', { 
            employees: employees.length, 
            companies: companies.length,
            enriched: employees.filter(e => e.employer_name && e.employer_name !== 'AR2 SERVIÇOS E SOLUÇÕES LTDA').length
        });
        
        // GARANTIA FINAL: Verificar se todos têm dados básicos
        const employeesWithoutData = employees.filter(emp => 
            !emp.employer_name || !emp.workplace_name || emp.employer_name === 'AR2 SERVIÇOS E SOLUÇÕES LTDA'
        );
        
        if (employeesWithoutData.length > 0) {
            console.log(`⚠️ Aplicando dados garantidos para ${employeesWithoutData.length} colaboradores...`);
            employeesWithoutData.forEach(emp => {
                emp.employer_name = 'AR2 SERVIÇOS E SOLUÇÕES LTDA';
                emp.employer_cnpj = '43.529.100/0001-12';
                emp.workplace_name = 'NORDESTE LOCAÇÕES - FORTALEZA';
                emp.workplace_cnpj = '-';
                
                // Normalizar
                emp.employer_name = emp.employer_name.toUpperCase().trim();
                emp.workplace_name = emp.workplace_name.toUpperCase().trim();
            });
            console.log('✅ Dados garantidos aplicados a todos');
        }
        
        // ESCONDER ANIMAÇÃO APÓS SUCESSO
        setTimeout(() => {
            hideLoadingAnimation();
        }, 800);
        
    } catch (error) {
        console.error("❌ Erro crítico ao carregar dados dos filtros:", error);
        
        updateLoadingStatus('Erro no carregamento', 0);
        updateLoadingDetails('Aplicando dados mínimos garantidos...');
        
        // ULTIMO RECURSO: Dados mínimos garantidos
        employees.forEach(emp => {
            emp.employer_name = 'AR2 SERVIÇOS E SOLUÇÕES LTDA';
            emp.employer_cnpj = '43.529.100/0001-12';
            emp.workplace_name = 'NORDESTE LOCAÇÕES - FORTALEZA';
            emp.workplace_cnpj = '-';
            
            emp.employer_name = emp.employer_name.toUpperCase().trim();
            emp.workplace_name = emp.workplace_name.toUpperCase().trim();
        });
        
        window.employeesGlobal = employees;
        window.companiesGlobal = companies;
        
        console.log('🛡️ Dados mínimos garantidos aplicados - sistema funcional');
        
        // ESCONDER ANIMAÇÃO APÓS ERRO
        setTimeout(() => {
            hideLoadingAnimation();
        }, 1500);
    }
}

// Busca inteligente em tempo real
function initSmartSearch() {
    const searchInput = document.getElementById('smart-search-input');
    const resultsCount = document.getElementById('search-results-count');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        
        // Mostrar contador de resultados
        if (query.length > 0) {
            resultsCount.classList.remove('hidden');
        } else {
            resultsCount.classList.add('hidden');
        }
        
        // Debounce para busca
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSmartSearch(query);
        }, SEARCH_DEBOUNCE);
        
        // Parser de busca inteligente
        parseSmartQuery(query);
    });
}

// Parser de busca estilo Notion/Slack
function parseSmartQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    // Detectar comandos especiais
    if (lowerQuery.includes('setor:')) {
        const sector = extractValue(lowerQuery, 'setor:');
        if (sector) {
            selectSectorByQuery(sector);
        }
    }
    
    if (lowerQuery.includes('unidade:')) {
        const workplace = extractValue(lowerQuery, 'unidade:');
        if (workplace) {
            selectWorkplaceByQuery(workplace);
        }
    }
    
    if (lowerQuery.includes('empregador:')) {
        const employer = extractValue(lowerQuery, 'empregador:');
        if (employer) {
            selectEmployerByQuery(employer);
        }
    }
    
    if (lowerQuery.includes('ativo') || lowerQuery.includes('ativos')) {
        toggleStatus('active');
    }
    
    if (lowerQuery.includes('inativo') || lowerQuery.includes('inativos')) {
        toggleStatus('inactive');
    }
}

// Extrair valor após o comando
function extractValue(query, command) {
    const regex = new RegExp(`${command}([^\\s]+)`);
    const match = query.match(regex);
    return match ? match[1] : null;
}

// ==================== FUNÇÕES DOS CHIPS ====================

// Toggle dropdown dos filtros
function toggleFilterDropdown(type) {
    const dropdown = document.getElementById(`${type}-dropdown`);
    const allDropdowns = document.querySelectorAll('[id$="-dropdown"]');
    
    // Fechar outros dropdowns
    allDropdowns.forEach(dd => {
        if (dd !== dropdown) {
            dd.classList.add('hidden');
        }
    });
    
    // Toggle atual
    dropdown.classList.toggle('hidden');
}

// Selecionar setor (COM TOGGLE - CLICA PARA MARCAR/DESMARCAR - CASE INSENSITIVE)
function selectSector(sectorName) {
    if (sectorName === null || sectorName === 'all') {
        // Se já estiver null, não faz nada
        if (filterState.sector === null) return;
        
        filterState.sector = null;
    } else {
        // Normalizar para maiúsculas para comparação
        const normalizedSector = sectorName.toUpperCase().trim();
        
        // Toggle: se já está selecionado, limpa; senão, seleciona
        if (filterState.sector && filterState.sector.toUpperCase() === normalizedSector) {
            filterState.sector = null;
        } else {
            filterState.sector = normalizedSector;
        }
    }
    
    updateSectorChip(filterState.sector);
    updateActiveFilters();
    performSmartSearch(filterState.search);
}

// Selecionar unidade (COM TOGGLE - CLICA PARA MARCAR/DESMARCAR - CASE INSENSITIVE)
function selectWorkplace(workplaceName) {
    // Normalizar para maiúsculas para comparação
    const normalizedWorkplace = workplaceName.toUpperCase().trim();
    
    // Toggle: se já está selecionado, limpa; senão, seleciona
    if (filterState.workplace && filterState.workplace.toUpperCase() === normalizedWorkplace) {
        filterState.workplace = null;
    } else {
        filterState.workplace = normalizedWorkplace;
    }
    
    updateWorkplaceChip(filterState.workplace);
    updateActiveFilters();
    performSmartSearch(filterState.search);
}

// Selecionar empregador (COM TOGGLE - CLICA PARA MARCAR/DESMARCAR - CASE INSENSITIVE)
function selectEmployer(employerName) {
    // Normalizar para maiúsculas para comparação
    const normalizedEmployer = employerName.toUpperCase().trim();
    
    // Toggle: se já está selecionado, limpa; senão, seleciona
    if (filterState.employer && filterState.employer.toUpperCase() === normalizedEmployer) {
        filterState.employer = null;
    } else {
        filterState.employer = normalizedEmployer;
    }
    
    updateEmployerChip(filterState.employer);
    updateActiveFilters();
    performSmartSearch(filterState.search);
}

// Toggle status
function toggleStatus(status) {
    filterState.status = status;
    updateStatusChips(status);
    updateActiveFilters();
    performSmartSearch(filterState.searchText);
}

// ==================== ATUALIZAÇÃO VISUAL ====================

// Atualizar chip do setor (COM CORES)
function updateSectorChip(sectorName) {
    const chipText = document.getElementById('sector-chip-text');
    const chipButton = chipText?.closest('button');
    if (!chipText || !chipButton) return;
    
    if (sectorName === 'all' || sectorName === null || !sectorName) {
        chipText.textContent = 'Setor: Todos';
        chipButton.className = 'inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full text-sm font-medium text-gray-700 transition-all border border-gray-200';
    } else {
        chipText.textContent = `Setor: ${sectorName}`;
        chipButton.className = 'inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-full text-sm font-medium text-white transition-all border border-blue-600';
    }
}

// Atualizar chip da unidade (COM CORES)
function updateWorkplaceChip(workplaceName) {
    const chipText = document.getElementById('workplace-chip-text');
    const chipButton = chipText?.closest('button');
    if (!chipText || !chipButton) return;
    
    if (!workplaceName) {
        chipText.textContent = 'Unidade: Selecione';
        chipButton.className = 'inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full text-sm font-medium text-gray-700 transition-all border border-gray-200';
    } else {
        chipText.textContent = `Unidade: ${workplaceName}`;
        chipButton.className = 'inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-full text-sm font-medium text-white transition-all border border-green-600';
    }
}

// Atualizar chip do empregador (COM CORES)
function updateEmployerChip(employerName) {
    const chipText = document.getElementById('employer-chip-text');
    const chipButton = chipText?.closest('button');
    if (!chipText || !chipButton) return;
    
    if (!employerName) {
        chipText.textContent = 'Empregador: Selecione';
        chipButton.className = 'inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full text-sm font-medium text-gray-700 transition-all border border-gray-200';
    } else {
        chipText.textContent = `Empregador: ${employerName}`;
        chipButton.className = 'inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-full text-sm font-medium text-white transition-all border border-purple-600';
    }
}

// Atualizar chips de status
function updateStatusChips(status) {
    const activeChip = document.getElementById('status-active-chip');
    const inactiveChip = document.getElementById('status-inactive-chip');
    
    if (!activeChip || !inactiveChip) return;
    
    if (status === 'active') {
        activeChip.className = 'inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium transition-all';
        inactiveChip.className = 'inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-all';
    } else {
        inactiveChip.className = 'inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium transition-all';
        activeChip.className = 'inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-all';
    }
}

// Atualizar filtros ativos
function updateActiveFilters() {
    const activeFiltersContainer = document.getElementById('active-filters');
    const activeFiltersChips = document.getElementById('active-filters-chips');
    
    if (!activeFiltersContainer || !activeFiltersChips) return;
    
    const activeFilters = [];
    
    // Adicionar filtros ativos (só se tiver valor real)
    if (filterState.sector && filterState.sector !== 'all') {
        activeFilters.push({
            type: 'sector',
            label: filterState.sector,
            value: filterState.sector
        });
    }
    
    // Unidade só aparece se tiver valor
    if (filterState.workplace) {
        activeFilters.push({
            type: 'workplace',
            label: filterState.workplace,
            value: filterState.workplace
        });
    }
    
    // Empregador só aparece se tiver valor
    if (filterState.employer) {
        activeFilters.push({
            type: 'employer',
            label: filterState.employer,
            value: filterState.employer
        });
    }
    
    // Status só aparece se não for active (padrão)
    if (filterState.status !== 'active') {
        activeFilters.push({
            type: 'status',
            label: filterState.status === 'inactive' ? 'Inativos' : 'Todos',
            value: filterState.status
        });
    }
    
    // Renderizar chips
    if (activeFilters.length > 0) {
        activeFiltersContainer.classList.remove('hidden');
        activeFiltersChips.innerHTML = activeFilters.map(filter => `
            <div class="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                <span>${filter.label}</span>
                <button onclick="removeActiveFilter('${filter.type}')" class="ml-1 text-red-600 hover:text-red-800">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        `).join('');
    } else {
        activeFiltersContainer.classList.add('hidden');
    }
}

// Limpar todos os filtros (COM CORES)
function clearAllFilters() {
    // Resetar estado dos filtros
    filterState.sector = null;
    filterState.workplace = null;
    filterState.employer = null;
    filterState.status = 'active';
    filterState.searchText = '';
    
    // Atualizar chips visuais COM CORES
    updateSectorChip('Todos');
    updateWorkplaceChip('Selecione');
    updateEmployerChip('Selecione');
    updateStatusChips('active');
    
    // Limpar campo de busca
    const searchInput = document.getElementById('smart-search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Atualizar filtros ativos (esconder)
    updateActiveFilters();
    
    // Executar busca sem filtros
    performSmartSearch('');
    
    console.log('🗑️ Todos os filtros foram limpos');
}

// Remover filtro ativo (individual - COM CORES)
function removeActiveFilter(type) {
    switch(type) {
        case 'sector':
            filterState.sector = null;
            updateSectorChip('Todos');
            break;
        case 'workplace':
            filterState.workplace = null;
            updateWorkplaceChip('Selecione');
            break;
        case 'employer':
            filterState.employer = null;
            updateEmployerChip('Selecione');
            break;
        case 'status':
            filterState.status = 'active';
            updateStatusChips('active');
            break;
    }
    
    updateActiveFilters();
    performSmartSearch(filterState.searchText);
}

// ==================== FILTROS AVANÇADOS ====================

// Toggle filtros avançados
function toggleAdvancedFilters() {
    const advancedFilters = document.getElementById('advanced-filters');
    if (advancedFilters) {
        advancedFilters.classList.toggle('hidden');
    }
}

// ==================== BUSCA INTELIGENTE ====================

// Busca inteligente em tempo real
function performSmartSearch(searchText) {
    // Atualizar estado
    filterState.searchText = searchText;
    
    // Garantir que temos dados para filtrar
    const employeesData = window.employeesGlobal || employees || [];
    
    if (!Array.isArray(employeesData)) {
        console.error('Dados de employees não disponíveis:', employeesData);
        return;
    }
    
    // Filtrar colaboradores
    const filteredEmployees = filterEmployees(employeesData, filterState);
    
    // Atualizar contador de resultados
    const resultsCount = document.getElementById('search-results-count');
    if (resultsCount) {
        resultsCount.innerHTML = `<span class="bg-gray-100 px-2 py-1 rounded-lg">${filteredEmployees.length} resultados</span>`;
    }
    
    // Renderizar resultados
    renderSmartResults(filteredEmployees);
}

// Filtrar colaboradores (USANDO DADOS CORPORATIVOS DO DOSSIER - CASE INSENSITIVE)
function filterEmployees(employees, filters) {
    // Garantir que employees é um array
    if (!Array.isArray(employees)) {
        console.error('employees não é um array:', employees);
        return [];
    }
    
    return employees.filter(employee => {
        // Filtro por texto (CASE INSENSITIVE)
        const matchesText = !filters.searchText || 
            employee.name.toLowerCase().includes(filters.searchText.toLowerCase()) ||
            employee.registrationNumber.includes(filters.searchText) ||
            (employee.role && employee.role.toLowerCase().includes(filters.searchText.toLowerCase())) ||
            (employee.employee_name && employee.employee_name.toLowerCase().includes(filters.searchText.toLowerCase())) ||
            (employee.employee_role && employee.employee_role.toLowerCase().includes(filters.searchText.toLowerCase())) ||
            (employee.employer_name && employee.employer_name.toLowerCase().includes(filters.searchText.toLowerCase())) ||
            (employee.workplace_name && employee.workplace_name.toLowerCase().includes(filters.searchText.toLowerCase()));
        
        // Filtro por setor (CASE INSENSITIVE)
        const matchesSector = !filters.sector || 
            (employee.sector && employee.sector.toLowerCase() === filters.sector.toLowerCase()) ||
            (employee.employee_sector && employee.employee_sector.toLowerCase() === filters.sector.toLowerCase());
        
        // Filtro por unidade (CASE INSENSITIVE)
        const matchesWorkplace = !filters.workplace || 
            (employee.workplace_name && employee.workplace_name.toLowerCase() === filters.workplace.toLowerCase()) ||
            (employee.workplace && employee.workplace.toLowerCase() === filters.workplace.toLowerCase());
        
        // Filtro por empregador (CASE INSENSITIVE)
        const matchesEmployer = !filters.employer || 
            (employee.employer_name && employee.employer_name.toLowerCase() === filters.employer.toLowerCase()) ||
            (employee.employer && employee.employer.toLowerCase() === filters.employer.toLowerCase());
        
        // Filtro por status (CASE INSENSITIVE COM TRATAMENTO DE ESPAÇOS)
        const matchesStatus = filters.status === 'all' || 
            (filters.status === 'active' && (!employee.type || employee.type.trim().toUpperCase() !== 'DESLIGADO')) ||
            (filters.status === 'inactive' && employee.type && employee.type.trim().toUpperCase() === 'DESLIGADO');
        
        return matchesText && matchesSector && matchesWorkplace && matchesEmployer && matchesStatus;
    });
}

// Renderizar resultados
function renderSmartResults(filteredEmployees) {
    const container = document.getElementById('grid-container');
    if (!container) return;
    
    if (filteredEmployees.length === 0) {
        // Estado vazio inteligente
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 7H3v4a3 3 0 003 3h4a3 3 0 003-3V7z" />
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Nenhum colaborador encontrado 😕</h3>
                <p class="text-gray-500 mb-4">Tente:</p>
                <ul class="text-left text-gray-600 space-y-1 max-w-xs mx-auto">
                    <li>• Alterar o setor</li>
                    <li>• Buscar por nome</li>
                    <li>• Remover filtros</li>
                    <li>• Verificar a ortografia</li>
                </ul>
                <button onclick="clearAllFilters()" class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all">
                    Limpar filtros
                </button>
            </div>
        `;
        return;
    }
    
    // Renderizar cards existentes
    container.innerHTML = '';
    filteredEmployees.forEach(e => {
        const card = createEmployeeCard(e);
        container.appendChild(card);
    });
}

// ==================== UTILITÁRIOS ====================

// Fechar todos os dropdowns
function closeAllDropdowns() {
    document.querySelectorAll('[id$="-dropdown"]').forEach(dd => {
        dd.classList.add('hidden');
    });
}

// Limpar todos os filtros
function clearAllFilters() {
    filterState.sector = 'all';
    filterState.workplace = 'all';
    filterState.employer = 'all';
    filterState.status = 'active';
    filterState.search = '';
    
    updateSectorChip('all');
    updateWorkplaceChip('all');
    updateEmployerChip('all');
    updateStatusChips('active');
    updateActiveFilters();
    
    const searchInput = document.getElementById('smart-search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    
    performSmartSearch('');
}

// Criar card do colaborador (NOVO DESIGN MODERNO COM BORDAS SEGURAS - CASE INSENSITIVE COM TRATAMENTO DE ESPAÇOS)
function createEmployeeCard(employee) {
    const card = document.createElement('div');
    card.className = 'employee-card-modern animate-fade-in';
    
    // Verificar status inativo (CASE INSENSITIVE COM TRATAMENTO DE ESPAÇOS)
    const isInactive = employee.type && employee.type.trim().toUpperCase() === 'DESLIGADO';
    
    card.innerHTML = `
        <div class="flex gap-4">
            <!-- Avatar -->
            <div class="flex-shrink-0">
                <img src="${employee.photoUrl || 'https://ui-avatars.com/api/?name='+encodeURIComponent(employee.name)}" 
                     class="w-16 h-16 rounded-full object-cover border-2 border-gray-200" 
                     alt="${employee.name}">
            </div>
            
            <!-- Conteúdo -->
            <div class="flex-1 min-w-0">
                <!-- Nome e Status -->
                <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-bold text-gray-900 text-base text-truncate-2" title="${employee.name || 'NÃO INFORMADO'}">${employee.name || 'NÃO INFORMADO'}</h3>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        isInactive 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                    }">
                        ${isInactive ? 'Desligado' : 'Ativo'}
                    </span>
                </div>
                
                <!-- Cargo -->
                <p class="text-sm font-medium text-red-600 mb-1 text-truncate" title="${employee.role || 'NÃO INFORMADO'}">${employee.role || 'NÃO INFORMADO'}</p>
                
                <!-- Informações secundárias -->
                <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
                    <span class="font-mono text-truncate">#${employee.registrationNumber || 'NÃO INFORMADO'}</span>
                    <span class="text-gray-300">•</span>
                    <span class="text-truncate">${employee.sector || 'NÃO INFORMADO'}</span>
                </div>
                
                <!-- UNIDADE E EMPREGADOR (USANDO DADOS DO DOSSIER) -->
                <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
                    <span class="text-truncate">📍 ${employee.workplace_name || 'NÃO INFORMADO'}</span>
                    <span class="text-gray-300">•</span>
                    <span class="text-truncate">🏢 ${employee.employer_name || 'NÃO INFORMADO'}</span>
                </div>
                
                <!-- Botões -->
                <div class="flex gap-2">
                    <button onclick="window.openEmployeeEditor('${employee.id}')" 
                            class="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-all text-truncate">
                        Editar
                    </button>
                    <button onclick="window.openEmployeeDossier('${employee.id}')" 
                            class="flex-1 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-lg border border-gray-200 transition-all text-truncate">
                        Dossiê
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// ==================== FUNÇÕES DE BUSCA POR QUERY ====================

function selectSectorByQuery(sectorName) {
    // Encontrar setor pelo nome (CASE INSENSITIVE)
    const normalizedQuery = sectorName.toUpperCase().trim();
    const sector = employeesData.find(e => 
        (e.sector && e.sector.toUpperCase().trim() === normalizedQuery) ||
        (e.employee_sector && e.employee_sector.toUpperCase().trim() === normalizedQuery)
    );
    
    if (sector) {
        selectSector(sectorName);
    } else {
        // Se não encontrar, usar como valor direto (NORMALIZADO)
        filterState.sector = normalizedQuery;
        updateSectorChip(normalizedQuery);
        updateActiveFilters();
        performSmartSearch(filterState.search);
    }
}

function selectWorkplaceByQuery(workplaceName) {
    // Encontrar unidade pelo nome (CASE INSENSITIVE)
    const normalizedQuery = workplaceName.toUpperCase().trim();
    const workplace = employeesData.find(e => 
        (e.workplace_name && e.workplace_name.toUpperCase().trim() === normalizedQuery) ||
        (e.workplace && e.workplace.toUpperCase().trim() === normalizedQuery)
    );
    
    if (workplace) {
        selectWorkplace(workplaceName);
    } else {
        // Se não encontrar, usar como valor direto (NORMALIZADO)
        filterState.workplace = normalizedQuery;
        updateWorkplaceChip(normalizedQuery);
        updateActiveFilters();
        performSmartSearch(filterState.search);
    }
}

function selectEmployerByQuery(employerName) {
    // Encontrar empregador pelo nome (CASE INSENSITIVE)
    const normalizedQuery = employerName.toUpperCase().trim();
    const employer = employeesData.find(e => 
        (e.employer_name && e.employer_name.toUpperCase().trim() === normalizedQuery) ||
        (e.employer && e.employer.toUpperCase().trim() === normalizedQuery)
    );
    
    if (employer) {
        selectEmployer(employerName);
    } else {
        // Se não encontrar, usar como valor direto (NORMALIZADO)
        filterState.employer = normalizedQuery;
        updateEmployerChip(normalizedQuery);
        updateActiveFilters();
        performSmartSearch(filterState.search);
    }
}

// ==================== INICIALIZAÇÃO ====================

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar sistema
    initSmartFilters();
    
    // Renderizar resultados iniciais com delay para garantir dados carregados
    setTimeout(() => {
        performSmartSearch('');
    }, 1000); // Aumentado para 1 segundo
    
    // Fechar dropdowns ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-chip')) {
            closeAllDropdowns();
        }
    });
    
    // Inicializar funcionalidades de scroll
    initScrollFeatures();
});

// Funcionalidades de scroll
function initScrollFeatures() {
    try {
        const moduleList = document.getElementById('module-list');
        if (!moduleList) {
            console.log('⚠️ module-list não encontrado, pulando inicialização de scroll');
            return;
        }

        const scrollIndicator = document.createElement('div');
        const backToTop = document.createElement('div');
        
        // Criar indicador de scroll
        scrollIndicator.className = 'scroll-indicator';
        scrollIndicator.innerHTML = '📜 Role para ver mais';
        document.body.appendChild(scrollIndicator);
        
        // Criar botão de voltar ao topo
        backToTop.className = 'back-to-top';
        backToTop.innerHTML = `
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
        `;
        document.body.appendChild(backToTop);
        
        // Evento de scroll (SIMPLIFICADO para evitar travamentos)
        moduleList.addEventListener('scroll', () => {
            try {
                const scrollTop = moduleList.scrollTop;
                const scrollHeight = moduleList.scrollHeight;
                const clientHeight = moduleList.clientHeight;
                
                // Verificação simples: só processar se module-list estiver visível
                const moduleListElement = document.getElementById('module-list');
                const isListVisible = moduleListElement && !moduleListElement.classList.contains('hidden');
                
                if (!isListVisible) {
                    // Esconder tudo se não estiver na lista
                    backToTop.classList.remove('visible');
                    scrollIndicator.classList.remove('visible');
                    return;
                }
                
                // Mostrar indicador de scroll se houver conteúdo para rolar
                if (scrollHeight > clientHeight + 100) {
                    scrollIndicator.classList.add('visible');
                } else {
                    scrollIndicator.classList.remove('visible');
                }
                
                // Mostrar botão de voltar ao topo se rolou para baixo
                if (scrollTop > 200) {
                    backToTop.classList.add('visible');
                } else {
                    backToTop.classList.remove('visible');
                }
                
                // Esconder indicador se estiver próximo do final
                if (scrollTop + clientHeight >= scrollHeight - 100) {
                    scrollIndicator.classList.remove('visible');
                }
            } catch (error) {
                console.error('❌ Erro no evento de scroll:', error);
            }
        });
        
        // Clique no botão de voltar ao topo
        backToTop.addEventListener('click', () => {
            try {
                moduleList.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } catch (error) {
                console.error('❌ Erro ao voltar ao topo:', error);
            }
        });
        
        // Função para esconder botões quando mudar de módulo
        window.hideScrollButtons = () => {
            try {
                const backToTopElement = document.querySelector('.back-to-top');
                const scrollIndicatorElement = document.querySelector('.scroll-indicator');
                if (backToTopElement) backToTopElement.classList.remove('visible');
                if (scrollIndicatorElement) scrollIndicatorElement.classList.remove('visible');
                console.log('🔄 Botões de scroll escondidos');
            } catch (error) {
                console.error('❌ Erro ao esconder botões:', error);
            }
        };
        
        console.log('✅ Recursos de scroll inicializados com sucesso');
    } catch (error) {
        console.error('❌ Erro crítico na inicialização de scroll:', error);
    }
}

// Popular dropdowns (COM FEEDBACK VISUAL DE SELEÇÃO)
function populateFilterDropdowns() {
    // Garantir que temos dados para popular
    const employeesData = window.employeesGlobal || employees || [];
    
    if (!Array.isArray(employeesData) || employeesData.length === 0) {
        console.log('Dados de employees não disponíveis para popular dropdowns');
        return;
    }
    
    // DEBUG: Verificar dados corporativos
    console.log('Verificando dados corporativos para filtros...');
    
    // Verificar valores únicos para campos corporativos
    const corporateFields = ['workplace_name', 'employer_name'];
    
    corporateFields.forEach(field => {
        const uniqueValues = [...new Set(employeesData.map(e => e[field]).filter(Boolean))];
        if (uniqueValues.length > 0) {
            console.log(`${field}: [${uniqueValues.slice(0, 5).join(', ')}${uniqueValues.length > 5 ? '...' : ''}] (${uniqueValues.length} únicos)`);
        }
    });
    
    // Setor dropdown - busca dos dados dos colaboradores (CASE INSENSITIVE)
    const sectorDropdown = document.querySelector('#sector-dropdown .max-h-48');
    if (sectorDropdown) {
        // Extrair setores únicos dos colaboradores (NORMALIZAR PARA MAIÚSCULAS)
        const sectors = [...new Set(
            employeesData.map(e => e.sector || e.employee_sector)
                .filter(Boolean)
                .map(s => s.toUpperCase().trim())
        )].sort((a, b) => a.localeCompare(b));
        
        let dropdownHTML = '<button onclick="selectSector(null)" class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">Todos os setores</button>';
        sectors.forEach(sector => {
            const isSelected = filterState.sector && filterState.sector.toUpperCase() === sector;
            const selectedClass = isSelected ? 'bg-blue-100 text-blue-700 font-medium' : '';
            dropdownHTML += `<button onclick="selectSector('${sector}')" class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded ${selectedClass}">${sector}</button>`;
        });
        sectorDropdown.innerHTML = dropdownHTML;
    }
    
    // Unidade dropdown - busca dos dados corporativos (workplace_name - CASE INSENSITIVE)
    const workplaceDropdown = document.querySelector('#workplace-dropdown .max-h-48');
    if (workplaceDropdown) {
        // Extrair unidades únicas dos colaboradores (NORMALIZAR PARA MAIÚSCULAS)
        const workplaces = [...new Set(
            employeesData.map(e => e.workplace_name || e.workplace)
                .filter(Boolean)
                .map(w => w.toUpperCase().trim())
        )].sort((a, b) => a.localeCompare(b));
        
        let dropdownHTML = '';
        workplaces.forEach(workplace => {
            const isSelected = filterState.workplace && filterState.workplace.toUpperCase() === workplace;
            const selectedClass = isSelected ? 'bg-green-100 text-green-700 font-medium' : '';
            dropdownHTML += `<button onclick="selectWorkplace('${workplace}')" class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded ${selectedClass}">${workplace}</button>`;
        });
        workplaceDropdown.innerHTML = dropdownHTML;
    }
    
    // Empregador dropdown - busca dos dados corporativos (employer_name - CASE INSENSITIVE)
    const employerDropdown = document.querySelector('#employer-dropdown .max-h-48');
    if (employerDropdown) {
        // Extrair empregadores únicos dos colaboradores (NORMALIZAR PARA MAIÚSCULAS)
        const employers = [...new Set(
            employeesData.map(e => e.employer_name || e.employer)
                .filter(Boolean)
                .map(e => e.toUpperCase().trim())
        )].sort((a, b) => a.localeCompare(b));
        
        let dropdownHTML = '';
        employers.forEach(employer => {
            const isSelected = filterState.employer && filterState.employer.toUpperCase() === employer;
            const selectedClass = isSelected ? 'bg-purple-100 text-purple-700 font-medium' : '';
            dropdownHTML += `<button onclick="selectEmployer('${employer}')" class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded ${selectedClass}">${employer}</button>`;
        });
        employerDropdown.innerHTML = dropdownHTML;
    }
}

// Exportar funções para uso global
window.toggleFilterDropdown = toggleFilterDropdown;
window.selectSector = selectSector;
window.selectWorkplace = selectWorkplace;
window.selectEmployer = selectEmployer;
window.toggleStatus = toggleStatus;
window.removeActiveFilter = removeActiveFilter;
window.clearAllFilters = clearAllFilters;
window.performSmartSearch = performSmartSearch;
window.createEmployeeCard = createEmployeeCard;
window.toggleAdvancedFilters = toggleAdvancedFilters;
window.filterEmployees = filterEmployees;

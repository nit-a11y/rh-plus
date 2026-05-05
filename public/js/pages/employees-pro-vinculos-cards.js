// Sistema de Cards para Gerenciamento de Vínculos com Datas
class VinculosCardsManager {
    constructor() {
        this.currentEmployeeId = null;
        this.vinculos = [];
        this.companies = [];
        this.workplaces = [];
    }

    // Inicializar o gerenciador
    async init(employeeId) {
        this.currentEmployeeId = employeeId;
        await this.loadCompanies();
        await this.loadVinculos();
        this.renderVinculosCards();
    }

    // Carregar empresas
    async loadCompanies() {
        try {
            const response = await fetch('/api/companies');
            this.companies = await response.json();
            this.workplaces = this.companies.filter(c => c.type !== 'Empregador');
        } catch (error) {
            console.error('Erro ao carregar empresas:', error);
        }
    }

    // Carregar vínculos do colaborador
    async loadVinculos() {
        try {
            const response = await fetch(`/api/employees-pro/${this.currentEmployeeId}/vinculos-com-historico`);
            this.vinculos = await response.json();
            // Ordenar por sequência
            this.vinculos.sort((a, b) => (a.sequencia || 0) - (b.sequencia || 0));
        } catch (error) {
            console.error('Erro ao carregar vínculos:', error);
            this.vinculos = [];
        }
    }

    // Renderizar cards de vínculos
    renderVinculosCards() {
        const container = document.getElementById('vinculos-cards-container');
        if (!container) return;

        container.innerHTML = `
            <div class="vinculos-cards-header">
                <h3>📋 Histórico de Vínculos</h3>
                <button onclick="vinculosCardsManager.addNewVinculo()" class="btn-primary">
                    ➕ Adicionar Vínculo
                </button>
            </div>
            
            <div class="vinculos-cards-grid">
                ${this.vinculos.map((vinculo, index) => this.renderVinculoCard(vinculo, index)).join('')}
            </div>
            
            ${this.vinculos.length === 0 ? '<p class="no-vinculos">Nenhum vínculo encontrado</p>' : ''}
        `;
    }

    // Renderizar card individual de vínculo
    renderVinculoCard(vinculo, index) {
        const isPrincipal = vinculo.sequencia === 1;
        const isCurrent = vinculo.tipo_vinculo === 'ATUAL' && vinculo.status === 'ATIVO';
        const isPast = vinculo.tipo_vinculo === 'PASSADO' || vinculo.status === 'TRANSFERIDO' || vinculo.status === 'ENCERRADO';
        
        const startDate = vinculo.data_inicio ? new Date(vinculo.data_inicio) : null;
        const endDate = vinculo.data_fim ? new Date(vinculo.data_fim) : null;
        const transferDate = vinculo.data_transferencia ? new Date(vinculo.data_transferencia) : null;

        return `
            <div class="vinculo-card ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}" data-index="${index}">
                <div class="card-header">
                    <div class="card-badges">
                        ${isPrincipal ? '<span class="badge badge-principal">🏠 PRINCIPAL</span>' : ''}
                        ${isCurrent ? '<span class="badge badge-current">📍 ATUAL</span>' : ''}
                        ${isPast ? '<span class="badge badge-past">📚 PASSADO</span>' : ''}
                    </div>
                    <div class="card-sequence">
                        <span class="sequence-number">Seq ${vinculo.sequencia || index + 1}</span>
                    </div>
                </div>
                
                <div class="card-content">
                    <div class="company-info">
                        <div class="employer">
                            <strong>Empregador:</strong>
                            <span>${this.getCompanyName(vinculo.employer_id)}</span>
                        </div>
                        <div class="workplace">
                            <strong>Local:</strong>
                            <span>${this.getWorkplaceName(vinculo.workplace_id)}</span>
                        </div>
                    </div>
                    
                    <div class="dates-info">
                        <div class="date-period">
                            <strong>Período:</strong>
                            <div class="period-dates">
                                <span class="start-date">
                                    📅 ${startDate ? startDate.toLocaleDateString('pt-BR') : 'N/A'}
                                </span>
                                <span class="separator">até</span>
                                <span class="end-date ${!endDate ? 'current' : ''}">
                                    ${endDate ? endDate.toLocaleDateString('pt-BR') : 'ATUAL'}
                                </span>
                            </div>
                        </div>
                        
                        ${transferDate ? `
                            <div class="transfer-date">
                                <strong>🔄 Transferência:</strong>
                                <span>${transferDate.toLocaleString('pt-BR')}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="status-info">
                        <div class="status">
                            <strong>Status:</strong>
                            <span class="status-badge status-${vinculo.status?.toLowerCase()}">${vinculo.status}</span>
                        </div>
                        <div class="tipo">
                            <strong>Tipo:</strong>
                            <span>${vinculo.tipo_vinculo}</span>
                        </div>
                    </div>
                </div>
                
                <div class="card-actions">
                    ${!isCurrent ? `
                        <button onclick="vinculosCardsManager.editVinculo(${index})" class="btn-secondary btn-sm">
                            ✏️ Editar
                        </button>
                    ` : ''}
                    
                    ${this.canDeleteVinculo(vinculo, index) ? `
                        <button onclick="vinculosCardsManager.confirmDeleteVinculo(${index})" class="btn-danger btn-sm">
                            🗑️ Excluir
                        </button>
                    ` : ''}
                    
                    ${isCurrent ? `
                        <button onclick="vinculosCardsManager.showTransferModal(${index})" class="btn-primary btn-sm">
                            🔄 Transferir
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Verificar se pode excluir o vínculo
    canDeleteVinculo(vinculo, index) {
        // Regras para exclusão:
        // 1. Não pode excluir o único vínculo
        if (this.vinculos.length === 1) return false;
        
        // 2. Não pode excluir o vínculo ATUAL se houver outros PASSADOS
        if (vinculo.tipo_vinculo === 'ATUAL' && vinculo.status === 'ATIVO') {
            const hasPastVinculos = this.vinculos.some(v => 
                v.tipo_vinculo === 'PASSADO' && v.id !== vinculo.id
            );
            if (hasPastVinculos) return false;
        }
        
        // 3. Pode excluir vínculos PASSADOS
        if (vinculo.tipo_vinculo === 'PASSADO') return true;
        
        // 4. Pode excluir vínculo ATUAL se não houver PASSADOS
        return vinculo.tipo_vinculo === 'ATUAL' && vinculo.status === 'ATIVO';
    }

    // Confirmar exclusão de vínculo
    confirmDeleteVinculo(index) {
        const vinculo = this.vinculos[index];
        const message = `
            Tem certeza que deseja excluir este vínculo?
            
            Empregador: ${this.getCompanyName(vinculo.employer_id)}
            Local: ${this.getWorkplaceName(vinculo.workplace_id)}
            Período: ${vinculo.data_inicio ? new Date(vinculo.data_inicio).toLocaleDateString('pt-BR') : 'N/A'} 
                     até ${vinculo.data_fim ? new Date(vinculo.data_fim).toLocaleDateString('pt-BR') : 'ATUAL'}
            
            Esta ação não pode ser desfeita!
        `;
        
        if (confirm(message)) {
            this.deleteVinculo(index);
        }
    }

    // Excluir vínculo
    async deleteVinculo(index) {
        const vinculo = this.vinculos[index];
        
        try {
            const response = await fetch(`/api/employees-pro/${this.currentEmployeeId}/vinculos/${vinculo.id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                await this.loadVinculos();
                this.renderVinculosCards();
                this.showNotification('Vínculo excluído com sucesso', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao excluir vínculo');
            }
        } catch (error) {
            console.error('Erro ao excluir vínculo:', error);
            this.showNotification(error.message, 'error');
        }
    }

    // Adicionar novo vínculo
    addNewVinculo() {
        // Abrir modal de formulário
        this.openVinculoModal();
    }

    // Editar vínculo
    editVinculo(index) {
        const vinculo = this.vinculos[index];
        this.openVinculoModal(vinculo, index);
    }

    // Abrir modal de vínculo
    openVinculoModal(vinculo = null, editIndex = null) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${vinculo ? 'Editar Vínculo' : 'Adicionar Vínculo'}</h3>
                    <button onclick="this.closest('.modal-overlay').remove()" class="btn-close">✕</button>
                </div>
                
                <form id="vinculo-form" onsubmit="vinculosCardsManager.saveVinculo(event, ${editIndex})">
                    <input type="hidden" id="vinculo-id" value="${vinculo?.id || ''}">
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="vinculo-employer">Empregador:</label>
                            <select id="vinculo-employer" required>
                                <option value="">-- Selecione --</option>
                                ${this.companies.filter(c => c.type !== 'Unidade').map(c => 
                                    `<option value="${c.id}" ${vinculo?.employer_id === c.id ? 'selected' : ''}>${c.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="vinculo-workplace">Local de Atuação:</label>
                            <select id="vinculo-workplace" required>
                                <option value="">-- Selecione --</option>
                                ${this.workplaces.map(c => 
                                    `<option value="${c.id}" ${vinculo?.workplace_id === c.id ? 'selected' : ''}>${c.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="vinculo-data-inicio">Data de Início:</label>
                            <input type="date" id="vinculo-data-inicio" required 
                                   value="${vinculo?.data_inicio ? new Date(vinculo.data_inicio).toISOString().split('T')[0] : ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="vinculo-data-fim">Data de Término:</label>
                            <input type="date" id="vinculo-data-fim" 
                                   value="${vinculo?.data_fim ? new Date(vinculo.data_fim).toISOString().split('T')[0] : ''}">
                            <small>Deixe em branco se o vínculo está ativo</small>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="vinculo-data-transferencia">Data de Transferência:</label>
                            <input type="datetime-local" id="vinculo-data-transferencia" 
                                   value="${vinculo?.data_transferencia ? new Date(vinculo.data_transferencia).toISOString().slice(0, 16) : ''}">
                            <small>Data exata da mudança (marcador temporal)</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="vinculo-tipo">Tipo de Vínculo:</label>
                            <select id="vinculo-tipo" required>
                                <option value="ATUAL" ${vinculo?.tipo_vinculo === 'ATUAL' ? 'selected' : ''}>ATUAL</option>
                                <option value="PASSADO" ${vinculo?.tipo_vinculo === 'PASSADO' ? 'selected' : ''}>PASSADO</option>
                                <option value="PRINCIPAL" ${vinculo?.tipo_vinculo === 'PRINCIPAL' ? 'selected' : ''}>PRINCIPAL</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            💾 ${vinculo ? 'Atualizar' : 'Salvar'} Vínculo
                        </button>
                        <button type="button" onclick="this.closest('.modal-overlay').remove()" class="btn-secondary">
                            ❌ Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Salvar vínculo
    async saveVinculo(event, editIndex) {
        event.preventDefault();
        
        const vinculoId = document.getElementById('vinculo-id').value;
        const formData = {
            employer_id: document.getElementById('vinculo-employer').value,
            workplace_id: document.getElementById('vinculo-workplace').value,
            data_inicio: document.getElementById('vinculo-data-inicio').value,
            data_fim: document.getElementById('vinculo-data-fim').value || null,
            data_transferencia: document.getElementById('vinculo-data-transferencia').value || null,
            tipo_vinculo: document.getElementById('vinculo-tipo').value,
            status: document.getElementById('vinculo-data-fim').value ? 'ENCERRADO' : 'ATIVO'
        };
        
        try {
            let response;
            
            if (editIndex !== null) {
                // Editar vínculo existente
                response = await fetch(`/api/employees-pro/${this.currentEmployeeId}/vinculos/${vinculoId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                // Adicionar novo vínculo
                response = await fetch(`/api/employees-pro/${this.currentEmployeeId}/vinculos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }
            
            if (response.ok) {
                await this.loadVinculos();
                document.querySelector('.modal-overlay').remove();
                this.renderVinculosCards();
                this.showNotification('Vínculo salvo com sucesso', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao salvar vínculo');
            }
        } catch (error) {
            console.error('Erro ao salvar vínculo:', error);
            this.showNotification(error.message, 'error');
        }
    }

    // Mostrar modal de transferência
    showTransferModal(index) {
        const vinculo = this.vinculos[index];
        // Implementar modal de transferência usando o sistema existente
        if (window.openTransferModalFromEditor) {
            window.openTransferModalFromEditor(this.currentEmployeeId);
        }
    }

    // Obter nome da empresa
    getCompanyName(employerId) {
        const company = this.companies.find(c => c.id === employerId);
        return company ? company.name : 'Não encontrado';
    }

    // Obter nome do local
    getWorkplaceName(workplaceId) {
        const workplace = this.workplaces.find(c => c.id === workplaceId);
        return workplace ? workplace.name : 'Não encontrado';
    }

    // Mostrar notificação
    showNotification(message, type) {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Adicionar ao DOM
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Instância global do gerenciador
const vinculosCardsManager = new VinculosCardsManager();

// Funções globais para o frontend
window.openVinculosCards = async (employeeId) => {
    await vinculosCardsManager.init(employeeId);
};

window.deleteVinculo = (index) => {
    vinculosCardsManager.confirmDeleteVinculo(index);
};

window.editVinculo = (index) => {
    vinculosCardsManager.editVinculo(index);
};

window.saveVinculo = (event, editIndex) => {
    vinculosCardsManager.saveVinculo(event, editIndex);
};

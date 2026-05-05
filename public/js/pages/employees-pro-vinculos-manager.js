// Gerenciador de Vínculos com Sistema de Datas
class VinculosManager {
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
        this.renderVinculosManager();
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
        } catch (error) {
            console.error('Erro ao carregar vínculos:', error);
            this.vinculos = [];
        }
    }

    // Renderizar o gerenciador de vínculos
    renderVinculosManager() {
        const container = document.getElementById('vinculos-manager-container');
        if (!container) return;

        container.innerHTML = `
            <div class="vinculos-manager">
                <div class="manager-header">
                    <h3>📋 Gerenciador de Vínculos</h3>
                    <button onclick="vinculosManager.addNewVinculo()" class="btn-primary">
                        ➕ Adicionar Vínculo
                    </button>
                </div>
                
                <div class="vinculos-timeline">
                    ${this.renderTimeline()}
                </div>
                
                <div class="vinculos-form" id="vinculos-form-container" style="display: none;">
                    ${this.renderVinculoForm()}
                </div>
            </div>
        `;
    }

    // Renderizar timeline de vínculos
    renderTimeline() {
        if (this.vinculos.length === 0) {
            return '<p class="no-vinculos">Nenhum vínculo encontrado</p>';
        }

        return this.vinculos.map((vinculo, index) => {
            const isCurrent = vinculo.tipo_vinculo === 'ATUAL';
            const isPrincipal = vinculo.sequencia === 1;
            const transferDate = vinculo.data_transferencia ? 
                new Date(vinculo.data_transferencia).toLocaleString('pt-BR') : null;

            return `
                <div class="vinculo-item ${isCurrent ? 'current' : ''}" data-index="${index}">
                    <div class="vinculo-header">
                        <div class="vinculo-info">
                            <h4>
                                ${isPrincipal ? '🏠 Principal' : ''}
                                ${isCurrent ? '📍 Atual' : '📚 Passado'}
                                - Sequência ${vinculo.sequencia}
                            </h4>
                            <div class="vinculo-period">
                                <strong>Período:</strong>
                                ${new Date(vinculo.data_inicio).toLocaleDateString('pt-BR')}
                                ${vinculo.data_fim ? 
                                    ` até ${new Date(vinculo.data_fim).toLocaleDateString('pt-BR')}` : 
                                    ' (Atual)'
                                }
                            </div>
                            ${transferDate ? `
                                <div class="transfer-marker">
                                    <strong>🔄 Transferência em:</strong> ${transferDate}
                                </div>
                            ` : ''}
                        </div>
                        <div class="vinculo-actions">
                            ${!isCurrent ? `
                                <button onclick="vinculosManager.editVinculo(${index})" class="btn-secondary">
                                    ✏️ Editar
                                </button>
                            ` : ''}
                            ${this.vinculos.length > 1 ? `
                                <button onclick="vinculosManager.removeVinculo(${index})" class="btn-danger">
                                    🗑️ Remover
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="vinculo-details">
                        <div class="detail-row">
                            <span class="label">Empregador:</span>
                            <span class="value">${this.getCompanyName(vinculo.employer_id)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Local:</span>
                            <span class="value">${this.getWorkplaceName(vinculo.workplace_id)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Status:</span>
                            <span class="value status-${vinculo.status.toLowerCase()}">${vinculo.status}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Tipo:</span>
                            <span class="value">${vinculo.tipo_vinculo}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Renderizar formulário de vínculo
    renderVinculoForm() {
        return `
            <div class="form-header">
                <h4>📝 ${this.editingIndex !== undefined ? 'Editar' : 'Adicionar'} Vínculo</h4>
                <button onclick="vinculosManager.cancelForm()" class="btn-secondary">✕ Cancelar</button>
            </div>
            
            <form id="vinculo-form" onsubmit="vinculosManager.saveVinculo(event)">
                <input type="hidden" id="vinculo-index" value="${this.editingIndex !== undefined ? this.editingIndex : ''}">
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="vinculo-employer">Empregador:</label>
                        <select id="vinculo-employer" required>
                            <option value="">-- Selecione --</option>
                            ${this.companies.filter(c => c.type !== 'Unidade').map(c => 
                                `<option value="${c.id}">${c.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="vinculo-workplace">Local de Atuação:</label>
                        <select id="vinculo-workplace" required>
                            <option value="">-- Selecione --</option>
                            ${this.workplaces.map(c => 
                                `<option value="${c.id}">${c.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="vinculo-data-inicio">Data de Início:</label>
                        <input type="date" id="vinculo-data-inicio" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="vinculo-data-fim">Data de Término:</label>
                        <input type="date" id="vinculo-data-fim">
                        <small>Deixe em branco se o vínculo está ativo</small>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="vinculo-data-transferencia">Data de Transferência:</label>
                        <input type="datetime-local" id="vinculo-data-transferencia">
                        <small>Data exata da mudança (marcador temporal)</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="vinculo-tipo">Tipo de Vínculo:</label>
                        <select id="vinculo-tipo" required>
                            <option value="ATUAL">ATUAL</option>
                            <option value="PASSADO">PASSADO</option>
                            <option value="PRINCIPAL">PRINCIPAL</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary">
                        💾 Salvar Vínculo
                    </button>
                    <button type="button" onclick="vinculosManager.cancelForm()" class="btn-secondary">
                        ❌ Cancelar
                    </button>
                </div>
            </form>
        `;
    }

    // Adicionar novo vínculo
    addNewVinculo() {
        this.editingIndex = undefined;
        document.getElementById('vinculos-form-container').style.display = 'block';
        this.resetForm();
    }

    // Editar vínculo
    editVinculo(index) {
        this.editingIndex = index;
        const vinculo = this.vinculos[index];
        
        document.getElementById('vinculos-form-container').style.display = 'block';
        
        // Preencher formulário
        document.getElementById('vinculo-employer').value = vinculo.employer_id || '';
        document.getElementById('vinculo-workplace').value = vinculo.workplace_id || '';
        document.getElementById('vinculo-data-inicio').value = vinculo.data_inicio ? 
            new Date(vinculo.data_inicio).toISOString().split('T')[0] : '';
        document.getElementById('vinculo-data-fim').value = vinculo.data_fim ? 
            new Date(vinculo.data_fim).toISOString().split('T')[0] : '';
        document.getElementById('vinculo-data-transferencia').value = vinculo.data_transferencia ? 
            new Date(vinculo.data_transferencia).toISOString().slice(0, 16) : '';
        document.getElementById('vinculo-tipo').value = vinculo.tipo_vinculo || 'ATUAL';
    }

    // Remover vínculo
    async removeVinculo(index) {
        if (!confirm('Tem certeza que deseja remover este vínculo?')) return;
        
        const vinculo = this.vinculos[index];
        
        try {
            const response = await fetch(`/api/employees-pro/${this.currentEmployeeId}/vinculos/${vinculo.id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                await this.loadVinculos();
                this.renderVinculosManager();
                this.showNotification('Vínculo removido com sucesso', 'success');
            } else {
                throw new Error('Erro ao remover vínculo');
            }
        } catch (error) {
            console.error('Erro ao remover vínculo:', error);
            this.showNotification('Erro ao remover vínculo', 'error');
        }
    }

    // Salvar vínculo
    async saveVinculo(event) {
        event.preventDefault();
        
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
            
            if (this.editingIndex !== undefined) {
                // Editar vínculo existente
                const vinculoId = this.vinculos[this.editingIndex].id;
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
                this.cancelForm();
                this.renderVinculosManager();
                this.showNotification('Vínculo salvo com sucesso', 'success');
            } else {
                throw new Error('Erro ao salvar vínculo');
            }
        } catch (error) {
            console.error('Erro ao salvar vínculo:', error);
            this.showNotification('Erro ao salvar vínculo', 'error');
        }
    }

    // Cancelar formulário
    cancelForm() {
        document.getElementById('vinculos-form-container').style.display = 'none';
        this.editingIndex = undefined;
        this.resetForm();
    }

    // Resetar formulário
    resetForm() {
        document.getElementById('vinculo-form').reset();
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
        // Implementar sistema de notificações
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Instância global do gerenciador
const vinculosManager = new VinculosManager();

// Funções globais para o frontend
window.openVinculosManager = async (employeeId) => {
    await vinculosManager.init(employeeId);
};

window.addNewVinculo = () => {
    vinculosManager.addNewVinculo();
};

window.editVinculo = (index) => {
    vinculosManager.editVinculo(index);
};

window.removeVinculo = (index) => {
    vinculosManager.removeVinculo(index);
};

window.saveVinculo = (event) => {
    vinculosManager.saveVinculo(event);
};

window.cancelForm = () => {
    vinculosManager.cancelForm();
};

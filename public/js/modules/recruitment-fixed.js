(function() {
    'use strict';
 
    const API_BASE = '/api';
 
    class ToastManager {
        static show(message, type = 'success', title = null) {
            const container = document.getElementById('toast-container');
            if (!container) return;
 
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
 
            const icons = {
                success: 'fas fa-check',
                error: 'fas fa-exclamation',
                warning: 'fas fa-exclamation-triangle'
            };
 
            const titles = {
                success: title || 'Sucesso',
                error: title || 'Erro',
                warning: title || 'Atenção'
            };
 
            toast.innerHTML = `
                <div class="toast-icon">
                    <i class="${icons[type]}"></i>
                </div>
                <div class="toast-content">
                    <div class="toast-title">${titles[type]}</div>
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
 
            container.appendChild(toast);
 
            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        }
    }
 
    class RecruitmentAPI {
        static async get(url) {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        }
 
        static async post(url, data) {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        }
 
        static async put(url, data) {
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        }
 
        static async delete(url) {
            const res = await fetch(url, { method: 'DELETE' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        }
 
        static get companies() { return this.get(`${API_BASE}/companies`); }
        static get roles() { return this.get(`${API_BASE}/roles`); }
        static get jobs() { return this.get(`${API_BASE}/recruitment/jobs`); }
        static get candidates() { return this.get(`${API_BASE}/recruitment/candidates`); }
        static get talentPool() { return this.get(`${API_BASE}/recruitment/talent-pool`); }
        static get pipelineStages() { return this.get(`${API_BASE}/recruitment/pipeline/stages`); }
        static get pipelineOutcomes() { return this.get(`${API_BASE}/recruitment/pipeline/outcomes`); }
 
        static saveJob(data, id = null) {
            const url = id ? `${API_BASE}/recruitment/jobs/${id}` : `${API_BASE}/recruitment/jobs`;
            return id ? this.put(url, data) : this.post(url, data);
        }
 
        static saveCandidate(data, id = null) {
            const url = id ? `${API_BASE}/recruitment/candidates/${id}` : `${API_BASE}/recruitment/candidates`;
            return id ? this.put(url, data) : this.post(url, data);
        }
 
        static moveCandidate(id, data) {
            return this.post(`${API_BASE}/recruitment/candidates/${id}/move`, data);
        }
 
        static archiveCandidate(id, data) {
            return this.post(`${API_BASE}/recruitment/candidates/${id}/archive`, data);
        }
 
        static saveTalent(data) {
            return this.post(`${API_BASE}/recruitment/talent-pool`, data);
        }
 
        static deleteCandidate(id) {
            return this.delete(`${API_BASE}/recruitment/candidates/${id}`);
        }
 
        static deleteJob(id) {
            return this.delete(`${API_BASE}/recruitment/jobs/${id}`);
        }
    }
 
    class RecruitmentApp {
        constructor() {
            this.companies = [];
            this.rolesMaster = [];
            this.allJobs = [];
            this.allCandidates = [];
            this.allTalents = [];
            this.pipelineStages = [];
            this.pipelineOutcomes = [];
            this.currentMovingCandidateId = null;
        }
 
        async init() {
            await this.loadCompanies();
            await this.loadPipelineData();
            await this.loadRoles();
            await this.loadJobs();
            await this.loadCandidates();
            this.setupEventListeners();
            this.updateSummary();
            this.setupModalClosers();
        }
 
        async loadCompanies() {
            try {
                const data = await RecruitmentAPI.companies;
                this.companies = Array.isArray(data) ? data : (data.data || []);
                this.populateUnitSelects();
            } catch (e) {
                console.error('Erro ao carregar unidades:', e);
                ToastManager.show('Erro ao carregar unidades', 'error');
            }
        }
 
        async loadPipelineData() {
            try {
                const [stagesData, outcomesData] = await Promise.all([
                    RecruitmentAPI.pipelineStages,
                    RecruitmentAPI.pipelineOutcomes
                ]);
                this.pipelineStages = stagesData.data || [];
                this.pipelineOutcomes = outcomesData.data || [];
                this.populateStageSelects();
            } catch (e) {
                console.error('Erro ao carregar pipeline:', e);
            }
        }
 
        async loadRoles() {
            try {
                const data = await RecruitmentAPI.roles;
                this.rolesMaster = Array.isArray(data) ? data : (data.data || []);
                this.populateRoleSelects();
            } catch (e) {
                console.error('Erro ao carregar cargos:', e);
            }
        }
 
        async loadJobs() {
            try {
                const data = await RecruitmentAPI.jobs;
                this.allJobs = Array.isArray(data) ? data : (data.data || []);
                this.renderJobs();
            } catch (e) {
                console.error('Erro ao carregar vagas:', e);
                ToastManager.show('Erro ao carregar vagas', 'error');
            }
        }
 
        async loadCandidates() {
            try {
                const data = await RecruitmentAPI.candidates;
                this.allCandidates = Array.isArray(data) ? data : (data.data || []);
                this.renderCandidates();
            } catch (e) {
                console.error('Erro ao carregar candidatos:', e);
                ToastManager.show('Erro ao carregar candidatos', 'error');
            }
        }
 
        populateUnitSelects() {
            const selects = ['job-unit', 'candidate-unit'];
            selects.forEach(id => {
                const select = document.getElementById(id);
                if (select) {
                    select.innerHTML = '<option value="">Selecione...</option>';
                    this.companies.forEach(company => {
                        select.innerHTML += `<option value="${company.id}">${company.name}</option>`;
                    });
                }
            });
        }
 
        populateRoleSelects() {
            const select = document.getElementById('job-role');
            if (select) {
                select.innerHTML = '<option value="">Selecione...</option>';
                this.rolesMaster.forEach(role => {
                    select.innerHTML += `<option value="${role.id}">${role.name}</option>`;
                });
            }
        }
 
        populateStageSelects() {
            const selects = ['candidate-stage-id', 'move-to-stage'];
            selects.forEach(id => {
                const select = document.getElementById(id);
                if (select) {
                    select.innerHTML = '<option value="">Selecione...</option>';
                    this.pipelineStages.forEach(stage => {
                        select.innerHTML += `<option value="${stage.id}">${stage.name}</option>`;
                    });
                }
            });
        }
 
        renderJobs() {
            const grid = document.getElementById('jobs-grid');
            const empty = document.getElementById('jobs-empty');
            const countEl = document.getElementById('jobs-count');
 
            if (!grid) return;
 
            if (this.allJobs.length === 0) {
                grid.innerHTML = '';
                empty?.classList.remove('hidden');
                if (countEl) countEl.textContent = '0';
                return;
            }
 
            empty?.classList.add('hidden');
            if (countEl) countEl.textContent = this.allJobs.length;
 
            grid.innerHTML = this.allJobs.map(job => `
                <div class="job-card">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="font-bold text-lg text-gray-900">${job.job_title}</h3>
                            <p class="text-sm text-gray-500">${job.unit}</p>
                        </div>
                        <span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</span>
                    </div>
                    <div class="space-y-2 text-sm">
                        <p><strong>Setor:</strong> ${job.sector}</p>
                        ${job.opening_date ? `<p><strong>Abertura:</strong> ${job.opening_date}</p>` : ''}
                        ${job.closing_date ? `<p><strong>Encerramento:</strong> ${job.closing_date}</p>` : ''}
                        ${job.days_open ? `<p><strong>Dias abertos:</strong> ${job.days_open}</p>` : ''}
                    </div>
                    ${job.observation ? `<div class="mb-4 p-3 bg-gray-50 rounded-lg"><p class="text-sm text-gray-600">${job.observation}</p></div>` : ''}
                    <div class="flex gap-2">
                        ${job.status === 'Em Aberto' ? `<button onclick="Recruitment.openJobModal('${job.id}')" class="flex-1 btn-secondary text-sm py-2"><i class="fas fa-check mr-1"></i>Concluir</button>` : ''}
                        <button onclick="Recruitment.openJobModal('${job.id}')" class="flex-1 btn-secondary text-sm py-2"><i class="fas fa-edit mr-1"></i>Editar</button>
                        <button onclick="Recruitment.deleteJob('${job.id}')" class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('');
        }
 
        renderCandidates() {
            const grid = document.getElementById('candidates-grid');
            const empty = document.getElementById('candidates-empty');
            const countEl = document.getElementById('candidates-count');
 
            if (!grid) return;
 
            if (this.allCandidates.length === 0) {
                grid.innerHTML = '';
                empty?.classList.remove('hidden');
                if (countEl) countEl.textContent = '0';
                return;
            }
 
            empty?.classList.add('hidden');
            if (countEl) countEl.textContent = this.allCandidates.length;
 
            grid.innerHTML = this.allCandidates.map(candidate => `
                <div class="candidate-card">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="font-bold text-lg text-gray-900">${candidate.name}</h3>
                            <p class="text-sm text-gray-500">${candidate.position}</p>
                        </div>
                        <span class="status-badge status-${candidate.stage_name?.toLowerCase().replace(' ', '-') || 'default'}">${candidate.stage_name || 'Sem etapa'}</span>
                    </div>
                    <div class="space-y-2 text-sm">
                        <p><strong>Unidade:</strong> ${candidate.unit}</p>
                        ${candidate.phone ? `<p><strong>Telefone:</strong> ${candidate.phone}</p>` : ''}
                        ${candidate.cpf ? `<p><strong>CPF:</strong> ${candidate.cpf}</p>` : ''}
                    </div>
                    ${candidate.observations ? `<div class="mb-4 p-3 bg-gray-50 rounded-lg"><p class="text-sm text-gray-600">${candidate.observations}</p></div>` : ''}
                    <div class="flex gap-2">
                        <button onclick="Recruitment.openMoveModal('${candidate.id}')" class="flex-1 btn-secondary text-sm py-2"><i class="fas fa-arrows-alt mr-1"></i>Mover</button>
                        <button onclick="Recruitment.openCandidateModal('${candidate.id}')" class="flex-1 btn-secondary text-sm py-2"><i class="fas fa-edit mr-1"></i>Editar</button>
                        <button onclick="Recruitment.deleteCandidate('${candidate.id}')" class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('');
        }
 
        updateSummary() {
            const summary = {
                open: 0,
                completed: 0,
                totalCandidates: 0
            };
 
            this.allJobs.forEach(job => {
                if (job.status === 'Em Aberto') summary.open++;
                if (job.status === 'Concluído') summary.completed++;
            });
 
            summary.totalCandidates = this.allCandidates.length;
 
            // Atualizar contadores no HTML
            const elements = {
                'summary-open-jobs': summary.open,
                'summary-completed-jobs': summary.completed,
                'summary-total-candidates': summary.totalCandidates
            };
 
            Object.entries(elements).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            });
        }
 
        setupEventListeners() {
            // Filtros
            document.getElementById('jobs-filter')?.addEventListener('change', (e) => {
                this.filterJobs(e.target.value);
            });
 
            document.getElementById('candidates-filter')?.addEventListener('change', (e) => {
                this.filterCandidates(e.target.value);
            });
 
            // Busca
            document.getElementById('jobs-search')?.addEventListener('input', (e) => {
                this.searchJobs(e.target.value);
            });
 
            document.getElementById('candidates-search')?.addEventListener('input', (e) => {
                this.searchCandidates(e.target.value);
            });
        }
 
        setupModalClosers() {
            const modals = ['job-modal', 'candidate-modal', 'move-modal'];
            modals.forEach(id => {
                const modal = document.getElementById(id);
                if (modal) {
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            this.closeModal(id);
                        }
                    });
                }
            });
        }
 
        closeModal(modalId) {
            document.getElementById(modalId)?.classList.add('hidden');
        }
 
        switchTab(tab) {
            // Esconder todas as seções
            ['jobs', 'candidates', 'analytics', 'talent-pool'].forEach(t => {
                document.getElementById(`${t}-section`).classList.add('hidden');
            });
 
            // Mostrar seção selecionada
            document.getElementById(`${tab}-section`).classList.remove('hidden');
 
            // Atualizar botões
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById(`tab-${tab}`)?.classList.add('active');
 
            if (tab === 'talent-pool') this.loadTalentPool();
        }
 
        openJobModal(jobId = null) {
            document.getElementById('job-modal')?.classList.remove('hidden');
            document.getElementById('job-form')?.reset();
            document.getElementById('job-id').value = '';
 
            if (jobId) {
                const job = this.allJobs.find(j => j.id === jobId);
                if (job) {
                    document.getElementById('job-id').value = job.id;
                    document.getElementById('job-unit').value = job.unit;
                    document.getElementById('job-title').value = job.job_title;
                    document.getElementById('job-sector').value = job.sector;
                    document.getElementById('job-opening').value = job.opening_date;
                    document.getElementById('job-closing').value = job.closing_date;
                    document.getElementById('job-admission').value = job.admission_date;
                    document.getElementById('job-status').value = job.status;
                    document.getElementById('job-observation').value = job.observation || '';
                    document.getElementById('job-modal-title').textContent = 'Editar Vaga';
                }
            } else {
                document.getElementById('job-modal-title').textContent = 'Nova Vaga';
            }
        }
 
        closeJobModal() {
            document.getElementById('job-modal')?.classList.add('hidden');
        }
 
        async saveJob(e) {
            e.preventDefault();
 
            const id = document.getElementById('job-id').value;
            const data = {
                unit: document.getElementById('job-unit').value,
                job_title: document.getElementById('job-title').value,
                sector: document.getElementById('job-sector').value,
                opening_date: document.getElementById('job-opening').value,
                closing_date: document.getElementById('job-closing').value,
                admission_date: document.getElementById('job-admission').value,
                status: document.getElementById('job-status').value,
                observation: document.getElementById('job-observation').value,
                created_by: 'Sistema'
            };
 
            try {
                const result = await RecruitmentAPI.saveJob(data, id || null);
                if (result.success) {
                    this.closeJobModal();
                    await this.loadJobs();
                    this.updateSummary();
                    ToastManager.show(id ? 'Vaga atualizada!' : 'Vaga criada!', 'success');
                } else {
                    ToastManager.show('Erro: ' + (result.error || 'Erro desconhecido'), 'error');
                }
            } catch (e) {
                ToastManager.show('Erro ao salvar: ' + e.message, 'error');
            }
        }
 
        openCandidateModal(candidateId = null) {
            document.getElementById('candidate-modal')?.classList.remove('hidden');
            document.getElementById('candidate-form')?.reset();
            document.getElementById('candidate-id').value = '';
 
            if (candidateId) {
                const candidate = this.allCandidates.find(c => c.id === candidateId);
                if (candidate) {
                    document.getElementById('candidate-id').value = candidate.id;
                    document.getElementById('candidate-unit').value = candidate.unit;
                    document.getElementById('candidate-requester').value = candidate.requester || '';
                    document.getElementById('candidate-name').value = candidate.name;
                    document.getElementById('candidate-cpf').value = candidate.cpf || '';
                    document.getElementById('candidate-phone').value = candidate.phone || '';
                    document.getElementById('candidate-birth').value = candidate.birth_date || '';
                    document.getElementById('candidate-position').value = candidate.position;
                    document.getElementById('candidate-stage-id').value = candidate.current_stage_id || '';
                    document.getElementById('candidate-outcome').value = candidate.stage_outcome || '';
                    document.getElementById('candidate-observations').value = candidate.observations || '';
                    document.getElementById('candidate-modal-title').textContent = 'Editar Candidato';
                }
            } else {
                document.getElementById('candidate-modal-title').textContent = 'Novo Candidato';
            }
        }
 
        closeCandidateModal() {
            document.getElementById('candidate-modal')?.classList.add('hidden');
        }
 
        async saveCandidate(e) {
            e.preventDefault();
 
            const id = document.getElementById('candidate-id').value;
            const data = {
                unit: document.getElementById('candidate-unit').value,
                requester: document.getElementById('candidate-requester').value,
                name: document.getElementById('candidate-name').value,
                cpf: document.getElementById('candidate-cpf').value,
                phone: document.getElementById('candidate-phone').value,
                birth_date: document.getElementById('candidate-birth').value,
                position: document.getElementById('candidate-position').value,
                current_stage_id: document.getElementById('candidate-stage-id').value,
                stage_outcome: document.getElementById('candidate-outcome').value,
                observations: document.getElementById('candidate-observations').value,
                created_by: 'Sistema'
            };
 
            try {
                const result = await RecruitmentAPI.saveCandidate(data, id || null);
                if (result.success) {
                    this.closeCandidateModal();
                    await this.loadCandidates();
                    this.updateSummary();
                    ToastManager.show(id ? 'Candidato atualizado!' : 'Candidato criado!', 'success');
                } else {
                    ToastManager.show('Erro: ' + (result.error || 'Erro desconhecido'), 'error');
                }
            } catch (e) {
                ToastManager.show('Erro ao salvar: ' + e.message, 'error');
            }
        }
 
        openMoveModal(candidateId) {
            const candidate = this.allCandidates.find(c => c.id === candidateId);
            if (!candidate) return;
 
            this.currentMovingCandidateId = candidateId;
 
            document.getElementById('move-modal')?.classList.remove('hidden');
            document.getElementById('move-candidate-name').textContent = candidate.name;
            document.getElementById('move-current-stage').textContent = candidate.stage_name || 'Sem etapa';
 
            // Preencher opções de etapas
            const stageSelect = document.getElementById('move-to-stage');
            stageSelect.innerHTML = '<option value="">Selecione...</option>';
            this.pipelineStages.forEach(stage => {
                stageSelect.innerHTML += `<option value="${stage.id}">${stage.name}</option>`;
            });
        }
 
        closeMoveModal() {
            document.getElementById('move-modal')?.classList.add('hidden');
            this.currentMovingCandidateId = null;
        }
 
        async moveCandidate() {
            if (!this.currentMovingCandidateId) return;
 
            const stageId = document.getElementById('move-to-stage').value;
            const outcome = document.getElementById('move-outcome').value;
            const notes = document.getElementById('move-notes').value;
 
            if (!stageId) {
                ToastManager.show('Selecione uma etapa', 'warning');
                return;
            }
 
            try {
                const result = await RecruitmentAPI.moveCandidate(this.currentMovingCandidateId, {
                    to_stage_id: stageId,
                    outcome: outcome,
                    notes: notes,
                    moved_by: 'Sistema'
                });
 
                if (result.success) {
                    this.closeMoveModal();
                    await this.loadCandidates();
                    ToastManager.show('Candidato movido com sucesso!', 'success');
                } else {
                    ToastManager.show('Erro: ' + (result.error || 'Erro desconhecido'), 'error');
                }
            } catch (e) {
                ToastManager.show('Erro ao movimentar: ' + e.message, 'error');
            }
        }
 
        async deleteCandidate(id) {
            if (!confirm('Tem certeza que deseja excluir este candidato?')) return;
 
            try {
                const result = await RecruitmentAPI.deleteCandidate(id);
                if (result.success) {
                    await this.loadCandidates();
                    this.updateSummary();
                    ToastManager.show('Candidato excluído!', 'success');
                } else {
                    ToastManager.show('Erro: ' + (result.error || 'Erro desconhecido'), 'error');
                }
            } catch (e) {
                ToastManager.show('Erro ao excluir: ' + e.message, 'error');
            }
        }
 
        async deleteJob(id) {
            if (!confirm('Tem certeza que deseja excluir esta vaga?')) return;
 
            try {
                const result = await RecruitmentAPI.deleteJob(id);
                if (result.success) {
                    await this.loadJobs();
                    this.updateSummary();
                    ToastManager.show('Vaga excluída!', 'success');
                } else {
                    ToastManager.show('Erro: ' + (result.error || 'Erro desconhecido'), 'error');
                }
            } catch (e) {
                ToastManager.show('Erro ao excluir: ' + e.message, 'error');
            }
        }
 
        // Função de upload de PDF (simplificada)
        async handleCVUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
 
            if (file.type !== 'application/pdf') {
                ToastManager.show('Por favor, selecione um arquivo PDF', 'error');
                return;
            }
 
            // Mostrar preview do arquivo
            const preview = document.getElementById('cv-preview');
            const filename = document.getElementById('cv-filename');
            preview.classList.remove('hidden');
            filename.textContent = file.name;
 
            try {
                // Simulação de extração de dados
                await new Promise(resolve => setTimeout(resolve, 1000));
 
                // Preencher campos com dados simulados
                document.getElementById('candidate-name').value = 'NOME EXTRAÍDO DO PDF';
                document.getElementById('candidate-cpf').value = '123.456.789-00';
                document.getElementById('candidate-phone').value = '(11) 98765-4321';
                document.getElementById('candidate-position').value = 'CARGO EXTRAÍDO';
 
                ToastManager.show('Currículo processado com sucesso!', 'success');
            } catch (error) {
                ToastManager.show('Erro ao processar o currículo', 'error');
            }
        }
 
        removeCV() {
            document.getElementById('candidate-cv').value = '';
            document.getElementById('cv-preview').classList.add('hidden');
        }
 
        onStageChangeForMove() {
            const stageId = document.getElementById('move-to-stage').value;
            const outcomeSelect = document.getElementById('move-outcome');
 
            outcomeSelect.innerHTML = '<option value="">Selecione...</option>';
 
            if (stageId) {
                const outcomes = this.pipelineOutcomes.filter(o => o.stage_id === stageId);
                outcomes.forEach(outcome => {
                    outcomeSelect.innerHTML += `<option value="${outcome.outcome}">${outcome.outcome}</option>`;
                });
            }
        }
    }
 
    window.Recruitment = new RecruitmentApp();
 
    document.addEventListener('DOMContentLoaded', () => {
        window.Recruitment.init();
    });
 
    // Funções globais
    window.switchTab = (tab) => window.Recruitment.switchTab(tab);
    window.openJobModal = (id) => window.Recruitment.openJobModal(id);
    window.closeJobModal = () => window.Recruitment.closeJobModal();
    window.saveJob = (e) => window.Recruitment.saveJob(e);
    window.openCandidateModal = (id) => window.Recruitment.openCandidateModal(id);
    window.closeCandidateModal = () => window.Recruitment.closeCandidateModal();
    window.saveCandidate = (e) => window.Recruitment.saveCandidate(e);
    window.deleteCandidate = (id) => window.Recruitment.deleteCandidate(id);
    window.openMoveModal = (id) => window.Recruitment.openMoveModal(id);
    window.closeMoveModal = () => window.Recruitment.closeMoveModal();
    window.moveCandidate = () => window.Recruitment.moveCandidate();
    window.onStageChangeForMove = () => window.Recruitment.onStageChangeForMove();
    window.deleteJob = (id) => window.Recruitment.deleteJob(id);
    window.handleCVUpload = (event) => window.Recruitment.handleCVUpload(event);
    window.removeCV = () => window.Recruitment.removeCV();
 
})();
// Integração do Sistema de Cards de Vínculos com o Editor Existente
class VinculosIntegration {
    constructor() {
        this.originalContainer = null;
        this.cardsContainer = null;
        this.isCardsMode = false;
    }

    // Inicializar a integração
    init() {
        console.log('🔧 Inicializando integração de vínculos...');
        
        // Aguardar o DOM carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupIntegration());
        } else {
            this.setupIntegration();
        }
    }

    // Configurar a integração
    setupIntegration() {
        // Encontrar o container original de vínculos
        this.originalContainer = document.getElementById('vinculos-container');
        
        if (!this.originalContainer) {
            console.log('⚠️ Container original de vínculos não encontrado');
            return;
        }

        // Criar botão de alternância
        this.createToggleSwitch();
        
        // Iniciar com o novo sistema de cards
        this.switchToCardsMode();
        
        console.log('✅ Integração de vínculos configurada');
    }

    // Criar botão de alternância entre sistemas
    createToggleSwitch() {
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'vinculos-toggle-container';
        toggleContainer.innerHTML = `
            <div class="toggle-header">
                <h4>📋 Sistema de Vínculos</h4>
                <div class="toggle-switch">
                    <button id="toggle-cards" class="toggle-btn active" onclick="vinculosIntegration.switchToCardsMode()">
                        🎴 Cards Modernos
                    </button>
                    <button id="toggle-classic" class="toggle-btn" onclick="vinculosIntegration.switchToClassicMode()">
                        📝 Clássico
                    </button>
                </div>
            </div>
        `;
        
        // Inserir antes do container original
        this.originalContainer.parentNode.insertBefore(toggleContainer, this.originalContainer);
    }

    // Alternar para modo Cards
    async switchToCardsMode() {
        if (this.isCardsMode) return;
        
        console.log('🎴 Alternando para modo Cards...');
        
        // Atualizar botões
        document.getElementById('toggle-cards')?.classList.add('active');
        document.getElementById('toggle-classic')?.classList.remove('active');
        
        // Esconder container original
        this.originalContainer.style.display = 'none';
        
        // Criar ou mostrar container de cards
        if (!this.cardsContainer) {
            this.cardsContainer = document.createElement('div');
            this.cardsContainer.id = 'vinculos-cards-container';
            this.originalContainer.parentNode.insertBefore(this.cardsContainer, this.originalContainer.nextSibling);
        }
        
        this.cardsContainer.style.display = 'block';
        this.isCardsMode = true;
        
        // Inicializar o gerenciador de cards
        if (window.vinculosCardsManager && window.currentEmpId) {
            try {
                await window.vinculosCardsManager.init(window.currentEmpId);
                console.log('✅ Cards de vínculos inicializados');
            } catch (error) {
                console.error('❌ Erro ao inicializar cards:', error);
            }
        }
    }

    // Alternar para modo Clássico
    switchToClassicMode() {
        if (!this.isCardsMode) return;
        
        console.log('📝 Alternando para modo Clássico...');
        
        // Atualizar botões
        document.getElementById('toggle-classic')?.classList.add('active');
        document.getElementById('toggle-cards')?.classList.remove('active');
        
        // Esconder container de cards
        if (this.cardsContainer) {
            this.cardsContainer.style.display = 'none';
        }
        
        // Mostrar container original
        this.originalContainer.style.display = 'block';
        this.isCardsMode = false;
        
        console.log('✅ Modo clássico ativado');
    }

    // Sobrescrever a função populateVinculos original
    overridePopulateVinculos() {
        // Salvar a função original
        const originalPopulateVinculos = window.populateVinculos;
        
        // Sobrescrever com a nova lógica
        window.populateVinculos = function(vinculos) {
            console.log('🔄 populateVinculos chamado com integração');
            
            // Se estiver em modo cards, usar o novo sistema
            if (window.vinculosIntegration && window.vinculosIntegration.isCardsMode) {
                if (window.vinculosCardsManager && window.currentEmpId) {
                    window.vinculosCardsManager.init(window.currentEmpId);
                    return;
                }
            }
            
            // Caso contrário, usar a função original
            return originalPopulateVinculos.call(this, vinculos);
        };
        
        console.log('✅ Função populateVinculos sobrescrita');
    }

    // Adicionar estilos para o toggle
    addToggleStyles() {
        const styles = `
            .vinculos-toggle-container {
                margin-bottom: 20px;
                padding: 15px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                color: white;
            }
            
            .toggle-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .toggle-header h4 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }
            
            .toggle-switch {
                display: flex;
                gap: 8px;
            }
            
            .toggle-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                background: rgba(255, 255, 255, 0.2);
                color: white;
            }
            
            .toggle-btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-1px);
            }
            
            .toggle-btn.active {
                background: rgba(255, 255, 255, 0.9);
                color: #333;
                font-weight: 600;
            }
            
            @media (max-width: 768px) {
                .toggle-header {
                    flex-direction: column;
                    gap: 10px;
                    align-items: flex-start;
                }
                
                .toggle-switch {
                    flex-direction: column;
                    width: 100%;
                }
                
                .toggle-btn {
                    text-align: center;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

// Instância global da integração
const vinculosIntegration = new VinculosIntegration();

// Inicializar automaticamente
vinculosIntegration.init();

// Adicionar estilos quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        vinculosIntegration.addToggleStyles();
        vinculosIntegration.overridePopulateVinculos();
    });
} else {
    vinculosIntegration.addToggleStyles();
    vinculosIntegration.overridePopulateVinculos();
}

// Funções globais para acesso direto
window.switchToCardsMode = () => vinculosIntegration.switchToCardsMode();
window.switchToClassicMode = () => vinculosIntegration.switchToClassicMode();

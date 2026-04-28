
import { KNOWLEDGE_BASE } from './steps.js';

class HelpCenter {
    constructor() {
        this.isOpen = false;
        // Sons de sistema (Links diretos para sons curtos de UI)
        this.sounds = {
            open: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
            click: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
            close: new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3')
        };
        // Ajustar volumes
        Object.values(this.sounds).forEach(s => s.volume = 0.2);
    }

    init() {
        this.injectFab();
        this.injectPanel();
    }

    injectFab() {
        const fab = document.createElement('button');
        fab.id = 'help-fab-discrete';
        fab.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        `;
        fab.onclick = () => this.toggle();
        document.body.appendChild(fab);
    }

    injectPanel() {
        const panel = document.createElement('div');
        panel.id = 'help-panel';
        panel.className = 'help-panel-hidden';
        panel.innerHTML = `
            <div class="help-header">
                <div class="help-header-info">
                    <span id="help-page-icon">❓</span>
                    <h2 id="help-page-title">Centro de Ajuda</h2>
                </div>
                <button id="help-close-btn">&times;</button>
            </div>
            <div class="help-content custom-scroll" id="help-tips-container">
                <!-- Dicas contextuais aqui -->
            </div>
            <div class="help-footer">
                Nordeste Academy • Instruções Operacionais
            </div>
        `;
        document.body.appendChild(panel);
        document.getElementById('help-close-btn').onclick = () => this.toggle();
    }

    toggle() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('help-panel');
        const fab = document.getElementById('help-fab-discrete');

        if (this.isOpen) {
            this.sounds.open.play();
            panel.classList.remove('help-panel-hidden');
            panel.classList.add('help-panel-visible');
            fab.classList.add('active');
            this.renderContextualTips();
        } else {
            this.sounds.close.play();
            panel.classList.remove('help-panel-visible');
            panel.classList.add('help-panel-hidden');
            fab.classList.remove('active');
        }
    }

    renderContextualTips() {
        const container = document.getElementById('help-tips-container');
        const path = window.location.pathname;
        
        // Tenta encontrar a chave exata ou uma que contenha o path
        const pageKey = Object.keys(KNOWLEDGE_BASE).find(key => path.includes(key)) || "/dashboard";
        const context = KNOWLEDGE_BASE[pageKey];

        document.getElementById('help-page-title').innerText = context.title;
        document.getElementById('help-page-icon').innerText = context.icon;

        container.innerHTML = context.tips.map((tip, idx) => `
            <div class="help-card animate-slide-up" style="animation-delay: ${idx * 0.1}s">
                <div class="help-card-task">${tip.task}</div>
                <div class="help-card-instruction">${tip.instruction}</div>
            </div>
        `).join('') + `
            <div class="help-info-box">
                <b>Dúvida Técnica?</b><br>
                Se precisar de suporte com o banco de dados ou erros de sistema, contate o administrador do TI.
            </div>
        `;
    }
}

window.HelpCenter = new HelpCenter();
document.addEventListener('DOMContentLoaded', () => window.HelpCenter.init());

/**
 * 🔔 Widget de Notificações - Onboarding 90 Dias
 * Gerencia e exibe notificações na dashboard
 */

let notifications = [];
let unreadCount = 0;

// Carregar notificações ao iniciar
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar se estamos na página correta
    if (!document.getElementById('notifications-list')) return;
    
    await loadNotifications();
    
    // Auto-refresh a cada 5 minutos
    setInterval(loadNotifications, 5 * 60 * 1000);
    
    // Também atualizar badge do header
    window.updateNotificationBadgeOnLoad = async () => {
        if (document.getElementById('header-notification-badge')) {
            await loadNotifications();
        }
    };
    
    // Executar immediately
    if (document.getElementById('header-notification-badge')) {
        loadNotifications();
    }
});

// Carregar notificações da API
window.loadNotifications = async () => {
    try {
        const res = await fetch('/api/notifications?limit=10');
        const data = await res.json();
        
        notifications = data.notifications || [];
        unreadCount = data.unreadCount || 0;
        
        renderNotifications();
        updateBadge();
    } catch (err) {
        console.error('Erro ao carregar notificações:', err);
        document.getElementById('notifications-list').innerHTML = `
            <p class="text-gray-300 text-center text-xs font-bold py-8">Erro ao carregar</p>
        `;
    }
};

// Renderizar lista de notificações
function renderNotifications() {
    const container = document.getElementById('notifications-list');
    if (!container) return;
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                </div>
                <p class="text-gray-400 text-xs font-bold uppercase">Nenhuma notificação pendente</p>
                <p class="text-gray-300 text-[10px] mt-1">Tudo em dia!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(n => {
        const priorityColors = {
            'high': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
            'medium': { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
            'low': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' }
        };
        
        const colors = priorityColors[n.priority] || priorityColors.low;
        const unreadClass = n.readed ? 'opacity-60' : '';
        
        return `
            <div class="notification-item ${colors.bg} ${colors.border} border-l-4 rounded-r-lg p-3 cursor-pointer hover:shadow-md transition-all ${unreadClass}" 
                 onclick="window.openNotificationDetail(${n.id})">
                <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-black ${colors.text} uppercase tracking-wider mb-1">${n.title}</p>
                        <p class="text-[10px] text-gray-600 leading-tight">${n.message}</p>
                    </div>
                    ${!n.readed ? '<div class="w-2 h-2 bg-nordeste-red rounded-full flex-shrink-0 mt-1"></div>' : ''}
                </div>
                <div class="flex items-center justify-between mt-2">
                    <span class="text-[9px] text-gray-400 font-bold uppercase">${formatTimeAgo(n.created_at)}</span>
                    <button onclick="event.stopPropagation(); window.dismissNotification(${n.id})" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Atualizar badge de notificações não lidas
function updateBadge() {
    const badge = document.getElementById('notification-badge');
    const headerBadge = document.getElementById('header-notification-badge');
    
    if (badge) {
        if (unreadCount > 0) {
            badge.classList.remove('hidden');
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        } else {
            badge.classList.add('hidden');
        }
    }
    
    // Atualizar badge do header também
    if (headerBadge) {
        if (unreadCount > 0) {
            headerBadge.classList.remove('hidden');
            headerBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        } else {
            headerBadge.classList.add('hidden');
        }
    }
}

// Rolar até a seção de notificações
window.scrollToNotifications = () => {
    const section = document.getElementById('notifications-section');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// Abrir detalhes da notificação
window.openNotificationDetail = async (id) => {
    // Marcar como lida
    try {
        await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    } catch (e) {
        console.log('Erro ao marcar como lida');
    }
    
    // Encontrar notificação
    const n = notifications.find(item => item.id === id);
    if (!n) return;
    
    // Se tem employee_id, redirecionar para o onboarding
    if (n.employee_id) {
        window.location.href = `/onboarding-90dias.html?employee=${n.employee_id}`;
    }
};

// Dispensar notificação
window.dismissNotification = async (id) => {
    try {
        await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
        await loadNotifications();
    } catch (err) {
        console.error('Erro ao dispensar:', err);
    }
};

// Marcar todas como lidas
window.markAllNotificationsRead = async () => {
    try {
        await fetch('/api/notifications/read-all', { method: 'PUT' });
        await loadNotifications();
        
        // Mostrar toast
        showToast('Todas as notificações marcadas como lidas');
    } catch (err) {
        console.error('Erro ao marcar todas como lidas:', err);
    }
};

// Mostrar notificação toast popup
function showToast(message) {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'notification-toast fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-bold z-50 animate-fade-in';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Formatar tempo relativo
function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('pt-BR');
}

// Gerar notificações manualmente (para testing)
window.generateOnboardingNotifications = async () => {
    try {
        const res = await fetch('/api/onboarding/generate-notifications', { method: 'POST' });
        const data = await res.json();
        
        showToast(`${data.notificationsCreated} notificações geradas`);
        await loadNotifications();
    } catch (err) {
        console.error('Erro ao gerar:', err);
    }
};

import { DateFixer } from '../date-fixer.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = Auth.getUser();
    if (!currentUser) return;

    initProfile();
});

async function initProfile() {
    loadUIData();
    await fetchFullProfile();
}

function loadUIData() {
    const user = currentUser;
    
    // Atualizar Header
    const headerName = document.getElementById('header-user-name');
    if(headerName) headerName.innerText = user.name;
    
    const headerAvatar = document.getElementById('header-user-avatar');
    const headerInitials = document.getElementById('header-user-initials');
    
    if (headerAvatar && user.photoUrl) {
        headerAvatar.src = user.photoUrl;
        headerAvatar.classList.remove('hidden');
        headerInitials.classList.add('hidden');
    } else if(headerInitials) {
        headerAvatar?.classList.add('hidden');
        headerInitials.classList.remove('hidden');
        headerInitials.innerText = user.name.charAt(0).toUpperCase();
    }

    // Preencher campos do formulário
    const labelDisplayName = document.getElementById('display-name-label');
    if(labelDisplayName) labelDisplayName.innerText = user.name;

    document.getElementById('user-fullname').value = user.name;
    document.getElementById('user-login').value = user.username;
    document.getElementById('profile-preview').src = user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=E57373&color=fff&size=300`;
}

async function fetchFullProfile() {
    try {
        const res = await fetch(`/api/profile/${currentUser.id}`);
        const data = await res.json();
        if (data.success) {
            currentUser = data.user;
            Auth.updateSession(data.user);
            loadUIData();
        }
    } catch (e) {
        showToast("Erro de sincronização", "error");
    }
}

window.previewAvatar = (input) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('profile-preview').src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.removeAvatar = () => {
    document.getElementById('profile-preview').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=E57373&color=fff&size=300`;
    document.getElementById('avatar-input').value = "";
};

window.saveBasicInfo = async () => {
    const btn = document.getElementById('btn-save-basic');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "GRAVANDO...";

    const payload = {
        name: document.getElementById('user-fullname').value,
        photoUrl: document.getElementById('profile-preview').src
    };

    try {
        const res = await fetch(`/api/profile/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            Auth.updateSession(data.user);
            currentUser = data.user;
            loadUIData();
            showToast("Alterações salvas!", "success");
        }
    } catch (e) {
        showToast("Falha ao salvar", "error");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
};

window.checkPasswordStrength = () => {
    const pass = document.getElementById('pass-new').value;
    const confirm = document.getElementById('pass-confirm').value;
    const bar = document.getElementById('strength-fill');
    const label = document.getElementById('strength-label');
    
    // Checklist UI
    const checkLen = document.getElementById('check-length');
    const checkMatch = document.getElementById('check-match');
    
    let strength = 0;
    if (pass.length >= 6) {
        strength = 100;
        checkLen.classList.add('valid');
        label.innerText = "Segura";
    } else {
        checkLen.classList.remove('valid');
        label.innerText = "Pendente";
    }

    if (pass === confirm && pass.length > 0) {
        checkMatch.classList.add('valid');
    } else {
        checkMatch.classList.remove('valid');
    }

    bar.style.width = strength + "%";
    bar.style.backgroundColor = strength === 100 ? "#10B981" : "#E57373";
};

// Monitorar confirmação de senha
document.addEventListener('input', (e) => {
    if (e.target.id === 'pass-confirm') window.checkPasswordStrength();
});

window.saveNewPassword = async () => {
    const current = document.getElementById('pass-current').value;
    const news = document.getElementById('pass-new').value;
    const confirm = document.getElementById('pass-confirm').value;

    if (!current) return showToast("Informe a senha atual", "error");
    if (news.length < 6) return showToast("Senha muito curta", "error");
    if (news !== confirm) return showToast("As senhas divergem", "error");

    const btn = document.getElementById('btn-save-pass');
    btn.disabled = true;
    btn.innerText = "PROCESSANDO...";

    try {
        const res = await fetch(`/api/profile/${currentUser.id}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword: current, newPassword: news })
        });
        const data = await res.json();
        
        if (data.success) {
            showToast("Senha atualizada!", "success");
            document.getElementById('pass-current').value = "";
            document.getElementById('pass-new').value = "";
            document.getElementById('pass-confirm').value = "";
            window.checkPasswordStrength();
        } else {
            showToast(data.error, "error");
        }
    } catch (e) {
        showToast("Erro no servidor", "error");
    } finally {
        btn.disabled = false;
        btn.innerText = "ATUALIZAR SENHA";
    }
};

function showToast(msg, type) {
    const t = document.getElementById('toast');
    if(!t) return;
    t.innerText = msg;
    t.className = `fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-8 py-3.5 rounded-3xl font-black text-[10px] uppercase shadow-2xl transition-all duration-500 toast-${type}`;
    t.style.opacity = "1";
    t.style.transform = "translate(-50%, 0) scale(1)";
    
    setTimeout(() => {
        t.style.opacity = "0";
        t.style.transform = "translate(-50%, 20px) scale(0.9)";
    }, 3000);
}

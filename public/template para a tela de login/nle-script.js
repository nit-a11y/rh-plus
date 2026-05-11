/**
 * ================================================
 * NLE LOGIN PLUGIN - JavaScript Principal
 * ================================================
 * Plugin de login reutilizável com suporte a:
 * - Auth da Interface de Temas (protege painel de customização)
 * - Auth do Sistema Destino (autenticação do usuário final)
 * ================================================
 */

const NLE = (function() {
  'use strict';

  // ============================================
  // ELEMENTOS DO DOM
  // ============================================
  const els = {
    backgroundContainer: null,
    configModal: null,
    essenceLink: null,
    authEmail: null,
    authPassword: null,
    themeSection: null,
    uploadArea: null,
    fileInput: null,
    previewContainer: null,
    previewImage: null,
    fileName: null,
    removeBtn: null,
    saveBtn: null,
    saveThemeBtn: null,
    resetThemeBtn: null,
    cancelBtn: null,
    errorMessage: null,
    successMessage: null,
    loginForm: null,
    modalClose: null,
    cardBgColor: null,
    cardBgText: null,
    cardBgEyedropper: null,
    buttonColor: null,
    buttonText: null,
    buttonEyedropper: null,
    textColor: null,
    textColorText: null,
    textEyedropper: null,
    cardBorderColor: null,
    cardBorderText: null,
    cardBorderEyedropper: null
  };

  // Estado interno
  let state = {
    selectedFile: null,
    isThemeAuthenticated: false,
    themeControlsEnabled: false,
    backgroundSettings: {
      size: '100% 100%',
      position: 'top left',
      zoom: 100,
      repeat: 'no-repeat',
      stretch: true
    }
  };

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  function init() {
    cacheElements();
    loadBackground();
    loadTheme();
    setupEventListeners();
    console.log('[NLE Plugin] Inicializado com sucesso');
  }

  /**
   * Armazena referências aos elementos do DOM
   * @private
   */
  function cacheElements() {
    els.backgroundContainer = document.getElementById('nle-background');
    els.configModal = document.getElementById('nle-config-modal');
    els.essenceLink = document.getElementById('nle-essence-link');
    els.authEmail = document.getElementById('nle-auth-email');
    els.authPassword = document.getElementById('nle-auth-password');
    els.themeSection = document.getElementById('nle-theme-section');
    els.uploadArea = document.getElementById('nle-upload-area');
    els.fileInput = document.getElementById('nle-file-input');
    els.previewContainer = document.getElementById('nle-preview-container');
    els.previewImage = document.getElementById('nle-preview-image');
    els.fileName = document.getElementById('nle-file-name');
    els.removeBtn = document.getElementById('nle-remove-btn');
    els.saveBtn = document.getElementById('nle-save-bg-btn');
    els.saveThemeBtn = document.getElementById('nle-save-theme-btn');
    els.resetThemeBtn = document.getElementById('nle-reset-theme-btn');
    els.cancelBtn = document.getElementById('nle-cancel-btn');
    els.errorMessage = document.getElementById('nle-error-message');
    els.successMessage = document.getElementById('nle-success-message');
    els.loginForm = document.getElementById('nle-login-form');
    els.modalClose = document.getElementById('nle-modal-close');
    els.cardBgColor = document.getElementById('nle-card-bg-color');
    els.cardBgText = document.getElementById('nle-card-bg-text');
    els.cardBgEyedropper = document.getElementById('nle-card-bg-eyedropper');
    els.buttonColor = document.getElementById('nle-button-color');
    els.buttonText = document.getElementById('nle-button-text');
    els.buttonEyedropper = document.getElementById('nle-button-eyedropper');
    els.textColor = document.getElementById('nle-text-color');
    els.textColorText = document.getElementById('nle-text-color-text');
    els.textEyedropper = document.getElementById('nle-text-eyedropper');
    els.cardBorderColor = document.getElementById('nle-card-border-color');
    els.cardBorderText = document.getElementById('nle-card-border-text');
    els.cardBorderEyedropper = document.getElementById('nle-card-border-eyedropper');
    
    // Background controls
    els.backgroundSize = document.getElementById('nle-background-size');
    els.backgroundPosition = document.getElementById('nle-background-position');
    els.backgroundZoom = document.getElementById('nle-background-zoom');
    els.zoomValue = document.getElementById('nle-zoom-value');
    els.backgroundRepeat = document.getElementById('nle-background-repeat');
    els.previewViewport = document.getElementById('nle-preview-viewport');
  }

  // ============================================
  // CARREGAMENTO DE DADOS
  // ============================================

  /**
   * Carrega background salvo do localStorage
   * @private
   */
  function loadBackground() {
    try {
      const isLocalFile = window.location.protocol === 'file:';
      let saved;
      
      if (isLocalFile) {
        try {
          saved = sessionStorage.getItem(NLE_CONFIG.storageKeys.background);
        } catch (e) {
          saved = null;
        }
      } else {
        try {
          saved = localStorage.getItem(NLE_CONFIG.storageKeys.background);
        } catch (e) {
          saved = null;
        }
      }
      
      if (saved && els.backgroundContainer) {
        // Modo STRETCH: 100% da tela, sem cortes
        els.backgroundContainer.style.backgroundImage = `url(${saved})`;
        els.backgroundContainer.style.backgroundSize = '100% 100%';
        els.backgroundContainer.style.backgroundPosition = 'top left';
        els.backgroundContainer.style.backgroundRepeat = 'no-repeat';
      }
      
      // Carregar configurações do background
      loadBackgroundSettings();
    } catch (error) {
      console.error('[NLE] Erro ao carregar background:', error);
    }
  }

  /**
   * Carrega tema salvo do localStorage
   * @private
   */
  function loadTheme() {
    try {
      // Verifica se está rodando localmente (file://)
      const isLocalFile = window.location.protocol === 'file:';
      
      let saved;
      if (isLocalFile) {
        // Para ambiente local, tenta sessionStorage primeiro
        try {
          saved = sessionStorage.getItem(NLE_CONFIG.storageKeys.theme);
        } catch (e) {
          console.log('[NLE] SessionStorage não disponível para tema');
          saved = null;
        }
      } else {
        // Para ambiente web, usa localStorage normalmente
        try {
          saved = localStorage.getItem(NLE_CONFIG.storageKeys.theme);
        } catch (e) {
          console.log('[NLE] LocalStorage não disponível para tema');
          saved = null;
        }
      }
      
      if (saved) {
        try {
          const theme = JSON.parse(saved);
          applyTheme(theme);
        } catch (parseError) {
          console.log('[NLE] Erro ao parsear tema, usando padrão');
        }
      }
    } catch (error) {
      console.error('[NLE] Erro ao carregar tema:', error);
    }
  }

  // ============================================
  // APLICAÇÃO DE TEMA
  // ============================================

  /**
   * Aplica tema visual ao componente
   * @param {Object} theme - Objeto com propriedades de tema
   * @param {string} theme.cardBg - Cor de fundo do card
   * @param {string} theme.buttonColor - Cor dos botões
   * @param {string} theme.textColor - Cor do texto
   * @param {string} theme.cardBorderColor - Cor das bordas
   * @public
   */
  function applyTheme(theme) {
    if (theme.cardBg && els.backgroundContainer) {
      document.documentElement.style.setProperty('--nle-branco', theme.cardBg);
      const card = document.querySelector('.nle-card');
      if (card) card.style.background = theme.cardBg;
    }
    
    if (theme.buttonColor) {
      document.documentElement.style.setProperty('--nle-rubi', theme.buttonColor);
      const buttons = document.querySelectorAll('.nle-btn-primary');
      buttons.forEach(btn => btn.style.background = theme.buttonColor);
    }
    
    if (theme.textColor) {
      document.documentElement.style.setProperty('--nle-cinza-escuro', theme.textColor);
      const textEls = document.querySelectorAll('.nle-valor-title, .nle-valor-description, .nle-valor-list li');
      textEls.forEach(el => el.style.color = theme.textColor);
    }
    
    if (theme.cardBorderColor) {
      const cards = document.querySelectorAll('.nle-valor-card');
      cards.forEach(card => card.style.borderColor = theme.cardBorderColor);
    }
  }

  /**
   * Retorna o tema atual
   * @returns {Object} Tema atual
   * @public
   */
  function getTheme() {
    const saved = localStorage.getItem(NLE_CONFIG.storageKeys.theme);
    return saved ? JSON.parse(saved) : NLE_CONFIG.defaultTheme;
  }

  /**
   * Define um novo tema
   * @param {Object} theme - Tema a ser aplicado
   * @public
   */
  function setTheme(theme) {
    applyTheme(theme);
    localStorage.setItem(NLE_CONFIG.storageKeys.theme, JSON.stringify(theme));
  }

  /**
   * Reseta o tema para o padrão
   * @public
   */
  function resetTheme() {
    const defaultTheme = NLE_CONFIG.defaultTheme;
    els.cardBgColor.value = defaultTheme.cardBg;
    els.cardBgText.value = defaultTheme.cardBg;
    els.buttonColor.value = defaultTheme.buttonColor;
    els.buttonText.value = defaultTheme.buttonColor;
    els.textColor.value = defaultTheme.textColor;
    els.textColorText.value = defaultTheme.textColor;
    els.cardBorderColor.value = defaultTheme.cardBorderColor;
    els.cardBorderText.value = defaultTheme.cardBorderColor;
    
    applyTheme(defaultTheme);
    localStorage.removeItem(NLE_CONFIG.storageKeys.theme);
    
    showSuccess(NLE_CONFIG.messages.themeReset);
    if (NLE_CONFIG.callbacks.onThemeReset) {
      NLE_CONFIG.callbacks.onThemeReset(defaultTheme);
    }
  }

  /**
   * Define background customizado
   * @param {string} imageUrl - URL da imagem de background
   * @public
   */
  function setBackground(imageUrl) {
    if (els.backgroundContainer) {
      // Modo STRETCH: 100% da tela, sem cortes
      els.backgroundContainer.style.backgroundImage = `url(${imageUrl})`;
      els.backgroundContainer.style.backgroundSize = '100% 100%';
      els.backgroundContainer.style.backgroundPosition = 'top left';
      els.backgroundContainer.style.backgroundRepeat = 'no-repeat';
      
      const storage = window.location.protocol === 'file:' ? sessionStorage : localStorage;
      storage.setItem(NLE_CONFIG.storageKeys.background, imageUrl);
    }
  }

  /**
   * Verifica se está autenticado no painel de temas
   * @returns {boolean}
   * @public
   */
  function isThemeAuthenticated() {
    return state.isThemeAuthenticated;
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  /**
   * Configura todos os event listeners
   * @private
   */
  function setupEventListeners() {
    if (els.essenceLink) {
      els.essenceLink.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    }

    if (els.cancelBtn) {
      els.cancelBtn.addEventListener('click', closeModal);
    }

    if (els.saveThemeBtn) {
      els.saveThemeBtn.addEventListener('click', saveTheme);
    }

    if (els.resetThemeBtn) {
      els.resetThemeBtn.addEventListener('click', resetTheme);
    }

    if (els.modalClose) {
      els.modalClose.addEventListener('click', closeModal);
    }

    if (els.authEmail) {
      els.authEmail.addEventListener('input', validateThemeAuth);
    }

    if (els.authPassword) {
      els.authPassword.addEventListener('input', validateThemeAuth);
    }

    setupColorControls('cardBg');
    setupColorControls('button');
    setupColorControls('text');
    setupColorControls('cardBorder');

    if (els.uploadArea) {
      els.uploadArea.addEventListener('click', () => {
        if (state.isThemeAuthenticated) {
          els.fileInput.click();
        }
      });

      els.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (state.isThemeAuthenticated) {
          els.uploadArea.classList.add('dragover');
        }
      });

      els.uploadArea.addEventListener('dragleave', () => {
        els.uploadArea.classList.remove('dragover');
      });

      els.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        els.uploadArea.classList.remove('dragover');
        if (state.isThemeAuthenticated && e.dataTransfer.files.length) {
          handleFile(e.dataTransfer.files[0]);
        }
      });
    }

    if (els.fileInput) {
      els.fileInput.addEventListener('change', handleFileSelect);
    }

    if (els.removeBtn) {
      els.removeBtn.addEventListener('click', removeFile);
    }

    if (els.saveBtn) {
      els.saveBtn.addEventListener('click', saveBackground);
    }

    if (els.configModal) {
      els.configModal.addEventListener('click', (e) => {
        if (e.target === els.configModal) {
          closeModal();
        }
      });
    }

    if (els.loginForm) {
      els.loginForm.addEventListener('submit', handleSystemLogin);
    }

    // Background controls event listeners
    if (els.backgroundSize) {
      els.backgroundSize.addEventListener('change', updateBackgroundPreview);
    }
    
    if (els.backgroundPosition) {
      els.backgroundPosition.addEventListener('change', updateBackgroundPreview);
    }
    
    if (els.backgroundZoom) {
      els.backgroundZoom.addEventListener('input', updateBackgroundPreview);
    }
    
    if (els.backgroundRepeat) {
      els.backgroundRepeat.addEventListener('change', updateBackgroundPreview);
    }
  }

  // ============================================
  // AUTENTICAÇÃO DO TEMA
  // ============================================

  /**
   * Valida credenciais do painel de temas
   * @private
   */
  function validateThemeAuth() {
    const email = els.authEmail.value;
    const password = els.authPassword.value;
    const authConfig = NLE_CONFIG.authTheme;

    if (email === authConfig.email && password === authConfig.password) {
      state.isThemeAuthenticated = true;
      els.authEmail.disabled = true;
      els.authPassword.disabled = true;
      els.uploadArea.classList.remove('disabled');
      enableThemeControls(true);
      hideError();
      loadThemeToControls();
    } else if (email.length > 0 || password.length > 0) {
      state.isThemeAuthenticated = false;
      els.uploadArea.classList.add('disabled');
      enableThemeControls(false);
    }
  }

  /**
   * Habilita/desabilita controles de tema
   * @param {boolean} enable
   * @private
   */
  function enableThemeControls(enable) {
    const pickers = document.querySelectorAll('.nle-color-picker');
    const texts = document.querySelectorAll('.nle-color-text');
    const eyedroppers = document.querySelectorAll('.nle-eyedropper-btn');
    
    pickers.forEach(p => {
      p.disabled = !enable;
      p.style.opacity = enable ? '1' : '0.5';
      p.style.pointerEvents = enable ? 'auto' : 'none';
    });
    
    texts.forEach(t => {
      t.disabled = !enable;
      t.style.opacity = enable ? '1' : '0.5';
      t.style.pointerEvents = enable ? 'auto' : 'none';
    });
    
    eyedroppers.forEach(e => {
      e.disabled = !enable;
      e.style.opacity = enable ? '1' : '0.5';
      e.style.pointerEvents = enable ? 'auto' : 'none';
    });

    if (els.saveThemeBtn) {
      els.saveThemeBtn.disabled = !enable;
      els.saveThemeBtn.style.opacity = enable ? '1' : '0.5';
      els.saveThemeBtn.style.pointerEvents = enable ? 'auto' : 'none';
    }

    if (els.resetThemeBtn) {
      els.resetThemeBtn.disabled = !enable;
      els.resetThemeBtn.style.opacity = enable ? '1' : '0.5';
      els.resetThemeBtn.style.pointerEvents = enable ? 'auto' : 'none';
    }

    if (els.saveBtn) {
      els.saveBtn.disabled = !enable;
      els.saveBtn.style.opacity = enable ? '1' : '0.5';
      els.saveBtn.style.pointerEvents = enable ? 'auto' : 'none';
    }

    state.themeControlsEnabled = enable;
  }

  /**
   * Carrega tema salvo para os controles visuais
   * @private
   */
  function loadThemeToControls() {
    const saved = localStorage.getItem(NLE_CONFIG.storageKeys.theme);
    if (saved) {
      const theme = JSON.parse(saved);
      
      if (theme.cardBg) {
        els.cardBgColor.value = theme.cardBg;
        els.cardBgText.value = theme.cardBg;
      }
      
      if (theme.buttonColor) {
        els.buttonColor.value = theme.buttonColor;
        els.buttonText.value = theme.buttonColor;
      }
      
      if (theme.textColor) {
        els.textColor.value = theme.textColor;
        els.textColorText.value = theme.textColor;
      }
      
      if (theme.cardBorderColor) {
        els.cardBorderColor.value = theme.cardBorderColor;
        els.cardBorderText.value = theme.cardBorderColor;
      }
    }
  }

  // ============================================
  // AUTENTICAÇÃO DO SISTEMA
  // ============================================

  /**
   * Manipula login do sistema destino
   * @param {Event} e - Evento de submit do formulário
   * @private
   */
  function handleSystemLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('nle-email')?.value;
    const password = document.getElementById('nle-password')?.value;
    const authSystem = NLE_CONFIG.authSystem;

    if (!authSystem.enabled) {
      alert('Sistema de autenticação desabilitado');
      return;
    }

    if (authSystem.customAuth) {
      authSystem.customAuth(email, password, {
        success: (data) => {
          handleLoginSuccess(data);
        },
        error: (msg) => {
          handleLoginError(msg);
        }
      });
    } else {
      fetch(authSystem.endpoint, {
        method: authSystem.method || 'POST',
        headers: authSystem.headers || { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          handleLoginSuccess(data);
        } else {
          handleLoginError(data.message || NLE_CONFIG.messages.loginError);
        }
      })
      .catch(err => {
        handleLoginError(NLE_CONFIG.messages.loginError);
      });
    }
  }

  /**
   * Processa login bem-sucedido
   * @param {Object} data - Dados do usuário
   * @private
   */
  function handleLoginSuccess(data) {
    if (authSystem.storageKey) {
      localStorage.setItem(NLE_CONFIG.authSystem.storageKey, JSON.stringify(data));
    }
    
    if (NLE_CONFIG.callbacks.onLoginSuccess) {
      NLE_CONFIG.callbacks.onLoginSuccess(data);
    }

    const event = new CustomEvent('nle-login-success', { detail: data });
    window.dispatchEvent(event);

    if (NLE_CONFIG.authSystem.redirectSuccess) {
      window.location.href = NLE_CONFIG.authSystem.redirectSuccess;
    }
  }

  /**
   * Processa erro de login
   * @param {string} error - Mensagem de erro
   * @private
   */
  function handleLoginError(error) {
    if (NLE_CONFIG.callbacks.onLoginError) {
      NLE_CONFIG.callbacks.onLoginError(error);
    }

    const event = new CustomEvent('nle-login-error', { detail: { error } });
    window.dispatchEvent(event);
  }

  // ============================================
  // CONTROLES DE COR
  // ============================================

  /**
   * Configura controles de cor (picker + text + eyedropper)
   * @param {string} prefix - Prefixo do controle (cardBg, button, text, cardBorder)
   * @private
   */
  function setupColorControls(prefix) {
    const picker = els[prefix + 'Color'];
    const text = els[prefix + 'Text'];
    const eyedropper = els[prefix + 'Eyedropper'];

    if (picker && text) {
      picker.addEventListener('input', (e) => {
        text.value = e.target.value;
        previewTheme();
      });

      text.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          picker.value = e.target.value;
          previewTheme();
        }
      });
    }

    if (eyedropper) {
      eyedropper.addEventListener('click', async () => {
        if (!state.isThemeAuthenticated) return;
        
        try {
          const eyeDropper = new EyeDropper();
          const result = await eyeDropper.open();
          if (result.sRGBHex) {
            picker.value = result.sRGBHex;
            text.value = result.sRGBHex;
            previewTheme();
          }
        } catch (err) {
          console.log('[NLE] EyeDropper não suportado ou cancelado');
        }
      });
    }
  }

  /**
   * Pré-visualiza tema em tempo real
   * @private
   */
  function previewTheme() {
    const theme = {
      cardBg: els.cardBgColor?.value,
      buttonColor: els.buttonColor?.value,
      textColor: els.textColor?.value,
      cardBorderColor: els.cardBorderColor?.value
    };
    applyTheme(theme);
  }

  /**
   * Salva tema no localStorage
   * @private
   */
  function saveTheme() {
    try {
      const theme = {
        cardBg: els.cardBgColor?.value,
        buttonColor: els.buttonColor?.value,
        textColor: els.textColor?.value,
        cardBorderColor: els.cardBorderColor?.value
      };

      // Verifica se está rodando localmente (file://)
      const isLocalFile = window.location.protocol === 'file:';
      
      if (isLocalFile) {
        // Para ambiente local, usa sessionStorage como fallback
        sessionStorage.setItem(NLE_CONFIG.storageKeys.theme, JSON.stringify(theme));
        console.log('[NLE] Tema salvo no sessionStorage (modo local)');
      } else {
        // Para ambiente web, usa localStorage normalmente
        localStorage.setItem(NLE_CONFIG.storageKeys.theme, JSON.stringify(theme));
      }
      
      showSuccess(NLE_CONFIG.messages.themeSaved);

      if (NLE_CONFIG.callbacks.onThemeSaved) {
        NLE_CONFIG.callbacks.onThemeSaved(theme);
      }

      const event = new CustomEvent('nle-theme-saved', { detail: theme });
      window.dispatchEvent(event);

      setTimeout(closeModal, 1500);
    } catch (error) {
      console.error('[NLE] Erro ao salvar tema:', error);
      showError('Erro ao salvar tema. Tente novamente.');
    }
  }

  // ============================================
  // UPLOAD DE ARQUIVO
  // ============================================

  /**
   * Manipula seleção de arquivo
   * @param {Event} e - Evento change
   * @private
   */
  function handleFileSelect(e) {
    if (e.target.files.length) {
      handleFile(e.target.files[0]);
    }
  }

  /**
   * Processa arquivo selecionado
   * @param {File} file - Arquivo a processar
   * @private
   */
  function handleFile(file) {
    const limits = NLE_CONFIG.limits;

    if (!limits.allowedImageTypes.includes(file.type)) {
      showError(NLE_CONFIG.messages.invalidFile);
      return;
    }

    if (file.size > limits.maxImageSize) {
      showError(NLE_CONFIG.messages.fileTooLarge);
      return;
    }

    state.selectedFile = file;
    const reader = new FileReader();

    reader.onload = (e) => {
      if (els.previewImage) els.previewImage.src = e.target.result;
      if (els.fileName) els.fileName.textContent = file.name;
      if (els.previewContainer) els.previewContainer.classList.add('active');
      
      // Initialize background controls
      loadBackgroundSettings();
      updateBackgroundPreview();
    };

    reader.readAsDataURL(file);
  }

  /**
   * Remove arquivo selecionado
   * @private
   */
  function removeFile() {
    state.selectedFile = null;
    if (els.fileInput) els.fileInput.value = '';
    if (els.previewContainer) els.previewContainer.classList.remove('active');
  }

  /**
   * Salva background no localStorage
   * @private
   */
  function saveBackground() {
    if (!state.selectedFile) return;

    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const base64 = e.target.result;
          
          const isLocalFile = window.location.protocol === 'file:';
          const storage = isLocalFile ? sessionStorage : localStorage;
          
          storage.setItem(NLE_CONFIG.storageKeys.background, base64);
          
          if (els.backgroundContainer) {
            // Modo STRETCH: 100% da tela, sem cortes
            els.backgroundContainer.style.backgroundImage = `url(${base64})`;
            els.backgroundContainer.style.backgroundSize = '100% 100%';
            els.backgroundContainer.style.backgroundPosition = 'top left';
            els.backgroundContainer.style.backgroundRepeat = 'no-repeat';
          }
          
          saveBackgroundSettings();
          
          showSuccess(NLE_CONFIG.messages.themeSaved);
          setTimeout(closeModal, 1500);
        } catch (error) {
          console.error('[NLE] Erro ao processar background:', error);
          showError('Erro ao salvar background. Tente novamente.');
        }
      };

      reader.onerror = () => {
        console.error('[NLE] Erro ao ler arquivo');
        showError('Erro ao ler arquivo. Tente novamente.');
      };

      reader.readAsDataURL(state.selectedFile);
    } catch (error) {
      console.error('[NLE] Erro ao salvar background:', error);
      showError('Erro ao salvar background. Tente novamente.');
    }
  }

  /**
   * Atualiza preview do background com configurações atuais
   * @private
   */
  function updateBackgroundPreview() {
    if (!els.previewImage || !els.previewViewport) return;
    
    const selectedSize = els.backgroundSize?.value || '100% 100%';
    
    // Detectar modo STRETCH (100% 100%)
    const isStretchMode = selectedSize === '100% 100%';
    
    // Forçar stretch mode
    state.backgroundSettings.stretch = true;
    
    // Modo STRETCH - preenche 100% da tela
    const size = isStretchMode ? '100% 100%' : selectedSize;
    const position = isStretchMode ? 'top left' : (els.backgroundPosition?.value || 'center center');
    const zoom = isStretchMode ? 100 : (els.backgroundZoom?.value || 100);
    const repeat = isStretchMode ? 'no-repeat' : state.backgroundSettings.repeat;
    
    // Update state
    state.backgroundSettings = { 
      ...state.backgroundSettings, 
      size, 
      position, 
      zoom, 
      repeat,
      stretch: true
    };
    
    // Update preview viewport
    els.previewViewport.style.backgroundSize = size;
    els.previewViewport.style.backgroundPosition = position;
    els.previewViewport.style.backgroundRepeat = repeat;
    els.previewViewport.style.backgroundImage = els.previewImage.src ? `url(${els.previewImage.src})` : 'none';
    
    // Update zoom value display
    if (els.zoomValue) {
      els.zoomValue.textContent = isStretchMode ? 'STRETCH' : `${zoom}%`;
    }
    
    // Hide preview image since we're using background
    els.previewImage.style.display = 'none';
  }

  /**
   * Carrega configurações do background
   * @private
   */
  function loadBackgroundSettings() {
    try {
      const isLocalFile = window.location.protocol === 'file:';
      const storage = isLocalFile ? sessionStorage : localStorage;
      
      let saved = storage.getItem('nle_background_settings');
      
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          state.backgroundSettings = { 
            size: '100% 100%',
            position: 'top left',
            zoom: 100,
            repeat: 'no-repeat',
            stretch: true,
            ...settings,
            stretch: true // Sempre forçar stretch
          };
          
          // Update controls
          if (els.backgroundSize) els.backgroundSize.value = 'stretch';
          if (els.backgroundPosition) els.backgroundPosition.value = 'top left';
          if (els.backgroundZoom) els.backgroundZoom.value = 100;
          if (els.backgroundRepeat) els.backgroundRepeat.value = 'no-repeat';
          
          // Aplicar stretch ao container
          if (els.backgroundContainer) {
            els.backgroundContainer.style.backgroundSize = '100% 100%';
            els.backgroundContainer.style.backgroundPosition = 'top left';
            els.backgroundContainer.style.backgroundRepeat = 'no-repeat';
          }
        } catch (parseError) {
          console.log('[NLE] Erro ao parsear configurações, usando padrão');
        }
      }
    } catch (error) {
      console.log('[NLE] Erro ao carregar configurações do background, usando padrão');
    }
  }

  /**
   * Salva configurações do background
   * @private
   */
  function saveBackgroundSettings() {
    try {
      const isLocalFile = window.location.protocol === 'file:';
      
      if (isLocalFile) {
        try {
          sessionStorage.setItem('nle_background_settings', JSON.stringify(state.backgroundSettings));
        } catch (e) {
          console.log('[NLE] SessionStorage não disponível para salvar configurações');
        }
      } else {
        try {
          localStorage.setItem('nle_background_settings', JSON.stringify(state.backgroundSettings));
        } catch (e) {
          console.log('[NLE] LocalStorage não disponível para salvar configurações');
        }
      }
    } catch (error) {
      console.log('[NLE] Erro ao salvar configurações do background:', error);
    }
  }

  // ============================================
  // MODAL
  // ============================================

  /**
   * Abre o modal de configuração
   * @public
   */
  function openModal() {
    if (els.configModal) {
      els.configModal.classList.add('active');
      resetModal();
    }
  }

  /**
   * Fecha o modal de configuração
   * @public
   */
  function closeModal() {
    if (els.configModal) {
      els.configModal.classList.remove('active');
      resetModal();
    }
  }

  /**
   * Reseta estado do modal
   * @private
   */
  function resetModal() {
    state.isThemeAuthenticated = false;
    state.selectedFile = null;
    state.themeControlsEnabled = false;

    if (els.authEmail) {
      els.authEmail.value = '';
      els.authEmail.disabled = false;
    }
    if (els.authPassword) {
      els.authPassword.value = '';
      els.authPassword.disabled = false;
    }
    if (els.uploadArea) {
      els.uploadArea.classList.add('disabled');
    }
    if (els.previewContainer) {
      els.previewContainer.classList.remove('active');
    }

    enableThemeControls(false);
    hideError();
    hideSuccess();
  }

  // ============================================
  // FEEDBACK
  // ============================================

  /**
   * Exibe mensagem de erro
   * @param {string} message
   * @private
   */
  function showError(message) {
    if (els.errorMessage) {
      els.errorMessage.textContent = message;
      els.errorMessage.classList.add('active');
    }
    if (els.successMessage) {
      els.successMessage.classList.remove('active');
    }
  }

  /**
   * Oculta mensagem de erro
   * @private
   */
  function hideError() {
    if (els.errorMessage) {
      els.errorMessage.classList.remove('active');
    }
  }

  /**
   * Exibe mensagem de sucesso
   * @param {string} message
   * @private
   */
  function showSuccess(message) {
    if (els.successMessage) {
      els.successMessage.textContent = message;
      els.successMessage.classList.add('active');
    }
    if (els.errorMessage) {
      els.errorMessage.classList.remove('active');
    }
  }

  /**
   * Oculta mensagem de sucesso
   * @private
   */
  function hideSuccess() {
    if (els.successMessage) {
      els.successMessage.classList.remove('active');
    }
  }

  // ============================================
  // API PÚBLICA
  // ============================================
  return {
    init,
    openModal,
    closeModal,
    resetTheme,
    setTheme,
    getTheme,
    setBackground,
    isThemeAuthenticated
  };
})();

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', NLE.init);
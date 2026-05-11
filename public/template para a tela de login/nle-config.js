/**
 * NLE LOGIN PLUGIN - CONFIGURAÇÕES CENTRALIZADAS
 * ================================================
 * Edite apenas este arquivo para personalizar o plugin.
 * Não é necessário editar nle-styles.css ou nle-script.js.
 */

const NLE_CONFIG = {

  // ============================================
  // AUTH DA INTERFACE DE TEMAS
  // Protege o acesso ao painel de customização
  // ============================================
  authTheme: {
    email: 'interface@nordestelocacoes.com.br',
    password: '12Nordeste34+'
  },

  // ============================================
  // AUTH DO SISTEMA DESTINO
  // Autenticação que será usada no login
  // ============================================
  authSystem: {
    enabled: true,
    endpoint: '/api/login',
    method: 'POST',
    redirectSuccess: '/dashboard.html',
    storageKey: 'nle_user_logged',
    headers: {
      'Content-Type': 'application/json'
    },
    customAuth: null
  },

  // ============================================
  // CHAVES DE ARMAZENAMENTO LOCAL
  // ============================================
  storageKeys: {
    theme: 'nle_theme_config',
    background: 'nle_background_image'
  },

  // ============================================
  // TEMA PADRÃO (Fallback)
  // ============================================
  defaultTheme: {
    cardBg: '#ffffff',
    buttonColor: '#b91c1c',
    textColor: '#374151',
    cardBorderColor: '#b91c1c'
  },

  // ============================================
  // CALLBACKS (Eventos)
  // ============================================
  callbacks: {
    onLoginSuccess: null,
    onLoginError: null,
    onThemeSaved: null,
    onThemeReset: null
  },

  // ============================================
  // CONFIGURAÇÕES VISUAIS
  // ============================================
  visual: {
    logoPath: 'LOGO COLORIDA.png',
    showEssencePanel: true,
    showInstitutional: true,
    institutionalTitle: 'Nossa Essência',
    footerText: '© 2026 Nordeste Locações - Todos os direitos reservados'
  },

  // ============================================
  // MENSAGENS E TEXTOS
  // ============================================
  messages: {
    loginSuccess: 'Login realizado com sucesso!',
    loginError: 'Credenciais incorretas.',
    themeSaved: 'Configurações salvas com sucesso!',
    themeReset: 'Tema redefinido para o padrão.',
    invalidFile: 'Por favor, selecione uma imagem válida (JPG, PNG ou WebP).',
    fileTooLarge: 'A imagem deve ter no máximo 5MB.',
    authThemeError: 'Credenciais de acesso incorretas.'
  },

  // ============================================
  // LIMITAÇÕES
  // ============================================
  limits: {
    maxImageSize: 5 * 1024 * 1024,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
  }
};
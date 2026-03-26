/**
 * auth-modal.js — 注册/登录弹窗模块（支持 i18n）
 */

let authModal = null;
let authModalOverlay = null;
let authMode = 'login'; // 'login' | 'register'

// i18n 辅助函数
function t(key, fallback) {
  if (window.I18N && typeof window.I18N.getI18n === 'function') {
    const result = window.I18N.getI18n(key);
    return result || fallback || key;
  }
  return fallback || key;
}

// 等待 i18n 初始化完成
async function waitForI18n(timeoutMs = 3000) {
  const start = Date.now();
  while (!window.I18N || !window.I18N.getI18n) {
    if (Date.now() - start > timeoutMs) {
      console.warn('[Auth] i18n initialization timeout');
      return false;
    }
    await new Promise(r => setTimeout(r, 50));
  }
  return true;
}

function createAuthModal() {
  // 如果已存在，不再创建
  if (document.getElementById('authModal')) return;

  // 创建遮罩层
  authModalOverlay = document.createElement('div');
  authModalOverlay.id = 'authModalOverlay';
  authModalOverlay.className = 'auth-modal-overlay';
  authModalOverlay.addEventListener('click', (e) => {
    if (e.target === authModalOverlay) closeAuthModal();
  });

  // 创建弹窗
  authModal = document.createElement('div');
  authModal.id = 'authModal';
  authModal.className = 'auth-modal';
  authModal.innerHTML = getAuthModalHTML();

  document.body.appendChild(authModalOverlay);
  document.body.appendChild(authModal);

  // 绑定事件
  bindAuthModalEvents();

  // 初始应用翻译
  updateAuthModalUI();
}

function getAuthModalHTML() {
  return `
    <div class="auth-modal__close" id="authModalClose">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>

    <div class="auth-modal__header">
      <h2 class="auth-modal__title" id="authModalTitle" data-i18n="auth.login_title">${t('auth.login_title', '登录')}</h2>
      <p class="auth-modal__subtitle" id="authModalSubtitle" data-i18n="auth.login_subtitle">${t('auth.login_subtitle', '登录后解锁无限次占卜')}</p>
    </div>

    <form class="auth-modal__form" id="authForm">
      <div class="auth-modal__field">
        <label class="auth-modal__label" id="authEmailLabel" data-i18n="auth.email_label">${t('auth.email_label', '邮箱')}</label>
        <input
          type="email"
          id="authEmail"
          class="auth-modal__input"
          placeholder="${t('auth.email_placeholder', 'your@email.com')}"
          required
          autocomplete="email"
        >
      </div>

      <div class="auth-modal__field">
        <label class="auth-modal__label" id="authPasswordLabel" data-i18n="auth.password_label">${t('auth.password_label', '密码')}</label>
        <input
          type="password"
          id="authPassword"
          class="auth-modal__input"
          placeholder="${t('auth.password_placeholder', '输入密码')}"
          required
          minlength="6"
          autocomplete="current-password"
        >
      </div>

      <div class="auth-modal__field auth-modal__field--register" id="confirmPasswordField" style="display: none;">
        <label class="auth-modal__label" id="authConfirmPasswordLabel" data-i18n="auth.confirm_password_label">${t('auth.confirm_password_label', '确认密码')}</label>
        <input
          type="password"
          id="authConfirmPassword"
          class="auth-modal__input"
          placeholder="${t('auth.confirm_password_placeholder', '再次输入密码')}"
          minlength="6"
          autocomplete="new-password"
        >
      </div>

      <div class="auth-modal__error" id="authError" style="display: none;"></div>

      <button type="submit" class="auth-modal__submit" id="authSubmitBtn">
        <span id="authSubmitText">${t('auth.login_btn', '登录')}</span>
        <span class="auth-modal__spinner" id="authSpinner" style="display: none;">
          <svg class="spinner" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4"/>
          </svg>
        </span>
      </button>
    </form>

    <div class="auth-modal__footer">
      <span id="authFooterText" data-i18n="auth.no_account_yet">${t('auth.no_account_yet', '还没有账号？')}</span>
      <a href="#" id="authSwitchBtn" data-i18n="auth.switch_to_register">${t('auth.switch_to_register', '立即注册')}</a>
    </div>
  `;
}

function bindAuthModalEvents() {
  // 关闭按钮
  document.getElementById('authModalClose').addEventListener('click', closeAuthModal);

  // 表单提交
  document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);

  // 切换登录/注册
  document.getElementById('authSwitchBtn').addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthMode();
  });

  // ESC 键关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authModal?.classList.contains('active')) {
      closeAuthModal();
    }
  });
}

function toggleAuthMode() {
  authMode = authMode === 'login' ? 'register' : 'login';
  updateAuthModalUI();
}

function updateAuthModalUI() {
  const title = document.getElementById('authModalTitle');
  const subtitle = document.getElementById('authModalSubtitle');
  const submitText = document.getElementById('authSubmitText');
  const footerText = document.getElementById('authFooterText');
  const switchBtn = document.getElementById('authSwitchBtn');
  const confirmField = document.getElementById('confirmPasswordField');
  const passwordInput = document.getElementById('authPassword');
  const emailLabel = document.getElementById('authEmailLabel');
  const passwordLabel = document.getElementById('authPasswordLabel');
  const confirmPasswordLabel = document.getElementById('authConfirmPasswordLabel');

  if (authMode === 'login') {
    // 登录模式
    title.textContent = t('auth.login_title', '登录');
    title.dataset.i18n = 'auth.login_title';
    subtitle.textContent = t('auth.login_subtitle', '登录后解锁无限次占卜');
    subtitle.dataset.i18n = 'auth.login_subtitle';
    submitText.textContent = t('auth.login_btn', '登录');
    footerText.textContent = t('auth.no_account_yet', '还没有账号？');
    footerText.dataset.i18n = 'auth.no_account_yet';
    switchBtn.textContent = t('auth.switch_to_register', '立即注册');
    switchBtn.dataset.i18n = 'auth.switch_to_register';
    confirmField.style.display = 'none';
    passwordInput.placeholder = t('auth.password_placeholder', '输入密码');
    passwordInput.removeAttribute('minlength');
    passwordInput.setAttribute('minlength', '6');
    passwordInput.setAttribute('autocomplete', 'current-password');
  } else {
    // 注册模式
    title.textContent = t('auth.register_title', '注册');
    title.dataset.i18n = 'auth.register_title';
    subtitle.textContent = t('auth.register_subtitle', '注册后解锁每日免费占卜');
    subtitle.dataset.i18n = 'auth.register_subtitle';
    submitText.textContent = t('auth.signup_btn', '注册');
    footerText.textContent = t('auth.has_account', '已有账号？');
    footerText.dataset.i18n = 'auth.has_account';
    switchBtn.textContent = t('auth.switch_to_login', '立即登录');
    switchBtn.dataset.i18n = 'auth.switch_to_login';
    confirmField.style.display = 'block';
    passwordInput.placeholder = t('auth.confirm_password_placeholder', '再次输入密码');
    passwordInput.setAttribute('minlength', '6');
    passwordInput.setAttribute('autocomplete', 'new-password');
  }

  // 更新 label
  if (emailLabel) {
    emailLabel.textContent = t('auth.email_label', '邮箱');
    emailLabel.dataset.i18n = 'auth.email_label';
  }
  if (passwordLabel) {
    passwordLabel.textContent = t('auth.password_label', '密码');
    passwordLabel.dataset.i18n = 'auth.password_label';
  }
  if (confirmPasswordLabel) {
    confirmPasswordLabel.textContent = t('auth.confirm_password_label', '确认密码');
    confirmPasswordLabel.dataset.i18n = 'auth.confirm_password_label';
  }

  // 清空错误
  hideAuthError();
}

async function handleAuthSubmit(e) {
  e.preventDefault();

  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const confirmPassword = document.getElementById('authConfirmPassword')?.value;

  // 验证
  if (!email || !password) {
    showAuthError(t('auth.fill_all_fields', '请填写所有字段'));
    return;
  }

  if (authMode === 'register') {
    if (password !== confirmPassword) {
      showAuthError(t('auth.passwords_not_match', '两次输入的密码不一致'));
      return;
    }
    if (password.length < 6) {
      showAuthError(t('auth.password_min_length', '密码至少需要6位'));
      return;
    }
  }

  // 显示加载状态
  setAuthLoading(true);
  hideAuthError();

  try {
    const { data, error } = authMode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      showAuthError(error.message);
    } else {
      if (authMode === 'register') {
        // 注册成功
        showToast(t('auth.registration_success', '注册成功！请查收验证邮件'), 'success');
      } else {
        // 登录成功
        showToast(t('auth.login_success', '登录成功！'), 'success');
      }
      closeAuthModal();
    }
  } catch (err) {
    showAuthError(t('auth.network_error', '网络错误，请稍后重试'));
    console.error('[Auth] Submit error:', err);
  } finally {
    setAuthLoading(false);
  }
}

function showAuthError(message) {
  const errorEl = document.getElementById('authError');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

function hideAuthError() {
  const errorEl = document.getElementById('authError');
  errorEl.style.display = 'none';
}

function setAuthLoading(loading) {
  const btn = document.getElementById('authSubmitBtn');
  const text = document.getElementById('authSubmitText');
  const spinner = document.getElementById('authSpinner');

  btn.disabled = loading;
  text.style.display = loading ? 'none' : 'inline';
  spinner.style.display = loading ? 'inline-flex' : 'none';
}

async function openAuthModal(mode = 'login') {
  // 确保 i18n 已初始化
  await waitForI18n();
  authMode = mode;
  createAuthModal();

  // 清空表单
  document.getElementById('authEmail').value = '';
  document.getElementById('authPassword').value = '';
  const confirmEl = document.getElementById('authConfirmPassword');
  if (confirmEl) confirmEl.value = '';
  hideAuthError();

  // 显示弹窗
  authModalOverlay.classList.add('active');
  authModal.classList.add('active');
  document.body.style.overflow = 'hidden'; // 防止背景滚动

  // 聚焦邮箱输入框
  setTimeout(() => document.getElementById('authEmail').focus(), 100);
}

function closeAuthModal() {
  if (authModalOverlay) authModalOverlay.classList.remove('active');
  if (authModal) authModal.classList.remove('active');
  document.body.style.overflow = '';
}

// 语言切换时更新弹窗文字
document.addEventListener('locale-change', () => {
  if (document.getElementById('authModal')) {
    updateAuthModalUI();
  }
});

// 暴露到全局
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;

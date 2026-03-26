/**
 * auth-modal.js — 注册/登录弹窗模块
 */

let authModal = null;
let authModalOverlay = null;
let authMode = 'login'; // 'login' | 'register'

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
}

function getAuthModalHTML() {
  return `
    <div class="auth-modal__close" id="authModalClose">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>

    <div class="auth-modal__header">
      <h2 class="auth-modal__title" id="authModalTitle">登录</h2>
      <p class="auth-modal__subtitle" id="authModalSubtitle">登录后解锁无限次占卜</p>
    </div>

    <form class="auth-modal__form" id="authForm">
      <div class="auth-modal__field">
        <label class="auth-modal__label" for="authEmail">邮箱</label>
        <input
          type="email"
          id="authEmail"
          class="auth-modal__input"
          placeholder="your@email.com"
          required
          autocomplete="email"
        >
      </div>

      <div class="auth-modal__field">
        <label class="auth-modal__label" for="authPassword">密码</label>
        <input
          type="password"
          id="authPassword"
          class="auth-modal__input"
          placeholder="••••••••"
          required
          minlength="6"
          autocomplete="${authMode === 'register' ? 'new-password' : 'current-password'}"
        >
      </div>

      <div class="auth-modal__field auth-modal__field--register" id="confirmPasswordField" style="display: none;">
        <label class="auth-modal__label" for="authConfirmPassword">确认密码</label>
        <input
          type="password"
          id="authConfirmPassword"
          class="auth-modal__input"
          placeholder="再次输入密码"
          minlength="6"
          autocomplete="new-password"
        >
      </div>

      <div class="auth-modal__error" id="authError" style="display: none;"></div>

      <button type="submit" class="auth-modal__submit" id="authSubmitBtn">
        <span id="authSubmitText">登录</span>
        <span class="auth-modal__spinner" id="authSpinner" style="display: none;">
          <svg class="spinner" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4"/>
          </svg>
        </span>
      </button>
    </form>

    <div class="auth-modal__footer">
      <span id="authFooterText">还没有账号？</span>
      <a href="#" id="authSwitchBtn">立即注册</a>
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

  if (authMode === 'login') {
    title.textContent = '登录';
    subtitle.textContent = '登录后解锁无限次占卜';
    submitText.textContent = '登录';
    footerText.textContent = '还没有账号？';
    switchBtn.textContent = '立即注册';
    confirmField.style.display = 'none';
    passwordInput.placeholder = '输入密码';
    passwordInput.removeAttribute('minlength');
    document.getElementById('authPassword').setAttribute('minlength', '6');
    document.getElementById('authPassword').setAttribute('autocomplete', 'current-password');
  } else {
    title.textContent = '注册';
    subtitle.textContent = '注册后解锁每日免费占卜';
    submitText.textContent = '注册';
    footerText.textContent = '已有账号？';
    switchBtn.textContent = '立即登录';
    confirmField.style.display = 'block';
    passwordInput.placeholder = '至少6位密码';
    passwordInput.setAttribute('minlength', '6');
    passwordInput.setAttribute('autocomplete', 'new-password');
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
    showAuthError('请填写所有字段');
    return;
  }

  if (authMode === 'register') {
    if (password !== confirmPassword) {
      showAuthError('两次输入的密码不一致');
      return;
    }
    if (password.length < 6) {
      showAuthError('密码至少需要6位');
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
        showToast('注册成功！请查收验证邮件', 'success');
      } else {
        showToast('登录成功！', 'success');
      }
      closeAuthModal();
    }
  } catch (err) {
    showAuthError('网络错误，请稍后重试');
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

function openAuthModal(mode = 'login') {
  authMode = mode;
  createAuthModal();
  updateAuthModalUI();

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

// 暴露到全局
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;

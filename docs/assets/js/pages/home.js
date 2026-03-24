/**
 * pages/home.js — 首页逻辑
 */

document.addEventListener('DOMContentLoaded', () => {
  initHomePage();
});

function initHomePage() {
  // 监听语言切换事件
  window.addEventListener('locale-change', updateLangButtons);
  // 立即更新一次按钮状态（initI18n 已触发 locale-change，但可能先于本监听器注册）
  requestAnimationFrame(() => updateLangButtons());

  // 登录按钮（未来接入 Firebase Auth）
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLoginClick);
  }

  // Auth 状态变化监听
  window.addEventListener('auth-change', ({ detail }) => {
    updateLoginButton(detail.user);
  });
}

function updateLangButtons() {
  const locale = window.I18N?.getCurrentLocale() || APP_STATE?.locale || 'zh';
  document.querySelectorAll('[data-lang-switch]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.langSwitch === locale);
  });
}

function handleLoginClick(e) {
  e.preventDefault();
  if (window.FirebaseService?.showLoginModal) {
    window.FirebaseService.showLoginModal();
  } else {
    // 临时提示
    showToast('Firebase 登录功能即将上线，敬请期待 ✨', 'info');
  }
}

function updateLoginButton(user) {
  const loginBtn = document.getElementById('loginBtn');
  if (!loginBtn) return;

  if (user) {
    loginBtn.textContent = user.displayName || '我的';
    loginBtn.href = '#profile';
    loginBtn.classList.remove('btn-ghost');
    loginBtn.classList.add('btn-secondary');
  } else {
    const label = window.I18N?.getI18n('nav.login') || '登录';
    loginBtn.textContent = label;
    loginBtn.href = '#';
    loginBtn.classList.add('btn-ghost');
    loginBtn.classList.remove('btn-secondary');
  }
}

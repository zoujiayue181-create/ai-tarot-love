/**
 * main.js — 全局初始化与工具函数
 */

// ============================================
// 全局状态
// ============================================
window.APP_STATE = {
  user: null,        // Firebase 用户对象
  plan: 'free',      // 'free' | 'premium'
  locale: 'zh',      // 'zh' | 'en'
  isLoading: false,
};

// ============================================
// 初始化
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // i18n 初始化由 i18n.js 负责（initI18n 在脚本加载时自动调用）
  // 等待 i18n 就绪后同步 APP_STATE.locale
  const saved = localStorage.getItem('tarot-locale');
  if (saved) {
    APP_STATE.locale = saved;
  } else {
    const browserLang = navigator.language.toLowerCase();
    APP_STATE.locale = browserLang.startsWith('zh') ? 'zh' : 'en';
  }

  initTheme();
  bindGlobalEvents();
  checkAuthState();
});

/**
 * 切换语言
 */
async function switchLanguage(locale) {
  // 调用 i18n 模块的 setLocale，它会加载语言数据并应用翻译
  await window.I18N.setLocale(locale);
  APP_STATE.locale = locale;

  // 触发语言切换事件（供各页面监听）
  window.dispatchEvent(new CustomEvent('lang-change', { detail: { locale } }));
}

/**
 * 初始化主题
 */
function initTheme() {
  // 目前只有暗色主题，未来可扩展
  document.documentElement.setAttribute('data-theme', 'dark');
}

/**
 * 绑定全局事件
 */
function bindGlobalEvents() {
  // 语言切换按钮
  document.addEventListener('click', (e) => {
    const langBtn = e.target.closest('[data-lang-switch]');
    if (langBtn) {
      const targetLang = langBtn.getAttribute('data-lang-switch');
      switchLanguage(targetLang);
    }
  });

  // 加载状态提示
  window.addEventListener('online', () => {
    showToast('网络已恢复', 'success');
  });
  window.addEventListener('offline', () => {
    showToast('网络已断开，部分功能可能无法使用', 'warning');
  });
}

// ============================================
// Firebase Auth 状态监听
// ============================================
function checkAuthState() {
  // Firebase 将在 firebase.js 中初始化并调用此函数
  // 这里只是预留的占位，实际实现在 services/firebase.js
  if (window.FirebaseService) {
    window.FirebaseService.onAuthStateChange(handleAuthChange);
  }
}

function handleAuthChange(user) {
  APP_STATE.user = user;
  if (user) {
    APP_STATE.plan = user.plan || 'free';
  } else {
    APP_STATE.plan = 'free';
  }
  // 通知所有页面更新 UI
  window.dispatchEvent(new CustomEvent('auth-change', {
    detail: { user, plan: APP_STATE.plan }
  }));
}

// ============================================
// 全局工具函数
// ============================================

/**
 * 显示 Toast 提示
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number} duration - 显示时长（ms）
 */
function showToast(message, type = 'info', duration = 3000) {
  // 避免重复创建
  let existing = document.getElementById('toast-container');
  if (!existing) {
    existing = document.createElement('div');
    existing.id = 'toast-container';
    existing.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(existing);
  }

  const toast = document.createElement('div');
  const colors = {
    success: '#7BC9A6',
    error:   '#E07B7B',
    warning: '#E8C85A',
    info:    '#6B4C9A',
  };
  toast.style.cssText = `
    background: ${colors[type]};
    color: #1A0F2E;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    animation: toastIn 300ms ease;
    pointer-events: auto;
  `;
  toast.textContent = message;
  existing.appendChild(toast);

  // 动画样式
  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = `
      @keyframes toastIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      @keyframes toastOut { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(10px); } }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    toast.style.animation = 'toastOut 300ms ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * 显示全屏加载遮罩
 * @param {boolean} show
 */
function showLoading(show) {
  let overlay = document.getElementById('loading-overlay');

  if (show) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(26, 15, 46, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9998;
        backdrop-filter: blur(4px);
      `;
      overlay.innerHTML = `
        <div style="text-align:center">
          <div style="
            width:40px;height:40px;
            border:3px solid rgba(212,175,55,0.2);
            border-top-color:#D4AF37;
            border-radius:50%;
            animation:spin 800ms linear infinite;
            margin:0 auto 16px;
          "></div>
          <p style="color:#C9B8D9;font-size:14px">星辰正在解读...</p>
        </div>
      `;
      const style = document.createElement('style');
      style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
    APP_STATE.isLoading = true;
  } else {
    if (overlay) overlay.style.display = 'none';
    APP_STATE.isLoading = false;
  }
}

/**
 * 获取查询参数
 * @param {string} name
 */
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * 跳转到登录弹窗（Freemium 限制提示）
 */
function promptLogin(message) {
  showToast(message || '请先登录后体验完整功能', 'info');
  // 触发登录弹窗（具体实现由 firebase.js 提供）
  if (window.FirebaseService?.showLoginModal) {
    window.FirebaseService.showLoginModal();
  }
}

/**
 * Freemium 限制提示
 */
function showFreemiumLimit(feature) {
  showToast(`今日免费次数已用完。升级 Premium 解锁 ${feature} 无限次`, 'info');
  // 可选：弹出升级提示
}

// ============================================
// 暴露到全局
// ============================================
window.showToast = showToast;
window.showLoading = showLoading;
window.getQueryParam = getQueryParam;
window.promptLogin = promptLogin;
window.showFreemiumLimit = showFreemiumLimit;
window.switchLanguage = switchLanguage;

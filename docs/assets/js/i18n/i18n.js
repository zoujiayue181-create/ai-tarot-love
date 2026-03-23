/**
 * i18n/i18n.js — 国际化加载器
 */

const LOCALE_DATA = {
  zh: null, // 动态加载
  en: null,
};

// 当前语言
let currentLocale = 'zh';
let dataLoaded = false;

/**
 * 初始化 i18n，加载语言数据
 * @returns {Promise<void>}
 */
async function initI18n() {
  const locale = getInitialLocale();
  await loadLocale(locale);
  window.I18N_DATA = LOCALE_DATA[locale];
  currentLocale = locale;
  dataLoaded = true;
}

/**
 * 获取初始语言（优先 localStorage，其次浏览器语言）
 */
function getInitialLocale() {
  const saved = localStorage.getItem('tarot-locale');
  // 检查 saved 是否是有效的 locale key（不能只检查 LOCALE_DATA[saved] 的真值，因为初始化时是 null）
  if (saved && saved in LOCALE_DATA) return saved;

  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('zh')) return 'zh';
  return 'en';
}

/**
 * 加载指定语言的数据
 * @param {string} locale
 */
async function loadLocale(locale) {
  if (LOCALE_DATA[locale]) return; // 已有缓存

  try {
    // 根据当前页面路径计算相对路径
    const basePath = getBasePath();
    const response = await fetch(`${basePath}assets/js/i18n/${locale}.json`);
    if (!response.ok) throw new Error(`Failed to load ${locale} translations`);
    LOCALE_DATA[locale] = await response.json();
  } catch (err) {
    console.error(`[i18n] Failed to load ${locale}:`, err);
    // 回退到内联备用数据
    LOCALE_DATA[locale] = getInlineFallback(locale);
  }
}

/**
 * 获取基础路径（兼容 GitHub Pages 多层路径）
 */
function getBasePath() {
  const pathname = window.location.pathname;
  // 如果在子目录，向上取目录
  const depth = pathname.split('/').filter(Boolean).length - 1;
  if (depth === 0) return '/';
  return '../'.repeat(depth);
}

/**
 * 切换语言
 * @param {string} locale
 */
async function setLocale(locale) {
  if (locale === currentLocale) return;
  await loadLocale(locale);
  currentLocale = locale;
  LOCALE_DATA[locale] = LOCALE_DATA[locale];
  window.I18N_DATA = LOCALE_DATA[locale];
  localStorage.setItem('tarot-locale', locale);
  APP_STATE.locale = locale;
  applyTranslations();
  window.dispatchEvent(new CustomEvent('locale-change', { detail: { locale } }));
}

/**
 * 应用翻译到所有带有 data-i18n 属性的元素
 */
function applyTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = getI18n(key);
    if (translation) {
      if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = translation;
      } else {
        el.textContent = translation;
      }
    }
  });

  // 更新 HTML lang 属性
  document.documentElement.lang = currentLocale;
}

/**
 * 获取翻译
 * @param {string} key - 形如 "home.hero_title"
 */
function getI18n(key) {
  if (!window.I18N_DATA) return key;
  const keys = key.split('.');
  let value = window.I18N_DATA;
  for (const k of keys) {
    value = value?.[k];
  }
  return value ?? key;
}

/**
 * 备用内联数据（网络失败时使用）
 */
function getInlineFallback(locale) {
  if (locale === 'zh') {
    return {
      meta: { lang: 'zh', name: '简体中文' },
      nav: { home: '首页', single_draw: '单牌占卜', three_card: '三牌占卜', blog: '博客', login: '登录', logout: '退出登录' },
      home: { hero_title: '你的感情困惑，星辰懂你', hero_cta: '开始今日占卜', features_title: '星辰能为你做什么', footer: { copyright: '© 2026 星辰 AI 塔罗' } },
      common: { loading: '加载中...', error: '出错了，请稍后重试' }
    };
  }
  return {
    meta: { lang: 'en', name: 'English' },
    nav: { home: 'Home', single_draw: 'Single Card', three_card: 'Three Card', blog: 'Blog', login: 'Login', logout: 'Logout' },
    home: { hero_title: 'Your Love Questions, Understood by Stardust', hero_cta: "Start Today's Reading", features_title: 'What Can Stardust Do For You', footer: { copyright: '© 2026 Stardust AI Tarot' } },
    common: { loading: 'Loading...', error: 'Something went wrong, please try again' }
  };
}

// ============================================
// 初始化并暴露到全局
// ============================================
initI18n().then(() => {
  if (typeof applyTranslations === 'function') {
    applyTranslations();
  }
});

window.I18N = {
  setLocale,
  getI18n,
  getCurrentLocale: () => currentLocale,
};

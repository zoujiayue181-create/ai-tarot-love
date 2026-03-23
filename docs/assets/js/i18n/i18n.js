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
  // 页面加载时立即应用翻译
  applyTranslations();
}

/**
 * 获取初始语言（优先 localStorage，其次浏览器语言）
 */
function getInitialLocale() {
  const saved = localStorage.getItem('tarot-locale');
  // 检查 saved 是否是有效的 locale key
  if (saved && saved in LOCALE_DATA) return saved;

  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('zh')) return 'zh';
  return 'en';
}

/**
 * 加载指定语言的数据
 * @param {string} locale
 * @param {boolean} forceReload - 强制重新加载（忽略缓存）
 */
async function loadLocale(locale, forceReload = false) {
  // 如果有缓存且不是强制重新加载，直接返回
  if (LOCALE_DATA[locale] && !forceReload) return;

  // 清除可能不完整的缓存
  if (forceReload) {
    LOCALE_DATA[locale] = null;
  }

  try {
    // 根据当前页面路径计算相对路径
    const basePath = getBasePath();
    const url = `${basePath}assets/js/i18n/${locale}.json`;
    console.log(`[i18n] Fetching translations from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${locale} translations (${response.status})`);
    LOCALE_DATA[locale] = await response.json();
    console.log(`[i18n] Loaded ${locale} translations from network`);
  } catch (err) {
    console.error(`[i18n] Failed to load ${locale} from network:`, err.message);
    // 回退到内联备用数据
    LOCALE_DATA[locale] = getInlineFallback(locale);
    console.log(`[i18n] Using inline fallback for ${locale}`);
  }
}

/**
 * 获取基础路径（兼容 GitHub Pages 和自定义域名）
 */
function getBasePath() {
  const pathname = window.location.pathname;
  // 计算路径深度
  const segments = pathname.split('/').filter(Boolean);
  const depth = segments.length - 1;
  
  if (depth <= 0) {
    // 根路径 - GitHub Pages 部署在子目录，需要包含仓库名
    // 尝试从 script 标签的 src 反推
    // 备选方案：硬编码仓库名（适合 GitHub Pages）
    return '/ai-tarot-love/';
  }
  return '../'.repeat(depth);
}

/**
 * 切换语言
 * @param {string} locale
 */
async function setLocale(locale) {
  if (locale === currentLocale) return;
  // 强制重新加载，确保获取最新翻译
  await loadLocale(locale, true);
  currentLocale = locale;
  window.I18N_DATA = LOCALE_DATA[locale];
  localStorage.setItem('tarot-locale', locale);
  if (typeof APP_STATE !== 'undefined') {
    APP_STATE.locale = locale;
  }
  applyTranslations();
  window.dispatchEvent(new CustomEvent('locale-change', { detail: { locale } }));
}

/**
 * 应用翻译到所有带有 data-i18n 属性的元素
 */
function applyTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  let applied = 0;
  let missing = 0;
  
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = getI18n(key);
    if (translation && translation !== key) {
      if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = translation;
      } else {
        el.textContent = translation;
      }
      applied++;
    } else {
      missing++;
      console.warn(`[i18n] Missing translation for key: ${key}`);
    }
  });

  console.log(`[i18n] Applied ${applied} translations, ${missing} missing`);
  
  // 更新 HTML lang 属性
  document.documentElement.lang = currentLocale;
}

/**
 * 获取翻译
 * @param {string} key - 形如 "home.hero_title"
 */
function getI18n(key) {
  if (!window.I18N_DATA) {
    console.warn(`[i18n] I18N_DATA is null, key "${key}" not translated`);
    return key;
  }
  const keys = key.split('.');
  let value = window.I18N_DATA;
  for (const k of keys) {
    if (value == null || typeof value !== 'object') {
      return key;
    }
    value = value[k];
  }
  return value ?? key;
}

/**
 * 备用内联数据（网络失败时使用）- 完整版本
 */
function getInlineFallback(locale) {
  if (locale === 'zh') {
    return {
      meta: { lang: 'zh', name: '简体中文' },
      nav: { 
        home: '首页', 
        single_draw: '单牌占卜', 
        three_card: '三牌占卜', 
        blog: '博客', 
        login: '登录', 
        logout: '退出登录' 
      },
      home: { 
        hero_title: '你的感情困惑，星辰懂你', 
        hero_subtitle: 'AI 塔罗 · 温柔解读 · 情感陪伴',
        hero_cta: '开始今日占卜', 
        hero_secondary: '了解更多',
        features_title: '星辰能为你做什么',
        feature1_title: '每日单牌占卜',
        feature1_desc: '每日一次，AI 解读今日感情运势，给你温暖的指引',
        feature2_title: '三牌爱情占卜',
        feature2_desc: '过去·现在·未来，AI 综合解读你在感情中的位置和方向',
        feature3_title: '感情追踪记录',
        feature3_desc: '记录每一次占卜，看到感情变化轨迹，增强自我认知',
        situations_title: '找到你的专属场景',
        situation_crush: '暧昧期',
        situation_crush_desc: '他/她对我有感觉吗？',
        situation_ex: '分手边缘',
        situation_ex_desc: '这段感情还能挽回吗？',
        situation_paizhao: '感情诊断',
        situation_paizhao_desc: '我们的感情出了什么问题？',
        diff_title: '为什么选择星辰',
        diff_empathy: '共情而非说教',
        diff_empathy_desc: '不是冷冰冰的牌义，是真正理解你感受的朋友式对话',
        diff_scene: '垂直场景',
        diff_scene_desc: '暧昧、分手、挽回，不同场景不同解读',
        diff_record: '追踪留存',
        diff_record_desc: '记录你的每一次占卜，看到感情的成长轨迹',
        cta_title: '准备好开始了吗？',
        cta_subtitle: '每日一次免费的温柔指引，等待着你'
      },
      footer: { 
        privacy: '隐私政策', 
        terms: '使用条款', 
        contact: '联系我们',
        copyright: '© 2026 星辰 AI 塔罗 · All rights reserved'
      },
      tarot: {
        select_question: '选择你想问的问题',
        single_draw_title: '单牌每日占卜',
        question_subtitle: '深呼吸，专注你的问题，选择一个最贴近的类别',
        draw_card: '点击抽牌',
        draw_guidance: '抽取今日指引',
        draw_subtitle: '点击下方牌堆，让星辰为你抽取今日的塔罗牌',
        shuffling: '洗牌中...',
        your_card: '你抽到的牌',
        ai_guidance: '星辰的解读',
        reading_subtitle: '正在为你解读...',
        draw_again: '再次占卜',
        restart: '重新占卜',
        try_three_card: '体验三牌占卜',
        free_limit_reached: '今日免费次数已用完',
        upgrade_premium: '升级 Premium 解锁无限次',
        loading_reading: '星辰正在解读你的牌...'
      },
      question_types: {
        daily_luck: '今日感情运势',
        single_love: '单恋对象',
        reconciliation: '复合可能性',
        breakup_timing: '脱单时机'
      },
      three_card: {
        main_title: '三牌爱情占卜',
        scene_subtitle: '选择你最想了解的维度，星辰将为你解读过去、现在与未来',
        draw_instruction: '依次抽取三张牌',
        draw_hint: '点击牌堆，依次抽取过去 · 现在 · 未来',
        past: '过去',
        present: '现在',
        future: '未来',
        selectSituation: '选择你的情况',
        startReading: '开始解读',
        reading: '解读中...'
      },
      common: { loading: '加载中...', error: '出错了，请稍后重试' }
    };
  }
  // English fallback - 完整版本
  return {
    meta: { lang: 'en', name: 'English' },
    nav: { 
      home: 'Home', 
      single_draw: 'Single Card', 
      three_card: 'Three Card', 
      blog: 'Blog', 
      login: 'Login', 
      logout: 'Logout' 
    },
    home: { 
      hero_title: 'Your Love Questions, Understood by Stardust', 
      hero_subtitle: 'AI Tarot · Gentle Guidance · Emotional Companionship',
      hero_cta: "Start Today's Reading", 
      hero_secondary: 'Learn More',
      features_title: 'What Can Stardust Do For You',
      feature1_title: 'Daily Single Card',
      feature1_desc: 'Once a day, AI reveals your love fortune with gentle guidance',
      feature2_title: 'Three-Card Love Reading',
      feature2_desc: 'Past · Present · Future — AI interprets your emotional landscape',
      feature3_title: 'Love Tracking',
      feature3_desc: 'Record every reading, see your emotional growth over time',
      situations_title: 'Find Your Specific Situation',
      situation_crush: 'Crush Phase',
      situation_crush_desc: 'Does he/she have feelings for me?',
      situation_ex: 'Breakup Edge',
      situation_ex_desc: 'Can this relationship still be saved?',
      situation_paizhao: 'Relationship Diagnosis',
      situation_paizhao_desc: "What's going wrong in our relationship?",
      diff_title: 'Why Choose Stardust',
      diff_empathy: 'Empathy Over Lectures',
      diff_empathy_desc: 'Not cold card meanings — friendly conversation that truly understands you',
      diff_scene: 'Specific Scenarios',
      diff_scene_desc: 'Crush, breakup, reconciliation — different scenarios get different insights',
      diff_record: 'Track & Grow',
      diff_record_desc: 'Record every reading, see your emotional journey unfold',
      cta_title: 'Ready to Begin?',
      cta_subtitle: 'One free daily reading awaits you'
    },
    tarot: {
      select_question: 'Select Your Question',
      single_draw_title: 'Daily Single Card',
      question_subtitle: 'Take a breath, focus on your question, choose the category that fits best',
      draw_card: 'Draw a Card',
      draw_guidance: 'Draw Your Guidance',
      draw_subtitle: "Click the deck below and let Stardust draw your tarot card for today",
      shuffling: 'Shuffling...',
      your_card: 'Your Card',
      ai_guidance: "Stardust's Insight",
      reading_subtitle: 'Interpreting for you...',
      draw_again: 'Draw Again',
      restart: 'Draw Again',
      try_three_card: 'Try Three-Card Reading',
      free_limit_reached: 'Daily free limit reached',
      upgrade_premium: 'Upgrade to Premium for unlimited readings',
      loading_reading: "Stardust is interpreting your card..."
    },
    question_types: {
      daily_luck: "Today's Love Fortune",
      single_love: 'Your Crush',
      reconciliation: 'Chance of Reconciliation',
      breakup_timing: 'When Will I Find Love'
    },
    three_card: {
      main_title: 'Three-Card Love Reading',
      scene_subtitle: 'Choose the dimension you most want to understand — Stardust will interpret your Past, Present & Future',
      draw_instruction: 'Draw Three Cards in Order',
      draw_hint: 'Click the deck to draw your Past · Present · Future',
      past: 'Past',
      present: 'Present',
      future: 'Future',
      selectSituation: 'Select your situation',
      startReading: 'Start Reading',
      reading: 'Interpreting...'
    },
    footer: { 
      privacy: 'Privacy Policy', 
      terms: 'Terms of Service', 
      contact: 'Contact Us',
      copyright: '© 2026 Stardust AI Tarot · All rights reserved'
    },
    common: { loading: 'Loading...', error: 'Something went wrong, please try again' }
  };
}

// ============================================
// 初始化并暴露到全局
// ============================================
initI18n().then(() => {
  console.log(`[i18n] Initialized with locale: ${currentLocale}`);
  if (typeof applyTranslations === 'function') {
    applyTranslations();
  }
});

window.I18N = {
  setLocale,
  getI18n,
  getCurrentLocale: () => currentLocale,
};

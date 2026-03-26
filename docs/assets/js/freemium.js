/**
 * freemium.js — Freemium 功能管理
 *
 * 规则：
 * - 未登录用户：每天 3 次（localStorage）
 * - 登录用户（免费）：每天 6 次（Supabase）
 * - Premium 用户：无限次
 */

const FREEMIUM_LIMIT_LOGGED_OUT = 3;   // 未登录用户每天 3 次
const FREEMIUM_LIMIT_LOGGED_IN = 6;     // 登录用户每天 6 次

/**
 * 获取今天日期字符串 (YYYY-MM-DD)
 */
function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * 获取 localStorage 的 Freemium 数据（未登录用户用）
 */
function getLocalFreemiumData() {
  const key = 'tarot-freemium-data';
  const data = localStorage.getItem(key);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * 保存 Freemium 使用数据到 localStorage
 */
function saveLocalFreemiumData(data) {
  const key = 'tarot-freemium-data';
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * 获取登录用户的今日使用次数（从 Supabase 查询）
 */
async function getLoggedInUsageFromCloud() {
  if (!window.AuthService?.isLoggedIn()) {
    return 0;
  }

  try {
    const { supabase } = window.AuthService.getSupabase();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return 0;

    const today = getTodayString();
    const startOfDay = `${today}T00:00:00+00:00`;

    const { count, error } = await supabase
      .from('reading_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfDay);

    if (error) {
      console.error('[Freemium] Cloud query error:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('[Freemium] Cloud query exception:', err);
    return 0;
  }
}

/**
 * 检查 Freemium 限制
 * @returns {{allowed: boolean, remaining: number, isPremium: boolean, isLoggedIn: boolean}}
 */
async function checkFreemiumLimit() {
  // Premium 用户不受限制
  if (APP_STATE.plan === 'premium') {
    return { allowed: true, remaining: Infinity, isPremium: true, isLoggedIn: true };
  }

  const isLoggedIn = window.AuthService?.isLoggedIn() ?? false;

  if (isLoggedIn) {
    // 登录用户：从 Supabase 查询今日次数
    const used = await getLoggedInUsageFromCloud();
    const limit = FREEMIUM_LIMIT_LOGGED_IN;
    const remaining = Math.max(0, limit - used);

    return {
      allowed: remaining > 0,
      remaining,
      isPremium: false,
      isLoggedIn: true,
      limit,
    };
  } else {
    // 未登录用户：用 localStorage
    const today = getTodayString();
    const data = getLocalFreemiumData();
    const limit = FREEMIUM_LIMIT_LOGGED_OUT;

    // 如果不是今天的数据，重置计数
    if (!data || data.date !== today) {
      return { allowed: true, remaining: limit, isPremium: false, isLoggedIn: false, limit };
    }

    const used = data.used || 0;
    const remaining = Math.max(0, limit - used);

    return {
      allowed: remaining > 0,
      remaining,
      isPremium: false,
      isLoggedIn: false,
      limit,
    };
  }
}

/**
 * 记录一次占卜使用
 */
async function recordFreemiumUsage() {
  // Premium 用户不需要记录
  if (APP_STATE.plan === 'premium') {
    return;
  }

  const isLoggedIn = window.AuthService?.isLoggedIn() ?? false;

  if (isLoggedIn) {
    // 登录用户的次数记录在 Supabase 的 reading_history 表里
    // 每次保存解读记录时会自动记录，这里不需要额外操作
    console.log('[Freemium] Logged-in user, usage counted via cloud storage');
    return;
  } else {
    // 未登录用户：记录到 localStorage
    const today = getTodayString();
    const data = getLocalFreemiumData() || { date: today, used: 0 };

    // 如果不是今天，重置计数
    if (data.date !== today) {
      data.date = today;
      data.used = 0;
    }

    data.used = (data.used || 0) + 1;
    saveLocalFreemiumData(data);

    console.log(`[Freemium] Local user recorded. Today: ${data.date}, Used: ${data.used}`);
  }
}

/**
 * 获取剩余免费次数
 */
async function getRemainingFreeCount() {
  const result = await checkFreemiumLimit();
  return result.remaining;
}

/**
 * 检查 Freemium 限制是否已达上限
 */
async function isFreemiumLimitReached() {
  const result = await checkFreemiumLimit();
  return !result.allowed;
}

/**
 * 获取 Freemium 限制配置
 */
function getFreemiumLimits() {
  return {
    loggedOut: FREEMIUM_LIMIT_LOGGED_OUT,
    loggedIn: FREEMIUM_LIMIT_LOGGED_IN,
  };
}

// 暴露到全局
window.FreemiumManager = {
  checkFreemiumLimit,
  recordFreemiumUsage,
  getRemainingFreeCount,
  isFreemiumLimitReached,
  getFreemiumLimits,
};

/**
 * freemium.js — Freemium 功能管理
 * 免费用户每天 3 次，Premium 用户无限次
 */

const FREEMIUM_LIMIT = 3; // 免费用户每天 3 次

/**
 * 获取今天日期字符串 (YYYY-MM-DD)
 */
function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * 获取 Freemium 使用数据
 */
function getFreemiumData() {
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
 * 保存 Freemium 使用数据
 */
function saveFreemiumData(data) {
  const key = 'tarot-freemium-data';
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * 检查是否可以进行占卜
 * @returns {{allowed: boolean, remaining: number, isPremium: boolean}}
 */
function checkFreemiumLimit() {
  // Premium 用户不受限制
  if (APP_STATE.plan === 'premium') {
    return { allowed: true, remaining: Infinity, isPremium: true };
  }

  const today = getTodayString();
  const data = getFreemiumData();

  // 如果不是今天的数据，重置计数
  if (!data || data.date !== today) {
    return { allowed: true, remaining: FREEMIUM_LIMIT, isPremium: false };
  }

  // 检查次数
  const used = data.used || 0;
  const remaining = Math.max(0, FREEMIUM_LIMIT - used);

  if (remaining <= 0) {
    return { allowed: false, remaining: 0, isPremium: false };
  }

  return { allowed: true, remaining, isPremium: false };
}

/**
 * 记录一次占卜使用
 */
function recordFreemiumUsage() {
  // Premium 用户不需要记录
  if (APP_STATE.plan === 'premium') {
    return;
  }

  const today = getTodayString();
  const data = getFreemiumData() || { date: today, used: 0 };

  // 如果不是今天，重置计数
  if (data.date !== today) {
    data.date = today;
    data.used = 0;
  }

  data.used = (data.used || 0) + 1;
  saveFreemiumData(data);

  console.log(`[Freemium] Recorded usage. Today: ${data.date}, Used: ${data.used}/${FREEMIUM_LIMIT}`);
}

/**
 * 获取剩余免费次数
 */
function getRemainingFreeCount() {
  const result = checkFreemiumLimit();
  return result.remaining;
}

/**
 * 检查 Freemium 限制，如果已达上限返回 true
 */
function isFreemiumLimitReached() {
  return !checkFreemiumLimit().allowed;
}

// 暴露到全局
window.FreemiumManager = {
  checkFreemiumLimit,
  recordFreemiumUsage,
  getRemainingFreeCount,
  isFreemiumLimitReached,
  FREEMIUM_LIMIT,
};

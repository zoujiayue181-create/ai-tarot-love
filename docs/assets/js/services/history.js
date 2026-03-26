/**
 * history.js — 云记忆（历史记录）服务
 * 使用 Supabase 存储用户的历史占卜记录
 */

const HISTORY_TABLE = 'reading_history';

/**
 * 保存一条占卜记录到云端
 * @param {Object} record - {
 *   cardName: string,
 *   cardType: string, // 'major' | 'minor'
 *   question: string,
 *   readingZh: string,
 *   readingEn: string,
 *   readingType: string // 'single' | 'three'
 * }
 */
async function saveReadingToCloud(record) {
  if (!window.AuthService?.isLoggedIn()) {
    console.log('[History] User not logged in, skipping cloud save');
    return { success: false, reason: 'not_logged_in' };
  }

  const user = window.AuthService?.getCurrentUser();
  if (!user) {
    return { success: false, reason: 'no_user' };
  }

  try {
    const { supabase } = window.AuthService.getSupabase();
    const { data, error } = await supabase
      .from(HISTORY_TABLE)
      .insert({
        user_id: user.id,
        card_name: record.cardName,
        card_type: record.cardType,
        question: record.question,
        reading_zh: record.readingZh,
        reading_en: record.readingEn,
        reading_type: record.readingType,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[History] Save failed:', error);
      return { success: false, error };
    }

    console.log('[History] Saved to cloud:', data);
    return { success: true, data };
  } catch (err) {
    console.error('[History] Save error:', err);
    return { success: false, error: err };
  }
}

/**
 * 获取用户的历史记录
 * @param {number} limit - 最大返回条数
 * @returns {Promise<Array>}
 */
async function getCloudHistory(limit = 10) {
  if (!window.AuthService?.isLoggedIn()) {
    return [];
  }

  const user = window.AuthService?.getCurrentUser();
  if (!user) return [];

  try {
    const { supabase } = window.AuthService.getSupabase();
    const { data, error } = await supabase
      .from(HISTORY_TABLE)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[History] Fetch failed:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[History] Fetch error:', err);
    return [];
  }
}

/**
 * 获取云记忆存储用量（免费用户上限 3 条）
 * @returns {Promise<{count: number, limit: number, canSave: boolean}>}
 */
async function getCloudStorageUsage() {
  const user = window.AuthService?.getCurrentUser();
  if (!user) {
    return { count: 0, limit: 0, canSave: false };
  }

  const isPremium = APP_STATE.plan === 'premium';
  const limit = isPremium ? Infinity : 3; // Premium 无限条

  if (isPremium) {
    return { count: -1, limit: Infinity, canSave: true }; // -1 表示不限制
  }

  try {
    const { supabase } = window.AuthService.getSupabase();
    const { count, error } = await supabase
      .from(HISTORY_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) {
      console.error('[History] Count failed:', error);
      return { count: 0, limit: 3, canSave: false };
    }

    return {
      count: count || 0,
      limit: 3,
      canSave: (count || 0) < 3,
    };
  } catch (err) {
    console.error('[History] Count error:', err);
    return { count: 0, limit: 3, canSave: false };
  }
}

/**
 * 删除一条历史记录
 * @param {string} recordId
 */
async function deleteHistoryRecord(recordId) {
  if (!window.AuthService?.isLoggedIn()) return false;

  try {
    const { supabase } = window.AuthService.getSupabase();
    const { error } = await supabase
      .from(HISTORY_TABLE)
      .delete()
      .eq('id', recordId);

    if (error) {
      console.error('[History] Delete failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[History] Delete error:', err);
    return false;
  }
}

/**
 * 清理超过 30 天的记录（Premium 用户）
 * 每天自动清理一次
 */
async function cleanupOldRecords() {
  if (APP_STATE.plan !== 'premium') return;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffDate = thirtyDaysAgo.toISOString();

  try {
    const { supabase } = window.AuthService.getSupabase();
    const { error } = await supabase
      .from(HISTORY_TABLE)
      .delete()
      .lt('created_at', cutoffDate);

    if (error) {
      console.error('[History] Cleanup failed:', error);
    } else {
      console.log('[History] Cleaned up records older than 30 days');
    }
  } catch (err) {
    console.error('[History] Cleanup error:', err);
  }
}

// 暴露到全局
window.HistoryService = {
  saveReadingToCloud,
  getCloudHistory,
  getCloudStorageUsage,
  deleteHistoryRecord,
  cleanupOldRecords,
};

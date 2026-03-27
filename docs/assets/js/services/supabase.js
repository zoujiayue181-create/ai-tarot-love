/**
 * services/supabase.js — Supabase 认证服务
 *
 * 配置：填入你的 Supabase 项目 URL 和 anon key
 */

const SUPABASE_URL = 'https://bttkawcwomzkslwwqoar.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0dGthd2N3b216a3Nsd3dxb2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDE1MDYsImV4cCI6MjA5MDA3NzUwNn0.rHL9qzP7I7aMNnvcNVG_fXVDTMqxJWv4F8DDiPCKNUs';

// 加载 Supabase SDK
(function() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/dist/umd/supabase.min.js';
  script.onload = initSupabase;
  script.onerror = () => console.error('[Supabase] SDK 加载失败');
  document.head.appendChild(script);
})();

let supabase = null;

function initSupabase() {
  console.log('[Supabase] SDK 加载成功');
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 暴露到全局，供 auth-modal.js 使用
  window.supabase = supabase;

  // 监听 Auth 状态变化
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('[Supabase] Auth 状态变化:', event, session);
    if (typeof handleAuthChange === 'function') {
      const user = session?.user ?? null;
      handleAuthChange(user);
    }
  });

  // 初始检查登录状态
  checkInitialSession();
}

async function checkInitialSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user && typeof handleAuthChange === 'function') {
    handleAuthChange(session.user);
  }
}

// ============================================
// 供 main.js 调用的 API
// ============================================
window.AuthService = {
  /**
   * 显示登录弹窗（邮箱/密码登录）
   */
  async showLoginModal() {
    const email = prompt('请输入邮箱：');
    if (!email) return;

    const password = prompt('请输入密码：');
    if (!password) return;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      showToast('登录失败：' + error.message, 'error');
      console.error('[Supabase] Login error:', error);
    } else {
      showToast('登录成功！', 'success');
    }
  },

  /**
   * 注册新用户
   */
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      showToast('注册失败：' + error.message, 'error');
      return { error };
    } else {
      showToast('注册成功！请查收验证邮件', 'success');
      return { data };
    }
  },

  /**
   * 发送密码重置邮件
   */
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      showToast('重置失败：' + error.message, 'error');
    } else {
      showToast('已发送重置邮件，请查收', 'success');
    }
  },

  /**
   * 退出登录
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[Supabase] Logout error:', error);
    } else {
      showToast('已退出登录', 'info');
    }
  },

  /**
   * 获取当前用户（异步）
   */
  async getCurrentUser() {
    if (!supabase) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (e) {
      return null;
    }
  },

  /**
   * 检查是否已登录（异步）
   */
  async isLoggedIn() {
    if (!supabase) return false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user != null;
    } catch (e) {
      return false;
    }
  },

  /**
   * 获取 Supabase 客户端（供其他服务使用）
   */
  getSupabase() {
    return supabase;
  },

  /**
   * 监听 Auth 状态变化
   */
  onAuthStateChange(callback) {
    if (supabase) {
      supabase.auth.onAuthStateChange((event, session) => {
        callback(session?.user ?? null);
      });
    }
  },
};

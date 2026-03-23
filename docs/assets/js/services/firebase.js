/**
 * services/firebase.js — Firebase 初始化占位
 *
 * TODO: 填入你的 Firebase Web 配置
 * 步骤：
 * 1. 打开 https://console.firebase.google.com
 * 2. 创建项目 → 添加 Web App
 * 3. 复制以下配置
 */

const FirebaseConfig = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_PROJECT.firebaseapp.com',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT.appspot.com',
  messagingSenderId:  'YOUR_SENDER_ID',
  appId:             'YOUR_APP_ID',
};

// ============================================
// Firebase Auth 监听（供 main.js 调用）
// ============================================
function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('[Firebase] SDK 未加载，请在 index.html 中引入 firebase-app.js');
    return;
  }

  firebase.initializeApp(FirebaseConfig);
  const auth = firebase.auth();

  auth.onAuthStateChanged((user) => {
    if (typeof handleAuthChange === 'function') {
      handleAuthChange(user);
    }
  });
}

// 页面加载后自动初始化
window.addEventListener('DOMContentLoaded', initFirebase);

// ============================================
// 供 main.js 调用的 API
// ============================================
window.FirebaseService = {
  /**
   * 登录弹窗（未来扩展）
   */
  showLoginModal() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).catch(err => {
      console.error('[Firebase] Login error:', err);
      showToast('登录失败：' + err.message, 'error');
    });
  },

  /**
   * 退出登录
   */
  logout() {
    firebase.auth().signOut().catch(err => {
      console.error('[Firebase] Logout error:', err);
    });
  },

  /**
   * 监听 Auth 状态变化
   */
  onAuthStateChange(callback) {
    if (typeof firebase !== 'undefined') {
      firebase.auth().onAuthStateChanged(callback);
    }
  },

  /**
   * 获取当前用户
   */
  getCurrentUser() {
    return firebase.auth().currentUser;
  },
};

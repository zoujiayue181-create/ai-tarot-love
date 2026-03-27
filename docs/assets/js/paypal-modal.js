/**
 * paypal-modal.js — Premium 订阅弹窗逻辑
 */

/**
 * 显示 Premium 订阅弹窗
 * @param {Object} options - 配置选项
 * @param {boolean} options.requireLogin - 是否强制要求登录
 */
function showPremiumModal(options = {}) {
  const { requireLogin = false } = options;

  // 如果已经 Premium，直接显示成功状态
  const isLoggedIn = window.AuthService?.isLoggedIn() ?? false;

  // 创建弹窗
  const overlay = document.createElement('div');
  overlay.className = 'premium-overlay';
  overlay.id = 'premiumModal';

  overlay.innerHTML = `
    <div class="premium-modal">
      <button class="close-btn" onclick="closePremiumModal()">×</button>

      <div class="premium-header">
        <span class="premium-badge">⭐ Premium</span>
        <h2 class="premium-title">解锁星辰全部力量</h2>
        <p class="premium-subtitle">升级 Premium，解锁无限占卜与专属功能</p>
      </div>

      <div class="premium-features">
        <h4>Premium 专属权益</h4>
        <ul class="feature-list">
          <li class="feature-item">
            <span class="icon unlimited">♾️</span>
            <span class="text">
              <span class="label">无限次占卜</span>
              <span class="desc">每天想占多少次就占多少次</span>
            </span>
          </li>
          <li class="feature-item">
            <span class="icon storage">☁️</span>
            <span class="text">
              <span class="label">30天云记忆存储</span>
              <span class="desc">保存所有解读记录，随时回顾</span>
            </span>
          </li>
          <li class="feature-item">
            <span class="icon badge">👑</span>
            <span class="text">
              <span class="label">专属 Premium 标识</span>
              <span class="desc">彰显尊贵身份</span>
            </span>
          </li>
        </ul>
      </div>

      <div class="premium-pricing">
        <div class="price-tag">
          <span class="price-currency">$</span>
          <span class="price-amount">4.99</span>
          <span class="price-period">/月</span>
        </div>
        <p class="price-note">随时取消 · 自动续费</p>
      </div>

      ${isLoggedIn ? `
        <div class="premium-paypal">
          <div id="paypal-button-container"></div>
        </div>
        <p style="text-align:center;font-size:12px;color:rgba(255,255,255,0.4);margin:0;">
          点击上方按钮通过 PayPal 安全支付
        </p>
      ` : `
        <div class="premium-login-hint">
          <p>登录后将获得 1 个月免费试用</p>
          <button class="premium-login-btn" onclick="closePremiumModal();openAuthModal('login');">
            登录 / 注册账号
          </button>
        </div>
        <p style="text-align:center;font-size:12px;color:rgba(255,255,255,0.4);margin:0;">
          登录后可享受首次订阅优惠
        </p>
      `}

      <div class="premium-footer">
        <p>
          登录即表示同意我们的
          <a href="#">服务条款</a> 和
          <a href="#">隐私政策</a>
        </p>
      </div>
    </div>
  `;

  // 添加到页面
  document.body.appendChild(overlay);

  // 显示动画
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  // ESC 关闭
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closePremiumModal();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);

  // 点击遮罩关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closePremiumModal();
    }
  });

  // 如果已登录，渲染 PayPal 按钮
  if (isLoggedIn) {
    renderPayPalSubscribeButton();
  }

  // 监听 Premium 激活事件
  const handlePremiumActivated = (e) => {
    showPremiumSuccess(e.detail.expiresAt);
  };
  window.addEventListener('premium-activated', handlePremiumActivated);
}

/**
 * 关闭 Premium 弹窗
 */
function closePremiumModal() {
  const overlay = document.getElementById('premiumModal');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }
}

/**
 * 渲染 PayPal 订阅按钮
 */
function renderPayPalSubscribeButton() {
  const container = document.getElementById('paypal-button-container');
  if (!container) return;

  // 检查 PayPal SDK 是否加载
  if (!window.paypal) {
    container.innerHTML = '<p style="text-align:center;color:#fff;">正在加载支付组件...</p>';
    setTimeout(renderPayPalSubscribeButton, 500);
    return;
  }

  container.innerHTML = '';

  window.paypal.Buttons({
    style: {
      layout: 'vertical',
      color: 'gold',
      shape: 'rect',
      label: 'pay'
    },

    createSubscription: function(data, actions) {
      console.log('[PayPal] Creating subscription...');

      // ⚠️ 重要：替换为你的 PayPal Product/Plan ID
      // 在 PayPal Dashboard → Subscriptions → Plans 创建
      // Sandbox 格式: P-XXXXXXXXXXXXXXXXXXXXXXX
      // Live 格式: 实际的 Plan ID
      const PLAN_ID = 'P-MODEL-PLAN-ID-HERE'; // ⚠️ 替换这里！

      return actions.subscription.create({
        plan_id: PLAN_ID,
        application_context: {
          brand_name: '星辰塔罗',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW'
        }
      });
    },

    onApprove: async function(data, actions) {
      console.log('[PayPal] Subscription approved:', data);

      // 计算过期日期（1个月后）
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      // 激活 Premium
      await window.PayPalService.activatePremium(
        data.subscriptionID,
        expiresAt.toISOString()
      );

      // 显示成功状态
      showPremiumSuccess(expiresAt.toISOString());
    },

    onCancel: function(data) {
      console.log('[PayPal] Subscription cancelled:', data);
      showToast('支付已取消', 'info');
    },

    onError: function(err) {
      console.error('[PayPal] Error:', err);
      showToast('支付遇到问题，请稍后重试', 'error');
    }
  }).render('#paypal-button-container');
}

/**
 * 显示 Premium 激活成功状态
 */
function showPremiumSuccess(expiresAt) {
  const modal = document.querySelector('.premium-modal');
  if (!modal) return;

  const expiresDate = new Date(expiresAt);
  const dateStr = `${expiresDate.getFullYear()}年${expiresDate.getMonth() + 1}月${expiresDate.getDate()}日`;

  modal.innerHTML = `
    <div class="premium-success">
      <div class="check-icon">✓</div>
      <h3>恭喜升级成功！</h3>
      <p>您的 Premium 有效期至 ${dateStr}</p>
      <p style="margin-top:16px;">
        <button class="premium-login-btn" onclick="closePremiumModal();" style="background:linear-gradient(135deg,#f5af19,#f12711);border:none;padding:12px 32px;">
          开始无限占卜
        </button>
      </p>
    </div>
  `;
}

/**
 * 打开 Premium 弹窗（全局调用）
 */
function openPremiumModal() {
  showPremiumModal();
}

/**
 * 升级 Freemium 检查 - 超过限制时显示 Premium 弹窗
 */
async function checkFreemiumAndShowUpgrade(remaining, isLoggedIn) {
  if (remaining <= 0) {
    // 免费次数用完了
    if (!isLoggedIn) {
      // 未登录：引导登录
      showToast('今日免费次数已用完。登录账号可获得更多次数！', 'info', 4000);
      setTimeout(() => {
        openAuthModal('login');
      }, 1500);
    } else {
      // 已登录：引导升级 Premium
      showToast('今日免费次数已用完。升级 Premium 解锁无限次占卜！', 'info', 4000);
      setTimeout(() => {
        openPremiumModal();
      }, 1500);
    }
    return true; // 表示拦截了操作
  }
  return false; // 继续执行
}

// ============================================
// Freemium 集成
// ============================================

// 拦截 Freemium 限制，显示升级弹窗
const originalCheckFreemiumLimit = window.FreemiumManager?.checkFreemiumLimit;

// 在 Freemium 检查后自动判断是否显示升级提示
window.addEventListener('DOMContentLoaded', () => {
  // 监听 Freemium 限制事件（如果发了的话）
  console.log('[PayPal] Premium modal module loaded');
});

// ============================================
// 快捷调用
// ============================================

// 显示升级提示（用于 Freemium 限制触发后）
function showUpgradePrompt(freemiumResult) {
  if (freemiumResult.allowed) {
    return false; // 没有超过限制
  }

  if (!freemiumResult.isLoggedIn) {
    // 未登录用户
    showToast('今日免费次数已用完。登录账号可获得更多次数！', 'info', 4000);
    setTimeout(() => openAuthModal('login'), 1500);
  } else {
    // 已登录但次数用完
    openPremiumModal();
  }

  return true;
}

// 全局暴露
window.showPremiumModal = showPremiumModal;
window.closePremiumModal = closePremiumModal;
window.openPremiumModal = openPremiumModal;
window.showUpgradePrompt = showUpgradePrompt;

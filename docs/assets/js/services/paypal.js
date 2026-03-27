/**
 * paypal.js — PayPal 支付服务
 *
 * 配置：
 * 1. 在 https://developer.paypal.com/ 创建应用
 * 2. 获取 Client ID
 * 3. 替换下面的 PAYPAL_CLIENT_ID
 *
 * 测试模式：sandbox
 * 正式模式：替换为你的 live Client ID
 */

const PAYPAL_CONFIG = {
  // ⚠️ 替换为你的 PayPal Client ID
  clientId: 'AYXmxKNVYkv_bEbA6VTFwmJqT4KR6X8Z4U3QCRY_8U7QkZvN5qLQjH3PiN9K2L5M1R6T8W0X2Y4Z', // 示例，请替换！

  // 环境：'sandbox' | 'live'
  environment: 'sandbox',

  // 订阅产品配置
  subscription: {
    // Premium 订阅 - $4.99/月
    premium: {
      price: '$4.99',
      priceCNY: '¥35', // 备用
      interval: 'month',
      productName: '星辰 Premium 月卡',
      description: '无限次占卜 + 30天云记忆存储',
    }
  }
};

// 加载 PayPal SDK
(function loadPayPalSDK() {
  const clientId = PAYPAL_CONFIG.clientId;
  const environment = PAYPAL_CONFIG.environment;

  // PayPal SDK URL
  const sdkUrl = environment === 'sandbox'
    ? `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=subscription`
    : `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=subscription`;

  const script = document.createElement('script');
  script.src = sdkUrl;
  script.onload = () => console.log('[PayPal] SDK loaded');
  script.onerror = () => console.error('[PayPal] SDK load failed');
  document.head.appendChild(script);
})();

/**
 * 检查是否是 Premium 用户
 * 优先级：Supabase > localStorage
 */
async function checkPremiumStatus() {
  // Premium 状态存储键
  const PREMIUM_KEY = 'tarot-premium-status';

  // 1. 如果是登录用户，从 Supabase 检查
  if (window.AuthService?.isLoggedIn()) {
    try {
      const { supabase } = window.AuthService.getSupabase();
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        // 查询用户的 premium 状态
        // 注意：需要创建 premium_users 表
        const { data, error } = await supabase
          .from('premium_users')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString())
          .single();

        if (data) {
          // 更新本地缓存
          localStorage.setItem(PREMIUM_KEY, JSON.stringify({
            expiresAt: data.expires_at,
            source: 'supabase'
          }));
          return { isPremium: true, expiresAt: data.expires_at };
        }
      }
    } catch (err) {
      console.error('[PayPal] Check premium error:', err);
    }
  }

  // 2. 检查本地缓存
  const localData = localStorage.getItem(PREMIUM_KEY);
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      const expiresAt = new Date(parsed.expiresAt);

      // 检查是否过期
      if (expiresAt > new Date()) {
        return { isPremium: true, expiresAt: parsed.expiresAt };
      } else {
        // 已过期，清除
        localStorage.removeItem(PREMIUM_KEY);
      }
    } catch (e) {
      localStorage.removeItem(PREMIUM_KEY);
    }
  }

  return { isPremium: false, expiresAt: null };
}

/**
 * 激活 Premium 状态（订阅成功后调用）
 * @param {string} subscriptionId - PayPal 订阅 ID
 * @param {string} expiryDate - 过期日期
 */
async function activatePremium(subscriptionId, expiryDate) {
  const PREMIUM_KEY = 'tarot-premium-status';

  // 保存到本地
  const premiumData = {
    subscriptionId,
    expiresAt: expiryDate,
    activatedAt: new Date().toISOString(),
    source: 'paypal'
  };
  localStorage.setItem(PREMIUM_KEY, JSON.stringify(premiumData));

  // 如果是登录用户，同步到 Supabase
  if (window.AuthService?.isLoggedIn()) {
    try {
      const { supabase } = window.AuthService.getSupabase();
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        //  upsert 到 premium_users 表
        await supabase.from('premium_users').upsert({
          user_id: user.id,
          subscription_id: subscriptionId,
          status: 'active',
          expires_at: expiryDate,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
        console.log('[PayPal] Premium synced to Supabase');
      }
    } catch (err) {
      console.error('[PayPal] Sync to Supabase failed:', err);
    }
  }

  // 更新 APP_STATE
  if (window.APP_STATE) {
    window.APP_STATE.plan = 'premium';
  }

  // 触发 UI 更新
  window.dispatchEvent(new CustomEvent('premium-activated', {
    detail: { expiresAt: expiryDate }
  }));

  console.log('[PayPal] Premium activated:', premiumData);
  return true;
}

/**
 * 渲染 PayPal 订阅按钮
 * @param {string} containerId - 容器元素 ID
 * @param {Function} onSuccess - 订阅成功回调
 * @param {Function} onError - 订阅失败回调
 */
function renderPayPalButton(containerId, onSuccess, onError) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('[PayPal] Container not found:', containerId);
    return;
  }

  // 等待 PayPal SDK 加载
  const checkPayPal = () => {
    if (window.paypal) {
      container.innerHTML = ''; // 清空容器

      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'subscribe'
        },

        // 创建订阅
        createSubscription: function(data, actions) {
          console.log('[PayPal] Creating subscription...');

          // ⚠️ 注意：这里的 Plan ID 需要在 PayPal Dashboard 创建
          // 格式：P-XXXXXXXXXXXXXXXX（Sandbox）或实际 Plan ID
          return actions.subscription.create({
            plan_id: 'P-MODEL-XXXXXXXXXXXXXXXX', // ⚠️ 替换为你的 PayPal Plan ID
            application_context: {
              brand_name: '星辰塔罗',
              shipping_preference: 'NO_SHIPPING'
            }
          });
        },

        // 订阅批准
        onApprove: async function(data, actions) {
          console.log('[PayPal] Subscription approved:', data);

          // data.subscriptionID 是 PayPal 订阅 ID
          // 计算过期日期（每月订阅 = 加1个月）
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1);

          // 激活 Premium
          await activatePremium(data.subscriptionID, expiresAt.toISOString());

          if (onSuccess) {
            onSuccess({
              subscriptionId: data.subscriptionID,
              expiresAt: expiresAt.toISOString()
            });
          }
        },

        // 取消
        onCancel: function(data) {
          console.log('[PayPal] Subscription cancelled:', data);
          if (onError) {
            onError({ type: 'cancelled', data });
          }
        },

        // 错误
        onError: function(err) {
          console.error('[PayPal] Error:', err);
          if (onError) {
            onError({ type: 'error', error: err });
          }
        }
      }).render('#' + containerId);

    } else {
      // SDK 还没加载完成，等待一下
      setTimeout(checkPayPal, 100);
    }
  };

  checkPayPal();
}

/**
 * 获取 Premium 状态信息
 */
async function getPremiumInfo() {
  const status = await checkPremiumStatus();

  if (status.isPremium) {
    const expiresAt = new Date(status.expiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    return {
      isPremium: true,
      expiresAt: status.expiresAt,
      daysLeft: Math.max(0, daysLeft),
      message: `Premium 会员（剩余 ${Math.max(0, daysLeft)} 天）`
    };
  }

  return {
    isPremium: false,
    expiresAt: null,
    daysLeft: 0,
    message: '免费用户'
  };
}

// ============================================
// PayPal Webhook 验证（可选，用于生产环境）
// ============================================
// 在 Cloudflare Worker 或后端服务器验证 webhook 签名
// 这里只是前端的基础实现

/**
 * 处理 PayPal 返回的 URL 参数
 * 当 PayPal 跳转回来时，检查 URL 中的订阅信息
 */
function handlePayPalReturn() {
  const urlParams = new URLSearchParams(window.location.search);

  // PayPal 会返回这些参数（启用 return_url 时）
  const token = urlParams.get('token');
  const ba_token = urlParams.get('ba_token'); // Billing Agreement token

  if (ba_token) {
    console.log('[PayPal] Billing agreement token:', ba_token);
    // 可以用这个 token 查询订阅状态
  }

  // 清除 URL 参数（不改变页面内容）
  if (window.history.replaceState) {
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
  }
}

// 页面加载时处理 PayPal 返回
window.addEventListener('DOMContentLoaded', handlePayPalReturn);

// 暴露到全局
window.PayPalService = {
  checkPremiumStatus,
  activatePremium,
  renderPayPalButton,
  getPremiumInfo,
  PAYPAL_CONFIG
};

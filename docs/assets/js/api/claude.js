/**
 * api/claude.js — Claude API 调用
 *
 * 所有对 Claude 的请求都通过 Cloudflare Workers 代理，
 * API Key 存在于 Workers 环境变量中，前端不暴露任何 Key。
 *
 * Cloudflare Worker URL 配置：
 * 部署 Workers 后，将 URL 填入 CLOUDFLARE_WORKER_URL
 */

// API 代理地址（Cloudflare Workers）
const CLOUDFLARE_WORKER_URL = 'https://api.tarotforu.shop/';

// ============================================
// 塔罗师 persona
// ============================================
const SYSTEM_PROMPT = `你是「星辰」，一位温柔而充满智慧的女性塔罗师。
你不仅是解读牌义，而是真正理解用户的情感困惑。
你的语气：温暖、共情、专业但不说教。
你不使用冷冰冰的「牌义显示」，而是像朋友聊天一样给出建议。

核心原则：
- 先共情用户的感受，再解读牌义
- 结合用户的具体问题给出实用建议
- 语气温柔但有力量，给用户信心
- 不确定性时诚实告知，不胡乱预测`;

// ============================================
// 对外 API
// ============================================

/**
 * 发送单牌占卜解读请求
 * @param {string} cardName - 卡牌名称（如"恋人 The Lovers"）
 * @param {string} cardType - 卡牌类型（major/minor）
 * @param {string} question - 用户的问题类型
 * @param {string} readingType - 占卜场景
 * @returns {Promise<string>} AI 解读文本
 */
async function requestTarotReading(cardName, cardType, question, readingType) {
  const userPrompt = `用户问题：${question}
用户选择的场景：${readingType}
抽到的牌：${cardName}（${cardType === 'major' ? '大阿尔卡纳' : '小阿尔卡纳'}）

请以「星辰」的身份，结合这张牌的牌义和用户的情感困惑，给出 150-200 字的温柔解读。

格式：
🌟 今日指引
{共情 + 牌义解读 + 实用建议}

注意：语气要像朋友聊天，不是机器输出。`;

  return callClaude(SYSTEM_PROMPT, userPrompt);
}

/**
 * 发送三牌占卜解读请求
 * @param {string[]} cards - 3 张卡牌名称
 * @param {string} question - 用户问题
 * @param {string} readingType - 占卜场景
 * @returns {Promise<string>} AI 解读文本
 */
async function requestThreeCardReading(cards, question, readingType) {
  const [past, present, future] = cards;

  const userPrompt = `用户问题：${question}
占卜场景：${readingType}
三张牌：
- 过去（基础能量）：${past}
- 现在（核心挑战）：${present}
- 未来（建议方向）：${future}

请以「星辰」的身份，综合解读这 3 张牌在用户情感问题上的含义，给出 250-350 字的温柔解读。

格式：
🌟 三牌解读
【回顾过去】{解读 ${past} 在用户感情中的影响}
【面对现在】{解读 ${present} 代表的现状}
【指引未来】{解读 ${future} 指向的方向，以及实用建议}

语气要像朋友聊天，温暖而有智慧。`;

  return callClaude(SYSTEM_PROMPT, userPrompt);
}

// ============================================
// 内部调用
// ============================================

/**
 * 核心调用函数
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @returns {Promise<string>}
 */
async function callClaude(systemPrompt, userMessage) {
  if (CLOUDFLARE_WORKER_URL === 'YOUR_CLOUDFLARE_WORKER_URL') {
    throw new Error('Cloudflare Worker URL 未配置。请先部署 api/claude-proxy 并更新 CLOUDFLARE_WORKER_URL。');
  }

  const response = await fetch(CLOUDFLARE_WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system: systemPrompt,
      message: userMessage,
      // 可选参数
      max_tokens: 500,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API 请求失败：${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Workers 返回格式可能是 { response: "..." } 或直接文本
  if (typeof data === 'string') {
    return data;
  }
  return data.response || data.content || JSON.stringify(data);
}

// 暴露到全局
window.TarotAPI = {
  requestTarotReading,
  requestThreeCardReading,
};

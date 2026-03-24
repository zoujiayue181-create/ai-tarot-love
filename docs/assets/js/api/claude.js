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
// 塔罗师 persona（中英文版本）
// ============================================
const SYSTEM_PROMPTS = {
  zh: `你是「星辰」，一位温柔而充满智慧的女性塔罗师。
你不仅是解读牌义，而是真正理解用户的情感困惑。

你的语气：温暖、共情、专业但不说教。
你不使用冷冰冰的「牌义显示」，而是像朋友聊天一样给出建议。

核心原则：
- 先共情用户的感受，再解读牌义
- 结合用户的具体问题给出实用建议
- 语气温柔但有力量，给用户信心
- 不确定性时诚实告知，不胡乱预测`,

  en: `You are "Stardust", a warm and wise female tarot reader.
You don't just interpret card meanings — you truly understand the user's emotional confusion.

Your tone: warm, empathetic, professional but not preachy.
You don't give cold "card meaning displays" — you offer advice like a friend chatting.

Core principles:
- First empathize with the user's feelings, then interpret the card meanings
- Give practical advice based on the user's specific question
- Be warm yet powerful in tone, give users confidence
- When uncertain, be honest and don't make wild predictions`
};

// ============================================
// 对外 API
// ============================================

/**
 * 获取当前语言设置
 */
function getCurrentLanguage() {
  // 优先使用 APP_STATE.locale
  if (typeof APP_STATE !== 'undefined' && APP_STATE.locale) {
    return APP_STATE.locale;
  }
  // 备用：从 localStorage 读取
  const saved = localStorage.getItem('tarot-locale');
  if (saved && (saved === 'zh' || saved === 'en')) {
    return saved;
  }
  // 默认中文
  return 'zh';
}

/**
 * 获取对应语言的 system prompt
 */
function getSystemPrompt(locale) {
  return SYSTEM_PROMPTS[locale] || SYSTEM_PROMPTS['zh'];
}

/**
 * 发送单牌占卜解读请求
 * @param {string} cardName - 卡牌名称（如"恋人 The Lovers"）
 * @param {string} cardType - 卡牌类型（major/minor）
 * @param {string} question - 用户的问题类型
 * @param {string} readingType - 占卜场景
 * @returns {Promise<string>} AI 解读文本
 */
async function requestTarotReading(cardName, cardType, question, readingType) {
  const locale = getCurrentLanguage();
  const systemPrompt = getSystemPrompt(locale);

  // 统一用英文 prompt，让 AI 生成双语内容
  const userPrompt = `User question: ${question}
Selected scenario: ${readingType}
Card drawn: ${cardName} (${cardType === 'major' ? 'Major Arcana' : 'Minor Arcana'})

Please respond as "Stardust" with BILINGUAL output in the following EXACT format:

[ZH]
【中文解读】
{150-200 words warm interpretation in SIMPLIFIED CHINESE, empathy + card meaning + practical advice, tone like chatting with a friend}
[/ZH]
[EN]
【English Interpretation】
{150-200 words warm interpretation in English, same content as Chinese version, empathy + card meaning + practical advice, tone like chatting with a friend}
[/EN]

IMPORTANT: Follow this exact format. Do not add any other text outside [ZH] and [EN] tags.`;

  return callClaude(systemPrompt, userPrompt);
}

/**
 * 发送三牌占卜解读请求
 * @param {string[]} cards - 3 张卡牌名称
 * @param {string} question - 用户问题
 * @param {string} readingType - 占卜场景
 * @returns {Promise<string>} AI 解读文本
 */
async function requestThreeCardReading(cards, question, readingType) {
  const locale = getCurrentLanguage();
  const systemPrompt = getSystemPrompt(locale);
  const [past, present, future] = cards;

  // 统一用英文 prompt，让 AI 生成双语内容
  const userPrompt = `User question: ${question}
Reading scenario: ${readingType}
Three cards:
- Past (Foundation): ${past}
- Present (Core Challenge): ${present}
- Future (Guidance): ${future}

Please respond as "Stardust" with BILINGUAL output in the following EXACT format:

[ZH]
【三牌解读】
【回顾过去】{解读 ${past} 在用户感情中的影响，100-150字中文}
【面对现在】{解读 ${present} 代表的现状，100-150字中文}
【指引未来】{解读 ${future} 指向的方向和实用建议，100-150字中文}
语气温暖如朋友聊天
[/ZH]
[EN]
【Three-Card Reading】
【Past】{Interpretation of ${past}'s influence on the user's feelings, 100-150 words}
【Present】{Interpretation of what ${present} represents in the current situation, 100-150 words}
【Future】{Interpretation of what ${future} points to, with practical advice, 100-150 words}
Warm tone like chatting with a friend
[/EN]

IMPORTANT: Follow this exact format. Do not add any other text outside [ZH] and [EN] tags.`;

  return callClaude(systemPrompt, userPrompt);
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

// 暴露给全局
window.TarotAPI = {
  requestTarotReading,
  requestThreeCardReading,
  parseBilingualResponse, // 导出解析函数供其他模块使用
};
window.callClaude = callClaude;

/**
 * 解析双语响应内容
 * @param {string} response - AI 返回的原始双语文本 [ZH]...[/ZH][EN]...[/EN]
 * @returns {{zh: string, en: string, original: string}}
 */
function parseBilingualResponse(response) {
  const result = { zh: '', en: '', original: response };

  // 调试日志
  console.log('[parseBilingualResponse] Raw response:', response.substring(0, 300));

  // 清理响应中的嵌套标签问题
  // 如果有嵌套的 [ZH] 或 [EN] 标签（AI 错误输出），先清理
  let cleaned = response;

  // 移除内部嵌套的标签（如 [ZH] 里面有 [ZH]...[/ZH]）
  // 策略：找到最外层的 [ZH]...[/ZH] 和 [EN]...[/EN]
  // 如果提取的内容里面还包含标签，继续清理

  /**
   * 递归清理嵌套标签，只保留最内层的内容
   */
  function extractContent(text, tag) {
    const tagRe = new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, 'i');
    let match = text.match(tagRe);
    if (!match) return '';

    let content = match[1].trim();
    // 如果内容中还有同类标签，继续提取
    while (content.includes(`[${tag}]`) || content.includes(`[/${tag}]`)) {
      const innerMatch = content.match(tagRe);
      if (innerMatch) {
        content = innerMatch[1].trim();
      } else {
        break;
      }
    }
    return content;
  }

  result.zh = extractContent(cleaned, 'ZH');
  result.en = extractContent(cleaned, 'EN');

  console.log('[parseBilingualResponse] Chinese extracted:', result.zh.substring(0, 100));
  console.log('[parseBilingualResponse] English extracted:', result.en.substring(0, 100));

  // 如果提取失败，尝试更宽松的匹配
  if (!result.zh || !result.en) {
    console.warn('[parseBilingualResponse] Extract failed, trying loose match');
    // 直接搜索中文和英文字符
    const chineseMatch = response.match(/[\u4e00-\u9fa5]{4,}/);
    const englishMatch = response.match(/[a-zA-Z]{4,}/);

    if (!result.zh && chineseMatch) {
      // 找到中文字符，尝试提取周围的内容
      const zhIndex = response.indexOf(chineseMatch[0]);
      // 往前找 [ZH]，往后找 [/ZH]
      const zhStart = response.lastIndexOf('[ZH]', zhIndex);
      const zhEnd = response.indexOf('[/ZH]', zhIndex);
      if (zhStart !== -1 && zhEnd !== -1) {
        result.zh = response.substring(zhStart + 5, zhEnd).trim();
      }
    }

    if (!result.en && englishMatch) {
      // 找到英文字符，尝试提取周围的内容
      const enIndex = response.indexOf(englishMatch[0]);
      const enStart = response.lastIndexOf('[EN]', enIndex);
      const enEnd = response.indexOf('[/EN]', enIndex);
      if (enStart !== -1 && enEnd !== -1) {
        result.en = response.substring(enStart + 5, enEnd).trim();
      }
    }
  }

  // 最终 fallback
  if (!result.zh) {
    result.zh = response;
  }
  if (!result.en) {
    result.en = result.zh;
  }

  return result;
}

/**
 * Cloudflare Workers — 智谱 AI (Zhipu) API 代理
 *
 * 部署方式：
 * 1. cd api/claude-proxy
 * 2. npm install -g wrangler
 * 3. wrangler login
 * 4. wrangler secret put ZHIPU_API_KEY
 *    → 粘贴你的智谱 AI API Key
 * 5. wrangler deploy
 *
 * API 文档：https://open.bigmodel.cn/dev/api
 */

const API_BASE = 'https://open.bigmodel.cn/api/paas/v4';

export default {
  async fetch(request, env, ctx) {
    // 仅允许 POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: '仅支持 POST 请求' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 获取 API Key
    const apiKey = env.ZHIPU_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: '服务器未配置 API Key' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = await request.json();
      const { system, message, max_tokens = 500, temperature = 0.8, model = 'glm-4-flash' } = body;

      // 构建消息格式（OpenAI 兼容）
      const messages = [];
      if (system) {
        messages.push({ role: 'system', content: system });
      }
      messages.push({ role: 'user', content: message });

      // 调用智谱 API
      const apiResponse = await fetch(`${API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: max_tokens,
          temperature: temperature,
        }),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        return new Response(
          JSON.stringify({ error: `智谱 API 错误：${apiResponse.status}`, detail: errorText }),
          { status: apiResponse.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const data = await apiResponse.json();

      // 提取 AI 回复
      const responseText = data.choices?.[0]?.message?.content || '';

      return new Response(JSON.stringify({ response: responseText }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('[Zhipu Proxy] Error:', err);
      return new Response(
        JSON.stringify({ error: '代理请求失败', detail: err.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};

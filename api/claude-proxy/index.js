/**
 * Cloudflare Workers — Claude API 代理
 *
 * 部署方式：
 * 1. cd api/claude-proxy
 * 2. npm install -g wrangler
 * 3. wrangler login
 * 4. wrangler secret put ANTHROPIC_API_KEY
 *    → 粘贴你的 Claude API Key
 * 5. wrangler deploy
 *
 * 环境变量：
 * - ANTHROPIC_API_KEY: Claude API Key（必填，通过 wrangler secret 设置）
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

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
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: '服务器未配置 API Key' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = await request.json();
      const { system, message, max_tokens = 500, temperature = 0.8 } = body;

      // 构建 Anthropic API 请求
      const apiResponse = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens,
          temperature,
          system,
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
        }),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        return new Response(
          JSON.stringify({ error: `Claude API 错误：${apiResponse.status}`, detail: errorText }),
          { status: apiResponse.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const data = await apiResponse.json();

      // 提取 AI 回复
      const responseText =
        data.content?.[0]?.type === 'text'
          ? data.content[0].text
          : JSON.stringify(data);

      return new Response(JSON.stringify({ response: responseText }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('[Claude Proxy] Error:', err);
      return new Response(
        JSON.stringify({ error: '代理请求失败', detail: err.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};

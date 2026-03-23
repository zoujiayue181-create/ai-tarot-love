/**
 * Cloudflare Workers — Google Gemini API 代理
 *
 * 部署方式：
 * 1. cd api/claude-proxy
 * 2. npm install -g wrangler
 * 3. wrangler login
 * 4. wrangler secret put GEMINI_API_KEY
 *    → 粘贴你的 Google Gemini API Key
 * 5. wrangler deploy
 *
 * API 文档：https://ai.google.dev/tutorials/rest_quickstart
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

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
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: '服务器未配置 API Key' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = await request.json();
      const { system, message, max_tokens = 500, temperature = 0.8 } = body;

      // 构建 Gemini API 请求
      const apiUrl = `${GEMINI_API_URL}?key=${apiKey}`;
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: message }],
            },
          ],
          systemInstruction: {
            parts: [{ text: system }],
          },
          generationConfig: {
            maxOutputTokens: max_tokens,
            temperature: temperature,
          },
        }),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        return new Response(
          JSON.stringify({ error: `Gemini API 错误：${apiResponse.status}`, detail: errorText }),
          { status: apiResponse.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const data = await apiResponse.json();

      // 提取 AI 回复
      const responseText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        JSON.stringify(data);

      return new Response(JSON.stringify({ response: responseText }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('[Gemini Proxy] Error:', err);
      return new Response(
        JSON.stringify({ error: '代理请求失败', detail: err.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};

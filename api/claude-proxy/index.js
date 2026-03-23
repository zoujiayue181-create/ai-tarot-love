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

// CORS 配置
const CORS_ORIGINS = [
  'https://zoujiayue181-create.github.io',
  'https://tarotforu.shop',
];

function getCorsHeaders(origin) {
  const allowedOrigin = CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function handleOptions(request) {
  const origin = request.headers.get('Origin') || '';
  const corsHeaders = getCorsHeaders(origin);
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = getCorsHeaders(origin);

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // 仅允许 POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: '仅支持 POST 请求' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // 获取 API Key
    const apiKey = env.ZHIPU_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: '服务器未配置 API Key' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
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
          {
            status: apiResponse.status,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      const data = await apiResponse.json();

      // 提取 AI 回复
      const responseText = data.choices?.[0]?.message?.content || '';

      return new Response(JSON.stringify({ response: responseText }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    } catch (err) {
      console.error('[Zhipu Proxy] Error:', err);
      return new Response(
        JSON.stringify({ error: '代理请求失败', detail: err.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
};

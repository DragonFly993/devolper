/**
 * 服务端代持 DashScope API Key，转发 OpenAI 兼容 Chat Completions 请求。
 * 环境变量（在 Netlify 控制台配置，勿提交仓库）：
 * - DASHSCOPE_API_KEY（必填）
 * - APP_SHARED_SECRET（可选；若设置则客户端须带 x-app-secret 头）
 */
const UPSTREAM = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-app-secret, X-App-Secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: 'Method Not Allowed' } }),
    };
  }

  const expectedSecret = process.env.APP_SHARED_SECRET;
  if (expectedSecret) {
    const sent =
      event.headers['x-app-secret'] ||
      event.headers['X-App-Secret'] ||
      event.headers['x-app-secret'];
    if (sent !== expectedSecret) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: { message: 'Unauthorized' } }),
      };
    }
  }

  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey || !String(apiKey).trim()) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: 'Server missing DASHSCOPE_API_KEY' } }),
    };
  }

  let res;
  try {
    res = await fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${String(apiKey).trim()}`,
        'Content-Type': 'application/json',
      },
      body: event.body && event.body.length ? event.body : '{}',
    });
  } catch (e) {
    const msg = e && e.message ? String(e.message) : String(e);
    return {
      statusCode: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: `Upstream fetch failed: ${msg}` } }),
    };
  }

  const text = await res.text();
  const contentType = res.headers.get('content-type') || 'application/json';

  return {
    statusCode: res.status,
    headers: {
      ...corsHeaders,
      'Content-Type': contentType,
    },
    body: text,
  };
};

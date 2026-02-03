// Vercel Edge Function - 代理 Tushare Pro API
export default async function handler(request) {
  // 只允许 POST 请求
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 从请求体获取 Tushare API 参数
    const body = await request.json();
    const { api_name, token, params, fields } = body;

    // 调用 Tushare Pro API
    const response = await fetch('https://api.tushare.pro/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_name,
        token,
        params,
        fields
      })
    });

    const data = await response.json();

    // 返回 Tushare Pro 的响应
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({
      code: -1,
      msg: 'Server error: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const config = {
  runtime: 'edge'
};

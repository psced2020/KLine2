// Vercel 无服务器函数 - 代理 Tushare Pro API
export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 从请求体获取 Tushare API 参数
    const { api_name, token, params, fields } = req.body;

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
    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      code: -1,
      msg: 'Server error: ' + error.message
    });
  }
}

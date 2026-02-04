// Vercel Edge Function - 获取本地K线数据

// 股票代码映射：前端输入的代码 -> 本地文件名
function getFileName(code) {
  const codeNum = code.padStart(6, '0');

  // 判断是上海还是深圳
  const market = codeNum.startsWith('6') || codeNum.startsWith('5') || codeNum.startsWith('688')
    ? 'SH'
    : 'SZ';

  return `${market}${codeNum}.txt.json`;
}

// 解析本地txt文件
function parseKlineData(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 3) return [];

  // 第1行：股票信息，第2行：表头，从第3行开始是数据
  const dataLines = lines.slice(2);

  return dataLines.map(line => {
    const parts = line.trim().split(',');
    if (parts.length < 6) return null;

    const date = parts[0];
    const open = parseFloat(parts[1]);
    const high = parseFloat(parts[2]);
    const low = parseFloat(parts[3]);
    const close = parseFloat(parts[4]);
    const volume = parseFloat(parts[5]);

    if (!date || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
      return null;
    }

    return { date, open, high, low, close, volume };
  }).filter(item => item !== null);
}

export default async function handler(request) {
  // 设置CORS头
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // 处理OPTIONS请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  // 只允许GET请求
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers
    });
  }

  try {
    // 获取股票代码参数
    const url = new URL(request.url);
    const code = url.searchParams.get('code') || '600000';

    const fileName = getFileName(code);

    // 读取JSON格式的数据文件
    const fileResponse = await fetch(new URL(`../data/${fileName}`, import.meta.url));
    if (!fileResponse.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `无法读取股票数据: ${fileName}`
      }), {
        status: 404,
        headers
      });
    }

    const jsonData = await fileResponse.json();

    // 解析数据
    const klineData = parseKlineData(jsonData.content);

    return new Response(JSON.stringify({
      success: true,
      data: klineData,
      stockName: jsonData.stockName
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('读取数据失败:', error.message);
    return new Response(JSON.stringify({
      success: false,
      error: `无法读取股票数据: ${error.message}`
    }), {
      status: 500,
      headers
    });
  }
}

export const config = {
  runtime: 'edge'
};

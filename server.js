import http from 'http'
import fs from 'fs'
import path from 'path'
import iconv from 'iconv-lite'
import zlib from 'zlib'
import { promisify } from 'util'

const gunzip = promisify(zlib.gunzip)

// 数据目录 - 指向项目中的data文件夹
const DATA_DIR = path.join(import.meta.dirname, 'data')

// 股票代码映射：前端输入的代码 -> 本地文件名
function getFileName(code) {
  const codeNum = code.padStart(6, '0')

  // 判断是上海还是深圳
  const market = codeNum.startsWith('6') || codeNum.startsWith('5') || codeNum.startsWith('688')
    ? 'SH'
    : 'SZ'

  return `${market}${codeNum}.txt.gz`
}

// 解析本地txt文件
function parseKlineData(content) {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length < 3) return []

  // 第1行：股票信息，第2行：表头，从第3行开始是数据
  const dataLines = lines.slice(2)

  return dataLines.map(line => {
    const parts = line.trim().split(',')
    if (parts.length < 6) return null

    const date = parts[0]
    const open = parseFloat(parts[1])
    const high = parseFloat(parts[2])
    const low = parseFloat(parts[3])
    const close = parseFloat(parts[4])
    const volume = parseFloat(parts[5])

    if (!date || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
      return null
    }

    return { date, open, high, low, close, volume }
  }).filter(item => item !== null)
}

// 创建服务器
const server = http.createServer(async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  // 解析请求
  const url = new URL(req.url, `http://localhost:${server.address().port}`)
  const pathname = url.pathname

  // 获取本地K线数据
  if (pathname === '/api/stock') {
    const searchParams = url.searchParams
    const code = searchParams.get('code') || '600000'

    try {
      const fileName = getFileName(code)
      const filePath = path.join(DATA_DIR, fileName)

      console.log(`读取数据: ${filePath}`)

      // 读取gzip压缩的本地文件
      const gzBuffer = fs.readFileSync(filePath)
      // 解压gzip
      const decompressed = await gunzip(gzBuffer)
      // 转换GBK编码
      const content = iconv.decode(decompressed, 'GBK')

      // 解析数据
      const klineData = parseKlineData(content)

      // 提取股票名称（从第1行）
      const lines = content.split('\n')
      const stockInfo = lines[0]?.trim() || ''

      res.setHeader('Content-Type', 'application/json')
      res.writeHead(200)
      res.end(JSON.stringify({
        success: true,
        data: klineData,
        stockName: stockInfo
      }))
    } catch (error) {
      console.error('读取数据失败:', error.message)
      res.writeHead(404)
      res.end(JSON.stringify({
        success: false,
        error: `无法读取股票数据: ${error.message}`
      }))
    }
  } else {
    res.writeHead(404)
    res.end(JSON.stringify({ error: 'Not found' }))
  }
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`本地数据服务器运行在 http://localhost:${PORT}`)
  console.log(`数据目录: ${DATA_DIR}`)
  console.log(`支持接口: http://localhost:${PORT}/api/stock?code=600000`)
})

import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import zlib from 'zlib';
import { promisify } from 'util';

const gunzip = promisify(zlib.gunzip);

const DATA_DIR = path.join(process.cwd(), 'data');

async function convertGzToJson() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.gz'));

  console.log(`找到 ${files.length} 个gz文件`);

  for (const file of files) {
    try {
      const gzPath = path.join(DATA_DIR, file);
      const jsonPath = path.join(DATA_DIR, file.replace('.gz', '.json'));

      // 检查是否已转换
      if (fs.existsSync(jsonPath)) {
        continue;
      }

      // 读取gz文件
      const gzBuffer = fs.readFileSync(gzPath);
      const decompressed = await gunzip(gzBuffer);

      // 转换GBK为UTF-8
      const content = iconv.decode(decompressed, 'GBK');

      // 解析数据
      const lines = content.split('\n').filter(line => line.trim());
      const stockInfo = lines[0]?.trim() || '';
      const dataLines = lines.slice(2);

      const data = dataLines.map(line => {
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

      // 保存为JSON
      const jsonData = {
        stockName: stockInfo,
        content: content,
        data: data
      };

      fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');

      console.log(`✓ ${file} -> ${path.basename(jsonPath)}`);

    } catch (error) {
      console.error(`✗ ${file}: ${error.message}`);
    }
  }

  console.log('\n转换完成！');

  // 删除gz文件
  const gzFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.gz'));
  console.log(`删除 ${gzFiles.length} 个gz文件...`);
  gzFiles.forEach(file => {
    fs.unlinkSync(path.join(DATA_DIR, file));
  });

  console.log('✓ 清理完成');
}

convertGzToJson().catch(console.error);

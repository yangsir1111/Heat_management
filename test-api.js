import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取一个示例图片并转换为base64
const imagePath = path.join(__dirname, 'test-image.jpg');
if (fs.existsSync(imagePath)) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
  
  // 测试API
  fetch('http://localhost:3001/api/image/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64Image
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('API响应:', JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('API调用错误:', error);
  });
} else {
  console.log('未找到测试图片，请提供一张食物图片用于测试');
  console.log('请将图片命名为 test-image.jpg 并放在项目根目录下');
}
// 通义千问VL-Plus模型测试脚本
// 这个脚本用于测试食物图片识别功能是否正常工作

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 等待一段时间的辅助函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 将图片文件转换为base64格式
function fileToBase64(filePath) {
  try {
    const fileData = fs.readFileSync(filePath);
    const base64Image = Buffer.from(fileData).toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.error('读取图片文件失败:', error);
    throw error;
  }
}

// 测试本地API调用
async function testLocalApi() {
  console.log('\n===== 测试本地API调用 =====');
  
  try {
    // 检查服务器健康状态
    console.log('检查服务器健康状态...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'OK') {
      console.log('✅ 服务器运行正常');
      console.log('  - API密钥配置:', healthData.apiKeyConfigured ? '已配置' : '未配置');
      console.log('  - AI客户端初始化:', healthData.aiClientInitialized ? '已初始化' : '未初始化');
      console.log('  - 服务器运行时间:', (healthData.uptime / 60).toFixed(2), '分钟');
    } else {
      console.error('❌ 服务器健康检查失败:', healthData);
      return false;
    }
    
    // 如果API密钥未配置，提示用户
    if (!healthData.apiKeyConfigured) {
      console.error('❌ 错误: 未配置API密钥，请检查.env文件');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ 连接服务器失败:', error.message);
    console.log('请确保后端服务器已启动: npm run server');
    return false;
  }
}

// 测试食物识别API
async function testFoodRecognition() {
  console.log('\n===== 测试食物识别API =====');
  
  // 这里使用一个假设的测试图片路径
  // 用户需要将测试图片放在项目根目录下的test-image.jpg
  const testImagePath = path.join(__dirname, 'test-image.jpg');
  
  // 检查测试图片是否存在
  if (!fs.existsSync(testImagePath)) {
    console.log('⚠️ 测试图片不存在: test-image.jpg');
    console.log('请将测试用的食物图片重命名为test-image.jpg并放在项目根目录下');
    console.log('或者在控制台输入以下命令生成一个测试用的模拟请求:');
    console.log('  node test-ai.js --simulate');
    return;
  }
  
  try {
    // 转换图片为base64
    console.log('读取并转换测试图片...');
    const base64Image = fileToBase64(testImagePath);
    
    console.log('调用食物识别API...');
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3001/api/image/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image })
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    const result = await response.json();
    
    console.log(`请求完成，耗时: ${duration.toFixed(2)}秒`);
    
    if (result.success) {
      console.log('✅ 识别成功！');
      console.log('识别结果:');
      console.log(`  - 食物名称: ${result.food.name}`);
      console.log(`  - 热量: ${result.food.nutrition.calories}`);
      console.log(`  - 蛋白质: ${result.food.nutrition.protein}`);
      console.log(`  - 碳水化合物: ${result.food.nutrition.carbs}`);
      console.log(`  - 脂肪: ${result.food.nutrition.fat}`);
      console.log(`  - GI值: ${result.food.gi_value}`);
      console.log(`  - 适合糖尿病患者: ${result.food.suitable_for_diabetes}`);
      console.log(`  - 健康建议: ${result.food.recommendation}`);
      
      // 保存结果到文件
      const resultFile = path.join(__dirname, 'recognition-result.json');
      fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
      console.log(`\n识别结果已保存到: ${resultFile}`);
    } else {
      console.error('❌ 识别失败:', result.error);
    }
  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message);
  }
}

// 模拟食物识别请求（用于没有实际图片的情况）
async function simulateFoodRecognition() {
  console.log('\n===== 模拟食物识别请求 =====');
  
  try {
    // 创建一个模拟的base64图片数据（很小的占位符）
    const mockBase64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9Uu1KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/9k=';
    
    console.log('发送模拟请求...');
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3001/api/image/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: mockBase64Image })
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    const result = await response.json();
    
    console.log(`请求完成，耗时: ${duration.toFixed(2)}秒`);
    
    if (result.success) {
      console.log('✅ API调用成功！');
      console.log('服务器返回:', result);
    } else {
      console.error('❌ API调用失败:', result.error);
    }
  } catch (error) {
    console.error('❌ 模拟请求出错:', error.message);
  }
}

// 主函数
async function main() {
  console.log('\n===== 通义千问VL-Plus模型测试工具 =====');
  console.log('这个工具用于测试食物识别API是否正常工作\n');
  
  // 解析命令行参数
  const args = process.argv.slice(2);
  const simulateMode = args.includes('--simulate') || args.includes('-s');
  
  // 首先检查服务器是否运行正常
  const serverReady = await testLocalApi();
  
  if (serverReady) {
    // 等待一小段时间，确保AI客户端完全初始化
    console.log('\n等待AI客户端初始化...');
    await sleep(1000);
    
    if (simulateMode) {
      await simulateFoodRecognition();
    } else {
      await testFoodRecognition();
    }
  }
  
  console.log('\n===== 测试完成 =====\n');
}

// 运行主函数
main().catch(err => {
  console.error('测试工具运行失败:', err);
  process.exit(1);
});
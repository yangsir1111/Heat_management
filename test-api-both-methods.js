import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';

// 配置
const BASE_URL = 'http://localhost:3001';
const API_KEY = process.env.DASHSCOPE_API_KEY || 'sk-9f00e62842424f97ad3dc231b99adbfd';

// 模拟的base64图像数据（实际使用时应替换为真实图像的base64编码）
const mockBase64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// 测试GET请求 - 由于GET请求不适合传输大型图像数据，我们将使用query参数传递小型图像或模拟数据
async function testGetRequest() {
  console.log('\n=== 测试GET请求 ===');
  try {
    const response = await fetch(`${BASE_URL}/api/recognize-food?mode=test&format=json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    const data = await response.json();
    console.log('GET请求成功，响应:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('GET请求失败:', error);
  }
}

// 测试POST请求 - 用于传输真实的图像数据
async function testPostRequest() {
  console.log('\n=== 测试POST请求 ===');
  try {
    const response = await fetch(`${BASE_URL}/api/recognize-food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        base64Image: mockBase64Image
      })
    });
    
    const data = await response.json();
    console.log('POST请求成功，响应:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('POST请求失败:', error);
  }
}

// 测试DashScope原生API调用方式
async function testDashScopeNativeCall() {
  console.log('\n=== 测试DashScope原生API调用 ===');
  try {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-vl-plus',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: '请识别图片中的食物，并返回食物名称、估计卡路里、GI值、是否适合糖尿病患者食用、健康建议和详细的营养成分信息。请使用JSON格式返回结果，不要包含其他无关文字。'
                },
                {
                  type: 'image',
                  image: mockBase64Image
                }
              ]
            }
          ]
        },
        parameters: {
          result_format: 'message'
        }
      })
    });
    
    const data = await response.json();
    console.log('DashScope原生调用成功，响应:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('DashScope原生调用失败:', error);
  }
}

// 读取本地图片并转换为base64（可选功能）
async function getLocalImageBase64(imagePath) {
  try {
    const imageData = await fs.readFile(imagePath);
    return imageData.toString('base64');
  } catch (error) {
    console.error('读取图片失败:', error);
    return mockBase64Image;
  }
}

// 运行所有测试
async function runTests() {
  console.log(`开始测试API调用，基础URL: ${BASE_URL}`);
  
  // 首先测试健康检查端点
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('健康检查成功:', healthData);
  } catch (error) {
    console.error('健康检查失败:', error);
    console.log('服务器可能未运行，请确保先启动服务器: npm run server');
    return;
  }
  
  // 运行各项测试
  await testPostRequest();
  await testGetRequest();
  // 可选：测试DashScope原生API调用（需要真实的API密钥）
  // if (API_KEY && API_KEY !== 'placeholder') {
  //   await testDashScopeNativeCall();
  // } else {
  //   console.log('\n跳过DashScope原生API调用测试（API密钥无效）');
  // }
}

// 执行测试
runTests().catch(console.error);
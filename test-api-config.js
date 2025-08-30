// 测试API配置和网络连接的脚本
import { access, readFile } from 'fs/promises';

// 打印环境变量配置情况
console.log('=== 环境变量配置检查 ===');
console.log('VITE_DASHSCOPE_API_KEY配置情况:', process.env.VITE_DASHSCOPE_API_KEY || '未配置');
console.log('API密钥是否以sk-开头:', process.env.VITE_DASHSCOPE_API_KEY?.startsWith('sk-') || false);

// 测试网络连接到通义千问API
const testNetworkConnection = async () => {
  try {
    console.log('\n=== 网络连接测试 ===');
    console.log('正在测试连接到通义千问API...');
    
    const startTime = Date.now();
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'HEAD', // 只发送HEAD请求，不获取完整内容
      signal: AbortSignal.timeout(10000), // 10秒超时
    });
    
    const endTime = Date.now();
    console.log(`连接成功！状态码: ${response.status}`);
    console.log(`响应时间: ${endTime - startTime}ms`);
    console.log('网络连接测试通过 ✅');
    
  } catch (error) {
    console.error('网络连接测试失败 ❌');
    console.error('错误信息:', error.message);
    console.log('\n可能的原因:');
    console.log('1. 网络连接问题');
    console.log('2. 防火墙或代理限制');
    console.log('3. API服务暂时不可用');
  }
};

// 检查项目中的.env文件是否存在
const checkEnvFile = async () => {
  console.log('\n=== .env文件检查 ===');
  try {
    await access('.env');
    console.log('.env文件已存在');
    
    try {
      const envContent = await readFile('.env', 'utf8');
      const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      console.log(`.env文件包含 ${lines.length} 个有效配置项`);
      
      // 检查是否包含正确的API密钥配置
      const hasCorrectApiKey = lines.some(line => 
        line.startsWith('VITE_DASHSCOPE_API_KEY=') && 
        line.substring('VITE_DASHSCOPE_API_KEY='.length).startsWith('sk-')
      );
      
      console.log('是否包含正确格式的VITE_DASHSCOPE_API_KEY:', hasCorrectApiKey);
      
      if (!hasCorrectApiKey) {
        console.log('\n建议修改.env文件，添加正确的API密钥配置:');
        console.log('VITE_DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx');
      }
    } catch (err) {
      console.error('读取.env文件内容失败:', err.message);
    }
  } catch (err) {
    console.log('.env文件不存在');
    console.log('\n请创建.env文件并添加以下内容:');
    console.log('VITE_DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx');
  }
};

// 运行测试
console.log('\n开始运行测试...\n');
await checkEnvFile();
await testNetworkConnection();
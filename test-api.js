import fetch from 'node-fetch';

// 测试API的函数
async function testRecognizeFoodAPI() {
  try {
    const response = await fetch('http://localhost:3001/api/recognize-food', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base64Image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      })
    });
    
    const data = await response.json();
    console.log('API调用成功!');
    console.log('响应:', data);
  } catch (error) {
    console.error('API调用失败:', error.message);
  }
}

// 运行测试
console.log('开始测试API...');
testRecognizeFoodAPI().then(() => {
  console.log('测试完成');
});
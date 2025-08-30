import fetch from 'node-fetch';
import fs from 'fs';

// 测试通过foodName参数获取特定食物数据的功能
async function testFoodNameParameter() {
  console.log('==== 测试foodName参数功能 ====');
  
  // 测试用例1：测试一个存在的食物名称
  const foodNamesToTest = ['苹果', '鸡胸肉', '米饭', '酸奶', '西兰花'];
  
  for (const foodName of foodNamesToTest) {
    try {
      console.log(`\n测试食物名称: ${foodName}`);
      
      // 发送GET请求，指定食物名称
      const response = await fetch(
        `http://localhost:3001/api/recognize-food?mode=test&foodName=${encodeURIComponent(foodName)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        console.error(`请求失败: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`响应状态: ${data.success}`);
      console.log(`返回的食物: ${data.data?.food_name}`);
      console.log(`是否通过名称匹配: ${data.matchedByName}`);
      console.log(`卡路里估计: ${data.data?.calorie_estimate}`);
      
    } catch (error) {
      console.error(`测试${foodName}时发生错误:`, error);
    }
  }
  
  // 测试用例2：测试不存在的食物名称
  try {
    console.log('\n测试不存在的食物名称: 太空汉堡');
    const response = await fetch(
      'http://localhost:3001/api/recognize-food?mode=test&foodName=太空汉堡',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    console.log(`响应状态: ${data.success}`);
    console.log(`返回的食物: ${data.data?.food_name}`);
    console.log(`是否通过名称匹配: ${data.matchedByName}`);
    console.log(`模拟类别: ${data.mockCategory}`);
    
  } catch (error) {
    console.error('测试不存在的食物名称时发生错误:', error);
  }
  
  // 测试用例3：POST请求中使用foodName参数
  try {
    console.log('\n测试POST请求中使用foodName参数: 西兰花');
    const response = await fetch('http://localhost:3001/api/recognize-food', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base64Image: 'dummyBase64Image',
        foodName: '西兰花'
      })
    });
    
    const data = await response.json();
    console.log(`响应状态: ${data.success}`);
    console.log(`返回的食物: ${data.data?.food_name}`);
    console.log(`是否通过名称匹配: ${data.matchedByName}`);
    
  } catch (error) {
    console.error('测试POST请求中使用foodName参数时发生错误:', error);
  }
}

// 运行测试
testFoodNameParameter().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
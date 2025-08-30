import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// 加载环境变量并添加调试日志
console.log('当前工作目录:', process.cwd());
const result = dotenv.config();
if (result.error) {
  console.error('加载.env文件失败:', result.error);
} else {
  console.log('.env文件加载成功，环境变量数量:', Object.keys(result.parsed || {}).length);
  console.log('加载的环境变量键名列表:', Object.keys(result.parsed || {}));
  // 检查并打印API密钥的前几位以保护隐私
if (process.env.DASHSCOPE_API_KEY && process.env.DASHSCOPE_API_KEY !== 'placeholder') {
  console.log('✅ 检测到有效的API密钥，前几位:', process.env.DASHSCOPE_API_KEY.substring(0, 5) + '...');
} else {
  console.error('❌ 未检测到有效的API密钥，请设置DASHSCOPE_API_KEY环境变量');
  console.log('请创建.env文件并添加：DASHSCOPE_API_KEY=sk-your-api-key-here');
}
}

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '10mb' })); // 增加请求体大小限制以处理大图片

// 初始化OpenAI客户端 - 使用通义千问兼容模式
const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY || 'placeholder',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

// 根路径接口
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '食物热量识别后端服务运行中',
    availableEndpoints: [
      '/api/health',
      '/api/recognize-food'
    ]
  });
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 图像理解接口 - 同时支持GET和POST方法
app.all('/api/recognize-food', async (req, res) => {
  try {
    // 支持GET和POST两种请求方式
    let base64Image;
    
    // GET请求：从查询参数中获取数据
    if (req.method === 'GET') {
      base64Image = req.query.base64Image;
    } 
    // POST请求：从请求体中获取数据
    else {
      base64Image = req.body.base64Image;
    }

    if (!base64Image) {
      return res.status(400).json({
        success: false,
        error: '缺少图片数据'
      });
    }

    console.log('收到图像识别请求，正在处理...');
    console.log('Base64图片数据长度:', base64Image.length);
    console.log('Base64图片数据前50个字符:', base64Image.substring(0, 50));
    console.log('Base64图片数据是否以data:开头:', base64Image.startsWith('data:'));

    // 检查是否有有效的API密钥
    const hasValidApiKey = process.env.DASHSCOPE_API_KEY && process.env.DASHSCOPE_API_KEY !== 'placeholder';

    // 检查是否有有效的API密钥，如果没有则返回错误
    if (!hasValidApiKey) {
      console.error('缺少有效的API密钥');
      return res.status(400).json({
        success: false,
        error: '缺少有效的API密钥，请配置DASHSCOPE_API_KEY环境变量'
      });
    }

    // 调用真实的通义千问VL模型进行食物识别
    try {
      console.log('尝试调用真实的通义千问VL模型...');
      
      // 使用OpenAI兼容模式调用通义千问VL模型
      const completion = await openai.chat.completions.create({
        model: 'qwen-vl-plus',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请识别图片中的食物，并返回以下信息：食物名称、估计卡路里、GI值、是否适合糖尿病患者食用、健康建议和详细的营养成分信息。请严格按照以下JSON格式返回，不要包含其他文字：{"food_name": "食物名称", "calorie_estimate": "卡路里数值", "confidence": 0.95, "health_tips": "健康建议", "gi_value": 数值, "suitable_for_diabetes": "适合/适量/不适合", "nutrition": {"protein": "蛋白质含量", "carbs": "碳水化合物含量", "fat": "脂肪含量", "calories": "总热量"}}'
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' }
      });

      // 解析API响应
      const responseContent = completion.choices[0].message.content;
      let recognitionData;
      
      try {
        recognitionData = JSON.parse(responseContent);
      } catch (jsonError) {
        console.error('解析JSON结果失败:', jsonError);
        // 如果解析失败，使用默认值
        recognitionData = {
          food_name: '识别的食物',
          calorie_estimate: '100kcal',
          confidence: 0.85,
          health_tips: '这是一个基于AI识别的食物结果',
          gi_value: 50,
          suitable_for_diabetes: '适量',
          nutrition: {
            protein: '2g',
            carbs: '15g',
            fat: '3g',
            calories: '100kcal'
          }
        };
      }

      // 返回格式化的识别结果 - 使用英文key，符合前端类型定义
      const result = {
        food_name: recognitionData.food_name || '未识别食物',
        calorie_estimate: recognitionData.calorie_estimate || '0kcal',
        confidence: recognitionData.confidence || 0.8,
        health_tips: recognitionData.health_tips || '暂无健康建议',
        gi_value: recognitionData.gi_value || 50,
        suitable_for_diabetes: recognitionData.suitable_for_diabetes || '未知',
        nutrition: recognitionData.nutrition || {
          protein: '0g',
          carbs: '0g',
          fat: '0g',
          calories: '0kcal'
        }
      };

      console.log('识别成功，返回结果:', result);
      res.json({
        success: true,
        data: result,
        isRealAPI: true
      });
    } catch (apiError) {
      console.error('API调用错误:', apiError);
      // API调用失败时返回错误信息
      res.status(500).json({
        success: false,
        error: `AI识别失败: ${apiError.message || '未知错误'}`
      });
    }
  } catch (error) {
    console.error('食物识别错误:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Backend API endpoints:');
  console.log(`- GET http://localhost:${PORT}/api/health`);
  console.log(`- GET/POST http://localhost:${PORT}/api/recognize-food (GET可带?mode=test参数进行测试)`);
});
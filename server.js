import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 获取当前文件的目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// 延迟初始化OpenAI客户端
let openaiClient = null;
let openaiInitialized = false;
let initializationPromise = null;

// 初始化OpenAI客户端的函数
async function initializeOpenAIClient() {
  if (openaiInitialized) {
    return openaiClient;
  }
  
  if (!initializationPromise) {
    initializationPromise = new Promise(async (resolve, reject) => {
      try {
        const { default: OpenAI } = await import('openai');
        openaiClient = new OpenAI({
          apiKey: process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY,
          baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        });
        openaiInitialized = true;
        console.log('OpenAI客户端初始化成功');
        resolve(openaiClient);
      } catch (error) {
        console.error('OpenAI客户端初始化失败:', error);
        reject(error);
      }
    });
  }
  
  return initializationPromise;
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    apiKeyConfigured: !!process.env.DASHSCOPE_API_KEY || !!process.env.OPENAI_API_KEY,
    aiClientInitialized: openaiInitialized
  });
});

// 食物识别端点
app.post('/api/image/analyze', async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        error: '缺少图像数据'
      });
    }
    
    // 检查API密钥是否配置
    if (!process.env.DASHSCOPE_API_KEY && !process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: '未配置API密钥，请检查.env文件'
      });
    }
    
    // 确保OpenAI客户端已初始化
    let openai;
    try {
      openai = await initializeOpenAIClient();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'AI客户端初始化失败，请稍后重试'
      });
    }
    
    // 调用DashScope QwenVL模型进行图像分析
    console.log('开始调用通义千问VL-Plus模型进行图像分析...');
    const response = await openai.chat.completions.create({
      model: "qwen-vl-plus",
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: "请分析这张图片中的食物，返回JSON格式的数据，包括：食物名称、GI数值、是否适合糖尿病患者食用（是/否）、食用建议、营养成分（蛋白质、碳水化合物、脂肪、热量）。请以以下JSON格式返回：{ \"food_name\": \"\", \"gi_value\": 0, \"suitable_for_diabetes\": \"是/否\", \"recommendation\": \"\", \"nutrition\": { \"protein\": \"\", \"carbs\": \"\", \"fat\": \"\", \"calories\": \"\" } }"
          },
          {
            type: "image_url",
            image_url: {
              url: image
            }
          }
        ]
      }],
      temperature: 0.1
    });
    
    // 解析模型返回的结果
    const result = response.choices[0]?.message?.content;
    
    if (!result) {
      console.error('未从AI模型获取到响应');
      return res.status(500).json({
        success: false,
        error: '无法从AI模型获取有效响应'
      });
    }
    
    console.log('AI模型返回结果:', result);
    
    // 尝试解析JSON
    let parsedResult;
    try {
      // 提取JSON部分（如果模型返回了额外的文本）
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        parsedResult = JSON.parse(result);
      }
    } catch (parseError) {
      console.error('JSON解析错误:', parseError);
      // 如果解析失败，返回原始结果
      return res.json({
        success: true,
        raw_response: result
      });
    }
    
    // 验证解析结果并填充默认值
    const foodData = {
      name: parsedResult.food_name || '未知食物',
      gi_value: parsedResult.gi_value || 0,
      suitable_for_diabetes: parsedResult.suitable_for_diabetes || '未知',
      recommendation: parsedResult.recommendation || '无建议',
      nutrition: {
        protein: parsedResult.nutrition?.protein || '未知',
        carbs: parsedResult.nutrition?.carbs || '未知',
        fat: parsedResult.nutrition?.fat || '未知',
        calories: parsedResult.nutrition?.calories || '未知'
      }
    };
    
    // 返回结构化数据
    res.json({
      success: true,
      food: foodData
    });
    
  } catch (error) {
    console.error('食物识别错误:', error);
    
    // 提供更具体的错误信息
    let errorMessage = '食物识别失败';
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorMessage = '无法连接到AI服务，请检查网络连接';
    } else if (error.response?.status === 401) {
      errorMessage = 'API密钥无效，请检查.env文件';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      // 仅在开发环境下包含详细错误信息
      ...(process.env.NODE_ENV !== 'production' && { debug: error.message })
    });
  }
});

// Serve the React app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// Function to start server with port fallback
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`服务器运行在端口 ${port}`);
    console.log(`本地访问: http://localhost:${port}`);
    
    // 检查API密钥配置
    if (!process.env.DASHSCOPE_API_KEY && !process.env.OPENAI_API_KEY) {
      console.warn('警告: 未配置API密钥，请检查.env文件');
    } else {
      console.log('API密钥已配置');
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`端口 ${port} 已被占用，尝试端口 ${port + 1}...`);
      if (port < 3005) { // 限制端口范围
        startServer(port + 1);
      } else {
        console.error('无法找到可用端口，请手动终止占用端口的进程');
      }
    } else {
      console.error('服务器错误:', err);
    }
  });

  // Handle SIGINT (Ctrl+C) gracefully
  process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    server.close(() => {
      console.log('服务器已关闭。');
      process.exit(0);
    });
  });
}

// Start server
startServer(PORT);
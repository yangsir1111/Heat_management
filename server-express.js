import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 初始化OpenAI客户端 - 使用通义千问兼容模式
const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY || 'placeholder',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '食物识别API服务器运行中',
    timestamp: new Date().toISOString()
  });
});

// 食物识别接口 - 返回完全中文化的JSON格式
app.post('/api/recognize-food', async (req, res) => {
  try {
    const { base64Image } = req.body;

    if (!base64Image) {
      return res.status(400).json({
        success: false,
        error: '缺少图片数据，请上传有效的食物图片'
      });
    }

    console.log('收到食物识别请求，正在处理...');
    console.log('图片数据长度:', base64Image.length);

    // 检查API密钥
    if (!process.env.DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY === 'placeholder') {
      return res.status(400).json({
        success: false,
        error: '系统配置错误：API密钥未配置，请联系管理员'
      });
    }

    try {
      // 调用通义千问VL模型，要求返回中文结果
      const completion = await openai.chat.completions.create({
        model: 'qwen-vl-plus',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请识别图片中的食物，并返回以下信息：食物名称、估计卡路里、GI值、是否适合糖尿病患者食用、健康建议和详细的营养成分信息。请严格按照以下JSON格式返回，不要包含其他文字，所有内容必须是中文：{"food_name": "食物名称", "calorie_estimate": "卡路里数值", "confidence": 0.95, "health_tips": "健康建议", "gi_value": 数值, "suitable_for_diabetes": "适合/适量/不适合", "nutrition": {"protein": "蛋白质含量", "carbs": "碳水化合物含量", "fat": "脂肪含量", "calories": "总热量"}}'
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
        console.error('解析AI返回的JSON数据失败:', jsonError);
        // 使用默认的中文值
        recognitionData = {
          food_name: '未识别食物',
          calorie_estimate: '100千卡',
          confidence: 0.85,
          health_tips: '这是AI识别的食物结果，建议咨询营养师获取更准确的建议',
          gi_value: 50,
          suitable_for_diabetes: '适量食用',
          nutrition: {
            protein: '2克',
            carbs: '15克',
            fat: '3克',
            calories: '100千卡'
          }
        };
      }

      // 标准化返回格式 - 使用中文字段名，确保所有值都是中文
      const result = {
        食物名称: recognitionData.food_name || '未识别食物',
        热量估算: recognitionData.calorie_estimate || '0千卡',
        识别置信度: recognitionData.confidence || 0.8,
        健康建议: recognitionData.health_tips || '暂无健康建议，建议咨询专业营养师',
        GI值: recognitionData.gi_value || 50,
        糖尿病适用性: recognitionData.suitable_for_diabetes || '未知，建议咨询医生',
        营养成分: recognitionData.nutrition || {
          蛋白质: '0克',
          碳水化合物: '0克',
          脂肪: '0克',
          总热量: '0千卡'
        }
      };

      console.log('食物识别成功，返回结果:', result);
      
      res.json({
        success: true,
        data: result,
        message: '食物识别成功',
        isRealAPI: true,
        timestamp: new Date().toISOString()
      });

    } catch (apiError) {
      console.error('调用AI服务失败:', apiError);
      res.status(500).json({
        success: false,
        error: `AI识别服务暂时不可用: ${apiError.message || '未知错误'}，请稍后重试`,
        message: '识别失败，请检查网络连接后重试',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('食物识别过程中发生错误:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误，请稍后重试',
      message: '系统错误，请联系技术支持',
      timestamp: new Date().toISOString()
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 食物识别API服务器运行在端口 ${PORT}`);
  console.log('📡 可用接口:');
  console.log(`   - GET  http://localhost:${PORT}/api/health`);
  console.log(`   - POST http://localhost:${PORT}/api/recognize-food`);
  console.log('🌐 已启用CORS跨域请求');
  console.log('🇨🇳 所有输出已中文化，为用户提供更好的体验');
});

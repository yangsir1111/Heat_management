import { RecognitionResult } from '../types';

// 获取API基础URL - 适配不同环境
const getApiBaseUrl = (): string => {
  // 如果在生产环境，使用绝对URL，否则使用相对路径
  // 这样在手机端也能正确连接到后端服务
  if (process.env.NODE_ENV === 'production') {
    // 这里应该替换为实际的生产环境API地址
    return window.location.origin;
  }
  // 开发环境使用相对路径，避免硬编码的localhost
  return '';
};

// 将图片文件转换为base64格式
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// 增强的错误处理函数
function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    // 网络错误处理
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return '网络连接失败，请检查您的网络设置后重试';
    }
    // API错误处理
    if (error.message.includes('API请求失败')) {
      return '服务器暂时无法响应，请稍后再试';
    }
    return error.message;
  }
  return '图片识别失败，请稍后重试';
}

// 带重试机制的fetch函数
async function fetchWithRetry(url: string, options: RequestInit, retries = 2, delay = 1000): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok && retries > 0) {
      // 延迟后重试
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      // 网络错误也重试
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

export const aiService = {
  async recognizeFood(imageFile: File): Promise<RecognitionResult> {
    try {
      // 检查网络连接
      if (!navigator.onLine) {
        throw new Error('网络连接已断开，请连接网络后重试');
      }
      
      // 将图片转换为base64
      const base64Image = await fileToBase64(imageFile);
      
      // 获取API基础URL
      const apiBaseUrl = getApiBaseUrl();
      const apiUrl = `${apiBaseUrl}/api/image/analyze`;
      
      // 发送到后端API进行食物识别，带重试机制
      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 添加跨域请求头
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          image: base64Image
        }),
        // 增加超时设置
        signal: AbortSignal.timeout(30000) // 30秒超时
      });
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '食物识别失败，请确保图片清晰且仅包含食物');
      }
      
      // 转换后端返回的数据格式以匹配前端期望的格式
      return {
        food_name: result.food.name,
        calorie_estimate: result.food.nutrition.calories,
        confidence: 0.95, // 后端未提供置信度，使用默认值
        health_tips: result.food.recommendation,
        gi_value: result.food.gi_value,
        suitable_for_diabetes: result.food.suitable_for_diabetes,
        nutrition: result.food.nutrition
      };
    } catch (error) {
      console.error('食物识别错误:', error);
      const userFriendlyError = handleApiError(error);
      throw new Error(userFriendlyError);
    }
  },

  // 增强的图片压缩函数，提高移动端兼容性
  compressImage(file: File, maxSize: number = 800): Promise<File> {
    return new Promise((resolve) => {
      // 检查文件大小，如果已经很小，直接返回
      if (file.size < 500 * 1024) { // 500KB
        resolve(file);
        return;
      }
      
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        // 处理Canvas不支持的情况
        if (!ctx) {
          resolve(file);
          return;
        }
        
        img.onload = () => {
          try {
            const ratio = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = Math.floor(img.width * ratio);
            canvas.height = Math.floor(img.height * ratio);
            
            // 提高绘制质量
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // 使用较低的压缩质量以减小文件大小，适合移动端网络
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: file.type }));
              } else {
                resolve(file);
              }
            }, file.type, 0.7); // 降低质量以减小文件大小
          } catch (e) {
            console.error('图片处理错误:', e);
            resolve(file);
          }
        };
        
        img.onerror = () => {
          console.error('图片加载失败');
          resolve(file);
        };
        
        img.src = URL.createObjectURL(file);
      } catch (e) {
        console.error('图片压缩异常:', e);
        resolve(file);
      }
    });
  }
};
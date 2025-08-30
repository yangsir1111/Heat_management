import { RecognitionResult } from '../types';

// 获取后端服务基础URL - 适配不同环境
const getBackendBaseUrl = (): string => {
  if (process.env.NODE_ENV === 'production') {
    // 生产环境使用当前域名
    return window.location.origin;
  }
  // 开发环境使用本地后端服务
  return 'http://localhost:3001';
};

// 将图片文件转换为base64格式 - 添加环境检查
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined' || typeof FileReader === 'undefined') {
      console.warn('在非浏览器环境中调用fileToBase64，无法转换图片');
      reject(new Error('无法在当前环境中处理图片'));
      return;
    }
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    } catch (error) {
      console.error('创建FileReader对象失败:', error);
      reject(error);
    }
  });
}

// 增强的错误处理函数 - 提供更具体的错误信息
function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    // 网络错误处理
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') || 
        error.message.includes('网络连接已断开')) {
      return '提示网络问题：请检查您的Wi-Fi或移动数据连接，确保网络信号良好。图片识别需要稳定的网络连接。';
    }
    
    // 超时错误处理
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return '网络请求超时，请检查您的网络速度并确保信号稳定';
    }
    
    // API错误处理
    if (error.message.includes('API请求失败')) {
      if (error.message.includes('401')) {
        return 'API密钥无效，请检查您的.env文件配置';
      } else if (error.message.includes('429')) {
        return '当前API请求过于频繁，请稍后再试';
      } else if (error.message.includes('50')) {
        return '服务器暂时无法响应，请稍后再试';
      }
      return '服务器暂时无法响应，请稍后再试';
    }
    
    // 图片处理错误
    if (error.message.includes('无法在当前环境中处理图片')) {
      return '图片处理失败，请选择其他图片重试';
    }
    
    // API密钥错误
    if (error.message.includes('API密钥未配置')) {
      return '系统配置错误，请联系管理员';
    }
    
    return error.message;
  }
  return '图片识别失败，请检查网络连接后重试';
}

// 增强的带重试机制的fetch函数 - 优化网络稳定性
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1500): Promise<Response> {
  try {
    // 检查网络连接状态
    if (!navigator.onLine) {
      throw new Error('网络连接已断开');
    }
    
    const response = await fetch(url, options);
    
    // 针对特定错误状态码优化重试策略
    const shouldRetry = retries > 0 && (
      !response.ok || 
      response.status === 429 || // 限流
      response.status === 500 || // 服务器错误
      response.status === 502 || // 网关错误
      response.status === 503 || // 服务不可用
      response.status === 504    // 网关超时
    );
    
    if (shouldRetry) {
      console.log(`请求失败，${delay}ms后重试，剩余重试次数: ${retries - 1}`);
      // 延迟后指数退避重试
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2); // 指数退避
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`网络错误，${delay}ms后重试，剩余重试次数: ${retries - 1}`);
      // 网络错误也重试，增加延迟
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const aiService = {
  async recognizeFood(imageFile: File): Promise<RecognitionResult> {
    try {
      // 检查网络连接
      if (!navigator.onLine) {
        throw new Error('网络连接已断开');
      }
      
      // 将图片转换为base64
      const base64Image = await fileToBase64(imageFile);
      
      // 获取后端服务URL
      const backendBaseUrl = getBackendBaseUrl();
      const apiUrl = `${backendBaseUrl}/api/recognize-food`;
      
      // 调试：检查准备发送的数据
      console.log('发送到后端服务:', apiUrl);
      
      // 创建可配置的AbortController用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时，提供更好的用户体验
      
      try {
        const response = await fetchWithRetry(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 添加移动端优化的HTTP头部
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          },
          body: JSON.stringify({ base64Image }),
          signal: controller.signal
        });
        
        // 请求成功，清除超时
        clearTimeout(timeoutId);
        
        console.log('后端服务请求完成，状态码:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.error || `请求失败: ${response.status} ${response.statusText}`;
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || '识别失败');
        }
        
        // 获取后端返回的识别数据
        const recognitionData = result.data;
        
        console.log('识别结果解析成功:', recognitionData);
        
        // 转换后端返回的数据格式以匹配前端期望的格式
        return {
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
      } finally {
        // 确保清除超时定时器
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error('食物识别错误:', error);
      const userFriendlyError = handleApiError(error);
      throw new Error(userFriendlyError);
    }
  },

  // 增强的图片压缩函数，提高移动端兼容性 - 添加环境检查
  compressImage(file: File, maxSize: number = 800): Promise<File> {
    return new Promise((resolve) => {
      // 检查文件大小，如果已经很小，直接返回
      if (file.size < 500 * 1024) { // 500KB
        resolve(file);
        return;
      }
      
      // 检查是否在浏览器环境中
      if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Image === 'undefined') {
        console.warn('在非浏览器环境中调用compressImage，无法压缩图片');
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
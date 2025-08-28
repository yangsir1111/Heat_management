import { RecognitionResult } from '../types';

// 将图片文件转换为base64格式
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

export const aiService = {
  async recognizeFood(imageFile: File): Promise<RecognitionResult> {
    try {
      // 将图片转换为base64
      const base64Image = await fileToBase64(imageFile);
      
      // 发送到后端API进行食物识别
      const response = await fetch('http://localhost:3001/api/image/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image
        })
      });
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '食物识别失败');
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
      throw new Error(error instanceof Error ? error.message : '食物识别失败，请稍后重试');
    }
  },

  compressImage(file: File, maxSize: number = 800): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: file.type }));
          } else {
            resolve(file);
          }
        }, file.type, 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
};
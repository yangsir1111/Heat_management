import { RecognitionResult } from '../types';

// 模拟AI识别服务（实际项目中需要接入通义千问VL模型API）
export const aiService = {
  async recognizeFood(imageFile: File): Promise<RecognitionResult> {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟不同食物的识别结果
    const mockResults: RecognitionResult[] = [
      {
        food_name: "鸡胸肉沙拉",
        calorie_estimate: 320,
        confidence: 0.92,
        health_tips: "富含优质蛋白质，适合减脂期食用"
      },
      {
        food_name: "拿铁咖啡",
        calorie_estimate: 180,
        confidence: 0.88,
        health_tips: "含有咖啡因，建议适量饮用"
      },
      {
        food_name: "蔬菜炒饭",
        calorie_estimate: 420,
        confidence: 0.85,
        health_tips: "搭配较为均衡，注意控制分量"
      },
      {
        food_name: "苹果",
        calorie_estimate: 85,
        confidence: 0.95,
        health_tips: "富含膳食纤维和维生素C，健康零食"
      },
      {
        food_name: "巧克力蛋糕",
        calorie_estimate: 450,
        confidence: 0.90,
        health_tips: "高热量甜品，建议适量享用"
      }
    ];
    
    // 随机返回一个结果
    const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
    
    // 有10%的概率模拟识别失败
    if (Math.random() < 0.1) {
      throw new Error('识别失败，请尝试拍摄更清晰的食物图片');
    }
    
    return randomResult;
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
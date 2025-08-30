import React, { useState } from 'react';
import { Camera, Image, Loader2, AlertCircle } from 'lucide-react';

// 一个简单的组件用于测试图标显示和基本功能

export const SimpleRecognitionTest: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  
  console.log('Testing lucide icons:', { Camera, Image, Loader2, AlertCircle });
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setError(null);
  };
  
  const simulateRecognition = async () => {
    if (!selectedImage) {
      setError('请先选择图片');
      return;
    }
    
    setIsRecognizing(true);
    setError(null);
    
    // 模拟识别过程
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 返回模拟结果
      setResult({
        food_name: '测试苹果',
        calorie_estimate: 52,
        confidence: 0.95,
        health_tips: '这是一个健康的选择'
      });
    } catch (err) {
      setError('模拟识别失败');
    } finally {
      setIsRecognizing(false);
    }
  };
  
  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center text-green-700">图标和识别测试</h1>
      
      <div className="mb-6 text-center">
        <Camera className="w-12 h-12 mx-auto text-green-600 mb-2" />
        <p className="text-gray-600">Camera 图标显示测试</p>
      </div>
      
      <div className="mb-6 text-center">
        <Image className="w-12 h-12 mx-auto text-blue-600 mb-2" />
        <p className="text-gray-600">Image 图标显示测试</p>
      </div>
      
      <div className="mb-6 text-center">
        <Loader2 className="w-12 h-12 mx-auto text-orange-600 mb-2 animate-spin" />
        <p className="text-gray-600">Loader2 图标显示测试</p>
      </div>
      
      <div className="mb-6">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="mb-4"
        />
        
        {selectedImage && (
          <div className="mb-4">
            <img 
              src={selectedImage} 
              alt="预览" 
              className="max-w-full h-auto rounded-md border border-gray-200"
            />
          </div>
        )}
        
        <button 
          onClick={simulateRecognition}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          disabled={isRecognizing}
        >
          {isRecognizing ? (
            <>
              <Loader2 className="inline-block w-4 h-4 animate-spin mr-2" />
              识别中...
            </>
          ) : (
            '模拟识别'
          )}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {result && (
        <div className="bg-green-50 p-4 rounded-md">
          <h2 className="font-bold text-lg mb-2">识别结果:</h2>
          <p>食物名称: {result.food_name}</p>
          <p>热量估计: {result.calorie_estimate} kcal</p>
          <p>置信度: {result.confidence}</p>
          <p>健康建议: {result.health_tips}</p>
        </div>
      )}
    </div>
  );
};
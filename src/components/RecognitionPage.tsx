import React, { useState, useRef } from 'react';
import { Camera, Image, Loader2 } from 'lucide-react';
import { aiService } from '../services/aiService';
import { storageService } from '../services/storage';
import { CalorieRecord, RecognitionResult } from '../types';

export const RecognitionPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);
    
    // 显示选中的图片
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setIsRecognizing(true);

    try {
      // 压缩图片
      const compressedFile = await aiService.compressImage(file);
      
      // 调用AI识别服务
      const recognitionResult = await aiService.recognizeFood(compressedFile);
      
      setResult(recognitionResult);
      
      // 保存识别结果到本地存储
      const now = new Date();
      const record: CalorieRecord = {
        id: now.getTime().toString(),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        timestamp: now.getTime(),
        foodName: recognitionResult.food_name,
        calorie: recognitionResult.calorie_estimate,
        imagePath: imageUrl,
        confidence: recognitionResult.confidence,
        healthTips: recognitionResult.health_tips
      };
      
      storageService.saveRecord(record);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '识别失败');
    } finally {
      setIsRecognizing(false);
    }
  };

  const resetState = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-6 shadow-lg">
        <h1 className="text-xl font-bold text-white text-center">🍎 智能热量识别</h1>
        <p className="text-emerald-100 text-center text-sm mt-1">拍照即可获取食物热量信息</p>
      </div>

      <div className="flex-1 relative">
        {!selectedImage ? (
          // 初始状态
          <div className="flex flex-col items-center justify-center h-full px-8 py-12">
            <div className="text-center mb-12">
              <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Camera className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">开始识别食物</h2>
              <p className="text-gray-600 text-lg">AI 将为您分析食物成分和热量</p>
            </div>
            
            <div className="space-y-6 w-full max-w-sm">
              <button
                onClick={handleImageCapture}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-5 px-8 rounded-2xl text-lg font-bold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl transform hover:scale-105"
              >
                <Camera size={24} />
                <span>拍照</span>
              </button>
              
              <button
                onClick={handleImageUpload}
                className="w-full border-2 border-emerald-500 text-emerald-600 py-5 px-8 rounded-2xl text-lg font-bold hover:bg-emerald-50 hover:border-emerald-600 transition-all duration-300 flex items-center justify-center space-x-3 transform hover:scale-105"
              >
                <Image size={24} />
                <span>上传照片</span>
              </button>
            </div>
          </div>
        ) : (
          // 图片预览和结果状态
          <div className="h-full flex flex-col bg-white m-4 rounded-3xl shadow-2xl overflow-hidden">
            <div className="relative flex-1">
              <img
                src={selectedImage}
                alt="Selected food"
                className="w-full h-full object-cover"
              />
              
              {isRecognizing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 flex flex-col items-center shadow-2xl">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mb-4">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <p className="text-gray-800 font-bold text-lg">AI 识别中...</p>
                    <p className="text-gray-600 text-sm mt-1">正在分析食物成分</p>
                  </div>
                </div>
              )}
            </div>
            
            {result && (
              <div className="bg-gradient-to-t from-white to-gray-50 p-6">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">{result.food_name}</h2>
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 mb-4 shadow-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-4xl font-bold text-white">{result.calorie_estimate}</span>
                      <span className="text-emerald-100 text-lg">千卡</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center space-x-2 mb-6">
                    <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-700 font-medium">识别准确度: {Math.round(result.confidence * 100)}%</span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 mb-6 border border-blue-100">
                  <h3 className="font-bold text-blue-900 mb-2 flex items-center">
                    <span className="mr-2">💡</span>
                    健康建议
                  </h3>
                  <p className="text-blue-800 text-sm leading-relaxed">{result.health_tips}</p>
                </div>
                
                <button
                  onClick={resetState}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-8 rounded-2xl font-bold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  继续识别
                </button>
              </div>
            )}
            
            {error && (
              <div className="bg-gradient-to-t from-white to-gray-50 p-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-3xl">😔</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">识别遇到问题</h2>
                  <p className="text-red-600 mb-6 bg-red-50 rounded-xl p-3 border border-red-100">{error}</p>
                  <button
                    onClick={resetState}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-8 rounded-2xl font-bold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg transform hover:scale-105"
                  >
                    重新尝试
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image, Loader2, AlertCircle, RefreshCw, Share2, Info, ChevronLeft, Wifi, Server, Smartphone } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { aiService, fileToBase64 } from '../services/aiService';
import { storageService } from '../services/storage';
import { CalorieRecord, RecognitionResult } from '../types';
// 确保移动端显示正确的图片识别状态

// 确保lucide-react图标能够正常工作
console.log('Lucide icons loaded:', { Camera, Image, Loader2 });

export const RecognitionPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false); // 新增：图片预处理状态
  const [isOnline, setIsOnline] = useState(navigator.onLine); // 新增：网络状态
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 监听网络状态变化
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleImageCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = () => {
    if (!isOnline) {
      setError('网络连接已断开，请连接网络后重试');
      return;
    }
    
    if (fileInputRef.current) {
      console.log('触发图片上传选择器');
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    } else {
      console.warn('文件输入引用不存在');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);
    setIsProcessingImage(true); // 开始图片预处理
    
    try {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        throw new Error('请上传图片文件');
      }
      
      // 显示选中的图片
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      
      // 检查网络连接
      if (!isOnline) {
        throw new Error('网络连接已断开，请连接网络后重试');
      }
      
      // 通知用户正在处理
      setTimeout(() => {
        setIsRecognizing(true);
      }, 500);

      // 使用真实的AI识别，不再使用模拟数据
      console.log('开始AI识别流程');

      try {
        // 额外的图片尺寸验证 - 通义千问VL模型要求至少10x10像素
        const imageDimensions = await getImageDimensions(imageUrl);
        if (imageDimensions.width < 10 || imageDimensions.height < 10) {
          throw new Error('图片尺寸过小，请上传尺寸至少为10x10像素的图片');
        }
        
        // 压缩图片 - 移动端优化：对大图片进行更彻底的压缩
        const maxSize = window.innerWidth < 768 ? 600 : 800; // 移动端使用更小的最大尺寸
        const compressedFile = await aiService.compressImage(file, maxSize);
        
        console.log('准备调用AI服务，压缩后图片大小:', compressedFile.size);
        
        // 检查base64数据（仅前100个字符）
        const testBase64 = await fileToBase64(compressedFile);
        console.log('base64数据前100个字符:', testBase64.substring(0, 100));
        console.log('base64数据总长度:', testBase64.length);
        
        // 调用AI识别服务
        const recognitionResult = await aiService.recognizeFood(compressedFile);
        
        console.log('识别成功，结果:', recognitionResult);
        setResult(recognitionResult);
        
        // 保存识别结果到本地存储
        const now = new Date();
        const record: CalorieRecord = {
          id: now.getTime().toString(),
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().slice(0, 5),
          timestamp: now.getTime(),
          foodName: recognitionResult.food_name,
          calorie: typeof recognitionResult.calorie_estimate === 'number' 
            ? recognitionResult.calorie_estimate 
            : parseInt(recognitionResult.calorie_estimate as string) || 0,
          imagePath: imageUrl,
          confidence: recognitionResult.confidence,
          healthTips: recognitionResult.health_tips
        };
        
        storageService.saveRecord(record);
        
      } catch (err) {
        // 处理识别过程中的错误
        console.error('识别过程错误:', err);
        const errorMsg = err instanceof Error ? err.message : '识别失败';
        setError(errorMsg);
      }
    } catch (err) {
      // 处理图片选择和预处理错误
      console.error('图片处理错误:', err);
      const errorMsg = err instanceof Error ? err.message : '处理图片时出错';
      setError(errorMsg);
    } finally {
      setIsRecognizing(false);
      setIsProcessingImage(false);
    }
  };
  
  // 获取图片尺寸的辅助函数 - 增加环境检查以避免服务器端执行错误
  const getImageDimensions = (imageUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      // 检查是否在浏览器环境中
      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        // 在非浏览器环境中返回默认尺寸
        console.warn('在非浏览器环境中调用getImageDimensions，返回默认尺寸');
        resolve({ width: 100, height: 100 });
        return;
      }
      
      try {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          reject(new Error('无法加载图片'));
        };
        img.src = imageUrl;
      } catch (error) {
        console.error('创建Image对象失败:', error);
        // 出错时返回默认尺寸
        resolve({ width: 100, height: 100 });
      }
    });
  };

  const resetState = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsRecognizing(true);
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      handleFileSelect({ target: { files: [file] } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-6 shadow-lg">
        {/* 显示网络状态指示器 */}
        {!isOnline && (
          <div className="flex items-center justify-center mb-2 text-white/90 text-xs">
            <Wifi className="w-3 h-3 mr-1" /> 离线模式
          </div>
        )}
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
              
              {/* 移动端提示 */}
              <div className="mt-4 bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-sm text-emerald-800">
                <div className="flex items-center">
                  <Smartphone className="w-4 h-4 mr-2" />
                  <span>建议在光线充足的环境下拍摄清晰的食物照片</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-6 w-full max-w-sm">
              {/* 拍照按钮 */}
              <button
                onClick={handleImageCapture}
                disabled={!isOnline} // 离线时禁用
                className={`w-full text-white py-5 px-8 rounded-2xl text-lg font-bold transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl transform hover:scale-105 ${isOnline ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700' : 'bg-gray-400 cursor-not-allowed'}`}
              >
                <Camera size={24} />
                <span>拍照</span>
              </button>
              
              {/* 上传照片按钮 */}
              <button
                onClick={handleImageUpload}
                disabled={!isOnline} // 离线时禁用
                className={`w-full py-5 px-8 rounded-2xl text-lg font-bold transition-all duration-300 flex items-center justify-center space-x-3 transform hover:scale-105 ${isOnline ? 'border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600' : 'border-2 border-gray-300 text-gray-400 cursor-not-allowed'}`}
              >
                <Image size={24} />
                <span>上传照片</span>
              </button>
              
              {/* 离线提示 */}
              {!isOnline && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Wifi className="w-4 h-4 mr-2 text-amber-600" />
                    <span className="text-amber-800 font-medium">网络连接已断开</span>
                  </div>
                  <p className="text-amber-700 text-sm">请检查您的网络连接后再试</p>
                </div>
              )}
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
              
              {/* 图片预处理状态 */}
              {isProcessingImage && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 flex flex-col items-center shadow-2xl">
                    <LoadingSpinner className="w-12 h-12 text-emerald-500" />
                    <p className="text-gray-800 font-bold text-lg mt-4">正在处理图片...</p>
                    <p className="text-gray-600 text-sm mt-1">请稍候</p>
                  </div>
                </div>
              )}
              
              {/* AI识别状态 */}
              {isRecognizing && !isProcessingImage && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 flex flex-col items-center shadow-2xl max-w-xs mx-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mb-4">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <p className="text-gray-800 font-bold text-lg">AI 识别中...</p>
                    <p className="text-gray-600 text-sm mt-1">正在分析食物成分和热量</p>
                    
                    {/* 提示用户保持耐心 */}
                    <div className="mt-4 text-xs text-gray-500 text-center">
                      这可能需要几秒钟时间，请保持耐心
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {result && (
              <div className="bg-gradient-to-t from-white to-gray-50 p-6">
                                 <div className="text-center mb-6">
                   {/* AI识别结果提示 */}
                   <div className="text-xs text-gray-500 mb-2">
                     <span className="font-medium">AI识别结果:</span> 基于通义千问VL模型的智能识别
                   </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">{result.food_name}</h2>
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 mb-4 shadow-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-4xl font-bold text-white">
                        {typeof result.calorie_estimate === 'number' ? result.calorie_estimate : result.calorie_estimate}
                      </span>
                      <span className="text-emerald-100 text-lg">千卡</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center space-x-2 mb-6">
                    <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-700 font-medium">识别准确度: {Math.round(result.confidence * 100)}%</span>
                  </div>
                </div>
                
                {/* 营养信息展示 */}
                {result.nutrition && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-5 mb-6 border border-purple-100">
                    <h3 className="font-bold text-purple-900 mb-3 flex items-center">
                      <span className="mr-2">🥗</span>
                      营养成分
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <p className="text-xs text-purple-600 mb-1">蛋白质</p>
                        <p className="text-lg font-bold text-gray-900">{result.nutrition.protein}</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <p className="text-xs text-purple-600 mb-1">碳水化合物</p>
                        <p className="text-lg font-bold text-gray-900">{result.nutrition.carbs}</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <p className="text-xs text-purple-600 mb-1">脂肪</p>
                        <p className="text-lg font-bold text-gray-900">{result.nutrition.fat}</p>
                      </div>
                      {result.gi_value !== undefined && (
                        <div className="bg-white rounded-xl p-3 shadow-sm relative group">
                          <p className="text-xs text-purple-600 mb-1">GI值</p>
                          <p className="text-lg font-bold text-gray-900">{result.gi_value}</p>
                          <div className="absolute top-2 right-2">
                            <button
                              className="text-gray-400 hover:text-purple-600 p-1 rounded-full hover:bg-purple-50 transition-colors"
                              aria-label="GI值解释"
                            >
                              <Info size={16} />
                            </button>
                            <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-lg shadow-lg p-3 border border-gray-200 text-sm text-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              <strong className="block mb-1">GI值是什么？</strong>
                              <p className="text-xs leading-relaxed">
                                GI值（升糖指数）是衡量食物使血糖升高速度的指标。数值越低，血糖上升越慢，越有利于控制血糖；数值越高，血糖上升越快。
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 mb-6 border border-blue-100">
                  <h3 className="font-bold text-blue-900 mb-2 flex items-center">
                    <span className="mr-2">💡</span>
                    健康建议
                  </h3>
                  <p className="text-blue-800 text-sm leading-relaxed">{result.health_tips}</p>
                  
                  {/* 糖尿病适用性建议 */}
                  {result.suitable_for_diabetes && (
                    <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600">🩺</span>
                        <span className="text-sm font-medium text-green-800">糖尿病适用性：</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.suitable_for_diabetes === '适合' 
                            ? 'bg-green-100 text-green-800' 
                            : result.suitable_for_diabetes === '适量' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.suitable_for_diabetes}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: '食物识别结果',
                          text: `我刚刚识别了${result?.food_name}，热量约为${result?.calorie_estimate}千卡。`,
                          url: window.location.href
                        }).catch(() => {
                          // 分享失败，降级处理
                          navigator.clipboard.writeText(`食物识别结果：${result?.food_name}，热量约为${result?.calorie_estimate}千卡。`).then(() => {
                            alert('分享内容已复制到剪贴板');
                          });
                        });
                      } else {
                        // 不支持分享API，使用剪贴板
                        navigator.clipboard.writeText(`食物识别结果：${result?.food_name}，热量约为${result?.calorie_estimate}千卡。`).then(() => {
                          alert('分享内容已复制到剪贴板');
                        });
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-8 rounded-2xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <Share2 size={20} />
                    <span>分享结果</span>
                  </button>
                  <button
                    onClick={resetState}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-8 rounded-2xl font-bold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg transform hover:scale-105"
                  >
                    继续识别
                  </button>
                </div>
              </div>
            )}
            
            {error && (
                <div className="bg-gradient-to-t from-white to-gray-50 p-6">
                  <div className="text-center">
                    {/* 根据错误类型显示不同图标 */}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${error.includes('网络') ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 'bg-gradient-to-r from-red-400 to-pink-500'}`}>
                      {error.includes('网络') ? (
                        <Wifi className="w-10 h-10 text-white" />
                      ) : error.includes('服务器') ? (
                        <Server className="w-10 h-10 text-white" />
                      ) : (
                        <AlertCircle className="w-10 h-10 text-white" />
                      )}
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">识别遇到问题</h2>
                    
                    {/* 更友好的错误消息显示 */}
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100 mb-6 mx-auto max-w-xs">
                      <p className="text-red-600 text-sm leading-relaxed">{error}</p>
                    </div>
                    
                    {/* 针对网络错误的特殊提示 */}
                    {error.includes('网络') && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mb-6 mx-auto max-w-xs">
                        <p className="text-blue-700 text-sm">
                          请检查您的Wi-Fi或移动数据连接，确保网络信号良好。
                          图片识别需要稳定的网络连接。
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <button
                        onClick={handleRetry}
                        disabled={!isOnline}
                        className={`w-full py-4 px-8 rounded-2xl font-bold transition-all duration-300 shadow-lg transform hover:scale-105 flex items-center justify-center space-x-2 ${isOnline ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700' : 'bg-gray-400 text-white cursor-not-allowed'}`}
                      >
                        <RefreshCw size={20} />
                        <span>重新尝试</span>
                      </button>
                      
                      <button
                        onClick={resetState}
                        className="w-full border-2 border-gray-300 text-gray-700 py-4 px-8 rounded-2xl font-bold hover:bg-gray-50 transition-all duration-300"
                      >
                        上传新照片
                      </button>
                      
                      {/* 返回按钮 */}
                      <button
                        onClick={() => {
                          // 这里可以添加返回上一页的逻辑，如果需要的话
                          resetState();
                        }}
                        className="w-full text-gray-600 py-3 px-8 font-medium hover:text-gray-800 transition-all duration-300"
                      >
                        <div className="flex items-center justify-center">
                          <ChevronLeft size={18} className="mr-1" />
                          <span>返回</span>
                        </div>
                      </button>
                    </div>
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
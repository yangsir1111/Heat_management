import React, { useState, useEffect } from 'react';
import { MinusCircle, Info, Camera } from 'lucide-react';
import { storageService } from '../services/storage';
import { CalorieRecord } from '../types';

export const ProfilePage: React.FC = () => {
  const [allRecords, setAllRecords] = useState<CalorieRecord[]>([]);

  useEffect(() => {
    loadAllRecords();
  }, []);

  const loadAllRecords = () => {
    const records = storageService.getRecords();
    // 按日期和时间降序排序（最新的在前）
    const sortedRecords = records.sort((a, b) => b.timestamp - a.timestamp);
    setAllRecords(sortedRecords);
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      storageService.deleteRecord(id);
      // 重新加载数据
      loadAllRecords();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* 标题栏 */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white text-center">🍎 识别记录</h1>
        <p className="text-emerald-100 text-center text-base mt-1">查看您的所有食物识别记录</p>
      </div>

      {/* 主内容区域 */}
      <div className="bg-white/90 backdrop-blur-lg p-4 sm:p-6 mx-3 sm:mx-4 mt-6 rounded-3xl shadow-xl border border-white/50 flex-1">
        <div className="flex items-center mb-6">
          <div className="w-3 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full mr-3"></div>
          <h2 className="text-2xl font-bold text-gray-900">历史记录</h2>
        </div>

        {allRecords.length === 0 ? (
          // 空状态
          <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-emerald-50 rounded-3xl shadow-sm">
            <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transform rotate-3">
              <Camera className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">暂无识别记录</h3>
            <p className="text-gray-600 text-base">去拍照或上传图片开始识别吧！</p>
          </div>
        ) : (
          // 记录列表 - 简单列表形式
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 pb-4">
            {allRecords.map((record) => (
              <div key={record.id} className="flex flex-col sm:flex-row sm:items-center p-4 bg-gradient-to-r from-gray-50 to-emerald-50/30 rounded-2xl shadow-md border border-emerald-100 hover:shadow-lg transition-all duration-300 space-y-4 sm:space-y-0 sm:space-x-4">
                {record.imagePath && (
                  <div className="relative self-center sm:self-auto">
                    <img
                      src={record.imagePath}
                      alt={record.foodName}
                      className="w-64 h-36 sm:w-40 sm:h-22.5 object-cover rounded-2xl shadow-md transform hover:scale-105 transition-transform"
                    />
                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-all"
                      aria-label="删除记录"
                    >
                      <MinusCircle size={20} />
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-xl sm:text-lg">{record.foodName}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 font-medium mt-1">
                        <span>{record.date}</span>
                      </div>
                    </div>
                    <div className="text-center sm:text-right">
                      <div className="font-bold text-emerald-600 text-xl sm:text-lg bg-emerald-50 px-4 py-2 rounded-full shadow-sm whitespace-nowrap">
                        {record.calorie} 千卡
                      </div>
                    </div>
                  </div>
                  {record.healthTips && (
                    <div className="mt-3 bg-blue-50 rounded-xl p-3 border border-blue-100 shadow-sm">
                      <div className="flex items-start space-x-2">
                        <div className="mt-0.5 bg-blue-100 p-1 rounded-full flex-shrink-0">
                          <Info size={14} className="text-blue-600" />
                        </div>
                        <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
                          <strong>💡 健康建议：</strong>{record.healthTips}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 免责声明 */}
      <div className="p-4 mx-4 mt-6 mb-24">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>免责声明：</strong>热量数据为AI估算值，仅供参考。实际热量可能因食物制作方法、分量等因素而有所差异。
          </p>
        </div>
      </div>
    </div>
  );
};
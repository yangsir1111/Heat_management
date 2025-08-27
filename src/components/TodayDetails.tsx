import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { storageService } from '../services/storage';
import { CalorieRecord } from '../types';

interface TodayDetailsProps {
  onBack: () => void;
}

export const TodayDetails: React.FC<TodayDetailsProps> = ({ onBack }) => {
  const [todayRecords, setTodayRecords] = useState<CalorieRecord[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const dailyGoal = 1800; // 每日目标热量

  useEffect(() => {
    const records = storageService.getTodayRecords();
    const sortedRecords = records.sort((a, b) => b.timestamp - a.timestamp);
    setTodayRecords(sortedRecords);
    
    const total = records.reduce((sum, record) => sum + record.calorie, 0);
    setTotalCalories(total);
  }, []);

  const progressPercentage = Math.min((totalCalories / dailyGoal) * 100, 100);
  const isOverGoal = totalCalories > dailyGoal;

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* 顶部导航 */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-600 px-6 py-6 flex items-center shadow-lg">
        <button 
          onClick={onBack} 
          className="mr-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">今日摄入详情</h1>
          <p className="text-emerald-100 text-sm">追踪您的每日热量目标</p>
        </div>
      </div>

      {/* 进度指示器 */}
      <div className="bg-white/90 backdrop-blur-lg p-8 mx-4 mt-6 rounded-3xl shadow-2xl border border-white/50">
        <div className="text-center mb-8">
          <div className={`text-6xl font-bold mb-3 ${isOverGoal ? 'text-red-500' : 'text-emerald-500'}`}>
            {totalCalories}
          </div>
          <div className="text-gray-700 text-lg font-medium">千卡 / {dailyGoal} 千卡</div>
        </div>
        
        {/* 进度条 */}
        <div className="relative mb-6">
          <div className="w-full bg-gray-200 rounded-full h-6 shadow-inner">
            <div
              className={`h-6 rounded-full transition-all duration-500 shadow-lg ${
                isOverGoal 
                  ? 'bg-gradient-to-r from-red-400 to-pink-500' 
                  : 'bg-gradient-to-r from-emerald-400 to-teal-500'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-700 mt-3 font-medium">
            <span>0</span>
            <span className="font-bold">{dailyGoal}</span>
          </div>
        </div>
        
        {isOverGoal && (
          <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-sm">
            <p className="text-red-800 text-sm font-medium flex items-center">
              <span className="mr-2 text-lg">⚠️</span>
              今日摄入量已超过建议值 {totalCalories - dailyGoal} 千卡
            </p>
          </div>
        )}
      </div>

      {/* 今日记录列表 */}
      <div className="bg-white/90 backdrop-blur-lg p-6 mx-4 mt-6 rounded-3xl shadow-xl border border-white/50 flex-1 mb-24">
        <div className="flex items-center mb-6">
          <div className="w-3 h-8 bg-gradient-to-b from-emerald-500 to-blue-600 rounded-full mr-3"></div>
          <h2 className="text-xl font-bold text-gray-900">今日摄入记录</h2>
        </div>
        
        {todayRecords.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Clock className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">暂无记录</h3>
            <p className="text-gray-500">开始记录您的第一餐吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayRecords.map((record) => (
              <div key={record.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                {record.imagePath && (
                  <img
                    src={record.imagePath}
                    alt={record.foodName}
                    className="w-16 h-16 object-cover rounded-2xl shadow-md"
                  />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{record.foodName}</h3>
                      <p className="text-sm text-gray-600 font-medium">{record.time}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 text-lg bg-emerald-50 px-3 py-1 rounded-full">
                        {record.calorie} 千卡
                      </div>
                    </div>
                  </div>
                  {record.healthTips && (
                    <p className="text-xs text-blue-600 mt-2 bg-blue-50 rounded-lg px-2 py-1 inline-block">
                      💡 {record.healthTips}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
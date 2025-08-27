import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { storageService } from '../services/storage';
import { TodayDetails } from './TodayDetails';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'today' | '7days' | '30days'>('today');
  const [showTodayDetails, setShowTodayDetails] = useState(false);
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0
  });
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = () => {
    // 计算统计数据
    const todayRecords = storageService.getTodayRecords();
    const todayTotal = todayRecords.reduce((sum, record) => sum + record.calorie, 0);
    
    const weeklyData = storageService.getDailyTotals(7);
    const weeklyAverage = weeklyData.length > 0 
      ? weeklyData.reduce((sum, day) => sum + day.total, 0) / weeklyData.length 
      : 0;
    
    const monthlyData = storageService.getDailyTotals(30);
    const monthlyAverage = monthlyData.length > 0 
      ? monthlyData.reduce((sum, day) => sum + day.total, 0) / monthlyData.length 
      : 0;

    setStats({
      today: Math.round(todayTotal),
      week: Math.round(weeklyAverage),
      month: Math.round(monthlyAverage)
    });

    // 准备图表数据
    let chartDays = 7;
    if (activeTab === '30days') chartDays = 30;
    else if (activeTab === '7days') chartDays = 7;
    else chartDays = 7; // 默认显示7天趋势

    const dailyTotals = storageService.getDailyTotals(chartDays);
    const labels = dailyTotals.map(item => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const data = dailyTotals.map(item => item.total);

    setChartData({
      labels,
      datasets: [
        {
          label: '每日摄入热量',
          data,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          tension: 0.3,
        },
      ],
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6',
        },
      },
    },
  };

  const getStatValue = () => {
    switch (activeTab) {
      case 'today': return stats.today;
      case '7days': return stats.week;
      case '30days': return stats.month;
      default: return stats.today;
    }
  };

  const getStatLabel = () => {
    switch (activeTab) {
      case 'today': return '今日总计';
      case '7days': return '近7天日均';
      case '30days': return '近30天日均';
      default: return '今日总计';
    }
  };

  if (showTodayDetails) {
    return <TodayDetails onBack={() => setShowTodayDetails(false)} />;
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-6 shadow-lg">
        <h1 className="text-xl font-bold text-white text-center">📊 健康数据中心</h1>
        <p className="text-blue-100 text-center text-sm mt-1">追踪您的饮食健康趋势</p>
      </div>

      {/* 图表区域 */}
      <div className="bg-white/80 backdrop-blur-lg p-6 mx-4 mt-6 rounded-3xl shadow-xl border border-white/50">
        <div className="flex items-center mb-6">
          <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
          <h2 className="text-xl font-bold text-gray-900">热量趋势分析</h2>
        </div>
        <div className="h-52 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-2xl p-4">
          {chartData && <Line data={chartData} options={chartOptions} />}
        </div>
      </div>

      {/* 统计数据区域 */}
      <div className="bg-white/80 backdrop-blur-lg p-6 mx-4 mt-6 rounded-3xl shadow-xl border border-white/50">
        <div className="flex justify-center space-x-2 mb-8">
          {[
            { key: 'today' as const, label: '今天' },
            { key: '7days' as const, label: '7天' },
            { key: '30days' as const, label: '30天' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 transform ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div 
          className={`text-center p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
            activeTab === 'today' 
              ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 shadow-lg' 
              : 'border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50 hover:shadow-lg'
          }`}
          onClick={() => activeTab === 'today' && setShowTodayDetails(true)}
        >
          <div className="text-5xl font-bold text-gray-900 mb-2">
            {getStatValue()} <span className="text-2xl text-gray-600">千卡</span>
          </div>
          <div className="text-gray-700 font-medium text-lg">{getStatLabel()}</div>
          {activeTab === 'today' && (
            <div className="text-sm text-emerald-600 mt-3 font-medium bg-emerald-100 rounded-full px-4 py-1 inline-block">
              点击查看详情 →
            </div>
          )}
        </div>
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
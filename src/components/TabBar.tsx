import React from 'react';
import { Camera, BarChart3 } from 'lucide-react';

interface TabBarProps {
  activeTab: 'recognize' | 'profile';
  onTabChange: (tab: 'recognize' | 'profile') => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 px-6 py-3 shadow-lg">
      <div className="flex justify-around max-w-md mx-auto">
        <button
          onClick={() => onTabChange('recognize')}
          className={`flex flex-col items-center py-3 px-6 rounded-2xl transition-all duration-300 transform ${
            activeTab === 'recognize'
              ? 'text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg scale-105'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Camera size={22} />
          <span className="text-xs mt-1 font-medium">识别</span>
        </button>
        
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center py-3 px-6 rounded-2xl transition-all duration-300 transform ${
            activeTab === 'profile'
              ? 'text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg scale-105'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <BarChart3 size={22} />
          <span className="text-xs mt-1 font-medium">数据</span>
        </button>
      </div>
    </div>
  );
};
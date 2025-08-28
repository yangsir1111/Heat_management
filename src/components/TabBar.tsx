import React from 'react';
import { Camera, BarChart3 } from 'lucide-react';

interface TabBarProps {
  activeTab: 'recognize' | 'profile';
  onTabChange: (tab: 'recognize' | 'profile') => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 shadow-md">
      <div className="flex justify-around items-center">
        <button
          onClick={() => onTabChange('recognize')}
          className={`flex flex-col items-center py-2 px-4 rounded-lg transition-all duration-300 ${ 
            activeTab === 'recognize'
              ? 'bg-emerald-100 text-emerald-600'
              : 'text-gray-500 hover:text-emerald-600'
          }`}
        >
          <Camera size={22} className="mb-1" />
          <span className="text-xs font-medium">识别</span>
        </button>
        
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center py-2 px-4 rounded-lg transition-all duration-300 ${ 
            activeTab === 'profile'
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-500 hover:text-blue-600'
          }`}
        >
          <BarChart3 size={22} className="mb-1" />
          <span className="text-xs font-medium">数据</span>
        </button>
      </div>
    </div>
  );
};
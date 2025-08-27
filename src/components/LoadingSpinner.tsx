import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-2" />
        <p className="text-gray-600 text-sm">加载中...</p>
      </div>
    </div>
  );
};
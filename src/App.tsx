import React, { useState } from 'react';
import { TabBar } from './components/TabBar';
import { RecognitionPage } from './components/RecognitionPage';
import { ProfilePage } from './components/ProfilePage';
import { SimpleRecognitionTest } from './components/SimpleRecognitionTest';

function App() {
  const [activeTab, setActiveTab] = useState<'recognize' | 'profile'>('recognize');
  const [showTestPage, setShowTestPage] = useState(false);

  // 显示测试页面用于验证图标和基本功能
  if (showTestPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex flex-col">
        <main className="flex-1">
          <SimpleRecognitionTest />
        </main>
        <div className="p-4 text-center">
          <button 
            onClick={() => setShowTestPage(false)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            返回主应用
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex flex-col">
      <main className="flex-1 flex flex-col pb-16">
        {activeTab === 'recognize' ? (
          <RecognitionPage />
        ) : (
          <ProfilePage />
        )}
      </main>
      
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
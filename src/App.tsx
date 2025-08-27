import React, { useState } from 'react';
import { TabBar } from './components/TabBar';
import { RecognitionPage } from './components/RecognitionPage';
import { ProfilePage } from './components/ProfilePage';

function App() {
  const [activeTab, setActiveTab] = useState<'recognize' | 'profile'>('recognize');

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
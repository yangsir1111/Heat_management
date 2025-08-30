import React from 'react';
import { Camera, Image, Loader2, AlertCircle, Server, Wifi, X, Share2, ChevronLeft } from 'lucide-react';

export const IconTest: React.FC = () => {
  const icons = [
    { name: 'Camera', component: <Camera /> },
    { name: 'Image', component: <Image /> },
    { name: 'Loader2', component: <Loader2 /> },
    { name: 'AlertCircle', component: <AlertCircle /> },
    { name: 'Server', component: <Server /> },
    { name: 'Wifi', component: <Wifi /> },
    { name: 'X', component: <X /> },
    { name: 'Share2', component: <Share2 /> },
    { name: 'ChevronLeft', component: <ChevronLeft /> },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Lucide Icons Test</h2>
      <div className="grid grid-cols-3 gap-4">
        {icons.map((icon, index) => (
          <div key={index} className="flex flex-col items-center p-2 border rounded">
            <div className="text-green-600 mb-2">{icon.component}</div>
            <span className="text-sm text-gray-600">{icon.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
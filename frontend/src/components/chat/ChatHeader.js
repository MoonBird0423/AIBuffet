import React from 'react';
import { getModelEmoji } from '../../config/defaultEmojis';

function ChatHeader({ selectedModel, emoji, purpose }) {
  const models = [
    { name: 'GPT-4', icon: 'apple-alt', bgColor: 'bg-red-100', textColor: 'text-red-600' },
    { name: 'Claude', icon: 'lemon', bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
    { name: 'Gemini', icon: 'carrot', bgColor: 'bg-green-100', textColor: 'text-green-600' },
    { name: 'Llama 2', icon: 'cookie', bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' }
  ];

  const currentModel = models.find(model => model.name === selectedModel) || models[0];

  return (
    <div className="px-6 py-4 border-b border-gray-200 flex items-center">
      <div className="flex items-center">
        <div className={`text-xl mr-3 ${currentModel.bgColor} p-2 rounded-full`}>
          {getModelEmoji(selectedModel, emoji)}
        </div>
        <div className="relative group">
          <div className="flex items-center cursor-pointer">
            <h2 className="text-lg font-bold">{selectedModel || 'Select Model'}</h2>
            <i className="fas fa-chevron-down ml-2 text-gray-500 text-xs"></i>
          </div>
          <p className="text-sm text-gray-500">{purpose || '通用AI助手'}</p>
        </div>
      </div>
      <div className="ml-auto flex space-x-2">
        <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
          <i className="fas fa-info-circle"></i>
        </button>
        <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
          <i className="fas fa-share-alt"></i>
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;
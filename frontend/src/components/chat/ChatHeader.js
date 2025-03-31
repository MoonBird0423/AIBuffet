import React from 'react';

function ChatHeader({ selectedModel }) {
  return (
    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center">
        <div className="relative group">
          <h2 className="text-lg font-bold">{selectedModel || 'Select Model'}</h2>
        </div>
      </div>
      <div className="text-sm text-gray-400">
        内容由 AI 生成，请仔细甄别
      </div>
    </div>
  );
}

export default ChatHeader;
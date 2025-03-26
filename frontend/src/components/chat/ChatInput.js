import React, { useState } from 'react';
import PromptTemplates from './PromptTemplates';

function ChatInput({ onSend, showPromptTemplates, onTogglePromptTemplates }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 p-4">
      {/* 操作按钮 */}
      <div className="flex justify-start mb-3 space-x-2">
        <button 
          className="flex items-center justify-center px-3 py-1 text-xs text-blue-500 hover:text-blue-700 border border-gray-200 rounded-md hover:bg-gray-50 transition duration-200"
        >
          <i className="fas fa-plus mr-1"></i> 新建对话
        </button>
        <button 
          onClick={onTogglePromptTemplates}
          className="flex items-center justify-center px-3 py-1 text-xs text-blue-500 hover:text-blue-700 border border-gray-200 rounded-md hover:bg-gray-50 transition duration-200"
        >
          <i className="fas fa-magic mr-1"></i> 提示词工程
        </button>
      </div>

      {showPromptTemplates ? (
        <PromptTemplates onSelect={(prompt) => setMessage(prompt)} onClose={onTogglePromptTemplates} />
      ) : (
        <form onSubmit={handleSubmit} className="relative rounded-lg shadow-sm">
          <textarea
            rows="3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="block w-full px-4 py-3 border-0 resize-none focus:ring-0 rounded-lg"
            placeholder="输入消息..."
          />
          <div className="absolute bottom-2 right-2 flex space-x-1">
            <button 
              type="button"
              className="p-2 rounded-full text-blue-500 hover:text-blue-700 hover:bg-gray-100"
            >
              <i className="fas fa-paperclip"></i>
            </button>
            <button 
              type="submit"
              disabled={!message.trim()}
              className={`p-2 rounded-full ${
                message.trim() 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </form>
      )}

      <div className="mt-2 text-xs text-gray-500 text-center">
        AI自助餐中的模型仅用于演示。请勿分享个人敏感信息。
      </div>
    </div>
  );
}

export default ChatInput;
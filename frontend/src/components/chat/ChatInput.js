import React, { useState, useRef, useEffect } from 'react';
import PromptTemplates from './PromptTemplates';

function ChatInput({ onSend, showPromptTemplates, onTogglePromptTemplates }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  // 组件挂载时自动聚焦
  useEffect(() => {
    if (!showPromptTemplates) {
      textareaRef.current?.focus();
    }
  }, [showPromptTemplates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSend(message);
      setMessage('');
      // 发送消息后自动聚焦
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error('发送消息失败:', error);
      // 可以添加错误提示
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePromptSelect = (prompt) => {
    setMessage(prompt);
    onTogglePromptTemplates();
    // 选择提示词后自动聚焦
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  return (
    <div className="border-t border-gray-200 p-4">
      {/* 操作按钮 */}
      <div className="flex justify-start mb-3">
        <button 
          onClick={onTogglePromptTemplates}
          className="flex items-center justify-center px-3 py-1 text-xs text-blue-500 hover:text-blue-700 border border-gray-200 rounded-md hover:bg-gray-50 transition duration-200"
        >
          <i className="fas fa-magic mr-1"></i> 提示词工程
        </button>
      </div>

      {showPromptTemplates ? (
        <PromptTemplates 
          onSelect={handlePromptSelect} 
          onClose={onTogglePromptTemplates} 
        />
      ) : (
        <form onSubmit={handleSubmit} className="relative rounded-lg shadow-sm">
          <textarea
            ref={textareaRef}
            rows="3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="block w-full px-4 py-3 border-0 resize-none focus:ring-0 rounded-lg"
            placeholder="输入消息..."
            disabled={isSubmitting}
            autoFocus // 添加自动聚焦属性
          />
          <div className="absolute bottom-2 right-2 flex space-x-1">
            <button 
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className={`p-2 rounded-full ${
                message.trim() && !isSubmitting
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-paper-plane"></i>
              )}
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
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ToastManager } from '../common/Toast';
import QuickQuestions from './QuickQuestions';

function ChatInput({ onSend, questionTarget, processing = false }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);
  
  // 判断是否禁用发送
  const isSendDisabled = !questionTarget || processing || isSubmitting;

  // 组件挂载时自动聚焦
  useEffect(() => {
    if (questionTarget) {
      textareaRef.current?.focus();
    }
  }, [questionTarget]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || isSendDisabled) return;

    try {
      setIsSubmitting(true);
      await onSend(message);
      setMessage('');
      // 发送消息后自动聚焦
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    } catch (error) {
      ToastManager.error('发送失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (isSendDisabled) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickQuestionSelect = async (question) => {
    if (isSendDisabled) return;
    
    try {
      setIsSubmitting(true);
      await onSend(question);
    } catch (error) {
      ToastManager.error('发送失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t border-gray-200 p-4">
      {/* 快捷提问标签 */}
      {questionTarget && (
          <QuickQuestions
            type={questionTarget.type}
            onSelect={handleQuickQuestionSelect}
            disabled={isSendDisabled}
          />
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* 输入框 */}
        <div className="relative rounded-lg shadow-sm">
          <textarea
            ref={textareaRef}
            rows="3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="block w-full px-4 py-3 border-0 resize-none focus:ring-0 rounded-lg bg-white text-gray-900"
            placeholder={!questionTarget ? "请先选择提问对象..." : "输入消息..."}
          />
        </div>
        
        {/* 底部工具栏 */}
        <div className="flex items-center justify-end">
          {/* 发送按钮 */}
          <button 
            type="submit"
            disabled={isSendDisabled || !message.trim()}
            className={`p-2 rounded-full transition-colors ${
              !isSendDisabled && message.trim()
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-arrow-up"></i>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

ChatInput.propTypes = {
  onSend: PropTypes.func.isRequired,
  questionTarget: PropTypes.object,
  processing: PropTypes.bool
};

export default ChatInput;

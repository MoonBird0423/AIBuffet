import React, { useEffect, useRef } from 'react';

function ChatMessages({ messages }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getMessageIcon = (role, model) => {
    if (role === 'user') {
      return (
        <div className="bg-blue-200 p-2 rounded-full">
          <i className="fas fa-user text-blue-600"></i>
        </div>
      );
    }
    
    // 根据不同的模型返回不同的图标
    const modelIcons = {
      'GPT-4': { icon: 'apple-alt', bg: 'bg-red-100', color: 'text-red-600' },
      'Claude': { icon: 'lemon', bg: 'bg-yellow-100', color: 'text-yellow-600' },
      'Gemini': { icon: 'carrot', bg: 'bg-green-100', color: 'text-green-600' },
      'Llama 2': { icon: 'cookie', bg: 'bg-yellow-100', color: 'text-yellow-600' }
    };

    const iconConfig = modelIcons[model] || { icon: 'robot', bg: 'bg-purple-100', color: 'text-purple-600' };
    
    return (
      <div className={`${iconConfig.bg} p-2 rounded-full`}>
        <i className={`fas fa-${iconConfig.icon} ${iconConfig.color}`}></i>
      </div>
    );
  };

  // 渲染单个内容项
  const renderContentItem = (item) => {
    switch (item.type) {
      case 'text':
        return item.text.split('\n').map((line, i) => (
          <p key={i} className="mb-1 last:mb-0">{line}</p>
        ));
      case 'input_audio':
        return (
          <div className="flex items-center space-x-2">
            <i className="fas fa-music text-gray-500"></i>
            <span>语音输入</span>
            <audio src={item.input_audio.data} controls className="max-w-full" />
          </div>
        );
      default:
        return <p>不支持的内容类型: {item.type}</p>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((message, index) => {
        if (message.role === 'system') {
          return (
            <div key={index} className="bg-blue-50 rounded-lg p-4 text-sm text-center text-blue-700">
              {message.content.map((item, i) => (
                <div key={i}>{renderContentItem(item)}</div>
              ))}
            </div>
          );
        }

        const isUser = message.role === 'user';
        return (
          <div key={index} className={`flex items-start ${isUser ? 'justify-end' : ''}`}>
            {!isUser && (
              <div className="flex-shrink-0 mr-3">
                {getMessageIcon('assistant', message.model)}
              </div>
            )}
            <div 
              className={`rounded-lg p-4 max-w-3xl ${
                isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.content.map((item, i) => (
                <div key={i} className={isUser && item.type === 'text' ? 'text-white' : ''}>
                  {renderContentItem(item)}
                </div>
              ))}
            </div>
            {isUser && (
              <div className="flex-shrink-0 ml-3">
                {getMessageIcon('user')}
              </div>
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatMessages;
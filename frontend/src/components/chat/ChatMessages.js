import React, { useEffect, useRef } from 'react';

function ChatMessages({ messages }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getMessageIcon = (type, model) => {
    if (type === 'user') {
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

    const iconConfig = modelIcons[model] || modelIcons['GPT-4'];
    
    return (
      <div className={`${iconConfig.bg} p-2 rounded-full`}>
        <i className={`fas fa-${iconConfig.icon} ${iconConfig.color}`}></i>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((message, index) => {
        if (message.type === 'system') {
          return (
            <div key={index} className="bg-blue-50 rounded-lg p-4 text-sm text-center text-blue-700">
              <p>{message.content}</p>
            </div>
          );
        }

        const isUser = message.type === 'user';
        return (
          <div key={index} className={`flex items-start ${isUser ? 'justify-end' : ''}`}>
            {!isUser && (
              <div className="flex-shrink-0 mr-3">
                {getMessageIcon(message.type, message.model)}
              </div>
            )}
            <div 
              className={`rounded-lg p-4 max-w-3xl ${
                isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.content.split('\n').map((line, i) => (
                <p key={i} className="mb-1 last:mb-0">{line}</p>
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
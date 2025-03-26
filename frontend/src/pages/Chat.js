import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ChatHeader from '../components/chat/ChatHeader';
import ChatMessages from '../components/chat/ChatMessages';
import ChatInput from '../components/chat/ChatInput';
import ChatSidebar from '../components/chat/ChatSidebar';

function Chat() {
  const location = useLocation();
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelEmoji, setModelEmoji] = useState('');
  const [modelPurpose, setModelPurpose] = useState('');
  const [messages, setMessages] = useState([]);
  const [showPromptTemplates, setShowPromptTemplates] = useState(false);

  useEffect(() => {
    // 从 URL 参数中获取模型信息
    const params = new URLSearchParams(location.search);
    const modelName = params.get('model');
    const emoji = params.get('emoji');
    const purpose = params.get('purpose');

    if (modelName) {
      setSelectedModel(modelName);
      setModelEmoji(emoji || '');
      setModelPurpose(purpose || '');

      // 添加欢迎消息
      setMessages([
        {
          type: 'system',
          content: `这是与 ${modelName} 的新对话。模型可能偶尔会产生不准确的信息。`
        },
        {
          type: 'ai',
          content: `您好！我是 ${modelName}，很高兴能与您交流。有什么我可以帮助您的吗？`,
          model: modelName
        }
      ]);
    }
  }, [location]);

  const handleSendMessage = (content) => {
    if (!content.trim()) return;

    // 添加用户消息
    const userMessage = {
      type: 'user',
      content: content
    };
    setMessages(prev => [...prev, userMessage]);

    // 模拟AI回复
    setTimeout(() => {
      const aiMessage = {
        type: 'ai',
        content: `这是来自 ${selectedModel} 的回复示例。在实际开发中，这里需要调用后端API获取真实的AI回复。`,
        model: selectedModel
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const handleModelChange = (modelName) => {
    setSelectedModel(modelName);
  };

  const togglePromptTemplates = () => {
    setShowPromptTemplates(!showPromptTemplates);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ChatSidebar />
      <div className="flex-1 flex flex-col">
        <ChatHeader
          selectedModel={selectedModel}
          emoji={modelEmoji}
          purpose={modelPurpose}
        />
        <ChatMessages messages={messages} />
        <ChatInput
          onSend={handleSendMessage}
          showPromptTemplates={showPromptTemplates}
          onTogglePromptTemplates={togglePromptTemplates}
        />
      </div>
    </div>
  );
}

export default Chat;
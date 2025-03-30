import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatHeader from '../components/chat/ChatHeader';
import ChatMessages from '../components/chat/ChatMessages';
import ChatInput from '../components/chat/ChatInput';
import ChatSidebar from '../components/chat/ChatSidebar';
import { getChatSession, createChatSession, updateChatSession } from '../services/api';

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelEmoji, setModelEmoji] = useState('');
  const [modelPurpose, setModelPurpose] = useState('');
  const [messages, setMessages] = useState([]);
  const [showPromptTemplates, setShowPromptTemplates] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [error, setError] = useState(null);
  const [sidebarKey, setSidebarKey] = useState(0);
  const [inputFocusKey, setInputFocusKey] = useState(0); // 用于触发输入框聚焦

  // 从URL参数获取会话ID
  const sessionId = new URLSearchParams(location.search).get('session');

  // 检查用户登录状态
  useEffect(() => {
    const authUser = localStorage.getItem('auth_user');
    if (!authUser) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    try {
      const user = JSON.parse(authUser);
      console.log('Current user:', user);
      if (!user.token) {
        navigate('/login', { state: { from: location.pathname + location.search } });
      }
    } catch (error) {
      console.error('解析用户信息失败:', error);
      navigate('/login', { state: { from: location.pathname + location.search } });
    }
  }, [location, navigate]);

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
    }
  }, [location]);

  // 加载对话内容
  useEffect(() => {
    const loadSession = async () => {
      if (sessionId) {
        try {
          setError(null);
          const session = await getChatSession(sessionId);
          setCurrentSession(session);
          setMessages(JSON.parse(session.messages));
          // 切换对话后触发输入框聚焦
          setInputFocusKey(prev => prev + 1);
        } catch (error) {
          console.error('加载对话失败:', error);
          if (error.response && error.response.status === 401) {
            navigate('/login', { state: { from: location.pathname + location.search } });
          } else {
            setError('加载对话失败，请稍后重试');
            navigate('/chat');
          }
        }
      } else {
        setCurrentSession(null);
        setMessages([
          {
            role: 'system',
            content: [{ type: 'text', text: '这是一个新对话。AI助手随时为您服务。' }]
          }
        ]);
        // 新对话时触发输入框聚焦
        setInputFocusKey(prev => prev + 1);
      }
    };

    loadSession();
  }, [sessionId, navigate, location]);

  const refreshSidebar = useCallback(() => {
    setSidebarKey(prev => prev + 1);
  }, []);

  const handleSendMessage = async (content) => {
    if (!content.trim()) return;

    // 添加用户消息
    const userMessage = {
      role: 'user',
      content: [{ type: 'text', text: content }]
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      setError(null);
      if (!sessionId) {
        // 如果是新对话，创建会话
        const newSession = await createChatSession(content);
        console.log('Created new session:', newSession);
        refreshSidebar(); // 刷新侧边栏
        navigate(`/chat?session=${newSession.sessionId}`);
      } else {
        // 更新现有对话
        await updateChatSession(sessionId, JSON.stringify(newMessages));
      }

      // 模拟AI回复
      setTimeout(() => {
        const aiMessage = {
          role: 'assistant',
          content: [{ 
            type: 'text', 
            text: `这是来自 ${selectedModel || 'AI助手'} 的回复示例。在实际开发中，这里需要调用后端API获取真实的AI回复。`
          }]
        };
        const updatedMessages = [...newMessages, aiMessage];
        setMessages(updatedMessages);
        
        // 更新服务器上的消息
        if (sessionId) {
          updateChatSession(sessionId, JSON.stringify(updatedMessages))
            .catch(error => {
              console.error('更新对话失败:', error);
              setError('更新对话失败，请稍后重试');
            });
        }
      }, 1000);
    } catch (error) {
      console.error('发送消息失败:', error);
      if (error.response && error.response.status === 401) {
        navigate('/login', { state: { from: location.pathname + location.search } });
      } else {
        setError('发送消息失败，请稍后重试');
      }
    }
  };

  const handleNewChat = () => {
    setError(null);
    setMessages([
      {
        role: 'system',
        content: [{ type: 'text', text: '这是一个新对话。AI助手随时为您服务。' }]
      }
    ]);
    setCurrentSession(null);
    // 新建对话时触发输入框聚焦
    setInputFocusKey(prev => prev + 1);
  };

  const togglePromptTemplates = () => {
    setShowPromptTemplates(!showPromptTemplates);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ChatSidebar 
        key={sidebarKey} 
        onNewChat={handleNewChat}
        onDeleteSuccess={refreshSidebar}
      />
      <div className="flex-1 flex flex-col">
        <ChatHeader
          selectedModel={selectedModel}
          emoji={modelEmoji}
          purpose={modelPurpose}
          chatName={currentSession?.chatName}
        />
        {error && (
          <div className="bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-circle text-red-400"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        <ChatMessages messages={messages} />
        <ChatInput
          key={inputFocusKey} // 使用key来触发重新渲染和自动聚焦
          onSend={handleSendMessage}
          showPromptTemplates={showPromptTemplates}
          onTogglePromptTemplates={togglePromptTemplates}
        />
      </div>
    </div>
  );
}

export default Chat;
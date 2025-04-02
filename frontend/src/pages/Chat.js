import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatHeader from '../components/chat/ChatHeader';
import ChatMessages from '../components/chat/ChatMessages';
import ChatInput from '../components/chat/ChatInput';
import ChatSidebar from '../components/chat/ChatSidebar';
import { getChatSession, createChatSession, updateChatSession, queryModels } from '../services/api';

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState(null);
  const [currentModel, setCurrentModel] = useState(null);
  const [modelEmoji, setModelEmoji] = useState('');
  const [modelPurpose, setModelPurpose] = useState('');
  const [messages, setMessages] = useState([]);
  const [showPromptTemplates, setShowPromptTemplates] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [error, setError] = useState(null);
  const [inputFocusKey, setInputFocusKey] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const sidebarRef = useRef(null);

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
      if (!user.token) {
        navigate('/login', { state: { from: location.pathname + location.search } });
      }
    } catch (error) {
      setError('登录信息无效,请重新登录');
      navigate('/login', { state: { from: location.pathname + location.search } });
    }
  }, [location, navigate]);

  // 获取模型完整信息
  const fetchModelDetails = useCallback(async (modelName) => {
    if (!modelName) return;
    try {
      const response = await queryModels({ name: modelName });
      if (response && response.length > 0) {
        const model = response[0];
        setCurrentModel(model);
      }
    } catch (error) {
      setError('获取模型信息失败');
    }
  }, []);

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
      fetchModelDetails(modelName);
    }
  }, [location, fetchModelDetails]);

  // ... rest of the code remains exactly the same
  
  useEffect(() => {
    const loadSession = async () => {
      if (sessionId) {
        try {
          setError(null);
          const session = await getChatSession(sessionId);
          setCurrentSession(session);
          setMessages(JSON.parse(session.messages));
          setInputFocusKey(prev => prev + 1);
        } catch (error) {
          if (error.response && error.response.status === 401) {
            setError('未登录或登录已过期,请重新登录');
            navigate('/login', { state: { from: location.pathname + location.search } });
          } else {
            setError('加载对话失败,请稍后重试');
            navigate('/chat');
          }
        }
      } else {
        setCurrentSession(null);
        setMessages([
          {
            role: 'system',
            content: '这是一个新对话。AI助手随时为您服务。'
          }
        ]);
        setInputFocusKey(prev => prev + 1);
      }
    };

    loadSession();
  }, [sessionId, navigate, location]);

  const handleSendMessage = async (content, files) => {
    if ((!content.trim() && (!files || !files.length)) || isProcessing) return;

    try {
      setIsProcessing(true);
      setError(null);

      // 添加用户消息
      const userMessage = {
        role: 'user',
        content: files && files.length > 0 ? [
          { type: 'text', text: content },
          ...(files || []).map(file => ({
            type: file.type.startsWith('image/') ? 'image' : 'file',
            file
          }))
        ] : content
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);

      if (!sessionId) {
        const newSession = await createChatSession(content);
        if (sidebarRef.current) {
          sidebarRef.current.handleChatCreated(newSession);
        }
        navigate(`/chat?session=${newSession.sessionId}`);
      } else {
        const updatedChat = await updateChatSession(sessionId, JSON.stringify(newMessages));
        if (sidebarRef.current) {
          sidebarRef.current.handleChatUpdated(updatedChat);
        }
      }

      // 模拟AI回复
      setTimeout(async () => {
        const aiMessage = {
          role: 'assistant',
          content: `这是来自 ${selectedModel || 'AI助手'} 的回复示例。在实际开发中，这里需要调用后端API获取真实的AI回复。`
        };
        const updatedMessages = [...newMessages, aiMessage];
        setMessages(updatedMessages);
        
        try {
          if (sessionId) {
            const updatedChat = await updateChatSession(sessionId, JSON.stringify(updatedMessages));
            if (sidebarRef.current) {
              sidebarRef.current.handleChatUpdated(updatedChat);
            }
          }
        } catch (error) {
          setError('更新对话失败,请稍后重试');
        } finally {
          setIsProcessing(false);
        }
      }, 1000);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setError('未登录或登录已过期,请重新登录');
        navigate('/login', { state: { from: location.pathname + location.search } });
      } else {
        setError('发送消息失败,请稍后重试');
      }
      setIsProcessing(false);
    }
  };

  const handleNewChat = () => {
    setError(null);
    setMessages([
      {
        role: 'system',
        content: '这是一个新对话。AI助手随时为您服务。'
      }
    ]);
    setCurrentSession(null);
    setInputFocusKey(prev => prev + 1);
  };

  const togglePromptTemplates = () => {
    setShowPromptTemplates(!showPromptTemplates);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ChatSidebar
        ref={sidebarRef}
        onNewChat={handleNewChat}
        onDeleteSuccess={async (deletedSessionId) => {
          if (sidebarRef.current) {
            sidebarRef.current.handleChatDeleted(deletedSessionId);
          }
        }}
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
          key={inputFocusKey}
          onSend={handleSendMessage}
          showPromptTemplates={showPromptTemplates}
          onTogglePromptTemplates={togglePromptTemplates}
          disabled={isProcessing}
          supportedTypes={currentModel?.supportedInputTypes || []}
        />
      </div>
    </div>
  );
}

export default Chat;
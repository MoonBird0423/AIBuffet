import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatHeader from '../components/chat/ChatHeader';
import ChatMessages from '../components/chat/ChatMessages';
import ChatInput from '../components/chat/ChatInput';
import ChatSidebar from '../components/chat/ChatSidebar';
import { getChatSession, createChatSession, updateChatSession, queryModels, invokeModel } from '../services/api';

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState(null);
  const [currentModel, setCurrentModel] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [modelEmoji, setModelEmoji] = useState('');
  const [modelPurpose, setModelPurpose] = useState('');
  const [messagesMap, setMessagesMap] = useState(new Map());
  const [processingMap, setProcessingMap] = useState(new Map());
  const [partialResponseMap, setPartialResponseMap] = useState(new Map());
  const [showPromptTemplates, setShowPromptTemplates] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [error, setError] = useState(null);
  const [inputFocusKey, setInputFocusKey] = useState(0);
  const [loadingRetryCount, setLoadingRetryCount] = useState(0);
  
  const sidebarRef = useRef(null);
  const abortControllerRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // 从URL参数获取会话ID
  const sessionId = new URLSearchParams(location.search).get('session');

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
      setError('登录信息无效，请重新登录');
      navigate('/login', { state: { from: location.pathname + location.search } });
    }
  }, [location, navigate]);

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

  useEffect(() => {
    const loadSession = async () => {
      // 清除之前的重试定时器
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      setError(null);
      if (sessionId) {
        try {
          const session = await getChatSession(sessionId);
          if (session) {
            setCurrentSessionId(sessionId);
            setCurrentSession(session);
            // 更新消息Map
            setMessagesMap(prev => {
              const newMap = new Map(prev);
              newMap.set(sessionId, JSON.parse(session.messages));
              return newMap;
            });
            setInputFocusKey(prev => prev + 1);
            setLoadingRetryCount(0); // 重置重试计数
          } else if (loadingRetryCount < 3) { // 最多重试3次
            // 如果session为null且未超过重试次数，延迟1秒后重试
            retryTimeoutRef.current = setTimeout(() => {
              setLoadingRetryCount(prev => prev + 1);
            }, 1000);
          }
        } catch (error) {
          console.error('Load session error:', error);
          if (error.response && error.response.status === 401) {
            setError('未登录或登录已过期，请重新登录');
            navigate('/login', { state: { from: location.pathname + location.search } });
          } else if (loadingRetryCount < 3) { // 最多重试3次
            // 如果出错且未超过重试次数，延迟1秒后重试
            retryTimeoutRef.current = setTimeout(() => {
              setLoadingRetryCount(prev => prev + 1);
            }, 1000);
          } else {
            setError('加载对话失败，但可以继续聊天');
          }
        }
      } else {
        // 如果没有sessionId，直接初始化新对话
        setCurrentSession(null);
        setMessagesMap(prev => {
          const newMap = new Map(prev);
          newMap.set('new', [
            {
              role: 'system',
              content: '这是一个新对话。AI助手随时为您服务。'
            }
          ]);
          return newMap;
        });
        setInputFocusKey(prev => prev + 1);
      }
    };

    loadSession();

    // 清理函数
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [sessionId, navigate, loadingRetryCount]);

  // 取消当前请求
  const cancelCurrentRequest = (sessionIdToCancel) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // 清理特定会话的状态
    setProcessingMap(prev => {
      const newMap = new Map(prev);
      if (sessionIdToCancel) {
        newMap.delete(sessionIdToCancel);
      }
      return newMap;
    });
    
    setPartialResponseMap(prev => {
      const newMap = new Map(prev);
      if (sessionIdToCancel) {
        newMap.delete(sessionIdToCancel);
      }
      return newMap;
    });
  };

  const handleSendMessage = async (content, files) => {
    if (!content.trim() && (!files || !files.length)) return;
    
    // 取消之前的请求（如果有）
    cancelCurrentRequest();

    let activeSessionId = sessionId;
    try {
      setError(null);

      // 先创建新会话（如果需要）
      if (!activeSessionId) {
        try {
          const newSession = await createChatSession(content);
          activeSessionId = newSession.sessionId;
          setCurrentSessionId(activeSessionId);
          setCurrentSession(newSession);
          
          // 将消息从'new'迁移到新会话
          setMessagesMap(prev => {
            const newMap = new Map(prev);
            const messages = newMap.get('new') || [];
            newMap.set(activeSessionId, messages);
            newMap.delete('new');
            return newMap;
          });

          // 通知侧边栏
          if (sidebarRef.current) {
            sidebarRef.current.handleChatCreated(newSession);
          }
          
          // 更新URL并触发路由更新
          navigate(`/chat?session=${activeSessionId}`);
        } catch (error) {
          console.error('Create session error:', error);
          setError('创建对话失败');
          return; // 如果创建会话失败，直接返回
        }
      }

      // 设置处理状态
      setProcessingMap(prev => {
        const newMap = new Map(prev);
        newMap.set(activeSessionId, true);
        return newMap;
      });
      
      // 清除部分响应
      setPartialResponseMap(prev => {
        const newMap = new Map(prev);
        newMap.set(activeSessionId, '');
        return newMap;
      });

      // 获取当前消息（从'new'或现有会话）
      const currentId = activeSessionId || 'new';
      const existingMessages = messagesMap.get(currentId) || [];
      
      // 添加用户消息
      const userMessage = {
        role: 'user',
        content: content.trim()
      };

      // 构建新的消息列表
      const newMessages = [...existingMessages, userMessage];
      
      // 更新消息映射
      setMessagesMap(prev => {
        const newMap = new Map(prev);
        newMap.set(currentId, newMessages);
        return newMap;
      });

      // 如果已有会话ID，更新会话
      if (activeSessionId) {
        try {
          const updatedChat = await updateChatSession(activeSessionId, JSON.stringify(newMessages));
          if (sidebarRef.current) {
            sidebarRef.current.handleChatUpdated(updatedChat);
          }
        } catch (error) {
          console.error('Update session error:', error);
          setError('更新对话失败，但可以继续聊天');
        }
      }

      // 创建新的AbortController
      abortControllerRef.current = new AbortController();

      // 调用模型
      let aiMessage = {
        role: 'assistant',
        content: ''
      };
      // 更新特定会话的消息
      // 使用确定的activeSessionId更新消息
      setMessagesMap(prev => {
        const newMap = new Map(prev);
        const sessionMessages = newMap.get(activeSessionId) || [];
        newMap.set(activeSessionId, [...sessionMessages, aiMessage]);
        return newMap;
      });

      // 开始流式调用
      invokeModel({
        messages: newMessages,
        model: selectedModel || 'deepseek-chat',
        onMessage: (data) => {
          // 从SSE响应中提取content
          const content = data.choices?.[0]?.delta?.content || '';
          if (content) {
            console.debug('Received content:', content);
            
            // 更新部分响应状态
            setPartialResponseMap(prev => {
              const newMap = new Map(prev);
              const currentPartial = (newMap.get(activeSessionId) || '') + content;
              newMap.set(activeSessionId, currentPartial);
              return newMap;
            });
            
            aiMessage.content = aiMessage.content + content;
            // 使用确定的activeSessionId更新消息
            setMessagesMap(prev => {
              const newMap = new Map(prev);
              const sessionMessages = [...(newMap.get(activeSessionId) || [])];
              sessionMessages[sessionMessages.length - 1] = { ...aiMessage };
              newMap.set(activeSessionId, sessionMessages);
              return newMap;
            });
          }
        },
        onError: (error) => {
          console.error('Model invocation error:', error);
          setError('模型调用失败，请重试');
          setProcessingMap(prev => {
            const newMap = new Map(prev);
            // 使用当前会话ID或新建会话的占位符
            const activeSessionId = sessionId || 'new';
            newMap.delete(activeSessionId);
            return newMap;
          });
        },
        onFinish: async () => {
          // 清理状态
          setPartialResponseMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(activeSessionId);
            return newMap;
          });
          
          setProcessingMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(activeSessionId);
            return newMap;
          });
          
          const finalMessages = [...newMessages, aiMessage];
          try {
            const updatedChat = await updateChatSession(activeSessionId, JSON.stringify(finalMessages));
            if (sidebarRef.current) {
              sidebarRef.current.handleChatUpdated(updatedChat);
            }
          } catch (error) {
            console.error('Update session error after completion:', error);
            setError('更新对话失败，但对话已完成');
          }
        },
        signal: abortControllerRef.current.signal
      });
    } catch (error) {
      console.error('Send message error:', error);
      if (error.name === 'AbortError') {
        setError('请求已取消');
      } else if (error.response && error.response.status === 401) {
        setError('未登录或登录已过期，请重新登录');
        navigate('/login', { state: { from: location.pathname + location.search } });
      } else {
        setError('发送消息失败，请重试');
      }
      setProcessingMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(activeSessionId);
        return newMap;
      });
    }
  };

  const handleNewChat = () => {
    if (sessionId) {
      cancelCurrentRequest(sessionId);
    }
    setError(null);
    setCurrentSession(null);
    setCurrentSessionId(null);
    setMessagesMap(prev => {
      const newMap = new Map(prev);
      newMap.set('new', [
        {
          role: 'system',
          content: '这是一个新对话。AI助手随时为您服务。'
        }
      ]);
      return newMap;
    });
    setInputFocusKey(prev => prev + 1);
  };

  const togglePromptTemplates = () => {
    setShowPromptTemplates(!showPromptTemplates);
  };

  useEffect(() => {
    return () => {
      cancelCurrentRequest();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      // 清理会话状态
      setCurrentSessionId(null);
      setCurrentSession(null);
    };
  }, []);

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
        <ChatMessages
          messages={messagesMap.get(currentSessionId || 'new') || []}
          partialResponse={partialResponseMap.get(currentSessionId || 'new') || ''}
          messageStatus={processingMap.get(currentSessionId || 'new') ? 'streaming' : 'completed'}
        />
        <ChatInput
          key={inputFocusKey}
          onSend={handleSendMessage}
          showPromptTemplates={showPromptTemplates}
          onTogglePromptTemplates={togglePromptTemplates}
          supportedTypes={currentModel?.supportedInputTypes || []}
        />
      </div>
    </div>
  );
}

export default Chat;
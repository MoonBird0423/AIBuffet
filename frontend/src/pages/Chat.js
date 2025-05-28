import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatHeader from '../components/chat/ChatHeader';
import ChatMessages from '../components/chat/ChatMessages';
import ChatInput from '../components/chat/ChatInput';
import ChatSidebar from '../components/chat/ChatSidebar';
import { getChatSession, createChatSession, updateChatSession, queryModels, invokeModel, uploadChatImage, clearQuestionTarget } from '../services/api';
import { FILE_TYPES, formatFileSize } from '../utils/fileUtils';
import { ToastManager } from '../components/common/Toast';

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState(null);
  const [currentModel, setCurrentModel] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentUserMessage, setCurrentUserMessage] = useState(null);
  const [uploadStates, setUploadStates] = useState(new Map());
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
  const [questionTarget, setQuestionTarget] = useState(null); // {type: 'book'|'knowledge', id: string, name: string}
  const [showNoTargetHint, setShowNoTargetHint] = useState(false);
  
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

  // URL参数解析逻辑 - 处理图书和知识库参数
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookId = params.get('bookId');
    const bookName = params.get('bookName');
    const knowledgeBaseId = params.get('knowledgeBaseId');
    const knowledgeBaseName = params.get('knowledgeBaseName');
    
    if (bookId && bookName) {
      setQuestionTarget({ 
        type: 'book', 
        id: bookId, 
        name: decodeURIComponent(bookName) 
      });
      setShowNoTargetHint(false);
    } else if (knowledgeBaseId && knowledgeBaseName) {
      setQuestionTarget({ 
        type: 'knowledge', 
        id: knowledgeBaseId, 
        name: decodeURIComponent(knowledgeBaseName) 
      });
      setShowNoTargetHint(false);
    } else {
      setQuestionTarget(null);
      setShowNoTargetHint(true);
    }
  }, [location.search]);

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
        const messages = JSON.parse(session.messages);
        
        // 从session中恢复questionTarget
        if (session.questionTargetType) {
          setQuestionTarget({
            type: session.questionTargetType,
            id: session.questionTargetId,
            name: session.questionTargetName
          });
          setShowNoTargetHint(false);
        }
        
        // 只在非流式输出状态时更新消息
        const isStreaming = processingMap.get(sessionId);
        if (!isStreaming) {
          // 如果当前有用户消息且正在等待响应，将其添加到消息列表
          if (currentUserMessage) {
            messages.push(currentUserMessage);
          }
          
          setMessagesMap(prev => {
            const newMap = new Map(prev);
            newMap.set(sessionId, messages);
            return newMap;
          });
        }
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
        // 如果没有sessionId，重置状态
        setCurrentSession(null);
        setCurrentSessionId(null);
        setMessagesMap(new Map());
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

  const uploadFile = async (file) => {
    try {
      // 文件验证
      if (!FILE_TYPES.IMAGE.mimeTypes.includes(file.type)) {
        ToastManager.error('不支持的文件格式，仅支持jpg/jpeg/png/gif/webp格式');
        throw new Error('不支持的文件格式');
      }
      if (file.size > FILE_TYPES.IMAGE.maxSize) {
        ToastManager.error(`文件大小超出限制：${formatFileSize(file.size)} > ${formatFileSize(FILE_TYPES.IMAGE.maxSize)}`);
        throw new Error('文件大小超出限制');
      }

      const response = await uploadChatImage(file);
      return response.url;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const handleSendMessage = async (content, files) => {
    if (!content.trim() && (!files || !files.length)) return;
    
    // 取消之前的请求（如果有）
    cancelCurrentRequest();

    // 构建用户消息
    let userMessage = {
      role: 'user'
    };

    // 处理文件上传
    if (files && files.length > 0) {
      const messageContent = [];
      
      // 添加文本内容
      if (content.trim()) {
        messageContent.push({
          type: 'text',
          text: content.trim()
        });
      }

      try {
        // 更新所有文件的状态为uploading
        const newUploadStates = new Map();
        files.forEach(file => {
          newUploadStates.set(file.name, { status: 'uploading', progress: 0 });
        });
        setUploadStates(newUploadStates);

        // 上传所有文件
        const uploadPromises = files.map(async (file) => {
          try {
            const url = await uploadFile(file);
            setUploadStates(prev => {
              const newStates = new Map(prev);
              newStates.set(file.name, { status: 'success', progress: 100 });
              return newStates;
            });
            return {
              type: 'image_url',
              image_url: { url }
            };
          } catch (error) {
            setUploadStates(prev => {
              const newStates = new Map(prev);
              newStates.set(file.name, { status: 'error', progress: 0 });
              return newStates;
            });
            throw error;
          }
        });

        const uploadedFiles = await Promise.all(uploadPromises);
        messageContent.push(...uploadedFiles);
      } catch (error) {
        setError('文件上传失败，请重试');
        return;
      }

      userMessage.content = messageContent;
    } else {
      userMessage.content = content.trim();
    }

    // 保存当前用户消息
    setCurrentUserMessage(userMessage);

    let activeSessionId = sessionId;
    try {
      setError(null);

      // 先创建新会话（如果需要）
      if (!activeSessionId) {
        try {
          const newSession = await createChatSession(content, questionTarget);
          activeSessionId = newSession.sessionId;
          setCurrentSessionId(activeSessionId);
          setCurrentSession(newSession);
          
          // 使用后端返回的消息列表
          const serverMessages = JSON.parse(newSession.messages);
          setMessagesMap(prev => {
            const newMap = new Map([[activeSessionId, serverMessages]]);
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

      // 获取当前会话的消息
      const currentMessages = messagesMap.get(activeSessionId) || [];
      // 构建新的消息列表
      const newMessages = [...currentMessages, userMessage];
      
      // 更新消息映射
      setMessagesMap(prev => {
        const newMap = new Map(prev);
        newMap.set(activeSessionId, newMessages);
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
      setMessagesMap(prev => {
        const newMap = new Map(prev);
        const sessionMessages = [...(newMap.get(activeSessionId) || [])];
        sessionMessages.push({ ...aiMessage });  // 使用push添加新消息
        newMap.set(activeSessionId, sessionMessages);
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
            // 只在有会话ID时删除状态
            if (activeSessionId) {
              newMap.delete(activeSessionId);
            }
            return newMap;
          });
        },
          onFinish: async () => {
            // 清理当前用户消息
            setCurrentUserMessage(null);
            
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
            
            // 使用完整的消息列表更新状态
            setMessagesMap(prev => {
              const newMap = new Map(prev);
              newMap.set(activeSessionId, finalMessages);
              return newMap;
            });
            
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
    setMessagesMap(new Map());
    setInputFocusKey(prev => prev + 1);
  };

  const togglePromptTemplates = () => {
    setShowPromptTemplates(!showPromptTemplates);
  };

  // 删除提问对象标签
  const handleRemoveTarget = async () => {
    if (currentSessionId) {
      try {
        await clearQuestionTarget(currentSessionId);
      } catch (error) {
        console.error('Clear question target error:', error);
        // 即使API调用失败，也继续更新前端状态
      }
    }
    setQuestionTarget(null);
    setShowNoTargetHint(true);
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
          questionTarget={questionTarget}
          onRemoveTarget={handleRemoveTarget}
          showNoTargetHint={showNoTargetHint}
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
          messages={messagesMap.get(currentSessionId) || []}
          partialResponse={currentSessionId ? partialResponseMap.get(currentSessionId) || '' : ''}
          messageStatus={currentSessionId ? (processingMap.get(currentSessionId) ? 'streaming' : 'completed') : 'completed'}
          uploadStates={uploadStates}
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

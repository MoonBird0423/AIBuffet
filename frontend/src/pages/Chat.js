import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import ChatHeader from '../components/chat/ChatHeader';
import ChatMessages from '../components/chat/ChatMessages';
import ChatInput from '../components/chat/ChatInput';
import ChatSidebar from '../components/chat/ChatSidebar';
import MobileChatDrawer from '../components/chat/MobileChatDrawer';
import { getChatSession, createChatSession, updateChatSession, invokeModel } from '../services/api';
import { ToastManager } from '../components/common/Toast';
import streamDebugger from '../utils/streamDebug';

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pageTitle, setPageTitle] = useState('AI对话 | 书意');
  useDocumentTitle(pageTitle);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentUserMessage, setCurrentUserMessage] = useState(null);
  const [messagesMap, setMessagesMap] = useState(new Map());
  const [processingMap, setProcessingMap] = useState(new Map());
  const [partialResponseMap, setPartialResponseMap] = useState(new Map());
  const [showPromptTemplates, setShowPromptTemplates] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [error, setError] = useState(null);
  const [completedMap, setCompletedMap] = useState(new Map());
  const [inputFocusKey, setInputFocusKey] = useState(0);
  const [loadingRetryCount, setLoadingRetryCount] = useState(0);
  const [questionTarget, setQuestionTarget] = useState(null); // {type: 'book'|'knowledge', id: string, name: string}
  const [showNoTargetHint, setShowNoTargetHint] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const sidebarRef = useRef(null);
  const mobileDrawerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // 从URL参数获取会话ID
  const sessionId = new URLSearchParams(location.search).get('session');

  // 检测移动端设备
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // 当从移动端切换到桌面端时，关闭移动端抽屉
  useEffect(() => {
    if (!isMobile && isMobileDrawerOpen) {
      setIsMobileDrawerOpen(false);
    }
  }, [isMobile, isMobileDrawerOpen]);

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

  // URL参数解析逻辑 - 处理图书和知识库参数
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookId = params.get('bookId');
    const bookName = params.get('bookName');
    const knowledgeBaseId = params.get('knowledgeBaseId');
    const knowledgeBaseName = params.get('knowledgeBaseName');
    
    if (bookId && bookName) {
      const target = { 
        type: 'book', 
        id: bookId, 
        name: decodeURIComponent(bookName) 
      };
      setQuestionTarget(target);
      setShowNoTargetHint(false);
      setPageTitle('AI对话 | 书意');
    } else if (knowledgeBaseId && knowledgeBaseName) {
      const target = { 
        type: 'knowledge', 
        id: knowledgeBaseId, 
        name: decodeURIComponent(knowledgeBaseName) 
      };
      setQuestionTarget(target);
      setShowNoTargetHint(false);
      setPageTitle('AI对话 | 书意');
    } else {
      setQuestionTarget(null);
      setShowNoTargetHint(true);
      setPageTitle('AI对话 | 书意');
    }
  }, [location.search]);

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
            
            let messages = [];
            try {
              messages = JSON.parse(session.messages || '[]');
            } catch (error) {
              console.error('Failed to parse messages:', error);
              messages = [];
            }
            
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
            setLoadingRetryCount(0);
          } else if (loadingRetryCount < 3) {
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

    setCompletedMap(prev => {
      const newMap = new Map(prev);
      if (sessionIdToCancel) {
        newMap.delete(sessionIdToCancel);
      }
      return newMap;
    });
  };

  const handleSendMessage = async (content) => {
    if (!content.trim()) return;
    
    // 取消之前的请求（如果有）
    cancelCurrentRequest();

    // 构建用户消息
    let userMessage = {
      role: 'user',
      content: content.trim()
    };

    // 保存当前用户消息
    // 如果有提问对象，添加到消息中
    if (questionTarget) {
      userMessage.questionTarget = {
        type: questionTarget.type,
        id: questionTarget.id,
        name: questionTarget.name
      };
    }

    
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
          // 通知移动端抽屉
          if (mobileDrawerRef.current) {
            mobileDrawerRef.current.handleChatCreated(newSession);
          }
          
          // 更新URL并触发路由更新
          navigate(`/chat?session=${activeSessionId}`);
        } catch (error) {
          console.error('Create session error:', error);
          setError('创建对话失败');
          return; // 如果创建会话失败，直接返回
        }
      }

      // 重置状态
      setCompletedMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(activeSessionId);
        return newMap;
      });

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
          // 通知移动端抽屉
          if (mobileDrawerRef.current) {
            mobileDrawerRef.current.handleChatUpdated(updatedChat);
          }
        } catch (error) {
          console.error('Update session error:', error);
          setError('更新对话失败，但可以继续聊天');
        }
      }

      // 创建新的AbortController
      abortControllerRef.current = new AbortController();

      // 初始化AI消息对象（仅用于UI显示）
      let aiMessage = {
        role: 'assistant',
        content: ''
      };
      
      // 添加空的AI消息到UI
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
        onMessage: (data) => {
          const content = data.choices?.[0]?.delta?.content || '';
          
          streamDebugger.log('CHAT_MESSAGE_RECEIVED', {
            hasContent: !!content,
            contentLength: content.length,
            sessionId: activeSessionId
          });
          
          if (content) {
            // 更新UI显示
            setPartialResponseMap(prev => {
              const newMap = new Map(prev);
              const currentPartial = (newMap.get(activeSessionId) || '') + content;
              newMap.set(activeSessionId, currentPartial);
              return newMap;
            });
            
            streamDebugger.log('UI_PARTIAL_UPDATE', {
              sessionId: activeSessionId,
              contentLength: content.length
            });
            
            // 累积AI响应内容
            aiMessage.content += content;
            
            // 更新UI中的消息
            setMessagesMap(prev => {
              const newMap = new Map(prev);
              const sessionMessages = [...(newMap.get(activeSessionId) || [])];
              sessionMessages[sessionMessages.length - 1] = { ...aiMessage };
              newMap.set(activeSessionId, sessionMessages);
              return newMap;
            });
            
            streamDebugger.log('UI_MESSAGE_UPDATE', {
              sessionId: activeSessionId,
              messageLength: aiMessage.content.length
            });
          }
        },
        onError: async (error) => {
          console.error('Model invocation error:', error);
          
          if (error.isPermissionError) {
            ToastManager.error(error.message);
            // 当权限错误时，自动打开购买弹窗
            window.dispatchEvent(new CustomEvent('showPurchaseModal', { 
              detail: { type: 'vip' } 
            }));
          } else if (error.response?.data?.error) {
            setError(error.response.data.error);
          } else {
            setError('模型调用失败，请重试');
          }
          
          // 如果有部分生成的内容，保存到数据库
          if (aiMessage.content) {
            const finalMessages = [...newMessages, { ...aiMessage }];
            try {
              const updatedChat = await updateChatSession(activeSessionId, JSON.stringify(finalMessages));
              if (sidebarRef.current) {
                sidebarRef.current.handleChatUpdated(updatedChat);
              }
              // 通知移动端抽屉
              if (mobileDrawerRef.current) {
                mobileDrawerRef.current.handleChatUpdated(updatedChat);
              }
            } catch (saveError) {
              console.error('Failed to save partial response:', saveError);
            }
          }

          // 清理状态
          setProcessingMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(activeSessionId);
            return newMap;
          });
          
          setPartialResponseMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(activeSessionId);
            return newMap;
          });
        },
        onFinish: async () => {
          try {
            streamDebugger.log('CHAT_COMPLETED', {
              sessionId: activeSessionId,
              finalLength: aiMessage.content.length
            });
            
            // 设置完成状态
            setCompletedMap(prev => {
              const newMap = new Map(prev);
              newMap.set(activeSessionId, true);
              return newMap;
            });

            // 使用完整的AI响应更新数据库
            const finalMessages = [...newMessages, { ...aiMessage }];
            
            const updatedChat = await updateChatSession(activeSessionId, JSON.stringify(finalMessages));

            // 更新UI状态
            setMessagesMap(prev => {
              const newMap = new Map(prev);
              newMap.set(activeSessionId, finalMessages);
              return newMap;
            });

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

            if (sidebarRef.current) {
              sidebarRef.current.handleChatUpdated(updatedChat);
            }
            // 通知移动端抽屉
            if (mobileDrawerRef.current) {
              mobileDrawerRef.current.handleChatUpdated(updatedChat);
            }
            
            // 输出性能分析报告
            setTimeout(() => {
              streamDebugger.analyze();
            }, 1000);
            
          } catch (error) {
            console.error('Update session error:', error);
            setError('更新会话失败，但对话已完成');
          }
        },
        signal: abortControllerRef.current.signal
      });
    } catch (error) {
      handleError(error);
      setProcessingMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(activeSessionId);
        return newMap;
      });
    }
  };

  // 统一的错误处理函数
  const handleError = (error) => {
    console.error('Operation error:', error);
    
    let errorMessage = '发送消息失败，请重试';
    
    if (error.name === 'AbortError') {
      errorMessage = '请求已取消';
    } else if (error.response) {
      switch (error.response.status) {
        case 401:
          errorMessage = '未登录或登录已过期，请重新登录';
          navigate('/login', { state: { from: location.pathname + location.search } });
          break;
        case 404:
          errorMessage = '会话不存在或已失效';
          // 尝试重新获取会话
          tryRefreshSession(currentSessionId);
          break;
        case 500:
          errorMessage = '服务器内部错误，请稍后重试';
          break;
        default:
          if (!navigator.onLine) {
            errorMessage = '网络连接失败，请检查网络';
          } else {
            errorMessage = error.response.data?.message || '发送消息失败，请重试';
          }
      }
    } else if (!error.response) {
      errorMessage = '网络连接失败，请检查网络';
    }
    
    setError(errorMessage);
  };

  // 会话刷新函数
  const tryRefreshSession = async (sessionId) => {
    if (!sessionId) return;
    
    try {
      const session = await getChatSession(sessionId);
      if (session) {
        setCurrentSession(session);
        const messages = JSON.parse(session.messages || '[]');
        setMessagesMap(prev => {
          const newMap = new Map(prev);
          newMap.set(sessionId, messages);
          return newMap;
        });
        setError(null); // 清除错误状态
      }
    } catch (retryError) {
      console.error('Session refresh failed:', retryError);
      // 刷新失败保持原有错误消息
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
    setCompletedMap(new Map());
    setInputFocusKey(prev => prev + 1);
  };

  // 处理移动端菜单打开
  const handleMobileMenuOpen = () => {
    setIsMobileDrawerOpen(true);
  };

  // 处理移动端菜单关闭
  const handleMobileMenuClose = () => {
    setIsMobileDrawerOpen(false);
  };

  // 处理移动端抽屉删除成功
  const handleMobileDeleteSuccess = async (deletedSessionId) => {
    if (mobileDrawerRef.current) {
      mobileDrawerRef.current.handleChatDeleted(deletedSessionId);
    }
    if (sidebarRef.current) {
      sidebarRef.current.handleChatDeleted(deletedSessionId);
    }
  };

  // 处理提问对象选择
  const handleTargetSelect = (target) => {
    setQuestionTarget(target);
    setShowNoTargetHint(false);
    setInputFocusKey(prev => prev + 1); // 触发输入框聚焦
    
    // 更新URL参数以保持状态同步
    const params = new URLSearchParams(window.location.search);
    params.set(`${target.type}Id`, target.id);
    params.set(`${target.type}Name`, encodeURIComponent(target.name));
    
    // 清除其他类型的参数
    if (target.type === 'book') {
      params.delete('knowledgeBaseId');
      params.delete('knowledgeBaseName');
    } else {
      params.delete('bookId');
      params.delete('bookName');
    }
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  };

  const togglePromptTemplates = () => {
    setShowPromptTemplates(!showPromptTemplates);
  };

  // 添加消息监听器处理窗口切换
  useEffect(() => {
    const handleMessage = (event) => {
      // 验证消息来源
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'UPDATE_QUESTION_TARGET') {
        const { questionTarget } = event.data;
        
        // 更新问题目标
        setQuestionTarget(questionTarget);
        setShowNoTargetHint(false);
        
        // 更新URL参数
        const params = new URLSearchParams();
        params.set(`${questionTarget.type}Id`, questionTarget.id);
        params.set(`${questionTarget.type}Name`, encodeURIComponent(questionTarget.name));
        
        // 保留现有的session参数
        const currentSession = new URLSearchParams(window.location.search).get('session');
        if (currentSession) {
          params.set('session', currentSession);
        }
        
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
        
        // 重置输入框聚焦
        setInputFocusKey(prev => prev + 1);
        
        // 显示切换成功提示
        ToastManager.success(`已切换到${questionTarget.type === 'book' ? '图书' : '知识库'}：${questionTarget.name}`);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    return () => {
      cancelCurrentRequest();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      // 清理会话状态
      setCurrentSessionId(null);
      setCurrentSession(null);
      setCompletedMap(new Map());
      setProcessingMap(new Map());
      setPartialResponseMap(new Map());
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 桌面端侧边栏 */}
      <div className="hidden md:block">
        <ChatSidebar
          ref={sidebarRef}
          onNewChat={handleNewChat}
          onDeleteSuccess={async (deletedSessionId) => {
            if (sidebarRef.current) {
              sidebarRef.current.handleChatDeleted(deletedSessionId);
            }
          }}
        />
      </div>

      {/* 移动端抽屉 */}
      <MobileChatDrawer
        ref={mobileDrawerRef}
        isOpen={isMobileDrawerOpen}
        onClose={handleMobileMenuClose}
        onNewChat={handleNewChat}
        onDeleteSuccess={handleMobileDeleteSuccess}
      />

      {/* 主对话区域 */}
      <div className="flex-1 flex flex-col">
        <ChatHeader
          questionTarget={questionTarget}
          showNoTargetHint={showNoTargetHint}
          onMenuClick={handleMobileMenuOpen}
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
          messageStatus={
            currentSessionId 
              ? (error 
                  ? 'error' 
                  : completedMap.get(currentSessionId) 
                    ? 'completed'
                    : processingMap.get(currentSessionId) 
                      ? 'streaming' 
                      : 'completed')
              : 'completed'
          }
          questionTarget={questionTarget}
          onTargetSelect={handleTargetSelect}
        />
        <ChatInput
          key={inputFocusKey}
          onSend={handleSendMessage}
          showPromptTemplates={showPromptTemplates}
          onTogglePromptTemplates={togglePromptTemplates}
          questionTarget={questionTarget}
          processing={currentSessionId ? processingMap.get(currentSessionId) : false}
        />
      </div>
    </div>
  );
}

export default Chat;

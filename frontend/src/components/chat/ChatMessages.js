import React, { useEffect, useRef, useMemo, useState } from 'react';
import MarkdownIt from 'markdown-it';
import { ToastManager } from '../common/Toast';
import ChatGuidance from './ChatGuidance';
import { useLocation } from 'react-router-dom';
import {
  AiOutlineLoading3Quarters,
  AiOutlineWarning,
  AiOutlineUser,
  AiOutlineRobot,
  AiOutlineApple,
  AiOutlineBulb,
  AiOutlineExperiment
} from 'react-icons/ai';

// 消息状态枚举
const MessageStatus = {
  WAITING: 'waiting',
  STREAMING: 'streaming',
  COMPLETED: 'completed',
  ERROR: 'error'
};

function ChatMessages({ messages, partialResponse, error, messageStatus, questionTarget, onTargetSelect }) {
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [justSentMessage, setJustSentMessage] = useState(false);

  // 检查是否在底部（用于自动滚动判断）
  const isAtBottomForAutoScroll = (element) => {
    const threshold = 250; // 距离底部250px以内启用自动滚动（放宽条件）
    const distance = Math.abs((element.scrollHeight - element.scrollTop) - element.clientHeight);
    const isAtBottom = distance < threshold;
    
    // 临时调试信息
    console.log('[Auto Scroll Check]', {
      scrollHeight: element.scrollHeight,
      scrollTop: element.scrollTop,
      clientHeight: element.clientHeight,
      distance: distance,
      threshold: threshold,
      isAtBottom: isAtBottom
    });
    
    return isAtBottom;
  };

  // 初始化检查滚动位置
  useEffect(() => {
    if (!isInitialized && messagesEndRef.current) {
      setIsInitialized(true);
      if (messages.length > 0) {
        console.log('[初始化滚动] 打开对话，自动滚动到底部，消息数量:', messages.length);
        setTimeout(() => {
          scrollToBottom(true);
        }, 100);
      }
    }
  }, [isInitialized, messages.length]);

  // 会话切换时的滚动处理
  useEffect(() => {
    if (isInitialized) {
      console.log('[会话切换] URL变化，滚动到底部');
      setTimeout(() => {
        scrollToBottom(true);
      }, 150);
    }
  }, [location.search, isInitialized]); 

  // 滚动到底部
  const scrollToBottom = (force = false) => {
    if (!messagesEndRef.current) return;
    
    const container = messagesEndRef.current.parentElement;
    
    // 增加优先级判断
    const shouldForceScroll = force || 
      !location.search || // 新对话
      messages.length === 0; // 首条消息
    
    if (shouldForceScroll) {
      console.log('[滚动] 强制滚动到底部');
      container._lastProgrammaticScroll = Date.now();
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      const atBottomForAutoScroll = isAtBottomForAutoScroll(container);
      
      if (atBottomForAutoScroll) {
        console.log('[滚动] 用户在底部，自动跟随滚动');
        container._lastProgrammaticScroll = Date.now();
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      } else {
        console.log('[滚动] 用户不在底部，跳过自动滚动');
      }
    }
  };

  // 初始化markdown-it实例
  const md = useMemo(() => {
    const instance = new MarkdownIt({
      html: false,
      breaks: true,
      linkify: true, 
      typographer: true
    });
    return instance;
  }, []);

  // 消息更新时的滚动处理
  useEffect(() => {
    // 用户发送新消息时 - 强制滚动到底部
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      setJustSentMessage(true);
      scrollToBottom(true);
      return;
    }
    
    // 模型正在流式输出时
    if (messageStatus === MessageStatus.STREAMING) {
      const scrollTimeout = setTimeout(() => {
        requestAnimationFrame(() => {
          if (justSentMessage) {
            scrollToBottom(true);
            setJustSentMessage(false);
          } else {
            scrollToBottom();
          }
        });
      }, justSentMessage ? 200 : 50);
      return () => clearTimeout(scrollTimeout);
    }
    
    // 消息完成时
    if (messageStatus === MessageStatus.COMPLETED) {
      setJustSentMessage(false);
      const container = messagesEndRef.current?.parentElement;
      if (container && isAtBottomForAutoScroll(container)) {
        scrollToBottom();
      }
    }
  }, [messages, partialResponse, messageStatus, justSentMessage]);
  
  // 监听错误状态
  useEffect(() => {
    if (error) {
      ToastManager.error(error);
    }
  }, [error]);

  const getMessageIcon = (role, model, status) => {
    if (role === 'user') {
      return (
        <div className="bg-blue-200 p-2 rounded-full">
          <AiOutlineUser className="text-xl text-blue-600" />
        </div>
      );
    }

    const statusIcons = {
      [MessageStatus.WAITING]: {
        icon: AiOutlineLoading3Quarters,
        bg: 'bg-gray-100',
        color: 'text-gray-600',
        className: 'animate-spin'
      },
      [MessageStatus.ERROR]: {
        icon: AiOutlineWarning,
        bg: 'bg-red-100',
        color: 'text-red-600'
      }
    };

    if (status && statusIcons[status]) {
      const { icon: Icon, bg, color, className = '' } = statusIcons[status];
      return (
        <div className={`${bg} p-2 rounded-full`}>
          <Icon className={`text-xl ${color} ${className}`} />
        </div>
      );
    }

    const modelIcons = {
      'GPT-4': { icon: AiOutlineApple, bg: 'bg-red-100', color: 'text-red-600' },
      'Claude': { icon: AiOutlineBulb, bg: 'bg-yellow-100', color: 'text-yellow-600' },
      'Gemini': { icon: AiOutlineExperiment, bg: 'bg-green-100', color: 'text-green-600' },
      'Llama 2': { icon: AiOutlineRobot, bg: 'bg-blue-100', color: 'text-blue-600' }
    };

    const iconConfig = modelIcons[model] || {
      icon: AiOutlineRobot,
      bg: 'bg-purple-100',
      color: 'text-purple-600'
    };
    
    return (
      <div className={`${iconConfig.bg} p-2 rounded-full`}>
        <iconConfig.icon className={`text-xl ${iconConfig.color}`} />
      </div>
    );
  };

  const renderContent = (content, isPartial = false, status) => {
    if (!content && status === MessageStatus.STREAMING) {
      return (
        <div className="flex items-center space-x-2">
          <AiOutlineLoading3Quarters className="animate-spin text-gray-400" />
          <span className="text-gray-400">正在生成回复...</span>
        </div>
      );
    }

    if (Array.isArray(content)) {
      return content.map((item, i) => {
        if (item.type === 'text') {
          let html = md.render(item.text || '');
          if (isPartial && i === content.length - 1 && status === MessageStatus.STREAMING) {
            html += '<span class="inline-block w-2 h-4 ml-0.5 bg-gray-600 animate-pulse"></span>';
          }
          return (
            <div 
              key={i}
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        return null;
      });
    }

    if (typeof content === 'string') {
      let html = md.render(content || '');
      if (isPartial && status === MessageStatus.STREAMING) {
        html += '<span class="inline-block w-2 h-4 ml-0.5 bg-gray-600 animate-pulse"></span>';
      }
      
      return (
        <div
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    
    return <p>无法显示的内容</p>;
  };

  if (messages.length === 0 && !questionTarget) {
    return <ChatGuidance onTargetSelect={onTargetSelect} />;
  }

  return (
    <>
      <div className="message-container relative h-[calc(100vh-160px)] overflow-y-auto px-6 pt-6 pb-24 space-y-6 scrollbar will-change-transform scroll-smooth">
        <style>
          {`
            .markdown-content {
              line-height: 1.6;
            }
            .markdown-content h1 {
              font-size: 1.5em;
              font-weight: bold;
              margin: 1em 0;
            }
            .markdown-content h2 {
              font-size: 1.3em;
              font-weight: bold;
              margin: 0.8em 0;
            }
            .markdown-content h3, h4, h5, h6 {
              font-size: 1.1em;
              font-weight: bold;
              margin: 0.6em 0;
            }
            .markdown-content p {
              margin: 0.5em 0;
            }
            .markdown-content ul, .markdown-content ol {
              margin: 0.5em 0;
              padding-left: 2em;
            }
            .markdown-content ul {
              list-style-type: disc;
            }
            .markdown-content ol {
              list-style-type: decimal;
            }
            .markdown-content blockquote {
              border-left: 4px solid #e5e7eb;
              padding-left: 1em;
              margin: 1em 0;
              color: #6b7280;
            }
            .markdown-content code {
              background-color: #f3f4f6;
              padding: 0.2em 0.4em;
              border-radius: 3px;
              font-family: monospace;
            }
            .markdown-content pre {
              background-color: #f3f4f6;
              padding: 1em;
              border-radius: 6px;
              overflow-x: auto;
              margin: 1em 0;
            }
            .markdown-content pre code {
              background-color: transparent;
              padding: 0;
            }
            .markdown-content a {
              color: #3b82f6;
              text-decoration: underline;
            }
            .markdown-content img {
              max-width: 100%;
              height: auto;
              margin: 1em 0;
            }
            .markdown-content table {
              border-collapse: collapse;
              width: 100%;
              margin: 1em 0;
            }
            .markdown-content th, .markdown-content td {
              border: 1px solid #e5e7eb;
              padding: 0.5em;
              text-align: left;
            }
            .markdown-content th {
              background-color: #f3f4f6;
            }
          `}
        </style>
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const isLastAssistantMessage = message.role === 'assistant' &&
            index === messages.findLastIndex(msg => msg.role === 'assistant');
          const showPartialResponse = isLastAssistantMessage && partialResponse;
          const currentStatus = error ? MessageStatus.ERROR :
                               showPartialResponse ? MessageStatus.STREAMING :
                               messageStatus === MessageStatus.STREAMING ? MessageStatus.STREAMING :
                               messageStatus;
          
          // 仅在状态变化时输出日志
          if (currentStatus !== messageStatus) {
            console.log('[Message Status Change]', {
              status: currentStatus,
              isStreaming: showPartialResponse
            });
          }

          if (message.role === 'system') {
            return (
              <div key={index} className="bg-blue-50 rounded-lg p-4 text-sm text-center text-blue-700">
                {renderContent(message.content, false, MessageStatus.COMPLETED)}
              </div>
            );
          }

          const isUser = message.role === 'user';
          return (
            <React.Fragment key={index}>
              <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="flex-shrink-0">
                  {isUser ? getMessageIcon('user') : getMessageIcon('assistant', message.model, currentStatus)}
                </div>
                <div
                  className={`message-bubble rounded-lg p-4 max-w-3xl ${
                    isUser 
                      ? 'bg-blue-500 text-white ml-auto'
                      : 'bg-gray-100 text-gray-800 mr-auto'
                  }`}
                >
                  <div className={isUser ? 'text-white' : ''}>
                    {showPartialResponse
                      ? renderContent(partialResponse, true, currentStatus)
                      : renderContent(message.content, false, currentStatus)}
                  </div>
                </div>
              </div>
              {currentStatus === MessageStatus.ERROR && error && (
                <div className="flex items-center mt-2 ml-11">
                  <div className="flex items-center space-x-2 text-red-600">
                    <AiOutlineWarning className="flex-shrink-0" />
                    <span className="text-sm">
                      {error.includes('登录已过期') ? '登录已过期，请重新登录' :
                       error.includes('会话不存在') ? '会话已失效，请刷新页面' :
                       error.includes('网络') ? '网络连接失败，请检查网络' :
                       error.includes('调用失败') ? '模型响应异常，请重试' :
                       `输出中断 - ${error}`}
                    </span>
                  </div>
                  {(error.includes('会话') || error.includes('失效')) && (
                    <button 
                      onClick={() => window.location.reload()}
                      className="text-blue-600 hover:text-blue-800 text-sm underline ml-4"
                    >
                      刷新页面
                    </button>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </>
  );
}

export default React.memo(ChatMessages);

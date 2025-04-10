import React, { useEffect, useRef, useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import { ToastManager } from '../common/Toast';
import {
  AiOutlineLoading3Quarters,
  AiOutlineWarning,
  AiOutlineUser,
  AiOutlineRobot,
  AiOutlineApple,
  AiOutlineBulb,
  AiOutlineExperiment,
  AiOutlineStar
} from 'react-icons/ai';

// 消息状态枚举
const MessageStatus = {
  WAITING: 'waiting',
  STREAMING: 'streaming',
  COMPLETED: 'completed',
  ERROR: 'error'
};

function ChatMessages({ messages, partialResponse, error, messageStatus }) {
  const messagesEndRef = useRef(null);
  
  // 初始化markdown-it实例，配置安全选项
  const md = useMemo(() => {
    const instance = new MarkdownIt({
      html: false, // 禁用HTML标签
      breaks: true, // 转换换行符为<br>
      linkify: true, // 自动转换URL为链接
      typographer: true, // 启用一些语言中性的替换和引号
    });
    return instance;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
      scrollToBottom();
    }, [messages, partialResponse]);
  
    // 监听错误状态，显示Toast提示
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

    // 状态图标配置
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

    // 如果有特殊状态，优先显示状态图标
    if (status && statusIcons[status]) {
      const { icon: Icon, bg, color, className = '' } = statusIcons[status];
      return (
        <div className={`${bg} p-2 rounded-full`}>
          <Icon className={`text-xl ${color} ${className}`} />
        </div>
      );
    }

    // 模型图标配置
    const modelIcons = {
      'GPT-4': { icon: AiOutlineApple, bg: 'bg-red-100', color: 'text-red-600' },
      'Claude': { icon: AiOutlineBulb, bg: 'bg-yellow-100', color: 'text-yellow-600' },
      'Gemini': { icon: AiOutlineExperiment, bg: 'bg-green-100', color: 'text-green-600' },
      'Llama 2': { icon: AiOutlineStar, bg: 'bg-yellow-100', color: 'text-yellow-600' }
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

  // 渲染消息内容
  const renderContent = (content, isPartial = false, status = MessageStatus.COMPLETED) => {
    // 如果内容为空且状态为STREAMING，显示Loading图标
    if (!content && status === MessageStatus.STREAMING) {
      return (
        <div className="markdown-content flex justify-center py-4">
          <AiOutlineLoading3Quarters className="text-2xl text-gray-600 animate-spin" />
        </div>
      );
    }

    // 如果是纯文本字符串
    if (typeof content === 'string') {
      // 如果是部分响应且正在流式输出，添加光标到HTML内容中
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
    
    // 如果是包含多媒体的数组
    if (Array.isArray(content)) {
      return content.map((item, i) => {
        switch (item.type) {
          case 'text':
            const renderedHTML = md.render(item.text);
            const result = (
              <div
                key={i}
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: renderedHTML }}
              />
            );
            // 如果是部分响应且是最后一个文本块，添加光标
            if (isPartial && i === content.length - 1 && status === MessageStatus.STREAMING) {
              renderedHTML += '<span class="inline-block w-2 h-4 ml-0.5 bg-gray-600 animate-pulse"></span>';
            }
            
            return (
              <div
                key={i}
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: renderedHTML }}
              />
            );
            return result;
          case 'input_audio':
            return (
              <div key={i} className="flex items-center space-x-2">
                <AiOutlineStar className="text-xl text-gray-500" />
                <span>语音输入</span>
                <audio src={item.input_audio.data} controls className="max-w-full" />
              </div>
            );
          case 'image':
            return (
              <div key={i} className="mt-2">
                <img 
                  src={item.file} 
                  alt="用户上传的图片" 
                  className="max-w-full rounded-lg"
                  loading="lazy"
                />
              </div>
            );
          case 'video':
            return (
              <div key={i} className="mt-2">
                <video 
                  src={item.file} 
                  controls 
                  className="max-w-full rounded-lg"
                  preload="metadata"
                />
              </div>
            );
          default:
            return <p key={i}>不支持的内容类型: {item.type}</p>;
        }
      });
    }
    
    return <p>无法显示的内容</p>;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar">
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
      {console.log('完整消息列表:', messages)}
      {messages.map((message, index) => {
        console.log('渲染消息:', {
          index,
          role: message.role,
          content: message.content,
          isUser: message.role === 'user',
          messagesLength: messages.length,
          allMessages: [...messages]
        });
        
        // 确定消息状态
        const isLastMessage = index === messages.length - 1;
        const isLastAssistantMessage = message.role === 'assistant' &&
          index === messages.findLastIndex(msg => msg.role === 'assistant');
        const showPartialResponse = isLastAssistantMessage && partialResponse;
        const currentStatus = error ? MessageStatus.ERROR :
                             showPartialResponse ? MessageStatus.STREAMING :
                             MessageStatus.COMPLETED;

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
                className={`rounded-lg p-4 max-w-3xl ${
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
            {currentStatus === MessageStatus.ERROR && (
              <div className="flex items-start mt-2">
                <div className="ml-11 text-sm text-red-600">
                  输出中断 - {error}
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default React.memo(ChatMessages);

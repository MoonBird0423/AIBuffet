import React, { useEffect, useRef, useMemo } from 'react';
import MarkdownIt from 'markdown-it';

function ChatMessages({ messages, partialResponse }) {
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

  // 渲染消息内容
  const renderContent = (content, isPartial = false) => {
    // 如果是纯文本字符串
    if (typeof content === 'string') {
      const renderedHTML = md.render(content);
      const result = (
        <div
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: renderedHTML }}
        />
      );
      
      // 如果是部分响应，添加光标
      if (isPartial) {
        return (
          <>
            {result}
            <span className="inline-block w-2 h-4 ml-1 bg-gray-600 animate-pulse"></span>
          </>
        );
      }
      
      return result;
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
            
            // 如果是部分响应，添加光标
            if (isPartial && i === content.length - 1) {
              return (
                <React.Fragment key={i}>
                  {result}
                  <span className="inline-block w-2 h-4 ml-1 bg-gray-600 animate-pulse"></span>
                </React.Fragment>
              );
            }
            
            return result;
          case 'input_audio':
            return (
              <div key={i} className="flex items-center space-x-2">
                <i className="fas fa-music text-gray-500"></i>
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
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1;
        const showPartialResponse = isLastMessage && message.role === 'assistant' && partialResponse;

        if (message.role === 'system') {
          return (
            <div key={index} className="bg-blue-50 rounded-lg p-4 text-sm text-center text-blue-700">
              {renderContent(message.content)}
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
              <div className={isUser ? 'text-white' : ''}>
                {showPartialResponse
                  ? (() => {
                      // 如果 partialResponse 比 message.content 长，说明是在流式输出中
                      const content = partialResponse.length > message.content.length
                        ? message.content + partialResponse.substring(message.content.length)
                        : message.content;
                      return renderContent(content, true);
                    })()
                  : renderContent(message.content)
                }
              </div>
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

export default React.memo(ChatMessages);
import React, { useMemo } from 'react';
import MarkdownIt from 'markdown-it';

function InterpretationViewer({ content, useMaxHeight = true }) {
  const md = useMemo(() => {
    return new MarkdownIt({
      html: false,
      breaks: true,
      linkify: true,
      typographer: true,
    });
  }, []);

  const renderContent = () => {
    // 处理空值
    if (!content) {
      return '暂无解读内容';
    }

    // 确保content是字符串类型
    if (typeof content !== 'string') {
      console.error('解读内容格式错误:', content);
      return '内容格式错误，请稍后重试';
    }

    try {
      return md.render(content);
    } catch (error) {
      console.error('渲染Markdown内容失败:', error);
      return '内容渲染失败，请稍后重试';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div 
        className="interpretation-content markdown-content"
        style={{
          ...(useMaxHeight ? { maxHeight: '60vh' } : {}),
          overflowY: 'auto',
          padding: '24px 0 24px 24px'
        }}
        dangerouslySetInnerHTML={{
          __html: renderContent()
        }}
      />
    </div>
  );
}

export default InterpretationViewer;

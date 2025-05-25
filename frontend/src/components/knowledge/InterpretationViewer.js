import React, { useMemo } from 'react';
import MarkdownIt from 'markdown-it';

function InterpretationViewer({ content }) {
  const md = useMemo(() => {
    return new MarkdownIt({
      html: false,
      breaks: true,
      linkify: true,
      typographer: true,
    });
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div 
        className="interpretation-content markdown-content"
        style={{
          maxHeight: '60vh',
          overflowY: 'auto',
          padding: '24px 0 24px 24px'
        }}
        dangerouslySetInnerHTML={{
          __html: md.render(content || '解读内容生成失败，请重试')
        }}
      />
    </div>
  );
}

export default InterpretationViewer;

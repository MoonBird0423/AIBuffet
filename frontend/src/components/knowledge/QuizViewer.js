import React from 'react';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

function QuizViewer({ questions }) {
  const renderQuestions = () => {
    try {
      return md.render(questions || '');
    } catch (error) {
      console.error('渲染测试题内容失败:', error);
      return questions || ''; // 降级处理：如果渲染失败则显示原始内容
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div 
        className="markdown-content"
        style={{
          maxHeight: '60vh',
          overflowY: 'auto',
          padding: '24px 0 24px 24px'
        }}
        dangerouslySetInnerHTML={{ __html: renderQuestions() }} 
      />
    </div>
  );
}

export default QuizViewer;

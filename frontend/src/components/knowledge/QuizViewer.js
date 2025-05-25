import React from 'react';

function QuizViewer({ questions }) {
  const parseQuestions = () => {
    try {
      const jsonContent = JSON.parse(questions);
      return jsonContent.content;
    } catch (error) {
      console.error('解析测试题内容失败:', error);
      return questions; // 降级处理：如果解析失败则显示原始内容
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div 
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: parseQuestions() }} 
      />
    </div>
  );
}

export default QuizViewer;

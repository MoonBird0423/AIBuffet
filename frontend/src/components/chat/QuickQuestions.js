import React from 'react';
import PropTypes from 'prop-types';

const QuickQuestions = ({ type, onSelect, disabled }) => {
  const questions = type === 'knowledge' 
    ? ['帮我总结知识库内容']
    : [
      '请帮我写一篇读后感',
      '作者的背景、立场或核心论点是什么？', 
      '阅读本书最大的收获可能是什么？'
    ];

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {questions.map(q => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          disabled={disabled}
          className={`px-3 py-1.5 text-sm border rounded-full transition-colors ${
            disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
              : 'bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-blue-200 hover:border-blue-300'
          }`}
        >
          {q}
        </button>
      ))}
    </div>
  );
};

QuickQuestions.propTypes = {
  type: PropTypes.oneOf(['book', 'knowledge']),
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default QuickQuestions;

import React, { useState } from 'react';

function PromptTemplates({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('全部');

  const categories = [
    '全部',
    '创意写作',
    '编程助手',
    '学习辅导',
    '内容总结',
    '商业应用'
  ];

  const templates = [
    {
      title: '详细解释复杂概念',
      category: '学习辅导',
      content: '请以易于理解的方式解释[概念]，从基础开始，逐步深入到复杂部分。包括类比、例子和实际应用。'
    },
    {
      title: '生成创意故事开头',
      category: '创意写作',
      content: '写一个引人入胜的[类型]故事开头，设定在[地点/时代]，主角是[人物描述]。创造一个令人好奇的场景或冲突。'
    },
    {
      title: '代码优化与重构',
      category: '编程助手',
      content: '请审查并重构以下[编程语言]代码，提高其可读性、性能和遵循最佳实践。说明您所做的每一处修改。'
    }
  ];

  const filteredTemplates = activeCategory === '全部'
    ? templates
    : templates.filter(t => t.category === activeCategory);

  const handleTemplateClick = (template) => {
    onSelect(template.content);
    onClose();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 提示词分类导航 */}
      <div className="border-b border-gray-200 p-2">
        <div className="flex space-x-1 overflow-x-auto py-1">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                activeCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 提示词模板列表 */}
      <div className="max-h-64 overflow-y-auto p-3">
        <div className="space-y-3">
          {filteredTemplates.map((template, index) => (
            <div
              key={index}
              onClick={() => handleTemplateClick(template)}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-sm">{template.title}</h4>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  template.category === '学习辅导' ? 'bg-blue-500 text-white' :
                  template.category === '创意写作' ? 'bg-purple-500 text-white' :
                  'bg-green-500 text-white'
                }`}>
                  {template.category}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {template.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 提示词操作按钮 */}
      <div className="border-t border-gray-200 p-3 flex justify-between">
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs text-blue-500 hover:text-blue-700 flex items-center"
        >
          <i className="fas fa-arrow-left mr-1"></i> 返回输入
        </button>
        <button className="px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600">
          查看更多提示词
        </button>
      </div>
    </div>
  );
}

export default PromptTemplates;
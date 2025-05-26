import React from 'react';
import InterpretationViewer from '../knowledge/InterpretationViewer';
import MindmapViewer from '../knowledge/MindmapViewer';
import QuizViewer from '../knowledge/QuizViewer';

function BookTabs({ activeTab, onTabChange, content }) {
  const tabs = [
    { key: 'interpretation', label: '图书解读' },
    { key: 'mindmap', label: '知识脑图' },
    { key: 'quiz', label: '知识测试' }
  ];

  const renderContent = () => {
    if (!content) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    if (content === '') {
      return (
        <div className="flex flex-col justify-center items-center py-12">
          <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <span className="text-gray-500 text-lg">内容暂未生成</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'interpretation':
        return <InterpretationViewer content={content} useMaxHeight={false} />;
      case 'mindmap':
        return <MindmapViewer content={content} height="1000px" />;
      case 'quiz':
        return <QuizViewer questions={content} useMaxHeight={false} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* 选项卡 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
}

export default BookTabs;

import React, { useMemo } from 'react';
import InterpretationViewer from '../knowledge/InterpretationViewer';
import MindmapViewer from '../knowledge/MindmapViewer';
import QuizViewer from '../knowledge/QuizViewer';

function BookTabs({ activeTab, onTabChange, content, loading = false }) {

  const tabs = [
    { key: 'interpretation', label: '图书解读' },
    { key: 'mindmap', label: '知识脑图' },
    { key: 'quiz', label: '知识测试' }
  ];

  // 使用 useMemo 来稳定内容渲染
  const stableContent = useMemo(() => {
    // 优先显示加载状态
    if (loading) {
      return (
        <div className="flex justify-center items-center" style={{ minHeight: '400px' }}>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            <span className="text-gray-600">加载中...</span>
          </div>
        </div>
      );
    }

    // 内容为null或undefined时显示等待状态
    if (content === null || content === undefined) {
      return (
        <div className="flex justify-center items-center" style={{ minHeight: '400px' }}>
          <div className="flex items-center space-x-2">
            <div className="animate-pulse rounded-full h-6 w-6 bg-gray-300"></div>
            <span className="text-gray-500">准备中...</span>
          </div>
        </div>
      );
    }

    // 内容为空字符串时显示暂无内容
    if (content === '') {
      return (
        <div className="flex flex-col justify-center items-center" style={{ minHeight: '400px' }}>
          <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <span className="text-gray-500 text-lg">内容暂未生成</span>
        </div>
      );
    }

    // 渲染实际内容
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
  }, [activeTab, content, loading]);

  const renderContent = () => stableContent;

  return (
    <div className="bg-white rounded-3xl shadow-xl">
      {/* Tab Navigation */}
      <div className="flex justify-center p-6 pb-0">
        <div className="bg-gray-100 rounded-2xl p-2">
          <div className="flex space-x-2">            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                disabled={loading}
                className={`
                  px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 whitespace-nowrap
                  ${activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white transform -translate-y-0.5 shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>      {/* 内容区域 */}
      <div className="p-8">
        <div 
          className="relative transition-opacity duration-200 ease-in-out"
          style={{ minHeight: '400px' }}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default BookTabs;

import React, { useMemo } from 'react';
import InterpretationViewer from '../knowledge/InterpretationViewer';
import MindmapViewer from '../knowledge/MindmapViewer';
import QuizViewer from '../knowledge/QuizViewer';
import QuizJsonRenderer from '../knowledge/QuizJsonRenderer';
import AudioPlayer from '../common/AudioPlayer';

function BookTabs({ activeTab, onTabChange, content, loading = false, contentStatus = 'loading', audioUrl, hasAudio, bookTitle, bookId }) {

  const tabs = [
    { key: 'interpretation', label: '图书解读' },
    { key: 'mindmap', label: '知识脑图' },
    { key: 'quiz', label: '知识测试' }
  ];

  // 获取选项卡特定的空状态信息
  const getEmptyStateInfo = (tabKey) => {
    const emptyStates = {
      interpretation: {
        icon: 'fas fa-book-open',
        title: '解读内容暂未生成',
        description: '该图书的AI解读内容尚未生成，请稍后再试'
      },
      mindmap: {
        icon: 'fas fa-project-diagram',
        title: '知识脑图暂未生成',
        description: '该图书的知识脑图尚未生成，请稍后再试'
      },
      quiz: {
        icon: 'fas fa-question-circle',
        title: '知识测试暂未生成',
        description: '该图书的知识测试题目尚未生成，请稍后再试'
      }
    };
    return emptyStates[tabKey] || emptyStates.interpretation;
  };

  // 使用 useMemo 来稳定内容渲染
  const stableContent = useMemo(() => {
    // 根据 contentStatus 渲染不同状态
    switch (contentStatus) {
      case 'loading':
        return (
          <div className="flex justify-center items-center" style={{ minHeight: '400px' }}>
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              <span className="text-gray-600 text-lg">正在加载内容...</span>
            </div>
          </div>
        );

      case 'empty':
        const emptyState = getEmptyStateInfo(activeTab);
        return (
          <div className="flex flex-col justify-center items-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <i className={`${emptyState.icon} text-4xl text-gray-400 mb-4`}></i>
              <h3 className="text-xl font-medium text-gray-600 mb-2">{emptyState.title}</h3>
              <p className="text-gray-500 max-w-md">{emptyState.description}</p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col justify-center items-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <i className="fas fa-exclamation-triangle text-4xl text-yellow-400 mb-4"></i>
              <h3 className="text-xl font-medium text-yellow-600 mb-2">加载失败</h3>
              <p className="text-gray-500 max-w-md">登录即可获取内容</p>
            </div>
          </div>
        );

      case 'success':
        // 渲染实际内容
        switch (activeTab) {
          case 'interpretation':
            return (
              <div className="space-y-6">
                {/* 音频播放器 - 只有当音频存在时才显示 */}
                {hasAudio && audioUrl && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                    <AudioPlayer audioUrl={audioUrl} bookTitle={bookTitle} bookId={bookId} />
                  </div>
                )}
                {/* 解读内容 */}
                <InterpretationViewer content={content} useMaxHeight={false} />
              </div>
            );
          case 'mindmap':
            return <MindmapViewer content={content} height="1000px" />;
          case 'quiz': {
            // 判断是否为JSON格式
            let isJson = false;
            if (typeof content === 'string') {
              const trimmed = content.trim();
              isJson = (trimmed.startsWith('{') || trimmed.startsWith('['));
              try {
                JSON.parse(trimmed);
              } catch {
                isJson = false;
              }
            }
            return isJson
              ? <QuizJsonRenderer content={content} />
              : <QuizViewer questions={content} useMaxHeight={false} />;
          }
          default:
            return null;
        }

      default:
        return (
          <div className="flex justify-center items-center" style={{ minHeight: '400px' }}>
            <div className="flex items-center space-x-2">
              <div className="animate-pulse rounded-full h-6 w-6 bg-gray-300"></div>
              <span className="text-gray-500">准备中...</span>
            </div>
          </div>
        );
    }
  }, [activeTab, content, contentStatus, hasAudio, audioUrl, bookTitle, bookId]);

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

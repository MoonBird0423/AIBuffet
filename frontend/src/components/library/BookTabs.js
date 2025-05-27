import React, { useState, useEffect } from 'react';
import InterpretationViewer from '../knowledge/InterpretationViewer';
import MindmapViewer from '../knowledge/MindmapViewer';
import QuizViewer from '../knowledge/QuizViewer';
import AudioPlayer from '../common/AudioPlayer';
import { synthesizeAudio, getAudioStatus } from '../../services/api';
import { useParams } from 'react-router-dom';

function BookTabs({ activeTab, onTabChange, content }) {
  const { id } = useParams();
  const [audioUrl, setAudioUrl] = useState(null);
  const [hasAudio, setHasAudio] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(null);

  const tabs = [
    { key: 'interpretation', label: '图书解读' },
    { key: 'mindmap', label: '知识脑图' },
    { key: 'quiz', label: '知识测试' }
  ];

  // 检查音频状态
  useEffect(() => {
    if (activeTab === 'interpretation' && id && content && content !== '') {
      checkAudioStatus();
    }
  }, [activeTab, id, content]);

  const checkAudioStatus = async () => {
    try {
      const response = await getAudioStatus(id);
      if (response.code === 200) {
        setHasAudio(response.data.hasAudio);
        setAudioUrl(response.data.audioUrl);
      }
    } catch (error) {
      console.error('检查音频状态失败:', error);
    }
  };

  const handleGenerateAudio = async () => {
    setAudioLoading(true);
    setAudioError(null);
    
    try {
      const response = await synthesizeAudio(id);
      if (response.code === 200) {
        setAudioUrl(response.data.audioUrl);
        setHasAudio(true);
      } else {
        setAudioError(response.message || '音频生成失败');
      }
    } catch (error) {
      console.error('音频生成失败:', error);
      setAudioError(error.message || '音频生成失败，请稍后重试');
    } finally {
      setAudioLoading(false);
    }
  };

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
        return (
          <div className="space-y-6">
            {/* 音频播放器区域 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <i className="fas fa-headphones text-indigo-600 mr-2"></i>
                  音频朗读
                </h3>
                {!hasAudio && content && content !== '' && (
                  <button
                    onClick={handleGenerateAudio}
                    disabled={audioLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                  >
                    {audioLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        生成中...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic mr-2"></i>
                        生成音频
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {audioError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <i className="fas fa-exclamation-triangle text-red-400 mr-2 mt-0.5"></i>
                    <span className="text-red-700 text-sm">{audioError}</span>
                  </div>
                </div>
              )}
              
              <AudioPlayer audioUrl={audioUrl} />
            </div>
            
            {/* 解读内容 */}
            <InterpretationViewer content={content} useMaxHeight={false} />
          </div>
        );
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

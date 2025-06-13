import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { getDocument, getInterpretation, getMindmap, getQuiz, synthesizeAudio, getAudioStatus } from '../services/api';
import BookInfo from '../components/library/BookInfo';
import BookTabs from '../components/library/BookTabs';
import AudioPlayer from '../components/common/AudioPlayer';
import FavoriteModal from '../components/library/FavoriteModal';
import { ToastManager } from '../components/common/Toast';

function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  useDocumentTitle('图书详情 | 书意');
  const [bookData, setBookData] = useState(null);
  const [activeTab, setActiveTab] = useState('interpretation');
  const [tabContent, setTabContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 内容缓存和加载状态
  const [contentCache, setContentCache] = useState({});
  const [tabLoading, setTabLoading] = useState(false);
  const [tabContentLoaded, setTabContentLoaded] = useState(false);
  
  // 音频相关状态
  const [audioUrl, setAudioUrl] = useState(null);
  const [hasAudio, setHasAudio] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(null);
  
  // 收藏相关状态
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);

  // 获取图书基本信息
  useEffect(() => {
    const fetchBookData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDocument(id);
        if (data) {
          setBookData(data);
        }
      } catch (err) {
        setError('获取图书信息失败');
        console.error('Error fetching book details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBookData();
    }
  }, [id]);

  // 根据选中的Tab加载对应内容
  useEffect(() => {
    const fetchTabContent = async () => {
      const cacheKey = `${id}-${activeTab}`;
      if (contentCache[cacheKey]) {
        setTabContent(contentCache[cacheKey]);
        return;
      }

      try {
        setTabLoading(true);
        let content;
        switch (activeTab) {
          case 'interpretation':
            const interpretationResponse = await getInterpretation(id);
            content = interpretationResponse.data;
            break;
          case 'mindmap':
            const mindmapResponse = await getMindmap(id);
            content = mindmapResponse.data;
            break;
          case 'quiz':
            const quizResponse = await getQuiz(id);
            content = quizResponse.data;
            break;
          default:
            return;
        }
        
        let processedContent = typeof content === 'string' ? content : '';
        if (!processedContent) {
          console.warn(`获取${activeTab}内容格式不正确:`, content);
        }
        
        setContentCache(prev => ({ ...prev, [cacheKey]: processedContent }));
        setTabContent(processedContent);
        setTabContentLoaded(true);
      } catch (err) {
        console.error('Error fetching tab content:', err);
        setTabContent(`获取${activeTab}内容失败，请稍后重试`);
        setTabContentLoaded(true);
      } finally {
        setTabLoading(false);
      }
    };

    if (id && activeTab) {
      fetchTabContent();
    }
  }, [activeTab, id]);

  // 检查音频状态
  useEffect(() => {
    if (activeTab === 'interpretation' && id && tabContent && tabContent !== '') {
      checkAudioStatus();
    }
  }, [activeTab, id, tabContent]);

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

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/book/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      ToastManager.success('图书地址复制成功，快去分享吧！');
    } catch (err) {
      ToastManager.error('复制链接失败，请稍后重试');
      console.error('复制链接失败:', err);
    }
  };

  const handleBack = () => {
    navigate('/library');
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    const cacheKey = `${id}-${tabKey}`;
    if (contentCache[cacheKey]) {
      setTabContent(contentCache[cacheKey]);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button
          onClick={handleBack}
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          返回图书馆
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 顶部渐变背景区域 */}
      <div className="bg-gradient-to-tr from-[#667eea] to-[#764ba2] pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 按钮区域 */}
          <div className="pt-20 pb-8">
            <div className="flex justify-between items-center">
              <button
                onClick={handleBack}
                className="inline-flex items-center px-6 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-full text-white hover:bg-white/30 transition-all duration-200"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                返回图书馆
              </button>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowFavoriteModal(true)}
                  className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/15 px-6 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-full text-white hover:bg-white/30"
                >
                  <i className="fas fa-heart mr-2"></i>
                  收藏到知识库
                </button>
                <button 
                  onClick={handleShare}
                  className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/15 px-6 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-full text-white hover:bg-white/30"
                >
                  <i className="fas fa-share mr-2"></i>
                  分享
                </button>
              </div>
            </div>
          </div>

          {/* 图书基本信息 */}
          <BookInfo bookData={bookData} />
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {/* 主标题 */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">AI伴读，直达书魂</h3>
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full"></div>
          </div>          {/* 音频解读区域 */}
          {bookData && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl shadow-xl p-8">
                {!hasAudio ? (
                  // 未生成音频时：只显示生成按钮和错误信息
                  <div className="flex items-center justify-center space-x-4">
                    {activeTab === 'interpretation' && tabContent && tabContent !== '' ? (
                      <button
                        onClick={handleGenerateAudio}
                        disabled={audioLoading}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 transition-all duration-200"
                      >
                        {audioLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            生成中...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-magic mr-3"></i>
                            生成音频
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="text-center text-gray-500">
                        <i className="fas fa-volume-mute text-3xl mb-3"></i>
                        <p className="text-lg">请先查看解读内容以生成音频</p>
                      </div>
                    )}
                    
                    {audioError && (
                      <div className="flex items-center text-red-600">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        <span className="text-sm">{audioError}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  // 音频生成完成后：显示音频播放组件
                  <AudioPlayer audioUrl={audioUrl} bookTitle={bookData?.fileName} bookId={id} />
                )}
              </div>
            </div>
          )}

          {/* 内容选项卡 */}
          {bookData && (
            <div className="pb-6">
              <BookTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                content={tabContent}
                loading={tabLoading}
              />
            </div>
          )}
        </div>
      </div>

      {/* 收藏弹窗 */}
      <FavoriteModal
        bookId={id}
        isOpen={showFavoriteModal}
        onClose={() => setShowFavoriteModal(false)}
      />
    </div>
  );
}

export default BookDetails;

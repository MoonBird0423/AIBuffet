import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { getDocument, getInterpretation, getMindmap, getQuiz, getAudioStatus } from '../services/api';
import BookInfo from '../components/library/BookInfo';
import BookTabs from '../components/library/BookTabs';
import FavoriteModal from '../components/library/FavoriteModal';
import UserLoginModal from '../components/auth/UserLoginModal';
import { useAuth } from '../contexts/AuthContext';
import { ToastManager } from '../components/common/Toast';

function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [contentStatus, setContentStatus] = useState('loading'); // 'loading', 'success', 'empty', 'error'
  
  // 音频相关状态
  const [audioUrl, setAudioUrl] = useState(null);
  const [hasAudio, setHasAudio] = useState(false);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  
  // 收藏相关状态
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);

  // 登录相关状态
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginSuccessCallback, setLoginSuccessCallback] = useState(null);
  const { isAuthenticated } = useAuth();

  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
        const cachedContent = contentCache[cacheKey];
        setTabContent(cachedContent);
        // 根据缓存内容设置状态
        if (cachedContent === '' || cachedContent === null || cachedContent === undefined) {
          setContentStatus('empty');
        } else {
          setContentStatus('success');
        }
        return;
      }

      try {
        setTabLoading(true);
        setContentStatus('loading');
        
        let content;
        
        switch (activeTab) {
          case 'interpretation':
            const interpretationResponse = await getInterpretation(id);
            content = interpretationResponse.data?.content || null;
            break;
          case 'mindmap':
            const mindmapResponse = await getMindmap(id);
            content = mindmapResponse.data?.content || null;
            break;
          case 'quiz':
            const quizResponse = await getQuiz(id);
            content = quizResponse.data?.questions || null;
            break;
          default:
            setContentStatus('empty');
            return;
        }
        
        // 验证内容格式和有效性
        let processedContent = '';
        let status = 'empty';
        
        if (content === null || content === undefined) {
          processedContent = null;
          status = 'empty';
        } else if (typeof content === 'string') {
          processedContent = content.trim();
          status = processedContent ? 'success' : 'empty';
        } else {
          // 对于非字符串内容，尝试转换或处理
          console.warn(`获取${activeTab}内容格式不正确:`, content);
          processedContent = '';
          status = 'empty';
        }
        
        setContentCache(prev => ({ ...prev, [cacheKey]: processedContent }));
        setTabContent(processedContent);
        setContentStatus(status);
        setTabContentLoaded(true);
        
      } catch (err) {
        console.error('Error fetching tab content:', err);
        setContentStatus('error');
        setTabContent(null); // 错误时不设置错误消息作为内容
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
        
        // 检查是否需要自动播放
        const autoplayParam = searchParams.get('autoplay') === 'true';
        if (autoplayParam && response.data.hasAudio && response.data.audioUrl) {
          // 设置自动播放状态
          setShouldAutoplay(true);
          
          // 清理 URL 参数
          searchParams.delete('autoplay');
          setSearchParams(searchParams, { replace: true });
        }
      }
    } catch (error) {
      console.error('检查音频状态失败:', error);
    }
  };
  
  const triggerAutoplay = (audioUrl) => {
    // 触发自动播放的逻辑将通过 BookTabs 组件传递给 AudioPlayer
    console.log('触发自动播放:', audioUrl);
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
    // 检查是否需要登录的tab
    const requiresLogin = tabKey === 'mindmap' || tabKey === 'quiz';
    
    if (requiresLogin && !isAuthenticated) {
      // 显示登录弹窗，并设置登录成功后的回调
      setLoginSuccessCallback(() => () => {
        // 登录成功后重新加载该tab的内容
        setActiveTab(tabKey);
        const cacheKey = `${id}-${tabKey}`;
        // 清除缓存，强制重新加载
        setContentCache(prev => {
          const newCache = { ...prev };
          delete newCache[cacheKey];
          return newCache;
        });
        setContentStatus('loading');
        setTabContent(null);
      });
      setShowLoginModal(true);
      return;
    }
    
    setActiveTab(tabKey);
    const cacheKey = `${id}-${tabKey}`;
    
    if (contentCache[cacheKey]) {
      const cachedContent = contentCache[cacheKey];
      setTabContent(cachedContent);
      
      // 根据缓存内容设置状态
      let newStatus;
      if (cachedContent === '' || cachedContent === null || cachedContent === undefined) {
        newStatus = 'empty';
      } else {
        newStatus = 'success';
      }
      
      setContentStatus(newStatus);
    } else {
      // 如果没有缓存，设置为加载状态，等待 useEffect 触发
      setContentStatus('loading');
      setTabContent(null);
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
      <div className="bg-gradient-to-tr from-[#667eea] to-[#764ba2] pb-4 md:pb-12">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          {/* 图书基本信息 */}
          <div style={{paddingTop: '112px'}}>
            <BookInfo 
              bookData={bookData} 
              onFavorite={() => setShowFavoriteModal(true)}
              onShare={handleShare}
            />
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-2 md:pt-6">
          {/* 主标题 */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">AI伴读，直达书魂</h3>
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full"></div>
          </div>

          {/* 内容选项卡 */}
          {bookData && (
            <div className="pb-6">
              <BookTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                content={tabContent}
                loading={tabLoading}
                contentStatus={contentStatus}
                audioUrl={audioUrl}
                hasAudio={hasAudio}
                bookTitle={bookData?.fileName}
                bookId={id}
                shouldAutoplay={shouldAutoplay}
                onAutoplayTriggered={() => setShouldAutoplay(false)}
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

      {/* 登录弹窗 */}
      <UserLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={loginSuccessCallback}
      />
    </div>
  );
}

export default BookDetails;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocument, incrementDocumentLearnerCount, getInterpretation, getMindmap, getQuiz, synthesizeAudio, getAudioStatus } from '../services/api';
import BookInfo from '../components/library/BookInfo';
import BookTabs from '../components/library/BookTabs';
import AudioPlayer from '../components/common/AudioPlayer';

function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookData, setBookData] = useState(null);
  const [activeTab, setActiveTab] = useState('interpretation');
  const [tabContent, setTabContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 音频相关状态 - 从 BookTabs 提升到这里
  const [audioUrl, setAudioUrl] = useState(null);
  const [hasAudio, setHasAudio] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(null);

  // 获取图书基本信息并增加学习人数
  useEffect(() => {
    const fetchBookData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDocument(id);
        if (data) {
          setBookData(data);
          // 增加学习人数
          await incrementDocumentLearnerCount(id);
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
      try {
        setTabContent(null);
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
        // 确保content是字符串类型
        if (typeof content === 'string') {
          setTabContent(content);
        } else {
          console.warn(`获取${activeTab}内容格式不正确:`, content);
          setTabContent('');
        }
      } catch (err) {
        console.error('Error fetching tab content:', err);
        // 在出错时设置一个错误提示信息，而不是保持 null
        setTabContent(`获取${activeTab}内容失败，请稍后重试`);
      }
    };

    if (id && activeTab) {
      fetchTabContent();
    }
  }, [activeTab, id]);

  // 检查音频状态 - 从 BookTabs 移动到这里
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

  const handleBack = () => {
    navigate('/library');
  };

  // 处理选项卡切换
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 返回按钮 */}
        <div className="mb-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            返回图书馆
          </button>
        </div>

        {/* 图书基本信息 - 在loading状态下也显示骨架屏 */}
        <BookInfo bookData={bookData} />

        {/* 音频播放器 - 只要有音频内容就显示，或者在图书解读选项卡可以生成音频 */}
        {bookData && ((hasAudio && audioUrl) || (activeTab === 'interpretation' && tabContent && tabContent !== '')) && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <i className="fas fa-headphones text-indigo-600 mr-2"></i>
                  知婷老师解读
                </h3>
                {!hasAudio && activeTab === 'interpretation' && tabContent && tabContent !== '' && (
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
          </div>
        )}

        {/* 内容选项卡 - 只有有基本数据后才显示 */}
        {bookData && (
          <BookTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            content={tabContent}
          />
        )}
      </div>
    </div>
  );
}

export default BookDetails;

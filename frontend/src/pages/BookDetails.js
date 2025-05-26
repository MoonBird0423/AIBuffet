import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocument, incrementDocumentLearnerCount, getInterpretation, getMindmap, getQuiz } from '../services/api';
import BookInfo from '../components/library/BookInfo';
import BookTabs from '../components/library/BookTabs';

function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookData, setBookData] = useState(null);
  const [activeTab, setActiveTab] = useState('interpretation');
  const [tabContent, setTabContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

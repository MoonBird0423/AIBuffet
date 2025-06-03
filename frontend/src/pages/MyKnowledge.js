import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KnowledgeBaseList from '../components/knowledge/KnowledgeBaseList';
import KnowledgeBaseContent from '../components/knowledge/KnowledgeBaseContent';
import { getMyKnowledgeBases } from '../services/api';

function MyKnowledge() {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const loadKnowledgeBases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyKnowledgeBases({});
      const content = response?.data?.content || [];
      setKnowledgeBases(Array.isArray(content) ? content : []);
      if (content && content.length > 0) {
        setSelectedKnowledgeBase(content[0]);
      }
    } catch (err) {
      setError(err.message || '加载知识库失败');
      setKnowledgeBases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKnowledgeBaseSelect = (knowledgeBase) => {
    setSelectedKnowledgeBase(knowledgeBase);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载知识库中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadKnowledgeBases}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            重试
          </button>
        </div>
      </div>
    );
  }  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* 英雄区 */}
      <section className="pt-20 pb-12" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              我的知识库
            </h1>
            <p className="text-xl text-white opacity-90">
              管理您的学习内容，构建个人知识体系
            </p>
          </div>
          
          {/* 统计卡片 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white opacity-70 text-sm">上传图书</p>
                  <p className="text-white text-3xl font-bold">12</p>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <i className="fas fa-upload text-white text-xl"></i>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white opacity-70 text-sm">收藏图书</p>
                  <p className="text-white text-3xl font-bold">28</p>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <i className="fas fa-heart text-white text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white opacity-70 text-sm">知识库</p>
                  <p className="text-white text-3xl font-bold">{knowledgeBases.length}</p>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <i className="fas fa-folder text-white text-xl"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 主内容区 */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 左侧知识库列表 */}
            <div className="lg:w-1/4">
              <KnowledgeBaseList
                knowledgeBases={knowledgeBases}
                selectedKnowledgeBase={selectedKnowledgeBase}
                onSelect={handleKnowledgeBaseSelect}
                onListChange={loadKnowledgeBases}
              />
            </div>
            
            {/* 右侧内容区 */}
            <div className="lg:w-3/4">
              {selectedKnowledgeBase ? (
                <KnowledgeBaseContent
                  knowledgeBase={selectedKnowledgeBase}
                />
              ) : (
                <div className="bg-white rounded-3xl shadow-xl p-8 text-center text-gray-500">
                  {knowledgeBases.length === 0 ? 
                    '暂无知识库，点击左侧"+"按钮创建新知识库' : 
                    '请选择一个知识库'
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MyKnowledge;

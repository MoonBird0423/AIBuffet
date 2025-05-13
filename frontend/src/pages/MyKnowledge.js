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
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row">
            {/* 左侧知识库列表 */}
            <div className="w-full lg:w-1/4 lg:pr-6 mb-6 lg:mb-0">
              <KnowledgeBaseList
                knowledgeBases={knowledgeBases}
                selectedKnowledgeBase={selectedKnowledgeBase}
                onSelect={handleKnowledgeBaseSelect}
                onListChange={loadKnowledgeBases}
              />
            </div>
            
            {/* 右侧内容区 */}
            <div className="w-full lg:w-3/4">
              {selectedKnowledgeBase ? (
                <KnowledgeBaseContent
                  knowledgeBase={selectedKnowledgeBase}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-500">
                  {knowledgeBases.length === 0 ? 
                    '暂无知识库，点击左侧"+"按钮创建新知识库' : 
                    '请选择一个知识库'
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MyKnowledge;

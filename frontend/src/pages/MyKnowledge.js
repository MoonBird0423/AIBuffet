import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import UserInfo from '../components/knowledge/UserInfo';
import MyKnowledgeCard from '../components/knowledge/MyKnowledgeCard';
import SearchInput from '../components/knowledge/SearchInput';
import StatusFilter from '../components/knowledge/StatusFilter';
import { getMyKnowledgeBases, deleteKnowledgeBase } from '../services/api';
import { FaPlus } from 'react-icons/fa';

function MyKnowledge() {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatus, setActiveStatus] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({
    avatar: '',
    username: '',
    knowledgeBaseCount: 0
  });

  // 加载知识库数据
  const loadKnowledgeBases = useCallback(async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        keyword: searchTerm || undefined,
        status: activeStatus
      };
      
      const response = await getMyKnowledgeBases(params);
      const content = response?.content || [];
      
      if (page === 0) {
        setKnowledgeBases(content);
      } else {
        setKnowledgeBases(prev => [...prev, ...content]);
      }
      
      setHasMore(content.length === 30); // 每页30条数据
      
      // 更新用户数据到context或全局状态
      if (page === 0) {
        setUserData(prev => ({
          ...prev,
          knowledgeBaseCount: response.totalElements || 0
        }));
      }
    } catch (err) {
      setError(err.message || '加载知识库失败');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, activeStatus, searchTerm]); // 移除loading依赖

  // 单独处理用户数据更新
  useEffect(() => {
    const updateUserData = async () => {
      try {
        const response = await getMyKnowledgeBases({ page: 0, size: 1 });
        if (response?.content?.[0]) {
          const firstKnowledgeBase = response.content[0];
          setUserData({
            avatar: firstKnowledgeBase.creatorAvatar,
            username: firstKnowledgeBase.creatorName,
            knowledgeBaseCount: response.totalElements || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    updateUserData();
  }, []); // 仅在组件挂载时获取一次用户数据

  // 监听搜索和状态筛选变化
  useEffect(() => {
    const timer = setTimeout(() => {
      setKnowledgeBases([]);
      setPage(0);
      setHasMore(true);
      loadKnowledgeBases();
    }, 500); // 500ms防抖

    return () => clearTimeout(timer);
  }, [searchTerm, activeStatus, loadKnowledgeBases]);

  // 监听页码变化
  useEffect(() => {
    if (page > 0) {
      loadKnowledgeBases();
    }
  }, [page, loadKnowledgeBases]);

  // 设置无限滚动
  const observer = useRef();
  const lastKnowledgeBaseRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, setPage]);

  const handleDelete = async (id) => {
    try {
      await deleteKnowledgeBase(id);
      // 重新加载第一页数据
      setKnowledgeBases([]);
      setPage(0);
      setHasMore(true);
      loadKnowledgeBases();
    } catch (err) {
      setError(err.message || '删除知识库失败');
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleStatusChange = (status) => {
    setActiveStatus(status);
  };

  const handleRetry = () => {
    setError(null);
    setKnowledgeBases([]);
    setPage(0);
    setHasMore(true);
    loadKnowledgeBases();
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-16">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserInfo 
          avatar={userData.avatar}
          username={userData.username}
          knowledgeBaseCount={userData.knowledgeBaseCount}
        />

        {/* Search and Create */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative flex-grow max-w-md w-full">
            <SearchInput 
              value={searchTerm}
              onChange={handleSearch}
              placeholder="搜索我的知识库"
            />
          </div>
          <div className="flex">
            <Link 
              to="/create-knowledge"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center"
            >
              <FaPlus className="mr-2" /> 创建知识库
            </Link>
          </div>
        </div>

        {/* 状态筛选 */}
        <div className="mb-6">
          <StatusFilter 
            activeStatus={activeStatus}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="text-center text-red-500 mb-4">
            {error}
            <button 
              className="ml-2 text-blue-500 hover:text-blue-600"
              onClick={handleRetry}
            >
              重试
            </button>
          </div>
        )}

        {/* 空状态 */}
        {!loading && knowledgeBases.length === 0 && !error && (
          <div className="text-center text-gray-500 py-12">
            暂无相关知识库
          </div>
        )}

        {/* Knowledge Base Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {knowledgeBases.map((kb, index) => (
            <div 
              key={kb.id} 
              ref={index === knowledgeBases.length - 1 ? lastKnowledgeBaseRef : null}
            >
              <MyKnowledgeCard
                id={kb.id}
                title={kb.name}
                documentCount={kb.docsCount}
                createdAt={kb.createdAt}
                visitors={kb.usageCount}
                colorMark={kb.colorMark}
                onDelete={() => handleDelete(kb.id)}
              />
            </div>
          ))}
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default MyKnowledge;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SearchInput from '../components/knowledge/SearchInput';
import CreateChatButton from '../components/knowledge/CreateChatButton';
import CategoryFilter from '../components/knowledge/CategoryFilter';
import KnowledgeCard from '../components/knowledge/KnowledgeCard';
import { getPublicKnowledgeBases } from '../services/api';

const KnowledgeGrid = () => {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [sortValue, setSortValue] = useState('latest');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // 加载知识库数据
  const loadKnowledgeBases = useCallback(async () => {
    // 如果已经在加载中，就不再触发新的请求
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        category: activeCategory,
        keyword: searchQuery || undefined,
        orderBy: sortValue
      };
      
      const response = await getPublicKnowledgeBases(params);
      const content = response?.content || [];
      
      if (page === 0) {
        setKnowledgeBases(content);
      } else {
        setKnowledgeBases(prev => [...prev, ...content]);
      }
      
      setHasMore(content.length === 30);
    } catch (err) {
      setError(err.message || '加载知识库失败');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory, searchQuery, sortValue]); // 移除loading依赖

  // 监听搜索、分类和排序变化
  useEffect(() => {
    const timer = setTimeout(() => {
      setKnowledgeBases([]);
      setPage(0);
      setHasMore(true);
      loadKnowledgeBases();
    }, 500); // 500ms的防抖时间

    return () => clearTimeout(timer);
  }, [searchQuery, activeCategory, sortValue, loadKnowledgeBases]); // 添加loadKnowledgeBases依赖

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

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  const handleSortChange = (value) => {
    setSortValue(value);
  };

  const handleRetry = () => {
    setError(null);
    setHasMore(true);
    loadKnowledgeBases();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Slogan */}
          <div className="text-center mb-10 mt-4">
            <p className="text-xl md:text-2xl font-light text-gray-600 tracking-wide select-none">
              "📖复杂文档，秒变简答📢"
            </p>
          </div>

          {/* 搜索栏和按钮 */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-full max-w-2xl flex flex-col md:flex-row gap-4">
              <SearchInput onChange={handleSearch} />
              <CreateChatButton />
            </div>
          </div>

          {/* 分类和排序 */}
          <CategoryFilter
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            sortValue={sortValue}
            onSortChange={handleSortChange}
            loading={loading}
          />

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
          {!loading && knowledgeBases.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              暂无相关知识库
            </div>
          )}

          {/* 知识库网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {knowledgeBases.map((item, index) => (
              <div 
                key={item.id} 
                ref={index === knowledgeBases.length - 1 ? lastKnowledgeBaseRef : null}
              >
                <KnowledgeCard data={item} />
              </div>
            ))}
          </div>

          {/* 加载状态 */}
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default KnowledgeGrid;

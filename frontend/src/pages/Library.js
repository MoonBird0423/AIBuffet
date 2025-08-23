import React, { useState, useEffect, useRef } from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import SearchBar from '../components/library/SearchBar';
import CategoryFilter from '../components/library/CategoryFilter';
import BookCard from '../components/library/BookCard';
import { getDocuments, DocumentCategory } from '../services/api';

function Library() {
  useDocumentTitle('图书馆 | 书意');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 24;  // 每次加载24本图书
  const [lastElementRef, setLastElementRef] = useState(null);
  const observer = useRef(null);

  const categories = [
    { id: 'all', name: '全部分类' },
    ...Object.entries(DocumentCategory).map(([id, name]) => ({ id, name }))
  ];

  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 增加防抖时间到800ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // 实现Intersection Observer监测
  useEffect(() => {
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        fetchMoreDocuments();
      }
    });
    
    if (lastElementRef) {
      observer.current.observe(lastElementRef);
    }
    
    return () => observer.current?.disconnect();
  }, [lastElementRef, hasMore, loading]);

  // 获取文档的方法
  const fetchDocuments = async (isInitial = false) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        keyword: debouncedKeyword || undefined,
        sortBy: sortBy
      };
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
      // 计算当前页码
      const currentPage = isInitial ? 0 : Math.floor(documents.length / pageSize);
      
      console.log('Library: 发送请求参数:', { page: currentPage, size: pageSize, ...params });
      const startTime = performance.now();
      const response = await getDocuments(currentPage, pageSize, params);
      const endTime = performance.now();
      const networkTime = endTime - startTime;
      
      console.log('Library: 接收到响应:', response);
      console.log(`Library: 请求耗时 ${networkTime.toFixed(2)}ms`);
      
      const newDocuments = response.data?.content || [];
      
      // 记录服务器处理耗时
      if (response.data?.serverProcessTime) {
        console.log(`Library: 服务器处理耗时 ${response.data.serverProcessTime}ms`);
        console.log(`Library: 网络传输耗时 ${(networkTime - response.data.serverProcessTime).toFixed(2)}ms`);
      }
      
      // 更新文档列表
      setDocuments(prev => isInitial ? newDocuments : [...prev, ...newDocuments]);
      
      // 检查是否还有更多数据
      setHasMore(newDocuments.length === pageSize);
    } catch (err) {
      setError('获取图书列表失败');
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  // 加载更多文档的方法
  const fetchMoreDocuments = () => {
    if (!loading && hasMore) {
      fetchDocuments(false);
    }
  };

  // 使用防抖后的关键词触发查询
  useEffect(() => {
    setDocuments([]);
    setHasMore(true);
    fetchDocuments(true);
  }, [debouncedKeyword, selectedCategory, sortBy]);

  // 骨架屏组件
  const SkeletonCard = () => (
    <div className="animate-pulse">
      <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
      <div className="h-4 bg-gray-300 rounded mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sf">
      {/* Hero Search Section */}
      <section className="pt-20 pb-6" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              探索知识海洋
            </h1>
            <p className="text-xl text-white/90 mb-8">
              以下内容均由AI生成，如有侵权请联系删除
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <SearchBar
              value={searchKeyword}
              onChange={(value) => {
                setSearchKeyword(value);
              }}
            />
          </div>
        </div>
      </section>

      <main className="flex-grow pb-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          <div className="flex flex-col lg:flex-row gap-8">
            {/* 左侧分类过滤 */}
            <div className="w-full lg:w-1/4">
              <CategoryFilter
                selectedCategory={selectedCategory}
                onSelectCategory={(category) => {
                  setSelectedCategory(category);
                }}
              />
            </div>

            {/* 右侧图书网格 */}
            <div className="w-full lg:w-3/4">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedCategory === 'all' ? '全部图书' : categories.find(c => c.id === selectedCategory)?.name}
                  </h2>
                  <p className="text-gray-600 mt-1">共找到 {documents.length} 本图书</p>
                </div>
                {/* 排序选择器 */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">排序：</span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">最新</option>
                    <option value="oldest">最旧</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              {loading && documents.length === 0 ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonCard key={index} />
                  ))}
                </div>
              ) : documents.length > 0 ? (
                <>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {documents.map((document, index) => (
                      <div 
                        key={document.id}
                        ref={index === documents.length - 1 ? setLastElementRef : null}
                      >
                        <BookCard document={document} />
                      </div>
                    ))}
                  </div>
                  
                  {loading && (
                    <div className="flex justify-center items-center h-20 mt-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  {!loading && !hasMore && documents.length > 0 && (
                    <div className="text-center text-gray-500 mt-8">
                      没有更多图书了
                    </div>
                  )}
                  </>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  暂无图书
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}

export default Library;

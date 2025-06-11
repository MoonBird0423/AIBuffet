import React, { useState, useEffect, useRef } from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import SearchBar from '../components/library/SearchBar';
import CategoryFilter from '../components/library/CategoryFilter';
import BookCard from '../components/library/BookCard';
import { getDocuments, DocumentCategory } from '../services/api';

function Library() {
  useDocumentTitle('图书馆 | 书意');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
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
        keyword: searchKeyword || undefined
      };
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
      // 计算当前页码
      const currentPage = isInitial ? 0 : Math.floor(documents.length / pageSize);
      
      console.log('Library: 发送请求参数:', { page: currentPage, size: pageSize, ...params });
      const response = await getDocuments(currentPage, pageSize, params);
      console.log('Library: 接收到响应:', response);
      const newDocuments = response.data?.content || [];
      
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

  // 在搜索关键词或分类变化时重置列表
  useEffect(() => {
    setDocuments([]);
    setHasMore(true);
    const debounceTimer = setTimeout(() => fetchDocuments(true), 300);
    return () => clearTimeout(debounceTimer);
  }, [searchKeyword, selectedCategory]);

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
              发现兴趣之书，开启智能之旅
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
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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

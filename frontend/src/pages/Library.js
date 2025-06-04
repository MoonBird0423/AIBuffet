import React, { useState, useEffect } from 'react';
import SearchBar from '../components/library/SearchBar';
import CategoryFilter from '../components/library/CategoryFilter';
import BookCard from '../components/library/BookCard';
import { getDocuments, DocumentCategory } from '../services/api';

function Library() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    { id: 'all', name: '全部分类' },
    ...Object.entries(DocumentCategory).map(([id, name]) => ({ id, name }))
  ];

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = {
          keyword: searchKeyword || undefined
        };
        if (selectedCategory !== 'all') {
          params.category = selectedCategory;
        }
        console.log('Library: 发送请求参数:', { page: currentPage, size: 20, ...params });
        const response = await getDocuments(currentPage, 6, params);
        console.log('Library: 接收到响应:', response);
        console.log('Library: 设置文档数据:', response.data?.content);
        setDocuments(response.data?.content || []);
        setTotalPages(response.data?.totalPages || 1);
      } catch (err) {
        setError('获取图书列表失败');
        console.error('Error fetching documents:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchDocuments, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchKeyword, selectedCategory, currentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

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
                setCurrentPage(0);
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
                  setCurrentPage(0);
                  setSelectedCategory(category);
                }}
              />
            </div>

            {/* 右侧图书网格 */}
            <div className="w-full lg:w-3/4">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedCategory === 'all' ? '热门图书' : categories.find(c => c.id === selectedCategory)?.name}
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
                  {documents.map(document => (
                    <BookCard key={document.id} document={document} />
                  ))}
                  </div>
                  
                  {/* Pagination */}
                  <div className="flex justify-center mt-12">
                      <nav className="flex items-center space-x-2">
                        <button 
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 0}
                          className={`px-4 py-2 rounded-xl shadow-sm border border-gray-200 
                            ${currentPage === 0 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200
                              ${currentPage === i
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                : 'text-gray-700 bg-white hover:bg-gray-50 shadow-sm border border-gray-200'
                              }`}
                          >
                            {i + 1}
                          </button>
                        ))}

                        <button 
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages - 1}
                          className={`px-4 py-2 rounded-xl shadow-sm border border-gray-200 
                            ${currentPage === totalPages - 1
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </nav>
                    </div>
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

import React, { useState, useEffect } from 'react';
import SearchBar from '../components/library/SearchBar';
import CategoryFilter from '../components/library/CategoryFilter';
import BookCard from '../components/library/BookCard';
import { getDocuments } from '../services/api';

function Library() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        console.log('Library: 发送请求参数:', { page: 0, size: 20, ...params });
        const response = await getDocuments(0, 20, params);
        console.log('Library: 接收到响应:', response);
        console.log('Library: 设置文档数据:', response.data?.content);
        setDocuments(response.data?.content || []);
      } catch (err) {
        setError('获取图书列表失败');
        console.error('Error fetching documents:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchDocuments, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchKeyword, selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 搜索栏 */}
          <div className="mb-6">
            <SearchBar
              value={searchKeyword}
              onChange={setSearchKeyword}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* 左侧分类过滤 */}
            <div className="w-full md:w-1/5">
              <CategoryFilter
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>

            {/* 右侧图书网格 */}
            <div className="w-full md:w-4/5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {documents.map(document => (
                    <BookCard key={document.id} document={document} />
                  ))}
                </div>
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

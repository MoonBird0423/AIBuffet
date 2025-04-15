import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SearchInput from '../components/knowledge/SearchInput';
import CreateChatButton from '../components/knowledge/CreateChatButton';
import CategoryFilter from '../components/knowledge/CategoryFilter';
import KnowledgeCard from '../components/knowledge/KnowledgeCard';

// 模拟数据，后续需要替换为真实的API调用
const mockData = [
  {
    id: 1,
    title: '产品使用手册',
    documentCount: 5,
    creator: {
      name: '张小明',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
    },
    userCount: 148
  },
  {
    id: 2,
    title: '财务报表分析',
    documentCount: 12,
    creator: {
      name: '李伟',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
    },
    userCount: 324
  }
];

const KnowledgeGrid = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortValue, setSortValue] = useState('latest');

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  const handleSortChange = (value) => {
    setSortValue(value);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Slogan */}
          <div className="text-center mb-10 mt-4">
            <p className="text-xl md:text-2xl font-light text-gray-600 tracking-wide select-none">
              "📢在对话中学习知识📖"
            </p>
          </div>

          {/* 搜索栏和按钮 */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-full max-w-2xl flex flex-col md:flex-row gap-4">
              <SearchInput onSearch={handleSearch} />
              <CreateChatButton />
            </div>
          </div>

          {/* 分类和排序 */}
          <CategoryFilter
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            sortValue={sortValue}
            onSortChange={handleSortChange}
          />

          {/* 知识库网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockData.map(item => (
              <KnowledgeCard key={item.id} data={item} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default KnowledgeGrid;

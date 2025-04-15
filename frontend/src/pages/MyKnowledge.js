import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import UserInfo from '../components/knowledge/UserInfo';
import MyKnowledgeCard from '../components/knowledge/MyKnowledgeCard';
import SearchInput from '../components/knowledge/SearchInput';
import { FaPlus } from 'react-icons/fa';

// 模拟用户数据
const mockUserData = {
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
  username: "张小明",
  knowledgeBaseCount: 8
};

// 模拟知识库数据
const mockKnowledgeBases = [
  {
    id: 1,
    title: "产品使用手册",
    documentCount: 5,
    createdAt: "2023-10-15",
    visitors: 148,
    gradient: "from-blue-500 to-indigo-600"
  },
  {
    id: 2,
    title: "财务报表分析",
    documentCount: 12,
    createdAt: "2023-09-28",
    visitors: 324,
    gradient: "from-green-500 to-teal-600"
  },
  {
    id: 3,
    title: "营销策略指南",
    documentCount: 8,
    createdAt: "2023-09-12",
    visitors: 212,
    gradient: "from-purple-500 to-pink-600"
  },
  {
    id: 4,
    title: "技术文档库",
    documentCount: 4,
    createdAt: "2023-08-30",
    visitors: 98,
    gradient: "from-red-500 to-orange-600"
  },
  {
    id: 5,
    title: "客户调研资料",
    documentCount: 7,
    createdAt: "2023-08-12",
    visitors: 176,
    gradient: "from-yellow-500 to-amber-600"
  }
];

function MyKnowledge() {
  const [knowledgeBases, setKnowledgeBases] = useState(mockKnowledgeBases);
  const [searchTerm, setSearchTerm] = useState("");

  const handleDelete = (id) => {
    setKnowledgeBases(knowledgeBases.filter(kb => kb.id !== id));
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const filteredKnowledgeBases = knowledgeBases.filter(kb =>
    kb.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen pt-16">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserInfo 
          avatar={mockUserData.avatar}
          username={mockUserData.username}
          knowledgeBaseCount={mockUserData.knowledgeBaseCount}
        />

        {/* Search and Create */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
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

        {/* Knowledge Base Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKnowledgeBases.map(kb => (
            <MyKnowledgeCard
              key={kb.id}
              {...kb}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default MyKnowledge;

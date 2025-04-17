import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaShare, FaEdit, FaComments } from 'react-icons/fa';
import { BsSearch } from 'react-icons/bs';
import ColorPicker from '../components/common/ColorPicker';
import Navbar from '../components/layout/Navbar';
import { getKnowledgeBase, updateKnowledgeBaseColor } from '../services/api';
import { ToastManager } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = {
  TECH: '技术文档',
  LITERATURE: '文学',
  POPULAR: '流行',
  CULTURE: '文化',
  LIFE: '生活',
  BUSINESS: '经管'
};

function KnowledgeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [knowledgeBase, setKnowledgeBase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    loadKnowledgeBase();
  }, [id, isAuthenticated, navigate]);

  const loadKnowledgeBase = async () => {
    try {
      const data = await getKnowledgeBase(id);
      setKnowledgeBase(data);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      ToastManager.error(error.message || '加载知识库失败');
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = async (color) => {
    try {
      await updateKnowledgeBaseColor(id, color);
      setKnowledgeBase(prev => ({ ...prev, colorMark: color }));
    } catch (error) {
      console.error('Error updating color:', error);
      ToastManager.error(error.message || '更新颜色失败');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      ToastManager.success('链接复制成功，快去分享吧！');
    }).catch(() => {
      ToastManager.error('复制链接失败');
    });
  };

  const handleStartChat = () => {
    window.open(`/chat?knowledgeId=${id}`, '_blank');
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center">加载中...</div>;
  }

  if (!knowledgeBase) {
    return <div className="h-screen flex items-center justify-center">知识库不存在</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* 返回按钮 */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="text-blue-600 hover:text-blue-800 inline-flex items-center"
          >
            <FaArrowLeft className="mr-2" /> 返回上一页
          </button>
        </div>

        {/* 知识库基本信息 */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  {/* 颜色标记 */}
                  <ColorPicker
                    value={knowledgeBase.colorMark}
                    onChange={handleColorChange}
                  />
                  
                  <h1 className="text-2xl font-bold text-gray-800 ml-3">{knowledgeBase.name}</h1>
                  <Link to={`/create-knowledge?id=${id}`} className="ml-3 text-gray-400 hover:text-gray-600 transition-colors">
                    <FaEdit className="text-lg" />
                  </Link>
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <img className="h-5 w-5 rounded-full mr-2" src={knowledgeBase.creatorAvatar} alt="" />
                  <span>{knowledgeBase.creatorName}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(knowledgeBase.createdAt).toLocaleDateString()}</span>
                  <span className="mx-2">•</span>
                  <span>{knowledgeBase.visibility === 'PRIVATE' ? '私有' : '公开'}</span>
                  {knowledgeBase.category && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                        {CATEGORIES[knowledgeBase.category]}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleShare}
                  className="text-gray-600 hover:text-gray-800 font-medium py-2 px-4 rounded-md transition-colors flex items-center border border-gray-200 hover:border-gray-300"
                >
                  <FaShare className="mr-2" /> 分享
                </button>
                <button
                  onClick={handleStartChat}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center"
                >
                  <FaComments className="mr-2" /> 开始对话
                </button>
              </div>
            </div>
            {knowledgeBase.description && (
              <p className="text-gray-600 mt-4">{knowledgeBase.description}</p>
            )}
          </div>
        </div>

        {/* 文档管理 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">文档管理</h2>
            <label className="cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 py-2 px-4 rounded-md transition-colors flex items-center">
              <FaShare className="mr-2" /> 上传文档
              <input type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.txt,.md" />
            </label>
          </div>

          {/* 搜索栏 */}
          <div className="relative mb-6">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <BsSearch className="text-gray-400" />
            </span>
            <input 
              type="text" 
              placeholder="搜索文档" 
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 文档列表 */}
          <div className="overflow-x-auto">
            {/* 这里暂时只做静态展示，待后续实现文件管理功能时再完善 */}
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    文档名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    大小
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    上传时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    解析状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    暂无文档
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default KnowledgeDetail;

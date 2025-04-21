import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaShare, FaEdit, FaComments, FaUpload } from 'react-icons/fa';
import { BsSearch } from 'react-icons/bs';
import ColorPicker from '../components/common/ColorPicker';
import Navbar from '../components/layout/Navbar';
import FileUploadModal from '../components/knowledge/FileUploadModal';
import FileList from '../components/knowledge/FileList';
import { getKnowledgeBase, updateKnowledgeBaseColor, getDocuments } from '../services/api';
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    loadKnowledgeBase();
  }, [id, isAuthenticated, navigate]);

  const loadDocuments = useCallback(async (page = 0) => {
    try {
      setDocumentsLoading(true);
      const response = await getDocuments(id, page, 20);
      setDocuments(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
      setCurrentPage(page);
    } catch (error) {
      console.error('加载文档列表失败:', error.message);
      ToastManager.error(error.message || '加载文档列表失败');
    } finally {
      setDocumentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDocuments(currentPage);
  }, [currentPage, loadDocuments]);

  const loadKnowledgeBase = async () => {
    try {
      const data = await getKnowledgeBase(id);
      setKnowledgeBase(data);
    } catch (error) {
      console.error('加载知识库失败:', error.message);
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
      console.error('更新颜色失败:', error.message);
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

  const handleDocumentDelete = useCallback((docId) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
    setTotalElements(prev => prev - 1);
    // 删除后立即刷新以确保数据同步
    loadDocuments(currentPage);
  }, [loadDocuments, currentPage]);

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
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 py-2 px-4 rounded-md transition-colors flex items-center"
            >
              <FaUpload className="mr-2" /> 上传文档
            </button>
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
          <FileList 
            files={documents}
            isLoading={documentsLoading}
            onDelete={handleDocumentDelete}
            knowledgeBaseId={id}
            page={currentPage}
            total={totalElements}
            pageSize={20}
            onPageChange={setCurrentPage}
          />
        </div>
      </main>

      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        knowledgeBaseId={id}
        onUploadComplete={() => {
          loadDocuments(0);
          setCurrentPage(0);
        }}
      />
    </div>
  );
}

export default KnowledgeDetail;

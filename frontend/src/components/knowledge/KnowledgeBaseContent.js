import React, { useState, useEffect } from 'react';
import FileList from './FileList';
import FileUploadModal from './FileUploadModal';
import FavoriteList from './FavoriteList';
import { getDocuments } from '../../services/api';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

function KnowledgeBaseContent({ knowledgeBase }) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('collections'); // 新增选项卡状态
  const [isMobile, setIsMobile] = useState(false);

  // 检测移动端
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 获取文件列表
  const fetchFiles = async () => {
    if (!knowledgeBase?.id) return;
    
    setIsLoading(true);
    try {
      const response = await getDocuments(page, 20, { 
        knowledgeBaseId: knowledgeBase.id,
        relationType: 'UPLOAD'
      });
      setFiles(response.data.content);
      setTotal(response.data.totalElements);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 在组件加载和依赖项变化时获取文件列表
  useEffect(() => {
    fetchFiles();
  }, [knowledgeBase?.id, page]);
  if (!knowledgeBase) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center text-gray-500">
        <p>请选择一个知识库</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统一选项卡容器 */}
      <div className="bg-white rounded-3xl shadow-xl">
        {/* 选项卡导航 */}
        <div className="flex justify-center p-6 pb-0">
          <div className="bg-gray-100 rounded-2xl p-2">
            <div className="flex space-x-2">
              <button 
                className={`tab-button px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'collections' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab('collections')}
              >
                <i className="fas fa-heart mr-2"></i>
                我的收藏
              </button>
              <button 
                className={`tab-button px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'uploads' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab('uploads')}
              >
                <i className="fas fa-upload mr-2"></i>
                我的上传
              </button>
            </div>
          </div>
        </div>

        {/* 我的上传选项卡 */}
        {activeTab === 'uploads' && (
          <div className="tab-content p-8">
            {/* 移动端友好提示 */}
            {isMobile ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center">
                  <i className="fas fa-mobile-alt text-3xl text-gray-400"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">移动端暂不支持上传</h3>
                <p className="text-gray-600 leading-relaxed">
                  为了更好的上传体验，请在PC端上传管理图书<br />
                </p>
              </div>
            ) : (
              /* PC端正常显示 */
              <>
                <div className="flex justify-end items-center mb-8">
                  <div className="flex space-x-3">
                    <button
                      onClick={fetchFiles}
                      className="floating-button bg-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-medium hover:bg-gray-200 transition-all duration-200"
                    >
                      <i className="fas fa-refresh mr-2"></i>
                      刷新
                    </button>
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="floating-button bg-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-medium hover:bg-gray-200 transition-all duration-200"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      上传图书
                    </button>
                  </div>
                </div>

                {/* 文件列表 */}
                {error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      重试
                    </button>
                  </div>
                ) : (
                  <FileList 
                    files={files}
                    isLoading={isLoading}
                    knowledgeBaseId={knowledgeBase.id}
                    onError={setError}
                    page={page}
                    pageSize={20}
                    total={total}
                    onPageChange={setPage}
                    onRefresh={fetchFiles}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* 我的收藏选项卡 */}
        {activeTab === 'collections' && (
          <div className="tab-content p-8">
            <FavoriteList knowledgeBaseId={knowledgeBase.id} />
          </div>
        )}
      </div>

      {/* 文件上传弹窗 */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setError(null);
        }}
        knowledgeBaseId={knowledgeBase.id}
          onUploadComplete={() => {
            setIsUploadModalOpen(false);
            fetchFiles(); // 上传完成后刷新
          }}
        onError={setError}
      />
    </div>
  );
}

export default KnowledgeBaseContent;

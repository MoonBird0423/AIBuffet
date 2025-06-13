import React, { useState, useEffect } from 'react';
import FileList from './FileList';
import FileUploadModal from './FileUploadModal';
import PublishModal from './PublishModal';
import FavoriteList from './FavoriteList';
import { getDocuments } from '../../services/api';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { openChatWindow } from '../../utils/chatWindowManager';

function KnowledgeBaseContent({ knowledgeBase }) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('uploads'); // 新增选项卡状态

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

  // 处理知识库问答按钮点击
  const handleChatClick = () => {
    openChatWindow({
      type: 'knowledge',
      id: knowledgeBase.id,
      name: knowledgeBase.name
    });
  };
  if (!knowledgeBase) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center text-gray-500">
        <p>请选择一个知识库</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 知识库标题栏 */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900" id="selectedKnowledgeBaseName">{knowledgeBase.name}</h2>
          </div>
          <button
            onClick={handleChatClick}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
          >
            <i className="fas fa-comments mr-2"></i>
            知识库问答
          </button>
        </div>
      </div>

      {/* 统一选项卡容器 */}
      <div className="bg-white rounded-3xl shadow-xl">
        {/* 选项卡导航 */}
        <div className="flex justify-center p-6 pb-0">
          <div className="bg-gray-100 rounded-2xl p-2">
            <div className="flex space-x-2">
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
            </div>
          </div>
        </div>

        {/* 我的上传选项卡 */}
        {activeTab === 'uploads' && (
          <div className="tab-content p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">我的上传</h2>
                <p className="text-gray-600 mt-1">上传图书进行智能解读和对话</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={fetchFiles}
                  className="floating-button bg-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-medium hover:bg-gray-200 transition-all duration-200"
                >
                  <i className="fas fa-refresh mr-2"></i>
                  刷新
                </button>                <button
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
                onPublish={(file) => {
                  setSelectedFile(file);
                  setIsPublishModalOpen(true);
                }}
              />
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

      {/* 发布弹窗 */}
      {selectedFile && (
        <PublishModal
          isOpen={isPublishModalOpen}
          onClose={() => {
            // 关闭时清空状态，确保下次打开时重新开始
            setIsPublishModalOpen(false);
            setSelectedFile(null);
          }}
          onSuccess={() => {
            setIsPublishModalOpen(false);
            setSelectedFile(null);
            fetchFiles(); // 发布成功后刷新
          }}
          fileName={selectedFile.name}
          documentId={selectedFile.id}
        />
      )}

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

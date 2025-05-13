import React, { useState, useEffect } from 'react';
import FileList from './FileList';
import FileUploadModal from './FileUploadModal';

function KnowledgeBaseContent({ knowledgeBase }) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // 重置上传成功状态
  useEffect(() => {
    if (uploadSuccess) {
      const timer = setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess]);

  // 处理知识库问答按钮点击
  const handleChatClick = () => {
    const chatUrl = `/chat?knowledgeBaseId=${knowledgeBase.id}`;
    window.open(chatUrl, '_blank');
  };

  if (!knowledgeBase) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-500">
        <p>请选择一个知识库</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 知识库信息 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-medium text-gray-900">{knowledgeBase.name}</h2>
          </div>
          <button
            onClick={handleChatClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4-4-4z" />
            </svg>
            知识库问答
          </button>
        </div>
      </div>

      {/* 上传文档区 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">我的上传</h2>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            上传图书
          </button>
        </div>

        {/* 文件列表 */}
        {error ? (
          <div className="text-center py-4">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              重试
            </button>
          </div>
        ) : (
          <>
            {uploadSuccess && (
              <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                文件上传成功
              </div>
            )}
            <FileList 
              knowledgeBaseId={knowledgeBase.id}
              onError={setError}
            />
          </>
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
        onSuccess={() => {
          setIsUploadModalOpen(false);
          setUploadSuccess(true);
        }}
        onError={setError}
      />
    </div>
  );
}

export default KnowledgeBaseContent;

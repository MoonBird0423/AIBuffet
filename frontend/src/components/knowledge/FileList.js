import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteDocument, updateDocumentPublishStatus } from '../../services/api';
import { ToastManager } from '../common/Toast';
import { ChevronLeftIcon, ChevronRightIcon, ExclamationCircleIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import Tooltip from '../common/Tooltip';
import Popover from '../common/Popover';
import Modal from '../common/Modal';
import ChunkViewModal from './ChunkViewModal';
import PublishModal from './PublishModal';

const FileList = ({ 
  files, 
  onRefresh,
  isLoading, 
  knowledgeBaseId, 
  page = 0, 
  pageSize = 20, 
  total = 0, 
  onPageChange 
}) => {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [showChunkModal, setShowChunkModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishingFileId, setPublishingFileId] = useState(null);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);

  const truncateFileName = (fileName) => {
    if (fileName.length > 20) {
      const ext = fileName.split('.').pop();
      const name = fileName.substring(0, 17);
      return `${name}...${ext}`;
    }
    return fileName;
  };

  const handlePublish = (fileId) => {
    setPublishingFileId(fileId);
    setShowPublishModal(true);
  };

  const handleUnpublish = (fileId) => {
    setPublishingFileId(fileId);
    setShowUnpublishModal(true);
  };

  const handleLearn = (fileId) => {
    navigate(`/book/${fileId}`);
  };

  const handleViewDetails = (fileId) => {
    setSelectedFileId(fileId);
    setShowChunkModal(true);
  };

  const handlePublishSuccess = () => {
    onRefresh();
    setShowPublishModal(false);
    setPublishingFileId(null);
  };

  const handleUnpublishConfirm = async () => {
    try {
      await updateDocumentPublishStatus(publishingFileId, 'UNPUBLISHED');
      onRefresh();
    } catch (error) {
      ToastManager.error('取消发布失败：' + (error.response?.data?.message || error.message));
    } finally {
      setShowUnpublishModal(false);
      setPublishingFileId(null);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': '待处理',
      'EXTRACTING_TEXT': '文本提取中',
      'CHUNKING': '分块中',
      'VECTORIZING': '向量化中',
      'COMPLETED': '完成',
      'FAILED': '错误'
    };
    return statusMap[status] || status;
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个文档吗？')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteDocument(id, knowledgeBaseId);
      onRefresh();
    } catch (error) {
      const errorCode = error.response?.data?.code;
      const message = error.response?.data?.message || '删除失败';
      
      switch (errorCode) {
        case 4001:
          ToastManager.error(message);
          onRefresh();
          break;
        case 4002:
          ToastManager.error(message);
          break;
        default:
          ToastManager.error('系统错误，请稍后重试');
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">加载中...</div>
    );
  }

  if (!files?.length) {
    return (
      <div className="p-8 text-center text-gray-500">还没有上传任何文档</div>
    );
  }

  const renderFileRow = (file) => (
    <tr key={file.id} className="hover:bg-gray-50">{/* 移除tr间的空白 */}
      <td className="px-6 py-4">
        <div className="flex items-center">
          <img 
            src={file.coverUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=80&h=100&fit=crop"} 
            alt={file.fileName} 
            className="w-12 h-16 object-cover rounded-lg"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=80&h=100&fit=crop";
            }}
          />
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              <Tooltip content={file.fileName} position="top">
                <span className="truncate block hover:text-blue-600 transition-colors">
                  {truncateFileName(file.fileName)}
                </span>
              </Tooltip>
            </h3>
            <p className="text-gray-600">{file.author || "暂无作者"}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          file.publishStatus === 'PUBLISHED' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {file.publishStatus === 'PUBLISHED' ? '已发布' : '未发布'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            file.processing_status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
            file.processing_status === 'FAILED' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {getStatusText(file.processing_status)}
          </span>
          {file.processing_status === 'FAILED' && file.error_message && (
            <Tooltip content={file.error_message} position="top">
              <ExclamationCircleIcon className="ml-2 h-5 w-5 text-red-500 cursor-help" />
            </Tooltip>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <Popover
            trigger={
              <button className="text-gray-400 hover:text-gray-600 p-2">
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
            }
            content={
              <div className="py-1">
                {file.publishStatus === 'PUBLISHED' ? (
                  <>{/* 已发布状态：显示学习、处理详情、取消发布 */}
                    <button
                      onClick={() => handleLearn(file.id)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <i className="fas fa-graduation-cap mr-2"></i>学习
                    </button>
                    <button
                      onClick={() => handleViewDetails(file.id)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <i className="fas fa-info-circle mr-2"></i>处理详情
                    </button>
                    <button
                      onClick={() => handleUnpublish(file.id)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <i className="fas fa-times mr-2"></i>取消发布
                    </button>
                  </>
                ) : (
                  <>{/* 未发布状态：显示发布、处理详情、删除 */}
                    {file.processing_status === 'COMPLETED' ? (
                      <button
                        onClick={() => handlePublish(file.id)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <i className="fas fa-upload mr-2"></i>解读发布
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed flex items-center"
                      >
                        <i className="fas fa-upload mr-2"></i>发布（处理中）
                      </button>
                    )}
                    <button
                      onClick={() => handleViewDetails(file.id)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <i className="fas fa-info-circle mr-2"></i>处理详情
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={deletingId === file.id}
                      className={`w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center
                        ${deletingId === file.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <i className="fas fa-trash mr-2"></i>
                      <span>{deletingId === file.id ? '删除中...' : '删除'}</span>
                    </button>
                  </>
                )}
              </div>
            }
            position="bottom"
          />
        </div>
      </td>
    </tr>
  );

  const Pagination = () => {
    const totalPages = Math.ceil(total / pageSize);
    const pageNumbers = [];
    
    // 计算显示哪些页码按钮
    for (let i = Math.max(0, page - 2); i < Math.min(totalPages, page + 3); i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button 
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            上一页
          </button>
          <button 
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              显示 <span className="font-medium">{page * pageSize + 1}</span> 到 
              <span className="font-medium">{Math.min((page + 1) * pageSize, total)}</span> 条，
              共 <span className="font-medium">{total}</span> 条结果
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium
                  ${page === 0 
                    ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
              >
                <span className="sr-only">上一页</span>
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              {pageNumbers.map(number => (
                <button
                  key={number}
                  onClick={() => onPageChange(number)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                    ${page === number 
                      ? 'bg-blue-50 border-blue-500 text-blue-600' 
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  {number + 1}
                </button>
              ))}
              {totalPages > 5 && page < totalPages - 3 && (
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  ...
                </span>
              )}
              {totalPages > 5 && page < totalPages - 3 && (
                <button
                  onClick={() => onPageChange(totalPages - 1)}
                  className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                >
                  {totalPages}
                </button>
              )}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium
                  ${page >= totalPages - 1
                    ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
              >
                <span className="sr-only">下一页</span>
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ overflow: 'visible' }}>
      <div className="bg-white rounded-2xl border border-gray-200" style={{ overflow: 'visible' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">图书信息</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发布状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">处理状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map(renderFileRow)}
          </tbody>
        </table>
      </div>
      
      <Pagination />
      
      <ChunkViewModal
        isOpen={showChunkModal}
        onClose={() => setShowChunkModal(false)}
        fileId={selectedFileId}
      />

      <PublishModal
        isOpen={showPublishModal}
        onClose={() => {
          setShowPublishModal(false);
          setPublishingFileId(null);
        }}
        onSuccess={handlePublishSuccess}
        fileName={files.find(f => f.id === publishingFileId)?.fileName || ''}
        documentId={publishingFileId}
      />

      <Modal
        isOpen={showUnpublishModal}
        onClose={() => {
          setShowUnpublishModal(false);
          setPublishingFileId(null);
        }}
        title="取消发布"
        footer={<>
          <button
            onClick={() => {
              setShowUnpublishModal(false);
              setPublishingFileId(null);
            }}
            className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            取消
          </button>
          <button
            onClick={handleUnpublishConfirm}
            className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            确认
          </button>
        </>}
      >
        <div className="p-6">
          <p className="text-gray-500">确定要取消发布此文档吗？取消发布后，其他用户将无法查看此文档。</p>
        </div>
      </Modal>
    </div>
  );
};

export default FileList;

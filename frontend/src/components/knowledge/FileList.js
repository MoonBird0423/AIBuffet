import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { deleteDocument, retryProcessing, getDocumentChunks } from '../../services/api';
import { TrashIcon, DocumentIcon, ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon, ViewfinderCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import Tooltip from '../common/Tooltip';
import ChunkViewModal from './ChunkViewModal';

const FileList = ({ files, onDelete, isLoading, knowledgeBaseId, page = 0, pageSize = 20, total = 0, onPageChange }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [showChunkModal, setShowChunkModal] = useState(false);

  const truncateFileName = (fileName) => {
    if (fileName.length > 20) {
      const ext = fileName.split('.').pop();
      const name = fileName.substring(0, 17);
      return `${name}...${ext}`;
    }
    return fileName;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getStatusClass = (status) => {
    const classes = {
      'PENDING': 'text-yellow-700 bg-yellow-50 border border-yellow-200',
      'EXTRACTING_TEXT': 'text-blue-700 bg-blue-50 border border-blue-200',
      'CHUNKING': 'text-blue-700 bg-blue-50 border border-blue-200',
      'VECTORIZING': 'text-blue-700 bg-blue-50 border border-blue-200',
      'COMPLETED': 'text-green-700 bg-green-50 border border-green-200',
      'FAILED': 'text-red-700 bg-red-50 border border-red-200'
    };
    return (classes[status] || 'text-gray-700 bg-gray-50 border border-gray-200') + ' px-2 py-1 rounded-full';
  };

  const handleRetry = async (id) => {
    setProcessingId(id);
    try {
      await retryProcessing(id);
      toast.success('已重新开始处理');
      // 刷新文件列表
      onPageChange(page);
    } catch (error) {
      toast.error('重试失败：' + (error.response?.data?.message || '系统错误'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewChunks = async (id) => {
    setSelectedFileId(id);
    setShowChunkModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个文档吗？')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteDocument(id, knowledgeBaseId);
      onDelete(id);
      toast.success('文档已删除');
    } catch (error) {
      const errorCode = error.response?.data?.code;
      const message = error.response?.data?.message || '删除失败';
      
      // 处理不同错误情况
      switch (errorCode) {
        case 4001: // RESOURCE_NOT_FOUND
          toast.warning(message);
          onDelete(id); // 从列表中移除不存在的文件
          break;
        case 4002: // PERMISSION_DENIED
          toast.error(message);
          break;
        default:
          toast.error('系统错误，请稍后重试');
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  if (!files?.length) {
    return (
      <div className="p-8 text-center text-gray-500">
        还没有上传任何文档
      </div>
    );
  }

  const Pagination = () => {
    const totalPages = Math.ceil(total / pageSize);
    const pageNumbers = [];
    const maxPageButtons = 5;
    
    // 计算显示哪些页码按钮
    for (let i = Math.max(0, page - 2); i < Math.min(totalPages, page + 3); i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
        <div className="overflow-visible">
          <p className="text-sm text-gray-700">
            显示 <span className="font-medium">{page * pageSize + 1}</span> 到 
            <span className="font-medium">{Math.min((page + 1) * pageSize, total)}</span> 条,
            共 <span className="font-medium">{total}</span> 条结果
          </p>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-end">
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
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
              >
                {number + 1}
              </button>
            ))}
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
    );
  };

  return (
    <div style={{ overflow: 'visible' }}>
      <div style={{ overflow: 'visible' }}>
        <table className="min-w-full divide-y divide-gray-200">
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
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <DocumentIcon className="h-5 w-5 text-gray-400" />
                    <div className="flex flex-col max-w-[180px] min-w-0">
                      <div className="font-medium text-gray-900">
                        <Tooltip content={file.fileName} position="top">
                          <span className="truncate block hover:text-blue-600 transition-colors">
                            {truncateFileName(file.fileName)}
                          </span>
                        </Tooltip>
                      </div>
                      <div className="text-sm text-gray-500">
                        {file.fileType}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatFileSize(file.fileSize)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(file.uploadedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className={getStatusClass(file.processing_status)}>
                      {getStatusText(file.processing_status)}
                    </span>
                    {file.processing_status === 'FAILED' && file.error_message && (
                      <Tooltip content={file.error_message} position="top">
                        <ExclamationCircleIcon className="ml-2 h-5 w-5 text-red-500 cursor-help" />
                      </Tooltip>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-3">
                    {file.processing_status === 'FAILED' && (
                      <button
                        onClick={() => handleRetry(file.id)}
                        disabled={processingId === file.id}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center space-x-1"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                        <span>{processingId === file.id ? '处理中...' : '重试'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleViewChunks(file.id)}
                      className="text-green-600 hover:text-green-900 inline-flex items-center space-x-1"
                    >
                      <ViewfinderCircleIcon className="h-4 w-4" />
                      <span>查看分块</span>
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={deletingId === file.id}
                      className={`text-red-600 hover:text-red-900 inline-flex items-center space-x-1
                        ${deletingId === file.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span>{deletingId === file.id ? '删除中...' : '删除'}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > pageSize && <Pagination />}
      
      <ChunkViewModal
        isOpen={showChunkModal}
        onClose={() => setShowChunkModal(false)}
        fileId={selectedFileId}
      />
    </div>
  );
};

export default FileList;

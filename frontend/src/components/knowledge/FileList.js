import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { deleteDocument } from '../../services/api';
import { TrashIcon, DocumentIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const FileList = ({ files, onDelete, isLoading, knowledgeBaseId, page = 0, pageSize = 20, total = 0, onPageChange }) => {
  const [deletingId, setDeletingId] = useState(null);

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
        <div>
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
                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
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
    <div>
      <div className="overflow-x-auto">
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
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <DocumentIcon className="h-5 w-5 text-gray-400" />
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-900 truncate max-w-md">
                        {file.fileName}
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
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleDelete(file.id)}
                    disabled={deletingId === file.id}
                    className={`text-red-600 hover:text-red-900 inline-flex items-center space-x-1
                      ${deletingId === file.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span>{deletingId === file.id ? '删除中...' : '删除'}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > pageSize && <Pagination />}
    </div>
  );
};

export default FileList;

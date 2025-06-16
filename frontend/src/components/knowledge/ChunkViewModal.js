import React, { useState, useEffect } from 'react';
import { getDocumentChunks } from '../../services/api';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ToastManager } from '../common/Toast';

const ChunkViewModal = ({ isOpen, onClose, fileId }) => {
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    if (isOpen && fileId) {
      setCurrentPage(0);
      loadChunks(0);
    } else {
      setChunks([]);
      setCurrentPage(0);
      setTotalPages(0);
      setTotalElements(0);
    }
  }, [isOpen, fileId]);

  const loadChunks = async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await getDocumentChunks(fileId, page, pageSize);
      setChunks(response.data.data || []);
      setCurrentPage(response.data.page || 0);
      setTotalPages(response.data.totalPages || 0);
      setTotalElements(response.data.totalElements || 0);
    } catch (error) {
      ToastManager.error('加载分块数据失败：' + (error.response?.data?.message || '系统错误'));
      setChunks([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
      loadChunks(page);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-600';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-600';
      case 'COMPLETED':
        return 'bg-green-100 text-green-600';
      case 'FAILED':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return '等待处理';
      case 'PROCESSING':
        return '处理中';
      case 'COMPLETED':
        return '已完成';
      case 'FAILED':
        return '失败';
      default:
        return '未知状态';
    }
  };

  const Pagination = ({ className = '' }) => {
    const renderPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`px-3 py-1 text-sm border rounded-md mx-1 ${
              i === currentPage
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {i + 1}
          </button>
        );
      }
      return pages;
    };

    if (totalPages <= 1) return null;

    return (
      <div className={`flex items-center justify-center space-x-2 ${className}`}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        
        {renderPageNumbers()}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
        
        <span className="text-sm text-gray-500 ml-4">
          共 {totalElements} 条，第 {currentPage + 1} 页，共 {totalPages} 页
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">文档分块解析</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 顶部分页器 */}
        <Pagination className="mb-4" />

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : chunks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              暂无分块数据
            </div>
          ) : (
            <div className="space-y-4">
              {chunks.map((chunk, index) => (
                <div key={chunk.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-700">
                        第 {chunk.chunkIndex + 1} 块
                      </div>
                      <div className={`text-sm px-2 py-0.5 rounded ${getStatusStyle(chunk.vectorStatus)}`}>
                        {getStatusText(chunk.vectorStatus)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Token数: {chunk.tokenCount || '未知'}
                    </div>
                  </div>
                  {chunk.vectorStatus === 'FAILED' && chunk.vectorError && (
                    <div className="text-red-600 text-sm mb-2 bg-red-50 p-2 rounded">
                      错误: {chunk.vectorError}
                    </div>
                  )}
                  <div className="text-gray-600 whitespace-pre-wrap bg-gray-50 rounded p-3">
                    {chunk.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部分页器 */}
        <Pagination className="mt-4" />
      </div>
    </div>
  );
};

export default ChunkViewModal;

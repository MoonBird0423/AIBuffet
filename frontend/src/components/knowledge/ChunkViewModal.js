import React, { useState, useEffect } from 'react';
import { getDocumentChunks } from '../../services/api';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ToastManager } from '../common/Toast';

const ChunkViewModal = ({ isOpen, onClose, fileId }) => {
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && fileId) {
      loadChunks();
    } else {
      setChunks([]);
    }
  }, [isOpen, fileId]);

  const loadChunks = async () => {
    try {
      const response = await getDocumentChunks(fileId);
      setChunks(response.data);
    } catch (error) {
      ToastManager.error('加载分块数据失败：' + (error.response?.data?.message || '系统错误'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">文档分块详情</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

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
                    <div className="font-medium text-gray-700">
                      第 {chunk.chunkIndex + 1} 块
                    </div>
                    <div className="text-sm text-gray-500">
                      Token数: {chunk.tokenCount || '未知'}
                    </div>
                  </div>
                  <div className="text-gray-600 whitespace-pre-wrap bg-gray-50 rounded p-3">
                    {chunk.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChunkViewModal;

import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { TrashIcon, DocumentIcon } from '@heroicons/react/24/outline';

const FileList = ({ files, onDelete, isLoading }) => {
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
      await axios.delete(`/api/documents/${id}`);
      onDelete(id);
      toast.success('文档已删除');
    } catch (error) {
      toast.error(error.response?.data?.message || '删除失败');
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

  return (
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
  );
};

export default FileList;

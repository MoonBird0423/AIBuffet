import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { uploadDocuments, getUploadProgress } from '../../services/api';

const ALLOWED_FILE_TYPES = {
  'Office 文档': ['.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt'],
  'PDF 文档': ['.pdf'],
  '纯文本': ['.txt', '.csv', '.json', '.xml', '.html'],
  '电子邮件': ['.eml', '.msg'],
  '电子书': ['.epub', '.mobi']
};

const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB

const FileUploadModal = ({ isOpen, onClose, knowledgeBaseId, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const uploadIdRef = useRef(null);
  const progressTimerRef = useRef(null);

  const onDrop = useCallback((acceptedFiles) => {
    const validFiles = acceptedFiles.filter(file => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      const isValidType = Object.values(ALLOWED_FILE_TYPES).flat().includes(extension);
      const isValidSize = file.size <= MAX_FILE_SIZE;

      if (!isValidType) {
        toast.error(`不支持的文件格式: ${file.name}`);
      }
      if (!isValidSize) {
        toast.error(`文件大小超出限制 (300MB): ${file.name}`);
      }

      return isValidType && isValidSize;
    });

    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const checkProgress = async (uploadId) => {
    try {
      const progress = await getUploadProgress(uploadId);
      setProgress(progress);

      if (progress < 100) {
        progressTimerRef.current = setTimeout(() => checkProgress(uploadId), 1000);
      } else {
        setIsUploading(false);
        setProgress(0);
        setFiles([]);
        onClose();
        onUploadComplete();
      }
    } catch (error) {
      console.error('获取上传进度失败:', error);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('请选择要上传的文件');
      return;
    }

    setIsUploading(true);
    try {
      const data = await uploadDocuments(files, knowledgeBaseId);
      uploadIdRef.current = data.uploadId;
      checkProgress(data.uploadId);
    } catch (error) {
      setIsUploading(false);
      toast.error(error.response?.data?.message || '上传失败');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">上传文档</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isUploading}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}
            `}
          >
            <input {...getInputProps()} />
            <ArrowUpTrayIcon className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2">将文件拖放到此处，或点击选择文件</p>
          </div>

          {files.length > 0 && (
            <div className="border rounded-lg p-4 space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 min-w-0">
                        {(() => {
                          const lastDotIndex = file.name.lastIndexOf('.');
                          const fileName = lastDotIndex !== -1 ? file.name.slice(0, lastDotIndex) : file.name;
                          const extension = lastDotIndex !== -1 ? file.name.slice(lastDotIndex) : '';
                          return (
                            <p className="text-sm font-medium overflow-hidden overflow-ellipsis whitespace-nowrap">
                              {fileName}
                              <span className="text-gray-500">{extension}</span>
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-500 hover:text-red-500"
                    disabled={isUploading}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 rounded">
                <div
                  className="h-full bg-blue-500 rounded transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 text-right">{progress}%</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-2">支持的文件格式：</h3>
            <div className="space-y-1">
              {Object.entries(ALLOWED_FILE_TYPES).map(([type, extensions]) => (
                <p key={type} className="text-sm text-gray-600">
                  <span className="font-medium">{type}：</span>
                  {extensions.join(', ')}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
            disabled={isUploading}
          >
            取消
          </button>
          <button
            onClick={handleUpload}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={isUploading || files.length === 0}
          >
            {isUploading ? '上传中...' : '开始上传'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;

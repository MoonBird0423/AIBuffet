import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ToastManager } from '../../components/common/Toast';
import { XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { uploadDocuments } from '../../services/api';

const ALLOWED_FILE_TYPES = {
  '文档': ['.txt', '.docx', '.pdf', '.md'],
  '表格': ['.xlsx', '.csv'],
  '电子书': ['.epub', '.mobi']
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_REQUEST_SIZE = 1024 * 1024 * 1024; // 1GB

const FileUploadModal = ({ isOpen, onClose, knowledgeBaseId, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileErrors, setFileErrors] = useState({});
  const [progress, setProgress] = useState({});
  const [totalSize, setTotalSize] = useState(0);

  const onDrop = useCallback((acceptedFiles) => {
    // 计算已选文件的总大小
    const currentTotalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    const validFiles = acceptedFiles.filter(file => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      const isValidType = Object.values(ALLOWED_FILE_TYPES).flat().includes(extension);
      const isValidSize = file.size <= MAX_FILE_SIZE;
      const newTotalSize = currentTotalSize + file.size;
      const isValidTotalSize = newTotalSize <= MAX_REQUEST_SIZE;

      if (!isValidType) {
        ToastManager.error(`不支持的文件格式: ${file.name}`);
      }
      if (!isValidSize) {
        ToastManager.error(`文件大小超出限制 (50MB): ${file.name} (${formatFileSize(file.size)})`);
      }
      if (!isValidTotalSize) {
        ToastManager.error(`添加此文件后总大小将超出限制 (1GB)`);
      }

      return isValidType && isValidSize && isValidTotalSize;
    });

    // 清除已存在的相同文件
    const existingFileNames = new Set(files.map(f => f.name));
    const newValidFiles = validFiles.filter(file => !existingFileNames.has(file.name));

    if (newValidFiles.length > 0) {
      const newTotalSize = currentTotalSize + newValidFiles.reduce((sum, file) => sum + file.size, 0);
      setTotalSize(newTotalSize);
      setFiles(prev => [...prev, ...newValidFiles]);
      // 清除新文件的错误状态
      setFileErrors(prev => {
        const newErrors = { ...prev };
        newValidFiles.forEach(file => delete newErrors[file.name]);
        return newErrors;
      });
    }
  }, [files]);

  const removeFile = (index) => {
    const file = files[index];
    setTotalSize(prev => prev - file.size);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[file.name];
      return newErrors;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const sanitizeFileName = (fileName) => {
    // 保持原始文件名不变，让后端处理文件名规范化
    return fileName;
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      ToastManager.error('请选择要上传的文件');
      return;
    }

    setIsUploading(true);
    setFileErrors({});

    try {
      // 初始化进度状态
      const initialProgress = {};
      files.forEach(file => {
        initialProgress[file.name] = 0;
      });
      setProgress(initialProgress);

      // 上传文件并处理结果
      console.log('开始上传文件:', files.map(f => f.name));
      const { results, errors } = await uploadDocuments(files, knowledgeBaseId, setProgress);
      console.log('上传服务器返回结果:', { results, errors });

      // 处理错误
      if (errors && errors.length > 0) {
        console.log('处理上传错误:', errors);
        const newErrors = {};
        errors.forEach(({fileName, error}) => {
          newErrors[fileName] = error;
          ToastManager.error(`文件 ${fileName} 上传失败: ${error}`);
        });
        setFileErrors(newErrors);
      }

      // 处理成功上传的文件
      if (results && results.length > 0) {
        console.log('处理成功上传的文件:', results);
        
        // 将文件名转换为小写进行比较
        const successFileNames = new Map(
          results.map(r => [r.fileName.toLowerCase(), r.fileName])
        );
        console.log('成功上传的文件名映射:', [...successFileNames.entries()]);
        
        // 移除成功上传的文件
        setFiles(prev => {
          const remainingFiles = prev.filter(f => !successFileNames.has(f.name.toLowerCase()));
          console.log('剩余文件:', remainingFiles.map(f => f.name));
          return remainingFiles;
        });

        // 刷新文件列表并关闭弹窗
        onUploadComplete();
        onClose();
      } else {
        console.log('没有文件上传成功');
      }

    } catch (error) {
      ToastManager.error('上传过程发生错误，请重试');
    }

    setIsUploading(false);
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
                    {isUploading && (
                      <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-in-out"
                            style={{ 
                              width: `${progress[file.name] || 0}%`,
                              transition: 'width 0.3s ease-in-out'
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 text-right mt-1">
                          {Math.round(progress[file.name] || 0)}%
                        </p>
                      </div>
                    )}
                    {fileErrors[file.name] && (
                      <p className="text-xs text-red-500 mt-1">
                        错误: {fileErrors[file.name]}
                      </p>
                    )}
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

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-2">上传说明：</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                1、文件大小：单个文件≤{formatFileSize(MAX_FILE_SIZE)}，单次上传≤{formatFileSize(MAX_REQUEST_SIZE)}
              </p>
              <p className="text-sm text-gray-600">
                2、文件格式：
                {Object.values(ALLOWED_FILE_TYPES)
                  .flat()
                  .map(ext => `-${ext}`)
                  .join('')}
              </p>
              <p className="text-sm text-gray-600">
                当前已选择：{formatFileSize(totalSize)}
              </p>
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

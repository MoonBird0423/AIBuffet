import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ToastManager } from '../../components/common/Toast';
import { XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { uploadDocuments } from '../../services/api';

const ALLOWED_FILE_TYPES = {
  'Office 文档': ['.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt'],
  'PDF 文档': ['.pdf'],
  '纯文本': ['.txt', '.csv', '.json', '.xml', '.html'],
  '电子邮件': ['.eml', '.msg'],
  '电子书': ['.epub', '.mobi']
};

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

const FileUploadModal = ({ isOpen, onClose, knowledgeBaseId, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileProgress, setFileProgress] = useState({});
  const [fileErrors, setFileErrors] = useState({});

  const onDrop = useCallback((acceptedFiles) => {
    const validFiles = acceptedFiles.filter(file => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      const isValidType = Object.values(ALLOWED_FILE_TYPES).flat().includes(extension);
      const isValidSize = file.size <= MAX_FILE_SIZE;

      if (!isValidType) {
        ToastManager.error(`不支持的文件格式: ${file.name}`);
      }
      if (!isValidSize) {
        ToastManager.error(`文件大小超出限制 (1GB): ${file.name} (${formatFileSize(file.size)})`);
      }

      return isValidType && isValidSize;
    });

    // 清除已存在的相同文件
    const existingFileNames = new Set(files.map(f => f.name));
    const newValidFiles = validFiles.filter(file => !existingFileNames.has(file.name));

    if (newValidFiles.length > 0) {
      setFiles(prev => [...prev, ...newValidFiles]);
      // 清除新文件的错误状态
      setFileErrors(prev => {
        const newErrors = { ...prev };
        newValidFiles.forEach(file => delete newErrors[file.name]);
        return newErrors;
      });
    }
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  const removeFile = (index) => {
    const file = files[index];
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[file.name];
      return newErrors;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const sanitizeFileName = (fileName) => {
    const lastDotIndex = fileName.lastIndexOf('.');
    const name = lastDotIndex !== -1 ? fileName.slice(0, lastDotIndex) : fileName;
    const extension = lastDotIndex !== -1 ? fileName.slice(lastDotIndex) : '';
    
    const sanitized = name.replace(/[^\w--]/g, '_');
    return sanitized + extension;
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      ToastManager.error('请选择要上传的文件');
      return;
    }

    setIsUploading(true);
    setFileErrors({});

    try {
      // 初始化进度
      const initialProgress = {};
      const fileNameMap = {};
      const processedFiles = [];

      // 处理每个文件并建立映射关系
      files.forEach(file => {
        const sanitizedName = sanitizeFileName(file.name);
        const processedFile = new File([file], sanitizedName, { type: file.type });
        processedFiles.push(processedFile);
        fileNameMap[sanitizedName] = file.name;
        initialProgress[file.name] = 0;
      });
      setFileProgress(initialProgress);

      // 上传文件并处理结果
      const { results, errors } = await uploadDocuments(
        processedFiles,
        knowledgeBaseId,
        (processedName, progress) => {
          // 使用映射找到原始文件名
          const originalName = fileNameMap[processedName];
          if (originalName) {
            setFileProgress(prev => ({
              ...prev,
              [originalName]: progress
            }));
          }
        }
      );

      // 处理错误
      if (errors.length > 0) {
        const newErrors = {};
        errors.forEach(({fileName, error}) => {  // 修改这里，解构error属性
          const originalName = fileNameMap[fileName] || fileName;
          newErrors[originalName] = error;  // 使用error而不是errors.error
          ToastManager.error(`文件 ${originalName} 上传失败: ${error}`);  // 同样使用error
        });
        setFileErrors(newErrors);
      }

      // 处理成功结果
      if (results.length > 0) {
        const successFileNames = new Set(
          results.map(r => fileNameMap[r.fileName] || r.fileName)
        );
        setFiles(prev => prev.filter(f => !successFileNames.has(f.name)));
        
        if (results.length === files.length) {
          ToastManager.success('所有文件上传成功');
          onClose();
          onUploadComplete();
        } else {
          ToastManager.success(`成功上传 ${results.length} 个文件，${errors.length} 个文件失败`);
        }
      }

    } catch (error) {
      console.error('上传过程发生错误:', error);
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
                        <div className="h-1 bg-gray-200 rounded">
                          <div
                            className="h-full bg-blue-500 rounded transition-all"
                            style={{ width: `${fileProgress[file.name] || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 text-right mt-1">
                          {fileProgress[file.name] || 0}%
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
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">文件大小限制：</p>
                <p className="text-sm text-gray-600">单个文件大小不超过 {formatFileSize(MAX_FILE_SIZE)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">支持的文件格式：</p>
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

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getFileIcon, formatFileSize } from '../../utils/fileUtils';
import { useFileUploadProgress } from '../../hooks/useFileUploadProgress';

const FilePreviewCard = ({ 
  file, 
  onRemove, 
  uploadStatus = 'idle', // 'idle' | 'uploading' | 'success' | 'error'
  uploadUrl,
  className
}) => {
  const truncateFilename = (name) => {
    const maxLength = 20;
    if (name.length <= maxLength) return name;
    
    const extension = name.split('.').pop();
    const nameWithoutExt = name.slice(0, name.lastIndexOf('.'));
    const truncated = nameWithoutExt.slice(0, maxLength - extension.length - 3) + '...';
    return `${truncated}.${extension}`;
  };

  // 判断是否为图片文件
  const isImage = file.type.startsWith('image/');
  
  const [previewUrl, setPreviewUrl] = useState('');
  const [progress, completeProgress] = useFileUploadProgress(uploadStatus === 'uploading');
  
  // 当上传状态变为success时，设置进度为100%
  useEffect(() => {
    if (uploadStatus === 'success') {
      completeProgress();
    }
  }, [uploadStatus, completeProgress]);

  useEffect(() => {
    if (isImage) {
      const url = uploadUrl || URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => {
        if (!uploadUrl) {
          URL.revokeObjectURL(url);
        }
      };
    }
  }, [file, isImage]);

  return (
    <div className={`relative p-3 border rounded-lg bg-white shadow-sm ${className || ''}`}>
      {/* 删除按钮只在上传前或出错时显示 */}
      {(uploadStatus === 'idle' || uploadStatus === 'error') && (
        <button
          onClick={() => onRemove(file)}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
          title="移除文件"
        >
          <i className="fas fa-times" />
        </button>
      )}
      
      <div className="flex items-center space-x-3">
        <div className="relative w-10 h-10">
          {isImage && previewUrl ? (
            <img
              src={previewUrl}
              alt={file.name}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <i className={`fas fa-${getFileIcon(file.type)} text-gray-400 text-xl`} />
          )}
          
          {/* 上传状态指示器 */}
          {uploadStatus === 'uploading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
              <div className="text-white text-xs">{Math.round(progress)}%</div>
            </div>
          )}
          {uploadStatus === 'success' && (
            <div className="absolute -top-1 -right-1 text-green-500">
              <i className="fas fa-check-circle" />
            </div>
          )}
          {uploadStatus === 'error' && (
            <div className="absolute -top-1 -right-1 text-red-500">
              <i className="fas fa-exclamation-circle" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate" title={file.name}>
            {truncateFilename(file.name)}
          </div>
          <div className="text-xs text-gray-500">
            {formatFileSize(file.size)}
          </div>
          {uploadStatus === 'error' && (
            <div className="text-xs text-red-500">上传失败</div>
          )}
        </div>
      </div>

      {/* 进度条 */}
      {uploadStatus === 'uploading' && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

FilePreviewCard.propTypes = {
  file: PropTypes.shape({
    name: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired
  }).isRequired,
  onRemove: PropTypes.func.isRequired,
  uploadStatus: PropTypes.oneOf(['idle', 'uploading', 'success', 'error']),
  uploadUrl: PropTypes.string,
  className: PropTypes.string
};

export default FilePreviewCard;

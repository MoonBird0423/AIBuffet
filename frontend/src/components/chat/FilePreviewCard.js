import React from 'react';
import PropTypes from 'prop-types';
import { getFileIcon, formatFileSize } from '../../utils/fileUtils';

const FilePreviewCard = ({ file, onRemove }) => {
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
  
  // 为图片文件创建预览URL
  const [previewUrl, setPreviewUrl] = React.useState('');
  
  React.useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  return (
    <div className="relative p-3 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => onRemove(file)}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
        title="移除文件"
      >
        <i className="fas fa-times" />
      </button>
      
      <div className="flex items-center space-x-3">
        {isImage && previewUrl ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="w-10 h-10 object-cover rounded"
          />
        ) : (
          <i className={`fas fa-${getFileIcon(file.type)} text-gray-400 text-xl`} />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate" title={file.name}>
            {truncateFilename(file.name)}
          </div>
          <div className="text-xs text-gray-500">
            {formatFileSize(file.size)}
          </div>
        </div>
      </div>
    </div>
  );
};

FilePreviewCard.propTypes = {
  file: PropTypes.shape({
    name: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired
  }).isRequired,
  onRemove: PropTypes.func.isRequired
};

export default FilePreviewCard;
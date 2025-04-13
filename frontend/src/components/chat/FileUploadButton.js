import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import Tooltip from '../common/Tooltip';
import { getIconByType, getAcceptByType, getTooltipByType, FILE_TYPES, formatFileSize } from '../../utils/fileUtils';
import { ToastManager } from '../common/Toast';

const FileUploadButton = ({ type, onChange, disabled = false }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    
    // 验证文件类型和大小
    for (const file of files) {
      if (!FILE_TYPES[type].mimeTypes.includes(file.type)) {
        ToastManager.error(`不支持的文件格式，仅支持${FILE_TYPES[type].name}格式`);
        event.target.value = '';  // 清空选择
        return;
      }
      
      if (file.size > FILE_TYPES[type].maxSize) {
        ToastManager.error(`文件 ${file.name} 超出大小限制：${formatFileSize(file.size)} > ${formatFileSize(FILE_TYPES[type].maxSize)}`);
        event.target.value = '';  // 清空选择
        return;
      }
    }
    
    onChange(event);
  };

  return (
    <Tooltip content={getTooltipByType(type)} position="top">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`p-2 rounded-full transition-colors duration-200 ${
          disabled
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-500 hover:text-blue-500 hover:bg-gray-100'
        }`}
        title={`上传${type === 'FILE' ? '文件' : type.toLowerCase()}`}
      >
        <i className={`fas fa-${getIconByType(type)}`} />
        <input
          type="file"
          hidden
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={getAcceptByType(type)}
          multiple
          disabled={disabled}
        />
      </button>
    </Tooltip>
  );
};

FileUploadButton.propTypes = {
  type: PropTypes.oneOf(['IMAGE', 'VIDEO', 'AUDIO', 'FILE']).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default FileUploadButton;

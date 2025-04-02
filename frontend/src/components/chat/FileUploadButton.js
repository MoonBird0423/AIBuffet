import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import Tooltip from '../common/Tooltip';
import { getIconByType, getAcceptByType, getTooltipByType } from '../../utils/fileUtils';

const FileUploadButton = ({ type, onChange, disabled = false }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
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
          onChange={onChange}
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
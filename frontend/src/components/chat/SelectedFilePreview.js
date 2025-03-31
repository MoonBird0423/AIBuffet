import React from 'react';
import PropTypes from 'prop-types';
import { formatFileSize } from '../../utils/fileUtils';

const SelectedFilePreview = ({ files, onRemove }) => {
  if (!files.length) return null;

  return (
    <div className="mt-2 space-y-2">
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-2 overflow-hidden">
            <i className={`fas fa-${getFileIcon(file.type)} text-gray-500`} />
            <div className="truncate">
              <div className="text-sm font-medium truncate">{file.name}</div>
              <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
            title="移除文件"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      ))}
    </div>
  );
};

const getFileIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'microphone';
  return 'file';
};

SelectedFilePreview.propTypes = {
  files: PropTypes.arrayOf(PropTypes.instanceOf(File)).isRequired,
  onRemove: PropTypes.func.isRequired
};

export default SelectedFilePreview;
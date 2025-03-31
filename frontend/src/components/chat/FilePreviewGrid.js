import React from 'react';
import PropTypes from 'prop-types';
import FilePreviewCard from './FilePreviewCard';

const FilePreviewGrid = ({ files, onRemove }) => {
  if (!files || files.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {files.map((file, index) => (
          <FilePreviewCard
            key={`${file.name}-${index}`}
            file={file}
            onRemove={(file) => onRemove(index)}
          />
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        已选择 {files.length} 个文件
      </div>
    </div>
  );
};

FilePreviewGrid.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      size: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired
    })
  ).isRequired,
  onRemove: PropTypes.func.isRequired
};

export default FilePreviewGrid;
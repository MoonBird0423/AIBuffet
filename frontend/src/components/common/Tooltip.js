import React from 'react';
import PropTypes from 'prop-types';

const Tooltip = ({ content, children, position = 'top' }) => {
  const positionClasses = {
    top: '-top-full bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2',
    bottom: 'top-full top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2',
    left: 'right-full right-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2',
    right: 'left-full left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2'
  };

  return (
    <div className="relative group inline-block">
      {children}
      <div
        className={`
          absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap
          opacity-0 pointer-events-none transition-opacity duration-200
          group-hover:opacity-100 ${positionClasses[position]}
        `}
        role="tooltip"
      >
        {content}
        <div
          className={`
            absolute w-2 h-2 bg-gray-800 transform rotate-45
            ${position === 'top' ? 'bottom-[-0.25rem] left-1/2 -translate-x-1/2' :
              position === 'bottom' ? 'top-[-0.25rem] left-1/2 -translate-x-1/2' :
              position === 'left' ? 'right-[-0.25rem] top-1/2 -translate-y-1/2' :
              'left-[-0.25rem] top-1/2 -translate-y-1/2'}
          `}
        />
      </div>
    </div>
  );
};

Tooltip.propTypes = {
  content: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right'])
};

export default Tooltip;
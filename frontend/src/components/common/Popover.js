import React, { useState, useRef, useEffect } from 'react';

function Popover({ trigger, content, position = 'bottom' }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target) &&
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-2';
      case 'bottom':
        return 'top-full mt-2';
      case 'left':
        return 'right-full mr-2';
      case 'right':
        return 'left-full ml-2';
      default:
        return 'top-full mt-2';
    }
  };

  return (
    <div className="relative">
      <div 
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute z-[60] min-w-[120px] ${getPositionClasses()}`}
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-1">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

export default Popover;

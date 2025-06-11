import React, { useState, useRef, useEffect } from 'react';

function Popover({ trigger, content, position = 'bottom', isOpen: controlledIsOpen, onOpenChange }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  // 使用受控状态或内部状态
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = controlledIsOpen !== undefined ? onOpenChange : setInternalIsOpen;

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target) &&
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        if (setIsOpen) {
          setIsOpen(false);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setIsOpen]);

  // 处理气泡内容区域的点击事件
  const handleContentClick = (event) => {
    // 检查是否点击的是按钮或具有点击功能的元素
    const clickedElement = event.target.closest('button, a, [role="button"], [onclick]');
    if (clickedElement && setIsOpen) {
      // 点击任何选项时关闭气泡菜单
      setIsOpen(false);
    }
  };

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
    <div className="relative">      <div 
        ref={triggerRef}
        onClick={() => setIsOpen && setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute z-[60] min-w-[120px] ${getPositionClasses()}`}
          onClick={handleContentClick}
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

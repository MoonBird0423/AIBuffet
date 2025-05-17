import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * 自定义下拉选择器组件
 * @param {Object} props
 * @param {Array<{value: string, label: string}>} props.options - 选项列表
 * @param {string} props.value - 当前选中的值
 * @param {Function} props.onChange - 值改变时的回调函数
 * @param {string} props.placeholder - 占位文本
 * @param {string} props.className - 自定义类名
 * @param {string} props.error - 错误信息
 */
function Select({ 
  options,
  value,
  onChange,
  placeholder = "请选择",
  className = "",
  error
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  const selectedOption = options.find(opt => opt.value === value);

  const updateDropdownPosition = useCallback(() => {
    if (!isOpen || !triggerRef.current || !dropdownRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // 检查是否有足够的空间在下方显示
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const dropdownHeight = dropdownRect.height;

    const style = {
      position: 'fixed',
      width: triggerRect.width + 'px',
      left: triggerRect.left + 'px'
    };

    if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
      // 在下方显示
      style.top = triggerRect.bottom + 4 + 'px';
    } else {
      // 在上方显示
      style.bottom = (viewportHeight - triggerRect.top + 4) + 'px';
    }

    setDropdownStyle(style);
  }, [isOpen]);

  // 监听滚动和调整大小事件
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      updateDropdownPosition();
    };

    const handleResize = () => {
      updateDropdownPosition();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    // 初始化位置
    updateDropdownPosition();

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updateDropdownPosition]);

  // 点击外部时关闭下拉列表
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (!triggerRef.current?.contains(event.target) && 
          !dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={triggerRef}>
      <div 
        className={`
          mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
          bg-white cursor-pointer select-none
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className={`block truncate ${!selectedOption ? 'text-gray-500' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="pointer-events-none">
            <svg 
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </span>
        </div>
      </div>
      {isOpen && createPortal((
        <div 
          ref={dropdownRef}
          style={dropdownStyle}
          className="z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto scrollbar"
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              className={`
                px-4 py-2 text-sm cursor-pointer select-none
                ${option.value === value ? 'text-indigo-600' : 'text-gray-900'}
                hover:bg-indigo-400 hover:text-white
                ${index !== options.length - 1 ? 'border-b border-gray-100' : ''}
              `}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      ), document.body)}
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export default Select;

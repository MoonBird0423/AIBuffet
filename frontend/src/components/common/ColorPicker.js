import React, { useState, useRef, useEffect } from 'react';
import { ToastManager } from './Toast';
import { FaCheck } from 'react-icons/fa';

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#6b7280', '#374151', '#64748b'
];

const ColorPicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState('');
  const popoverRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
        setCustomColor('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 验证HEX颜色值
  const isValidHexColor = (color) => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  };

  // 处理自定义颜色确认
  const handleCustomColorSubmit = () => {
    if (!customColor) {
      return;
    }
    
    let color = customColor;
    if (!color.startsWith('#')) {
      color = '#' + color;
    }
    
    if (!isValidHexColor(color)) {
      ToastManager.error('请输入有效的十六进制颜色值 (例如: #FF0000)');
      return;
    }
    
    onChange(color);
    setIsOpen(false);
    setCustomColor('');
  };

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCustomColorSubmit();
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* 颜色显示块 */}
      <div
        className="h-6 w-8 rounded-md cursor-pointer border border-gray-300 transition-all hover:ring-2 hover:ring-offset-2 hover:ring-gray-400"
        style={{ backgroundColor: value || '#ffffff' }}
        onClick={() => setIsOpen(!isOpen)}
      />
      
      {/* 颜色选择弹窗 */}
      {isOpen && (
        <div className="absolute left-0 z-50 mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 w-72">
          {/* 预设颜色网格 */}
          <div className="grid grid-cols-10 gap-2 mb-4">
            {COLOR_OPTIONS.map(color => (
              <div
                key={color}
                className="relative h-6 w-6 rounded-md cursor-pointer hover:ring-2 ring-offset-2 ring-gray-400 transition-all"
                style={{ backgroundColor: color }}
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
              >
                {color === value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FaCheck className="text-white text-xs" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 自定义颜色输入 */}
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="#000000"
              className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleCustomColorSubmit}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;

import React, { useEffect } from 'react';

function Modal({ isOpen, onClose, title, children, footer, width = 'lg' }) {
  const widthClasses = {
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };
  useEffect(() => {
    if (isOpen) {
      // 打开模态框时禁止body滚动
      document.body.style.overflow = 'hidden';
    } else {
      // 关闭模态框时恢复body滚动
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      
      {/* 模态框容器 */}
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div className={`relative w-full ${widthClasses[width]} transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all`}>
          {/* 头部 */}
          <div className="bg-white px-4 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">关闭</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 内容 */}
          <div className="bg-white px-4 py-5">
            {children}
          </div>

          {/* 底部 */}
          {footer && (
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modal;

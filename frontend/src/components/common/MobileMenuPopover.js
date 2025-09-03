import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserProfile from './UserProfile';

const MobileMenuPopover = ({ isOpen, onClose, triggerRef, children }) => {
  const location = useLocation();
  const popoverRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // 计算弹窗位置
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const navbarHeight = 64; // 导航栏高度 (h-16 = 64px)
      
      setPosition({
        top: navbarHeight + 8, // 导航栏底部 + 8px 间距
        left: window.innerWidth / 2, // 屏幕中心
      });
    }
  }, [isOpen, triggerRef]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target) && 
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  // ESC 键关闭
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultMenuItems = [
    { to: '/', label: '首页', icon: 'fas fa-home' },
    { to: '/library', label: '图书馆', icon: 'fas fa-book' },
    { to: '/pricing', label: '定价', icon: 'fas fa-tag' },
    { to: '/my-knowledge', label: '我的知识库', icon: 'fas fa-brain' },
  ];

  return (
    <>
      {/* 遮罩层 */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
      
      {/* 弹窗容器 */}
      <div
        ref={popoverRef}
        className="fixed z-50 transform -translate-x-1/2 transition-all duration-300 ease-out"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        {/* 三角指示器 */}
        <div className="relative">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-4 h-4 bg-white/95 backdrop-blur-xl border-l border-t border-white/20 transform rotate-45"></div>
          </div>
          
          {/* 弹窗主体 */}
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden min-w-[280px] max-w-[320px]">
            {children || (
              <>
                {/* 导航菜单项 */}
                <div className="px-4 py-3">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-2">
                    导航菜单
                  </div>
                  <div className="space-y-1">
                    {defaultMenuItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={`flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          location.pathname === item.to
                            ? 'bg-purple-100 text-purple-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <i className={`${item.icon} w-5 text-center`}></i>
                        <span>{item.label}</span>
                        {location.pathname === item.to && (
                          <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full"></div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* 分割线 */}
                <div className="border-t border-gray-200/50"></div>

                {/* 用户资料区域 */}
                <div className="px-4 py-3">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-2">
                    账户管理
                  </div>
                  <div className="flex items-center justify-center">
                    <UserProfile 
                      className="w-full text-gray-700 hover:bg-gray-100 rounded-xl transition-colors" 
                      onMenuClick={onClose}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenuPopover;

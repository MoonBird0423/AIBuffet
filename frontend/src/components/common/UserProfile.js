import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LogoutConfirmModal from '../auth/LogoutConfirmModal';

function UserProfile({ className = '', onMenuClick }) {
  const { user, loading, logout, showLoginModal, showAccountModal } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 检测是否在导航栏中使用（根据className判断）
  const isInNavbar = className.includes('text-white');

  const handleClick = () => {
    // 如果有回调函数，先调用它（用于关闭移动端菜单）
    if (onMenuClick) {
      onMenuClick();
    }
    
    if (!user) {
      // 改为打开登录弹窗而不是跳转页面
      showLoginModal();
    } else {
      showAccountModal();
    }
  };

  const handleClose = () => {
    setShowLogoutConfirm(false);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await logout();
      handleClose();
    } catch (err) {
      // 错误已在AuthContext中处理
    }
  };

  const handleImageError = (e) => {
    const src = e.target.src;
    if (!src.includes("/head.png") && !src.includes("?t=")) {
      e.target.src = src + '?t=' + new Date().getTime();
    } else {
      e.target.src = "/head.png";
    }
  };

  return (
    <>
      {/* 用户头像和用户名显示 */}
      <div
        className={`flex items-center space-x-3 cursor-pointer rounded-lg p-2 transition-colors ${
          isInNavbar 
            ? 'text-white hover:bg-white/10' 
            : 'text-gray-700 hover:bg-gray-100'
        } ${className}`}
        onClick={handleClick}
      >
        <img
          src={user?.avatar || "/head.png"}
          onError={handleImageError}
          alt={user ? "用户头像" : "默认头像"}
          className="w-8 h-8 rounded-full bg-gray-50"
        />
        <span className={`font-medium ${isInNavbar ? 'text-white' : 'text-gray-700'}`}>
          {user ? user.username : "点击登录"}
        </span>
      </div>

      {/* 退出确认弹窗 */}
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        loading={loading}
      />
    </>
  );
}

export default UserProfile;

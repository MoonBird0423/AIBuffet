import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function UserProfile({ className = '' }) {
  const { user, updateAvatar } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      setIsModalOpen(true);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // 验证文件类型
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('请上传JPG或PNG格式的图片');
      return;
    }

    // 验证文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过2MB');
      return;
    }

    // 创建本地预览URL
    const imageUrl = URL.createObjectURL(file);
    updateAvatar(imageUrl);
  };

  return (
    <>
      <div
        className={`flex items-center space-x-3 cursor-pointer ${className}`}
        onClick={handleClick}
      >
        <img
          src={user?.avatar || "/head.png"}
          alt={user ? "用户头像" : "默认头像"}
          className="w-8 h-8 rounded-full"
        />
        <span className="text-gray-700 font-medium">
          {user ? user.username : "点击登录"}
        </span>
      </div>

      {/* 账户信息弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 relative">
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-semibold mb-6">账户信息</h2>

            {/* 头像上传区域 */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <img
                  src={user?.avatar || "/head.png"}
                  alt="用户头像"
                  className="w-24 h-24 rounded-full mb-2"
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm">点击更换头像</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* 用户信息展示 */}
            <div className="space-y-4">
              <div className="flex border-b py-2">
                <span className="text-gray-500 w-24">账号：</span>
                <span>{user?.account || '-'}</span>
              </div>
              <div className="flex border-b py-2">
                <span className="text-gray-500 w-24">用户名：</span>
                <span>{user?.username || '-'}</span>
              </div>
              <div className="flex border-b py-2">
                <span className="text-gray-500 w-24">手机号：</span>
                <span>{user?.phone || '-'}</span>
              </div>
              <div className="flex border-b py-2">
                <span className="text-gray-500 w-24">微信号：</span>
                <span>{user?.wechat || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UserProfile;
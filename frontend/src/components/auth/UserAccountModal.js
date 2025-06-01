import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';

function UserAccountModal({ isOpen, onClose, onLogout }) {
  const { user, loading, error, updateAvatar, updateUsername } = useAuth();
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  // 格式化手机号，隐藏中间4位
  const formatPhoneNumber = (phone) => {
    if (!phone) return '-';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  // 处理图片加载错误，添加重试机制
  const handleImageError = (e) => {
    const src = e.target.src;
    if (!src.includes("/head.png") && !src.includes("?t=")) {
      // 如果不是默认头像且没有时间戳参数，添加时间戳刷新缓存
      e.target.src = src + '?t=' + new Date().getTime();
    } else {
      // 如果已经尝试过刷新或是默认头像，则使用默认头像
      e.target.src = "/head.png";
    }
  };

  const handleStartEditUsername = () => {
    setNewUsername(user?.username || '');
    setEditingUsername(true);
  };

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) return;

    try {
      await updateUsername(newUsername.trim());
      setEditingUsername(false);
    } catch (err) {
      console.error('Error saving username:', err);
    }
  };

  const handleFileUpload = async (event) => {
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

    try {
      await updateAvatar(file);
    } catch (err) {
      // 错误已在AuthContext中处理
    }
  };
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative z-50 mt-24 bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-semibold mb-6">账户信息</h2>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-600 rounded">
            {error}
          </div>
        )}

        {/* 头像上传区域 */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <img
              src={user?.avatar || "/head.png"}
              onError={handleImageError}
              alt="用户头像"
              className="w-24 h-24 rounded-full mb-2 bg-gray-100"
            />
            <label className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer ${loading ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 transition-opacity`}>
              <span className="text-white text-sm">
                {loading ? '上传中...' : '点击更换头像'}
              </span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>
        </div>

        {/* 用户信息展示 */}
        <div className="space-y-4">
          <div className="flex items-center border-b py-2">
            <span className="text-gray-500 w-24">用户名：</span>
            <div className="flex items-center gap-2">
              {editingUsername ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="border-none focus:outline-none bg-transparent"
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveUsername}
                    disabled={loading}
                    className="text-blue-500 hover:text-blue-600 text-sm disabled:opacity-50"
                  >
                    {loading ? '保存中...' : '保存'}
                  </button>
                </div>
              ) : (
                <>
                  <span>{user?.username || '-'}</span>
                  <button
                    onClick={handleStartEditUsername}
                    disabled={loading}
                    className="text-blue-500 hover:text-blue-600 text-sm disabled:opacity-50"
                  >
                    编辑
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex border-b py-2">
            <span className="text-gray-500 w-24">手机号：</span>
            <span>{formatPhoneNumber(user?.phone)}</span>
          </div>
          <div className="flex border-b py-2">
            <span className="text-gray-500 w-24">微信号：</span>
            <span>{user?.wechat || '未绑定'}</span>
          </div>
        </div>

        {/* 退出按钮 */}
        <div className="mt-6">
          <button
            onClick={onLogout}
            disabled={loading}
            className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            退出登录
          </button>        </div>
      </div>
    </div>,
    document.body
  );
}

export default UserAccountModal;

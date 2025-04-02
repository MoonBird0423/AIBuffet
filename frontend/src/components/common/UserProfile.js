import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function UserProfile({ className = '' }) {
  // 格式化手机号，隐藏中间4位
  const formatPhoneNumber = (phone) => {
    if (!phone) return '-';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  // 处理图片加载错误
  const handleImageError = (e) => {
    e.target.src = "/head.png";
  };

  const { user, loading, error, updateAvatar, updateUsername, logout, clearError } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      setIsModalOpen(true);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingUsername(false);
    setShowLogoutConfirm(false);
    clearError();  // 关闭弹窗时清除错误
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
      // 错误已在AuthContext中处理
    }
  };

  // 添加 useEffect 来监控 user 对象的变化
  useEffect(() => {
  }, [user]);

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

  return (
    <>
      <div
        className={`flex items-center space-x-3 cursor-pointer hover:bg-gray-100 rounded-lg p-2 ${className}`}
        onClick={handleClick}
      >
        <img
          src={user?.avatar || "/head.png"}
          onError={handleImageError}
          alt={user ? "用户头像" : "默认头像"}
          className="w-8 h-8 rounded-full bg-gray-50"
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
                      <span>{user?.username || '-'} {/* username: ${JSON.stringify(user)} */}</span>
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
                onClick={handleLogout}
                disabled={loading}
                className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 退出确认弹窗 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">确认退出</h3>
            <p className="text-gray-600 mb-6">确定要退出登录吗？</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirmLogout}
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? '退出中...' : '确认退出'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UserProfile;
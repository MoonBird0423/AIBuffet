import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserOrders } from '../../services/api';

function formatPhoneNumber(phone) {
  if (!phone) return '-';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

function formatDateTime(dt) {
  if (!dt) return '-';
  // 兼容字符串和Date对象
  const date = typeof dt === 'string' ? new Date(dt) : dt;
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', { hour12: false });
}

function formatAmount(amount) {
  if (amount == null) return '-';
  return (amount / 100).toFixed(2) + ' 元';
}

function UserAccountModal({ isOpen, onClose, onLogout }) {
  const { user, loading, error, updateAvatar, updateUsername } = useAuth();
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [orderPage, setOrderPage] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderTotalPages, setOrderTotalPages] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (activeTab === 'orders' && user?.id) {
      setOrdersLoading(true);
      setOrdersError('');
      getUserOrders(user.id, orderPage, pageSize)
        .then(res => {
          setOrders(res.content || []);
          setOrderTotal(res.totalElements || 0);
          setOrderTotalPages(res.totalPages || 0);
        })
        .catch(e => setOrdersError('订单获取失败'))
        .finally(() => setOrdersLoading(false));
    }
  }, [activeTab, user?.id, orderPage]);

  const handleImageError = (e) => {
    const src = e.target.src;
    if (!src.includes("/head.png") && !src.includes("?t=")) {
      e.target.src = src + '?t=' + new Date().getTime();
    } else {
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
    } catch (err) {}
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('请上传JPG或PNG格式的图片');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过2MB');
      return;
    }
    try {
      await updateAvatar(file);
    } catch (err) {}
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative z-50 mt-24 bg-white rounded-lg p-6 w-[700px] max-h-[90vh] overflow-y-auto shadow-xl">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 顶部选项卡 */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-2xl p-2 flex space-x-2">
            <button
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              账户信息
            </button>
            <button
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('orders')}
            >
              订单信息
            </button>
          </div>
        </div>

        {/* 账户信息页 */}
        {activeTab === 'profile' && (
          <>
            {error && (
              <div className="mb-4 p-2 bg-red-50 text-red-600 rounded">
                {error}
              </div>
            )}
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
              <div className="flex border-b py-2">
                <span className="text-gray-500 w-24">会员类型：</span>
                <span>{user?.name || '-'}</span>
              </div>
              <div className="flex border-b py-2">
                <span className="text-gray-500 w-24">过期时间：</span>
                <span>{formatDateTime(user?.expireTime)}</span>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={onLogout}
                disabled={loading}
                className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                退出登录
              </button>
            </div>
          </>
        )}

        {/* 订单信息页 */}
        {activeTab === 'orders' && (
          <div className="p-2">
            {ordersLoading ? (
              <div className="text-center py-8 text-gray-500">订单加载中...</div>
            ) : ordersError ? (
              <div className="text-center py-8 text-red-600">{ordersError}</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无订单</div>
            ) : (
              <>
                <div className="space-y-4">
                  {orders.map(order => (
                    <div
                      key={order.id}
                      className="bg-gray-50 rounded-2xl p-6 shadow flex flex-col space-y-2"
                    >
                      <div className="flex">
                        <span className="w-24 text-gray-500">订单号：</span>
                        <span className="break-all">{order.outTradeNo}</span>
                      </div>
                      <div className="flex">
                        <span className="w-24 text-gray-500">订单描述：</span>
                        <span className="break-all">{order.description}</span>
                      </div>
                      <div className="flex">
                        <span className="w-24 text-gray-500">订单金额：</span>
                        <span>{formatAmount(order.amount)}</span>
                      </div>
                      <div className="flex">
                        <span className="w-24 text-gray-500">支付时间：</span>
                        <span>{formatDateTime(order.payTime)}</span>
                      </div>
                      <div className="flex">
                        <span className="w-24 text-gray-500">支付状态：</span>
                        <span className={
                          order.payStatus === 'SUCCESS'
                            ? 'text-green-600'
                            : order.payStatus === 'NOTPAY'
                            ? 'text-yellow-600'
                            : 'text-gray-600'
                        }>
                          {order.payStatus}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="w-24 text-gray-500">交易ID：</span>
                        <span className="break-all">{order.transactionId || '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {orderTotalPages > 1 && (
                  <div className="flex justify-center space-x-2 mt-6">
                    <button
                      onClick={() => setOrderPage(p => Math.max(0, p - 1))}
                      disabled={orderPage === 0}
                      className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => setOrderPage(p => Math.min(orderTotalPages - 1, p + 1))}
                      disabled={orderPage === orderTotalPages - 1}
                      className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50"
                    >
                      下一页
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default UserAccountModal;

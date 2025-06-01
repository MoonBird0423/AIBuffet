import React from 'react';
import { createPortal } from 'react-dom';

function LogoutConfirmModal({ isOpen, onClose, onConfirm, loading }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative z-50 mx-auto mt-[30vh] bg-white rounded-lg p-6 w-80">
        <h3 className="text-lg font-semibold mb-4">确认退出</h3>
        <p className="text-gray-600 mb-6">确定要退出登录吗？</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? '退出中...' : '确认退出'}
          </button>        </div>
      </div>
    </div>,
    document.body
  );
}

export default LogoutConfirmModal;

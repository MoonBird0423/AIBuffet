import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

let toastId = 0;

const TOAST_TYPES = {
  info: {
    icon: 'info-circle',
    bgColor: 'bg-blue-500',
    textColor: 'text-white'
  },
  warning: {
    icon: 'exclamation-triangle',
    bgColor: 'bg-yellow-500',
    textColor: 'text-white'
  },
  error: {
    icon: 'exclamation-circle',
    bgColor: 'bg-red-500',
    textColor: 'text-white'
  },
  success: {
    icon: 'check-circle',
    bgColor: 'bg-green-500',
    textColor: 'text-white'
  }
};

// Toast管理器
export const ToastManager = {
  toasts: new Set(),
  listeners: new Set(),

  show: (message, type = 'info', duration = 2000) => {
    const id = ++toastId;
    const toast = { id, message, type };
    ToastManager.toasts.add(toast);
    ToastManager.notifyListeners();

    setTimeout(() => {
      ToastManager.toasts.delete(toast);
      ToastManager.notifyListeners();
    }, duration);

    return id;
  },

  // 便捷方法
  info: (message, duration) => ToastManager.show(message, 'info', duration),
  warning: (message, duration) => ToastManager.show(message, 'warning', duration),
  error: (message, duration) => ToastManager.show(message, 'error', duration),
  success: (message, duration) => ToastManager.show(message, 'success', duration),

  notifyListeners: () => {
    const toasts = Array.from(ToastManager.toasts);
    ToastManager.listeners.forEach(listener => listener(toasts));
  },

  subscribe: (listener) => {
    ToastManager.listeners.add(listener);
    return () => ToastManager.listeners.delete(listener);
  }
};

// 单个Toast组件
const ToastMessage = ({ message, type = 'info' }) => {
  const { icon, bgColor, textColor } = TOAST_TYPES[type];

  return (
    <div
      className={`flex items-center space-x-2 px-4 py-2 ${bgColor} ${textColor} rounded-lg shadow-lg animate-toast`}
      role="alert"
    >
      <i className={`fas fa-${icon}`} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
};

// Toast容器组件
const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = ToastManager.subscribe(newToasts => {
      setToasts([...newToasts]);
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-2"
    >
      {toasts.map(toast => (
        <ToastMessage
          key={toast.id}
          message={toast.message}
          type={toast.type}
        />
      ))}
    </div>,
    document.body
  );
};

export default ToastContainer;

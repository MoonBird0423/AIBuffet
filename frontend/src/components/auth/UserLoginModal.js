import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';
import { FaWeixin, FaMobile } from 'react-icons/fa';

function UserLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [tab, setTab] = useState('wechat');
  const { login } = useAuth();

  useEffect(() => {
    if (isOpen && tab === 'wechat') {
      // 动态加载微信官方JS（新版内嵌二维码，stylelite: 1）
      if (!window.WxLogin) {
        const script = document.createElement('script');
        script.src = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js';
        script.onload = () => {
          initWechatLogin();
        };
        document.body.appendChild(script);
      } else {
        initWechatLogin();
      }
    }
  }, [isOpen, tab]);

  const initWechatLogin = () => {
    const container = document.getElementById('wechat-login-container-modal');
    if (container) {
      container.innerHTML = ''; // 清空容器
      new window.WxLogin({
        id: "wechat-login-container-modal",
        appid: "wx0a89d967d8dc9614",
        scope: "snsapi_login",
        redirect_uri: encodeURIComponent('https://lovesuyi.cn/wechat-callback'),
        state: Math.random().toString(36).slice(2),
        style: "black",
        self_redirect: false,
        stylelite: 1,
        onReady: function(isReady) {
          // 可选：二维码iframe加载完成回调
        }
      });
    }
  };

  const handleLoginSuccess = () => {
    onClose(); // 登录成功后关闭弹窗
    if (onLoginSuccess) {
      onLoginSuccess(); // 调用登录成功回调
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative z-50 bg-white rounded-lg p-6 w-[420px] max-h-[90vh] flex flex-col shadow-xl">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 引导语 - 高级样式 */}
        <div className="text-center mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            书意解读
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            <span>
              登录即可
              <span className="font-bold text-blue-600 bg-blue-100 px-1 py-0.5 rounded-md mx-1">
                一键听书
              </span>
            </span>
            <br />
            <span>
              更有思维导图、测试题、知识问答等你探索
            </span>
          </p>
        </div>

        {/* 选项卡 */}
        <div className="flex justify-center mb-6 border-b border-gray-200">
          <button
            className={`px-6 py-2 text-sm font-medium transition-all duration-200 relative flex items-center ${
              tab === 'wechat'
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-blue-600'
            }`}
            onClick={() => setTab('wechat')}
            type="button"
          >
            <FaWeixin className="mr-2" />
            微信扫码
            {tab === 'wechat' && (
              <span className="absolute left-1/2 -bottom-[1px] -translate-x-1/2 w-10 h-1 bg-blue-600 rounded-full"></span>
            )}
          </button>
          <button
            className={`px-6 py-2 text-sm font-medium transition-all duration-200 relative flex items-center ${
              tab === 'phone'
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-blue-600'
            }`}
            onClick={() => setTab('phone')}
            type="button"
          >
            <FaMobile className="mr-2" />
            短信登录
            {tab === 'phone' && (
              <span className="absolute left-1/2 -bottom-[1px] -translate-x-1/2 w-10 h-1 bg-blue-600 rounded-full"></span>
            )}
          </button>
        </div>

        {/* 内容区 - 参考登录页面布局 */}
        <div>
          {tab === 'wechat' ? (
            <div className="flex flex-col items-center justify-center w-full">
              <div className="flex justify-center w-full">
                <div style={{ width: 300, height: 220, position: 'relative' }}>
                  <div 
                    id="wechat-login-container-modal" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      background: 'transparent',
                      overflow: 'hidden'
                    }} 
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-4 text-center">使用微信扫一扫，快速登录/注册</div>
            </div>
          ) : (
            <div className="max-w-md w-full mx-auto">
              <LoginForm onLoginSuccess={handleLoginSuccess} />
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}

export default UserLoginModal;

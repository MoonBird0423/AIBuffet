import React, { useEffect, useState } from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Logo from '../components/common/Logo';
import LoginForm from '../components/auth/LoginForm';

function Login() {
  useDocumentTitle('登录 | 书意');
  const [tab, setTab] = useState('wechat');

  useEffect(() => {
    // 动态加载微信官方JS（新版内嵌二维码，stylelite: 1）
    if (!window.WxLogin) {
      const script = document.createElement('script');
      script.src = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js';
      script.onload = () => {
        new window.WxLogin({
          id: "wechat-login-container",
          appid: "wx0a89d967d8dc9614",
          scope: "snsapi_login",
          redirect_uri: encodeURIComponent('https://lovesuyi.cn/wechat-callback'),
          state: Math.random().toString(36).slice(2),
          style: "black",
          self_redirect: true,
          stylelite: 1,
          onReady: function(isReady) {
            // 可选：二维码iframe加载完成回调
            // console.log('WxLogin ready:', isReady);
          }
        });
      };
      document.body.appendChild(script);
    } else {
      new window.WxLogin({
        id: "wechat-login-container",
        appid: "wx0a89d967d8dc9614",
        scope: "snsapi_login",
        redirect_uri: encodeURIComponent('https://lovesuyi.cn/wechat-callback'),
        state: Math.random().toString(36).slice(2),
        style: "black",
        self_redirect: true,
        stylelite: 1,
        onReady: function(isReady) {
          // 可选：二维码iframe加载完成回调
          // console.log('WxLogin ready:', isReady);
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Apple风格渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
      
      {/* 动态背景装饰元素 */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* 主要内容区域 */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        {/* Logo区域 */}
        <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
          <div className="flex justify-center transform hover:scale-105 transition-transform duration-300">
            <Logo />
          </div>
        </div>

        {/* 登录区域：选项卡切换 */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/70 backdrop-blur-xl py-10 px-6 shadow-2xl sm:rounded-2xl sm:px-8 border border-white/20 transform hover:shadow-3xl transition-all duration-500">
            {/* 选项卡 */}
            <div className="flex justify-center mb-8 border-b border-gray-200">
              <button
                className={`px-6 py-2 text-base font-semibold transition-all duration-200 relative ${
                  tab === 'wechat'
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
                onClick={() => setTab('wechat')}
                type="button"
              >
                微信扫码
                {tab === 'wechat' && (
                  <span className="absolute left-1/2 -bottom-[1px] -translate-x-1/2 w-10 h-1 bg-blue-600 rounded-full"></span>
                )}
              </button>
              <button
                className={`px-6 py-2 text-base font-semibold transition-all duration-200 relative ${
                  tab === 'phone'
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
                onClick={() => setTab('phone')}
                type="button"
              >
                短信登录
                {tab === 'phone' && (
                  <span className="absolute left-1/2 -bottom-[1px] -translate-x-1/2 w-10 h-1 bg-blue-600 rounded-full"></span>
                )}
              </button>
            </div>
            {/* 内容区 */}
            <div>
              {tab === 'wechat' ? (
                <div className="flex flex-col items-center justify-center w-full">
                  <div className="flex justify-center w-full">
                    <div id="wechat-login-container" className="mx-auto" style={{ width: 220, height: 220, background: 'transparent' }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-4 text-center">使用微信扫一扫，快速登录/注册</div>
                </div>
              ) : (
                <LoginForm />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

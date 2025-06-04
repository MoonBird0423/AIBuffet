import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaMobile, FaLock } from 'react-icons/fa';
import CaptchaModal from './CaptchaModal';
import authApi from '../../services/auth';
import { ToastManager } from '../common/Toast';

function LoginForm() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleSendCode = async () => {
    // 清空之前的错误提示
    setError('');
    
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    if (countdown > 0) {
      setError(`请等待${countdown}秒后再次发送`);
      return;
    }

    setShowCaptchaModal(true);
  };

  // 倒计时处理
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !code) {
      setError('请填写完整信息');
      return;
    }

    try {
      setError('');
      const userData = await authApi.loginWithPhone({
        phone,
        code
      });
      
      // 登录成功，直接使用API返回的完整用户数据
      login(userData);

      // 显示登录成功提示
      ToastManager.success('登录成功');

      // 如果是新用户，显示欢迎消息
      if (userData.newUser) {
        ToastManager.info(`欢迎加入AI自助餐！您的默认用户名为：${userData.username}`);
      }
      
      // 智能跳转逻辑：检查是否有来源页面，否则跳转到首页
      const redirectTo = location.state?.from?.pathname || '/';
      // 使用replace模式导航，防止用户返回到登录页
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setError(error.message || '登录失败，请稍后重试');
      if (error.response?.data?.code === 2004) {
        setCode(''); // 清空验证码输入
      }
    }
  };
  return (
    <div className="max-w-md w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
          欢迎回来
        </h2>
        <p className="text-gray-600">请使用手机验证码登录</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 text-sm rounded-xl animate-shake">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">          {/* 手机号输入框 */}
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              手机号码
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaMobile className="h-5 w-5 text-gray-800" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="appearance-none block w-full pl-12 pr-4 py-4 border-0 bg-gray-100/90 rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 text-gray-900"
                placeholder="请输入手机号"
                maxLength={11}
              />
            </div>
          </div>          {/* 验证码输入框 */}
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              验证码
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-800" />
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="appearance-none block w-full pl-12 pr-32 py-4 border-0 bg-gray-100/90 rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 text-gray-900"
                placeholder="请输入验证码"
                maxLength={4}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 hover:bg-blue-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300 disabled:border-gray-200 disabled:text-gray-400"
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </div>
          </div>

          <CaptchaModal
            isOpen={showCaptchaModal}
            onClose={() => {
              setShowCaptchaModal(false);
              setError('');
            }}
            onSuccess={() => {
              startCountdown();
              setShowCaptchaModal(false);
            }}
            phone={phone}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
          >
            登录 / 注册
          </button>
          
          <div className="mt-6 text-xs text-center text-gray-500">
            <p className="leading-relaxed">
              注册登录即代表已阅读并同意我们的
              <a
                href="/terms"
                target="_blank"
                className="text-blue-600 hover:text-blue-500 mx-1 underline underline-offset-2 hover:underline-offset-4 transition-all duration-200"
              >
                用户协议
              </a>
              与
              <a
                href="/privacy"
                target="_blank"
                className="text-blue-600 hover:text-blue-500 mx-1 underline underline-offset-2 hover:underline-offset-4 transition-all duration-200"
              >
                隐私政策
              </a>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;

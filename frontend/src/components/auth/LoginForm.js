import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaMobile, FaLock } from 'react-icons/fa';
import CaptchaModal from './CaptchaModal';
import authApi from '../../services/auth';

function LoginForm() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [captcha, setCaptcha] = useState({ captchaId: '', captchaCode: '' });
  
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

  // 图形验证码验证成功后的处理
  const handleCaptchaSuccess = async (captchaData) => {
    try {
      setError('');
      // 发送短信验证码
      await authApi.sendVerificationCode({
        phone,
        captchaId: captchaData.captchaId,
        captchaCode: captchaData.captchaCode
      });

      // 发送成功后开始倒计时
      startCountdown();
    } catch (error) {
      // 处理频率限制错误
      if (error.message && error.message.includes('发送频率超限')) {
        setError('发送过于频繁，请稍后再试');
        // 强制等待60秒
        startCountdown();
      } else {
        // 其他错误处理
        setError(error.message || '短信发送失败，请重试');
      }
    }
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
      
      // 添加必要的用户信息
      const userDataWithProfile = {
        ...userData,
        profile: userData // 确保profile信息存在
      };
      
      // 登录成功，保存完整的用户信息
      login(userDataWithProfile);

      // 如果是新用户，显示欢迎消息
      if (userData.newUser) {
        // 使用toast或alert显示欢迎消息
        alert(`欢迎加入AI自助餐！您的默认用户名为：${userData.username}`);
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
      <h2 className="text-center text-2xl font-medium text-gray-900 mb-8">
        手机验证码登录
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaMobile className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入手机号"
              maxLength={11}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="appearance-none block w-full pl-10 pr-24 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入验证码"
              maxLength={4}
            />
            <div className="absolute inset-y-0 right-0">
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0}
                className="h-full px-4 py-2 border-l border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg"
              >
                {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
              </button>
            </div>
          </div>

          <CaptchaModal
            isOpen={showCaptchaModal}
            onClose={() => setShowCaptchaModal(false)}
            onSuccess={handleCaptchaSuccess}
          />
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            登录 / 注册
          </button>
          
          <div className="mt-4 text-xs text-center text-gray-500">
            注册登录即代表已阅读并同意我们的
            <a
              href="/terms"
              target="_blank"
              className="text-blue-600 hover:text-blue-500 mx-1"
            >
              用户协议
            </a>
            与
            <a
              href="/privacy"
              target="_blank"
              className="text-blue-600 hover:text-blue-500 mx-1"
            >
              隐私政策
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;

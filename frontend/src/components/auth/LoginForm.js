import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  const { login } = useAuth();

  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    if (countdown > 0) {
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
      // 发送失败只显示错误信息，不重新打开验证码弹窗
      setError(error.message || '短信发送失败，请重试');
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
      
      login(userData);
      navigate(-1);
    } catch (error) {
      setError(error.message);
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
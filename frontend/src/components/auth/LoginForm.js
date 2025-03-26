import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaMobile, FaLock } from 'react-icons/fa';

function LoginForm() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      alert('请输入正确的手机号');
      return;
    }

    // TODO: 调用发送验证码API
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
      alert('请填写完整信息');
      return;
    }

    try {
      // TODO: 调用登录API
      // 模拟登录成功
      const mockUserData = {
        username: '用户' + phone.substr(-4),
        avatar: `https://www.gravatar.com/avatar/${Date.now()}?d=mp`,
        phone
      };
      login(mockUserData);
      navigate(-1);
    } catch (error) {
      alert('登录失败，请重试');
    }
  };

  return (
    <div className="max-w-md w-full">
      <h2 className="text-center text-2xl font-medium text-gray-900 mb-10">
        手机验证码登录
      </h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaMobile className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入手机号"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="appearance-none block w-full pl-10 pr-24 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入验证码"
            />
            <div className="absolute inset-y-0 right-0">
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0}
                className="h-full px-4 py-2 border-l border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg"
              >
                {countdown > 0 ? `${countdown}秒后重试` : '发送验证码'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
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
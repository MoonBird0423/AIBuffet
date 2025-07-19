import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ToastManager } from '../components/common/Toast';

function WechatCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // 解析URL参数
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code) {
      apiClient.post('/user/wechat-login', { code, state })
        .then(res => {
          if (res.data && res.data.code === 200 && res.data.data && res.data.data.token) {
            // 存储token到localStorage.auth_user，保持与全局一致
            localStorage.setItem('auth_user', JSON.stringify({ token: res.data.data.token }));
            login({ token: res.data.data.token });
            ToastManager.success('登录成功');
            navigate('/');
          } else {
            alert(res.data?.msg || '微信登录失败');
            navigate('/login');
          }
        })
        .catch(() => {
          alert('微信登录失败');
          navigate('/login');
        });
    } else {
      alert('未获取到微信授权code');
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-gray-600">正在登录，请稍候...</div>
    </div>
  );
}

export default WechatCallback;

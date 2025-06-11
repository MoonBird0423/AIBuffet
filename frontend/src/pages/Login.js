import React from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Logo from '../components/common/Logo';
import LoginForm from '../components/auth/LoginForm';

function Login() {
  useDocumentTitle('登录 | 书意');
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
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center transform hover:scale-105 transition-transform duration-300">
            <Logo />
          </div>
        </div>

        {/* 登录表单区域 */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/70 backdrop-blur-xl py-10 px-6 shadow-2xl sm:rounded-2xl sm:px-12 border border-white/20 transform hover:shadow-3xl transition-all duration-500">
            <LoginForm />
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;

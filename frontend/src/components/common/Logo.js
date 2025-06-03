import React from 'react';
import { Link } from 'react-router-dom';

function Logo({ to = '/' }) {
  return (
    <Link to={to} className="group">
      <div className="flex items-center space-x-3">
        {/* Logo图标 */}
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          {/* 光晕效果 */}
          <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
        </div>
        
        {/* Logo文字 */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:via-indigo-500 group-hover:to-purple-500 transition-all duration-300">
            DocuChat
          </h1>
        </div>
      </div>
    </Link>
  );
}

export default Logo;

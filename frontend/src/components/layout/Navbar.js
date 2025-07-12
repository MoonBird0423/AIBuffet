import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserProfile from '../common/UserProfile';
import CompactAudioPlayer from '../common/CompactAudioPlayer';

function Navbar() {
  const location = useLocation();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{
      backdropFilter: 'blur(30px)',
      background: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center flex-1">
            <Link to="/" className="text-2xl font-bold text-white hover:text-gray-300 transition-colors">
              <div className="flex items-center space-x-2">
                <img src="/书意渐变透明.png" alt="Logo" className="h-8 w-8"/>
                <span>书意</span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <CompactAudioPlayer />
            <div className="flex space-x-8">
              <Link 
                to="/" 
                className={`text-white hover:text-gray-300 px-3 py-2 text-sm font-medium ${
                  location.pathname === '/' ? 'bg-white/20 rounded-lg' : ''
                }`}
              >
                首页
              </Link>
              <Link 
                to="/library" 
                className={`text-white hover:text-gray-300 px-3 py-2 text-sm font-medium ${
                  location.pathname === '/library' ? 'bg-white/20 rounded-lg' : ''
                }`}
              >
                图书馆
              </Link>
              <Link 
                to="/pricing" 
                className={`text-white hover:text-gray-300 px-3 py-2 text-sm font-medium ${
                  location.pathname === '/pricing' ? 'bg-white/20 rounded-lg' : ''
                }`}
              >
                定价
              </Link>
              <Link 
                to="/my-knowledge" 
                className={`text-white hover:text-gray-300 px-3 py-2 text-sm font-medium ${
                  location.pathname === '/my-knowledge' ? 'bg-white/20 rounded-lg' : ''
                }`}
              >
                我的知识库
              </Link>
            </div>
            <div className="flex items-center">
              <UserProfile className="text-white hover:bg-white/10 rounded-lg transition-colors" />
            </div>
          </div>
          <div className="md:hidden">
            <button className="text-white">
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

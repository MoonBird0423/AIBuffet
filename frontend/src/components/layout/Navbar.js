import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserProfile from '../common/UserProfile';
import CompactAudioPlayer from '../common/CompactAudioPlayer';
import MobileMenuPopover from '../common/MobileMenuPopover';
import { useAudio } from '../../contexts/AudioContext';

function Navbar() {
  const location = useLocation();
  const { currentAudio } = useAudio();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const moreButtonRef = useRef(null);

  const hasAudio = currentAudio.audioUrl && currentAudio.id;
  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{
      backdropFilter: 'blur(30px)',
      background: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 桌面端布局 */}
          <div className="hidden md:flex items-center flex-1">
            <Link to="/" className="text-2xl font-bold text-white hover:text-gray-300 transition-colors">
              <div className="flex items-center space-x-2">
                <img src="/书意渐变透明.png" alt="Logo" className="h-8 w-8"/>
                <span>书意解读</span>
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

          {/* 移动端布局 */}
          <div className="md:hidden flex items-center justify-between w-full">
            {/* Logo - 只显示图标 */}
            <Link to="/" className="text-white hover:text-gray-300 transition-colors">
              <img src="/书意渐变透明.png" alt="Logo" className="h-8 w-8"/>
            </Link>

            {/* 音频播放器 - 居中显示，仅在有音频时显示 */}
            <div className="flex-1 flex justify-center">
              {hasAudio && <CompactAudioPlayer className="max-w-[200px]" />}
            </div>

            {/* 更多按钮 */}
            <button
              ref={moreButtonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="更多菜单"
            >
              <i className={`fas transition-transform duration-200 ${
                isMobileMenuOpen ? 'fa-times' : 'fa-ellipsis-v'
              }`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* 移动端菜单弹窗 */}
      <MobileMenuPopover
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        triggerRef={moreButtonRef}
      />
    </nav>
  );
}

export default Navbar;

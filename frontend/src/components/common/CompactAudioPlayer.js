import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '../../contexts/AudioContext';

const CompactAudioPlayer = ({ className = '' }) => {
  const navigate = useNavigate();
  const { currentAudio, togglePlay } = useAudio();

  // 如果没有音频在播放，不显示组件
  if (!currentAudio.audioUrl || !currentAudio.id) {
    return null;
  }

  const handleBookTitleClick = () => {
    navigate(`/book/${currentAudio.id}`);
  };

  return (
    <div className={`flex items-center space-x-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 ${className}`}>
      {/* 书名，可点击跳转 */}
      <button
        onClick={handleBookTitleClick}
        className="text-white hover:text-gray-200 transition-colors text-sm font-medium truncate max-w-48"
        title={`知婷老师解读《${currentAudio.bookTitle}》`}
      >
        《{currentAudio.bookTitle}》
      </button>

      {/* 播放/暂停按钮 */}
      <button
        onClick={togglePlay}
        disabled={currentAudio.isLoading}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 disabled:opacity-50 flex-shrink-0"
        title={currentAudio.isPlaying ? '暂停' : '播放'}
      >
        {currentAudio.isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : currentAudio.isPlaying ? (
          <i className="fas fa-pause text-white text-sm"></i>
        ) : (
          <i className="fas fa-play ml-0.5 text-white text-sm"></i>
        )}
      </button>
    </div>
  );
};

export default CompactAudioPlayer;

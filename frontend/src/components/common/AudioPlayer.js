import React, { useEffect } from 'react';
import { useAudio } from '../../contexts/AudioContext';
import '../../styles/audioPlayer.css';

const AudioPlayer = ({ audioUrl, bookTitle, bookId, className = '', shouldAutoplay = false, onAutoplayTriggered }) => {
  const { currentAudio, playAudio, togglePlay, setCurrentTime, setVolume, setPlaybackRate } = useAudio();

  // 当组件加载时，如果当前没有播放任何音频，则初始化为当前音频
  useEffect(() => {
    if (audioUrl && bookTitle && bookId && !currentAudio.audioUrl) {
      // 如果全局没有音频在播放，可以考虑自动设置为当前音频（但不自动播放）
    }
  }, [audioUrl, bookTitle, bookId, currentAudio.audioUrl]);

  const handlePlayClick = () => {
    if (audioUrl && bookTitle && bookId) {
      playAudio({
        id: bookId,
        bookTitle: bookTitle,
        audioUrl: audioUrl
      });
    }
  };

  // 自动播放逻辑
  useEffect(() => {
    if (shouldAutoplay && audioUrl && bookTitle && bookId) {
      // 延迟一点时间确保组件完全渲染
      const timer = setTimeout(() => {
        handlePlayClick();
        // 通知父组件自动播放已触发
        if (onAutoplayTriggered) {
          onAutoplayTriggered();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [shouldAutoplay, audioUrl, bookTitle, bookId, onAutoplayTriggered]);

  const handleProgressClick = (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * currentAudio.duration;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handlePlaybackRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 如果没有音频URL，不渲染组件
  if (!audioUrl) {
    return null;
  }

  // 检测是否为错误信息
  const isErrorMessage = audioUrl && audioUrl.startsWith('#生成内容失败');

  // 如果是错误信息，显示错误提示
  if (isErrorMessage) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-2xl p-6 ${className}`}>
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-medium text-red-800 mb-2">音频生成失败</h4>
            <p className="text-red-600 text-sm leading-relaxed">{audioUrl}</p>
          </div>
        </div>
      </div>
    );
  }

  // 判断是否是当前播放的音频
  const isCurrentAudio = currentAudio.id === bookId && currentAudio.audioUrl === audioUrl;
  const progressPercentage = isCurrentAudio && currentAudio.duration > 0 
    ? (currentAudio.currentTime / currentAudio.duration) * 100 
    : 0;

  return (
    <div className={`bg-white/50 border border-white/30 rounded-2xl p-4 md:p-6 backdrop-blur-sm ${className}`}>
      {/* 左右分栏布局：左侧播放按钮，右侧内容 */}
      <div className="flex items-start space-x-4 md:space-x-6">
        {/* 左侧播放按钮 */}
        <button
          onClick={handlePlayClick}
          disabled={currentAudio.isLoading}
          className="relative flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full transition-all duration-200 shadow-lg disabled:opacity-50 overflow-hidden flex-shrink-0"
          style={{
            backgroundImage: 'url(/知婷老师.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-30 hover:bg-opacity-20 transition-all duration-200"></div>
          {currentAudio.isLoading && isCurrentAudio ? (
            <div className="relative z-10 animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-b-2 border-white"></div>
          ) : (isCurrentAudio && currentAudio.isPlaying) ? (
            <i className="relative z-10 fas fa-pause text-lg md:text-xl text-white"></i>
          ) : (
            <i className="relative z-10 fas fa-play ml-0.5 text-lg md:text-xl text-white"></i>
          )}
        </button>

        {/* 右侧内容区域 - 移动端三行布局，桌面端两行布局 */}
        <div className="flex-1 min-w-0">
          {/* 第一行：解读标题 */}
          {bookTitle && (
            <div className="text-left mb-2 md:mb-3">
              <h4 className="text-base md:text-lg font-medium text-gray-800 truncate">
               《{bookTitle}》
              </h4>
            </div>
          )}
          
          {/* 第二行：播放进度（移动端独立一行，桌面端包含所有控制器） */}
          <div className="mb-2 md:mb-0">
            {/* 移动端：只显示进度相关 */}
            <div className="flex items-center space-x-3 md:hidden">
              {/* 播放时间 */}
              <span className="text-sm text-gray-600 min-w-[40px] font-mono flex-shrink-0">
                {formatTime(isCurrentAudio ? currentAudio.currentTime : 0)}
              </span>

              {/* 进度条 */}
              <div
                className="flex-1 h-2 bg-gray-200 rounded-full cursor-pointer overflow-hidden min-w-0"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-100"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              {/* 总时间 */}
              <span className="text-sm text-gray-600 min-w-[40px] font-mono flex-shrink-0">
                {formatTime(isCurrentAudio ? currentAudio.duration : 0)}
              </span>
            </div>

            {/* 桌面端：显示所有控制器 */}
            <div className="hidden md:flex items-center space-x-4">
              {/* 播放时间 */}
              <span className="text-sm text-gray-600 min-w-[45px] font-mono flex-shrink-0">
                {formatTime(isCurrentAudio ? currentAudio.currentTime : 0)}
              </span>

              {/* 进度条 */}
              <div
                className="flex-1 h-2 bg-gray-200 rounded-full cursor-pointer overflow-hidden min-w-0"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-100"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              {/* 总时间 */}
              <span className="text-sm text-gray-600 min-w-[45px] font-mono flex-shrink-0">
                {formatTime(isCurrentAudio ? currentAudio.duration : 0)}
              </span>

              {/* 音量控制 */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <i className="fas fa-volume-down text-gray-600 text-sm"></i>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={currentAudio.volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer audio-slider"
                />
              </div>

              {/* 播放速度控制 */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <i className="fas fa-tachometer-alt text-gray-600 text-sm"></i>
                <select
                  value={currentAudio.playbackRate}
                  onChange={handlePlaybackRateChange}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1">1x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>
            </div>
          </div>

          {/* 第三行：音量和倍速控制（仅移动端显示） */}
          <div className="flex items-center justify-center space-x-6 md:hidden">
            {/* 音量控制 */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <i className="fas fa-volume-down text-gray-600 text-sm"></i>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={currentAudio.volume}
                onChange={handleVolumeChange}
                className="w-16 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer audio-slider"
              />
            </div>

            {/* 播放速度控制 */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <i className="fas fa-tachometer-alt text-gray-600 text-sm"></i>
              <select
                value={currentAudio.playbackRate}
                onChange={handlePlaybackRateChange}
                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;

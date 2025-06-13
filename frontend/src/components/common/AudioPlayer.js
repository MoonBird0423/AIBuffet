import React, { useState, useRef, useEffect } from 'react';
import '../../styles/audioPlayer.css';

const AudioPlayer = ({ audioUrl, bookTitle, className = '' }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('音频加载失败');
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(err => {
        console.error('播放失败:', err);
        setError('播放失败');
      });
      setIsPlaying(true);
    }
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
  };

  const handlePlaybackRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
    audioRef.current.playbackRate = newRate;
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // 如果没有音频URL或有错误，不渲染组件（由父组件处理）
  if (!audioUrl || error) {
    return null;
  }
  return (
    <div className={`bg-white/50 border border-white/30 rounded-2xl p-6 backdrop-blur-sm ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* 左右分栏布局：左侧播放按钮，右侧两行内容 */}
      <div className="flex items-center space-x-6">
        {/* 左侧播放按钮 */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200 shadow-lg disabled:opacity-50 overflow-hidden flex-shrink-0"
          style={{
            backgroundImage: 'url(/知婷老师.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-30 hover:bg-opacity-20 transition-all duration-200"></div>
          {isLoading ? (
            <div className="relative z-10 animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : isPlaying ? (
            <i className="relative z-10 fas fa-pause text-xl text-white"></i>
          ) : (
            <i className="relative z-10 fas fa-play ml-0.5 text-xl text-white"></i>
          )}
        </button>

        {/* 右侧内容区域 */}
        <div className="flex-1 space-y-3">
          {/* 第一行：解读标题 */}
          {bookTitle && (
            <div className="text-left">
              <h4 className="text-lg font-medium text-gray-800">
                知婷老师解读《{bookTitle}》
              </h4>
            </div>
          )}
          
          {/* 第二行：进度条和控制器 */}
          <div className="flex items-center space-x-4">
            {/* 播放时间 */}
            <span className="text-sm text-gray-600 min-w-[45px] font-mono flex-shrink-0">
              {formatTime(currentTime)}
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
              {formatTime(duration)}
            </span>

            {/* 音量控制 */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <i className="fas fa-volume-down text-gray-600 text-sm"></i>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer audio-slider"
              />
            </div>

            {/* 播放速度控制 */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <i className="fas fa-tachometer-alt text-gray-600 text-sm"></i>
              <select
                value={playbackRate}
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

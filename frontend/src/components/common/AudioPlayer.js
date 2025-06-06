import React, { useState, useRef, useEffect } from 'react';
import '../../styles/audioPlayer.css';

const AudioPlayer = ({ audioUrl, className = '' }) => {
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
  
  if (!audioUrl) {
    return (
      <div className={`bg-gray-50 rounded-2xl p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <i className="fas fa-volume-mute text-3xl mb-3"></i>
          <p className="text-lg">暂无音频</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-2xl p-6 ${className}`}>
        <div className="text-center text-red-600">
          <i className="fas fa-exclamation-triangle text-3xl mb-3"></i>
          <p className="text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/50 border border-white/30 rounded-2xl p-6 backdrop-blur-sm ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-8">
          <div className="flex items-center space-x-3">
            <i className="fas fa-volume-down text-gray-600"></i>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer audio-slider"
            />
          </div>

          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full transition-all duration-200 shadow-lg disabled:bg-gray-400"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : isPlaying ? (
              <i className="fas fa-pause text-xl"></i>
            ) : (
              <i className="fas fa-play ml-1 text-xl"></i>
            )}
          </button>

          <div className="flex items-center space-x-3">
            <i className="fas fa-tachometer-alt text-gray-600"></i>
            <select
              value={playbackRate}
              onChange={handlePlaybackRateChange}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 min-w-[45px] font-mono">
            {formatTime(currentTime)}
          </span>
          
          <div
            className="flex-1 h-3 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          <span className="text-sm text-gray-600 min-w-[45px] font-mono">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;

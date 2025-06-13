import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(null);
  const [currentAudio, setCurrentAudio] = useState({
    id: null,
    bookTitle: '',
    audioUrl: '',
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    isLoading: false,
    error: null
  });

  // 初始化音频元素
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      setupAudioListeners();
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const setupAudioListeners = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setCurrentAudio(prev => ({
        ...prev,
        duration: audio.duration,
        isLoading: false,
        error: null
      }));
    };

    const handleTimeUpdate = () => {
      setCurrentAudio(prev => ({
        ...prev,
        currentTime: audio.currentTime
      }));
    };

    const handleEnded = () => {
      setCurrentAudio(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0
      }));
    };

    const handleError = () => {
      setCurrentAudio(prev => ({
        ...prev,
        error: '音频加载失败',
        isLoading: false,
        isPlaying: false
      }));
    };

    const handleCanPlay = () => {
      setCurrentAudio(prev => ({
        ...prev,
        isLoading: false,
        error: null
      }));
    };

    const handleLoadStart = () => {
      setCurrentAudio(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  };

  const playAudio = (audioData) => {
    const audio = audioRef.current;
    if (!audio) return;

    // 如果是同一个音频，只切换播放状态
    if (currentAudio.id === audioData.id && currentAudio.audioUrl === audioData.audioUrl) {
      togglePlay();
      return;
    }

    // 停止当前音频并播放新音频
    audio.pause();
    audio.src = audioData.audioUrl;
    audio.volume = currentAudio.volume;
    audio.playbackRate = currentAudio.playbackRate;

    setCurrentAudio(prev => ({
      ...prev,
      id: audioData.id,
      bookTitle: audioData.bookTitle,
      audioUrl: audioData.audioUrl,
      currentTime: 0,
      isLoading: true,
      error: null
    }));

    audio.play()
      .then(() => {
        setCurrentAudio(prev => ({
          ...prev,
          isPlaying: true,
          isLoading: false
        }));
      })
      .catch(err => {
        console.error('播放失败:', err);
        setCurrentAudio(prev => ({
          ...prev,
          error: '播放失败',
          isPlaying: false,
          isLoading: false
        }));
      });
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentAudio.audioUrl) return;

    if (currentAudio.isPlaying) {
      audio.pause();
      setCurrentAudio(prev => ({ ...prev, isPlaying: false }));
    } else {
      audio.play()
        .then(() => {
          setCurrentAudio(prev => ({ ...prev, isPlaying: true }));
        })
        .catch(err => {
          console.error('播放失败:', err);
          setCurrentAudio(prev => ({
            ...prev,
            error: '播放失败',
            isPlaying: false
          }));
        });
    }
  };

  const pauseAudio = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setCurrentAudio(prev => ({ ...prev, isPlaying: false }));
    }
  };

  const stopAudio = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setCurrentAudio(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0
      }));
    }
  };

  const setCurrentTime = (time) => {
    const audio = audioRef.current;
    if (audio && currentAudio.audioUrl) {
      audio.currentTime = time;
      setCurrentAudio(prev => ({ ...prev, currentTime: time }));
    }
  };

  const setVolume = (volume) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      setCurrentAudio(prev => ({ ...prev, volume }));
    }
  };

  const setPlaybackRate = (rate) => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = rate;
      setCurrentAudio(prev => ({ ...prev, playbackRate: rate }));
    }
  };

  const value = {
    currentAudio,
    playAudio,
    togglePlay,
    pauseAudio,
    stopAudio,
    setCurrentTime,
    setVolume,
    setPlaybackRate
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

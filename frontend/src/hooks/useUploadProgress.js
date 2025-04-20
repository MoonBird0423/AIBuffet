import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/api';

export const useUploadProgress = () => {
  const [progress, setProgress] = useState({});
  const [isPolling, setIsPolling] = useState(false);
  const pollTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  const startPolling = useCallback(async (uploadId) => {
    if (!uploadId) return;
    
    setIsPolling(true);
    abortControllerRef.current = new AbortController();

  const pollProgress = async (retryCount = 0) => {
    try {
      const response = await apiClient.get(`/documents/progress/${uploadId}`, {
        signal: abortControllerRef.current.signal
      });
      
      const { progress: fileProgresses, completed } = response.data.data;
      setProgress(prevProgress => ({
        ...prevProgress,
        ...fileProgresses
      }));

      // 只有在确认完成时才停止轮询
      if (completed) {
        setIsPolling(false);
      } else if (isPolling) {
        // 确保在轮询状态下继续
        pollTimerRef.current = setTimeout(() => pollProgress(0), 500);
      }
    } catch (error) {
      // 只有在非取消错误且确实出错时进行重试
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        console.error('Progress polling failed:', error);
        
        // 如果重试次数小于最大重试次数（3次）且仍在轮询状态
        if (retryCount < 3 && isPolling) {
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // 指数退避，最大5秒
          console.log(`Retrying progress polling in ${retryDelay}ms (attempt ${retryCount + 1}/3)`);
          pollTimerRef.current = setTimeout(() => pollProgress(retryCount + 1), retryDelay);
        } else {
          setIsPolling(false);
        }
      } else {
        // 如果是取消错误，但仍在轮询状态，继续尝试
        if (isPolling) {
          pollTimerRef.current = setTimeout(() => pollProgress(0), 500);
        }
      }
    }
  };

    pollProgress();
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    progress,
    startPolling,
    stopPolling,
    isPolling,
    setProgress,
    setIsPolling
  };
};

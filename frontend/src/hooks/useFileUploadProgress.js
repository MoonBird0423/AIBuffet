import { useState, useCallback, useEffect } from 'react';

export const useFileUploadProgress = (isUploading) => {
  const [progress, setProgress] = useState(0);
  
  // useEffect 用于模拟上传进度
  useEffect(() => {
    if (isUploading) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 500);

      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isUploading]);

  const completeProgress = useCallback(() => {
    setProgress(100);
  }, []);

  return [progress, completeProgress];
};

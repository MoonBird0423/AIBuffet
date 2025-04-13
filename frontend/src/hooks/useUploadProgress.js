import { useState, useEffect } from 'react';

const useUploadProgress = (isUploading, duration = 2000) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (!isUploading) {
      setProgress(0);
      return;
    }

    let startTime = Date.now();
    let animationFrame;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.min((elapsed / duration) * 90, 90); // 最多到90%
      
      setProgress(nextProgress);
      
      if (nextProgress < 90) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isUploading, duration]);

  const complete = () => {
    setProgress(100);
  };

  return [progress, complete];
};

export default useUploadProgress;

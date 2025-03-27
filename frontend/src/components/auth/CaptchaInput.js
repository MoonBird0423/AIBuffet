import React, { useState, useEffect } from 'react';
import authApi from '../../services/auth';

function CaptchaInput({ onChange, onError, onSuccess, onClose }) {
  const [captchaId, setCaptchaId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationState, setValidationState] = useState('default'); // default, validating, valid, invalid
  const [isLocked, setIsLocked] = useState(false); // 添加验证成功后的锁定状态

  const loadCaptcha = async () => {
    try {
      setIsLoading(true);
      const { captchaId, captchaImage } = await authApi.generateCaptcha();
      setCaptchaId(captchaId);
      setCaptchaImage(captchaImage);
      setCaptchaCode('');
      onChange?.({ captchaId: captchaId, captchaCode: '' });
    } catch (error) {
      onError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const handleRefresh = (e) => {
    e.preventDefault();
    loadCaptcha();
  };

  const handleVerify = async () => {
    if (isLocked || captchaCode.length !== 4) return;
    
    setValidationState('validating');
    try {
      await authApi.validateCaptcha({ captchaId, captchaCode });
      setValidationState('valid');
      setIsLocked(true);
      onChange?.({ captchaId, captchaCode, isValid: true });
      onSuccess?.();
      setTimeout(() => {
        onClose?.();
      }, 500);
    } catch (error) {
      setValidationState('invalid');
      onChange?.({ captchaId, captchaCode, isValid: false });
      onError?.(error.message);
    }
  };

  const handleChange = (e) => {
    if (isLocked) return;
    
    const value = e.target.value.toLowerCase();
    setCaptchaCode(value);
    
    if (validationState !== 'default') {
      setValidationState('default');
      onChange?.({ captchaId, captchaCode: value, isValid: false });
    }
  };


  return (
    <div className="relative">
      <div className="flex space-x-2">
        <div className="flex-1 flex space-x-2">
          <input
            type="text"
            value={captchaCode}
            onChange={handleChange}
            placeholder="请输入图形验证码"
            className={`appearance-none block w-full pl-3 pr-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 text-sm transition-colors duration-200 focus:outline-none ${
              validationState === 'default'
                ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                : validationState === 'validating'
                ? 'border-yellow-400 focus:ring-yellow-500 focus:border-yellow-500'
                : validationState === 'valid'
                ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                : 'border-red-500 focus:ring-red-500 focus:border-red-500'
            }`}
            maxLength={4}
          />
          <button
            onClick={handleVerify}
            disabled={captchaCode.length !== 4 || isLocked || validationState === 'validating'}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
              ${isLocked
                ? 'bg-green-500 text-white cursor-not-allowed'
                : validationState === 'validating'
                ? 'bg-yellow-400 text-white cursor-wait'
                : captchaCode.length !== 4
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            {isLocked
              ? '已验证'
              : validationState === 'validating'
              ? '验证中...'
              : '验证'}
          </button>
        </div>
        <div className="relative h-10 w-32 flex-shrink-0">
          {captchaImage ? (
            <img
              src={captchaImage}
              alt="验证码"
              className="h-full w-full object-cover rounded cursor-pointer"
              onClick={handleRefresh}
            />
          ) : (
            <div className="h-full w-full bg-gray-100 rounded flex items-center justify-center">
              {isLoading ? '加载中...' : '加载失败'}
            </div>
          )}
          <button
            onClick={handleRefresh}
            className="absolute inset-0 w-full h-full opacity-0"
            type="button"
          >
            刷新验证码
          </button>
        </div>
      </div>
      <div className="mt-1 flex justify-between items-center">
        {!captchaImage && !isLoading && (
          <button
            onClick={handleRefresh}
            className="text-blue-600 text-sm hover:text-blue-500"
            type="button"
          >
            点击重新获取
          </button>
        )}
        {validationState === 'validating' && (
          <span className="text-yellow-600 text-xs">正在验证...</span>
        )}
        {validationState === 'valid' && (
          <span className="text-green-600 text-xs">验证通过</span>
        )}
        {validationState === 'invalid' && (
          <span className="text-red-600 text-xs">验证码错误</span>
        )}
        {captchaCode.length > 0 && !isLocked && (
          <button
            onClick={() => {
              setCaptchaCode('');
              setValidationState('default');
              onChange?.({ captchaId, captchaCode: '', isValid: false });
            }}
            className="text-gray-400 hover:text-gray-500 text-sm"
            type="button"
          >
            清除
          </button>
        )}
      </div>
    </div>
  );
}

export default CaptchaInput;
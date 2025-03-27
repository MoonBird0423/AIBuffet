import React, { useState, useEffect } from 'react';
import authApi from '../../services/auth';

function CaptchaModal({ isOpen, onClose, onSuccess }) {
  const [captchaId, setCaptchaId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCaptcha();
    }
  }, [isOpen]);

  const loadCaptcha = async () => {
    try {
      setIsLoading(true);
      setError('');
      const { captchaId, captchaImage } = await authApi.generateCaptcha();
      setCaptchaId(captchaId);
      setCaptchaImage(captchaImage);
      setCaptchaCode('');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = (e) => {
    e.preventDefault();
    loadCaptcha();
  };

  const handleChange = async (e) => {
    const value = e.target.value;
    setCaptchaCode(value);

    // 当输入4位时进行验证
    if (value.length === 4) {
      try {
        setError('');
        setIsLoading(true);
        const response = await authApi.validateCaptcha({
          captchaId,
          captchaCode: value
        });
        
        if (response.code === 200) {
          // 验证成功后，立即通知父组件并关闭弹窗
          onSuccess({ captchaId, captchaCode: value });
          onClose();
          return; // 立即返回，不再继续处理
        }
        
        // 验证失败显示错误信息
        setError(response.message || '验证码错误，请重新输入');
      } catch (error) {
        setError(error.message || '验证失败，请重新输入');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-medium text-gray-900 mb-4">
          请输入图形验证码
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-center mb-4">
            {captchaImage ? (
              <img
                src={captchaImage}
                alt="验证码"
                className="h-12 cursor-pointer rounded"
                onClick={handleRefresh}
              />
            ) : (
              <div className="h-12 w-32 bg-gray-100 rounded flex items-center justify-center">
                {isLoading ? '加载中...' : '加载失败'}
              </div>
            )}
          </div>

          <input
            type="text"
            value={captchaCode}
            onChange={handleChange}
            placeholder="请输入验证码"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            maxLength={4}
            autoFocus
          />

          <div className="text-center">
            <button
              onClick={handleRefresh}
              className="text-blue-600 text-sm hover:text-blue-500"
              type="button"
            >
              看不清？换一张
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaptchaModal;
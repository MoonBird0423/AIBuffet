import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import authApi from '../../services/auth';
import { ToastManager } from '../common/Toast';

function CaptchaModal({ isOpen, onClose, onSuccess, phone }) {
  const [captchaId, setCaptchaId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationState, setValidationState] = useState('default'); // default, validating, success, error
  
  useEffect(() => {
    if (isOpen) {
      loadCaptcha();
      setValidationState('default');
    }
  }, [isOpen]);

  // 验证码生成
  const loadCaptcha = async () => {
    console.log('开始生成验证码...');
    try {
      setIsLoading(true);
      const { captchaId, captchaImage } = await authApi.generateCaptcha();
      console.log('验证码生成成功:', { captchaId });
      setCaptchaId(captchaId);
      setCaptchaImage(captchaImage);
      setCaptchaCode('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || '获取验证码失败';
      ToastManager.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 验证码输入处理
  const handleChange = async (e) => {
    const value = e.target.value.toLowerCase();
    console.log('验证码输入:', value);
    setCaptchaCode(value);

    // 输入4位时自动验证
    if (value.length === 4) {
      console.log('开始验证流程...', { captchaId, value });
      try {
        setValidationState('validating');
        setIsLoading(true);

        try {
          // 先验证图形验证码
          await authApi.validateCaptcha({
            captchaId,
            captchaCode: value
          });

          try {
            // 发送短信验证码
            await authApi.sendVerificationCode({
              captchaId,
              captchaCode: value,
              phone
            });

            // 全部成功
            setValidationState('success');
            ToastManager.success('验证码发送成功');
            onSuccess?.();
            setTimeout(() => onClose(), 1500);

          } catch (smsError) {
            // 短信发送失败
            const errorMessage = smsError.message;
            ToastManager.error(errorMessage || '短信发送失败，请稍后重试');
            // 如果是频率限制错误，清空验证码并刷新图片
            if (errorMessage && errorMessage.includes('短信发送过于频繁')) {
              setCaptchaCode('');
              loadCaptcha();
            }
          }
        } catch (captchaError) {
          // 图形验证码验证失败
          ToastManager.error(captchaError.message);
          setCaptchaCode('');
          setValidationState('error');
          loadCaptcha();
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  // 渲染UI
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative z-50 bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        {/* 关闭按钮 */}
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


        <div className="space-y-4">
          {/* 验证码图片 */}
          <div className="flex justify-center mb-4">
            {captchaImage ? (
              <img
                src={captchaImage}
                alt="验证码"
                className="h-12 cursor-pointer rounded"
                onClick={loadCaptcha}
              />
            ) : (
              <div className="h-12 w-32 bg-gray-100 rounded flex items-center justify-center">
                {isLoading ? '加载中...' : '加载失败'}
              </div>
            )}
          </div>

          {/* 输入框容器 */}
          <div className="relative">
            <input
              type="text"
              value={captchaCode}
              onChange={handleChange}
              placeholder="请输入验证码"
              className={`w-full pl-3 pr-10 py-2 border rounded-lg shadow-sm focus:outline-none transition-colors duration-200 ${
                validationState === 'default'
                  ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  : validationState === 'validating'
                  ? 'border-yellow-400 focus:ring-yellow-500 focus:border-yellow-500'
                  : validationState === 'success'
                  ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                  : 'border-red-500 focus:ring-red-500 focus:border-red-500'
              }`}
              maxLength={4}
              autoFocus
            />
            {/* Loading Spinner */}
            {(validationState === 'validating' || isLoading) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>

          {/* 刷新按钮 */}
          <div className="text-center">
            <button
              onClick={loadCaptcha}
              className="text-blue-600 text-sm hover:text-blue-500"
              type="button"
            >
              看不清？换一张
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default CaptchaModal;

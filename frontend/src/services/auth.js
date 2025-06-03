import apiClient from './api';

const authApi = {
  // 获取图形验证码
  generateCaptcha: async () => {
    console.log('[API] 开始获取图形验证码');
    try {
      const response = await apiClient.get('/auth/captcha/generate');
      console.log('[API] 图形验证码获取成功:', { captchaId: response.data.data.captchaId });
      return response.data.data;
    } catch (error) {
      console.error('[API] 图形验证码获取失败:', {
        status: error.response?.status,
        data: error.response?.data,
        error: error.message
      });
      throw new Error(error.response?.data?.message || '获取图形验证码失败');
    }
  },

  // 验证图形验证码
  validateCaptcha: async ({ captchaId, captchaCode }) => {
    console.log('[API] 开始验证图形验证码:', { captchaId, captchaCode });
    try {
      const response = await apiClient.post('/auth/captcha/validate', {
        captchaId,
        captchaCode
      });
      
      // 只检查响应状态码
      if (response.data.code !== 200) {
        console.error('[API] 图形验证码验证失败:', response.data);
        throw new Error(response.data.message || '验证码错误');
      }
      
      console.log('[API] 图形验证码验证成功');
      return response.data.data;
    } catch (error) {
      console.error('[API] 图形验证码验证失败:', {
        status: error.response?.status,
        data: error.response?.data,
        error: error.message
      });
      throw new Error(error.response?.data?.message || '验证码验证失败');
    }
  },

  // 发送短信验证码
  sendVerificationCode: async ({ phone, captchaId, captchaCode }) => {
    console.log('[API] 开始发送短信验证码:', { phone, captchaId, captchaCode });
    try {
      const response = await apiClient.post('/auth/code/send', {
        phone,
        captchaId,
        captchaCode
      });
      
      // 只检查响应状态码
      if (response.data.code !== 200) {
        console.error('[API] 短信验证码发送失败:', response.data);
        throw new Error(response.data.message || '发送验证码失败');
      }
      
      console.log('[API] 短信验证码发送成功');
      return response.data.data;
    } catch (error) {
      console.error('[API] 短信验证码发送失败:', {
        status: error.response?.status,
        data: error.response?.data,
        error: error.message
      });
      throw new Error(error.response?.data?.message || '发送验证码失败');
    }
  },

  // 手机验证码登录
  loginWithPhone: async ({ phone, code }) => {
    try {
      console.log('Sending login request with:', { phone, code });
      const response = await apiClient.post('/auth/login/phone', {
        phone,
        code
      });
      console.log('Login response:', response);
      
      // 检查响应状态并返回数据
      if (response.data.code !== 200) {
        throw new Error(response.data.message || '登录失败');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Login error:', error.response || error);
      throw new Error(error.response?.data?.message || '登录失败');
    }
  }
};

export default authApi;

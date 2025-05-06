import apiClient from './api';

const authApi = {
  // 获取图形验证码
  generateCaptcha: async () => {
    try {
      const response = await apiClient.get('/auth/captcha/generate');
      return response.data;
    } catch (error) {
      console.error('Generate captcha error:', error.response || error);
      throw new Error(error.response?.data?.message || '获取图形验证码失败');
    }
  },

  // 验证图形验证码
  validateCaptcha: async ({ captchaId, captchaCode }) => {
    try {
      const response = await apiClient.post('/auth/captcha/validate', {
        captchaId,
        captchaCode
      });
      return response.data;
    } catch (error) {
      console.error('Validate captcha error:', error.response || error);
      throw new Error(error.response?.data?.message || '验证码验证失败');
    }
  },

  // 发送短信验证码
  sendVerificationCode: async ({ phone, captchaId, captchaCode }) => {
    try {
      console.log('Sending verification code request:', { phone, captchaId, captchaCode });
      const response = await apiClient.post('/auth/code/send', {
        phone,
        captchaId,
        captchaCode
      });
      return response.data;
    } catch (error) {
      console.error('Send verification code error:', error.response || error);
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
      
      // 检查响应状态
      if (response.data.code !== 200) {
        throw new Error(response.data.message || '登录失败');
      }
      
      const userData = response.data.data;
      
      // 确保token被保存
      if (userData.token) {
        localStorage.setItem('auth_user', JSON.stringify({
          ...userData,
          token: userData.token
        }));
      }
      
      return userData;
    } catch (error) {
      console.error('Login error:', error.response || error);
      throw new Error(error.response?.data?.message || '登录失败');
    }
  }
};

export default authApi;

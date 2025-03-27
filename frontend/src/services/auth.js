import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const authApi = {
  // 获取图形验证码
  generateCaptcha: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/captcha/generate`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取图形验证码失败');
    }
  },

  // 验证图形验证码
  validateCaptcha: async ({ captchaId, captchaCode }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/captcha/validate`, {
        captchaId,
        captchaCode
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '验证码验证失败');
    }
  },

  // 发送短信验证码
  sendVerificationCode: async ({ phone, captchaId, captchaCode }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/code/send`, {
        phone,
        captchaId,
        captchaCode
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '发送验证码失败');
    }
  },

  // 手机验证码登录
  loginWithPhone: async ({ phone, code }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login/phone`, {
        phone,
        code
      });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '登录失败');
    }
  }
};

export default authApi;
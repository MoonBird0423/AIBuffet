import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true
});

// 添加请求拦截器来处理认证
apiClient.interceptors.request.use((config) => {
  // 保存原有的Content-Type
  const originalContentType = config.headers['Content-Type'];

  // 确保headers对象存在
  config.headers = config.headers || {};

  // 从localStorage获取认证信息
  const authUser = localStorage.getItem('auth_user');
  if (authUser) {
    try {
      const user = JSON.parse(authUser);
      if (user.token) {
        // 设置认证头
        config.headers['Authorization'] = `Bearer ${user.token}`;
        // 设置CSRF头
        config.headers['X-CSRF-TOKEN'] = user.token;
      }
    } catch (e) {
      console.error('解析认证信息失败:', e);
    }
  }

  // 如果是文件上传，设置正确的Content-Type，但保留其他headers
  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  } else if (originalContentType) {
    config.headers['Content-Type'] = originalContentType;
  }

  // 添加DEBUG日志
  console.log('Request config:', {
    url: config.url,
    method: config.method,
    headers: config.headers,
    data: config.data
  });

  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// 添加响应拦截器处理认证错误
apiClient.interceptors.response.use(
  response => response,
  error => {
    // 只处理特定的认证错误
    if (error.response && error.response.status === 403) {
      // 检查是否是用户配置接口
      const isProfileRequest = error.config.url.includes('/user/profile');
      
      // 只有在获取用户配置失败时才清除认证并重定向
      if (isProfileRequest) {
        localStorage.removeItem('auth_user');
        // 使用 history 进行导航而不是直接修改 location
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const getExample = async () => {
  try {
    const response = await apiClient.get('/example');
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export const queryModels = async (params) => {
  try {
    const response = await apiClient.get('/model/query', { params });
    return response.data;
  } catch (error) {
    console.error('Error querying models:', error);
    throw error;
  }
};

export default apiClient;

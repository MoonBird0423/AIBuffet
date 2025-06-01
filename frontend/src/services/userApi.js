import apiClient from './api';

// 获取用户信息
export const getUserProfile = async () => {
  try {
    const response = await apiClient.get('/user/profile');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// 更新用户头像
export const updateUserAvatar = async (file) => {
  console.log('Update Avatar: Starting avatar update with file:', file.name);
  console.log('Update Avatar: Current localStorage state:', localStorage.getItem('auth_user'));
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // 使用apiClient直接发送请求，它会自动处理Content-Type
    console.log('Update Avatar: Sending request');
    const response = await apiClient.post('/user/avatar', formData);
    console.log('Update Avatar: API response:', response.data);
    
    return { avatarUrl: response.data.data };
  } catch (error) {
    console.error('Update Avatar Error:', {
      error,
      message: error.message,
      response: error.response?.data,
      headers: error.response?.headers,
      status: error.response?.status
    });
    throw error;
  }
};

// 更新用户名
export const updateUserUsername = async (username) => {
  console.log('Update Username: Starting username update with:', username);
  console.log('Update Username: Current localStorage state:', localStorage.getItem('auth_user'));
  
  try {
    const response = await apiClient.put('/user/username', { username });
    console.log('Update Username: API response:', response.data);
    
    // 检查响应格式
    if (response.data.code !== 200) {
      console.log('Update Username: API returned error code:', response.data.code);
      throw new Error(response.data.message || '更新用户名失败');
    }
    
    // 返回data字段的值
    return response.data.data;
  } catch (error) {
    console.error('Update Username Error:', {
      error,
      message: error.message,
      response: error.response?.data,
      headers: error.response?.headers,
      status: error.response?.status
    });
    // 确保错误消息被正确传递
    throw new Error(error.response?.data?.message || error.message || '更新用户名失败');
  }
};

// 退出登录
export const logout = async () => {
  try {
    await apiClient.post('/user/logout');
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

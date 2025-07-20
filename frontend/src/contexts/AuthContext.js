import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserProfile, updateUserAvatar, updateUserUsername, logout as logoutApi } from '../services/userApi';

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = 'auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // 从localStorage读取用户数据
    const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 用户数据变化时保存到localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  // 避免首次加载时重复获取用户信息
  useEffect(() => {
    if (user?.token) {
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await getUserProfile();
      // 合并原有用户数据和新获取的数据，确保token和其他重要信息不丢失
      setUser(prevUser => ({
        ...prevUser,        // 保留所有现有数据
        ...userData,        // 更新新的用户信息
        token: prevUser.token  // 确保token不被覆盖
      }));
    } catch (err) {
      setError(err.message);
      // 如果获取用户信息失败，可能是token过期，清除用户状态
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    // 验证token存在
    if (!userData.token) {
      console.error('Login data is missing token:', userData);
      return;
    }
    // 构造完整的用户数据
    const completeUserData = {
      ...userData,
      token: userData.token  // 确保token存在
    };
    // 先保存token到状态
    setUser(completeUserData);
    // 等待状态和localStorage写入完成
    await new Promise(r => setTimeout(r, 0));
    // 拉取用户详细信息并合并
    await fetchUserProfile();
  };

  const logout = async () => {
    try {
      setLoading(true);
      await logoutApi();
      setUser(null);
    } catch (err) {
      setError(err.message);
      // 即使退出失败，也清除本地用户状态
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateAvatar = async (file) => {
    if (!user) return;

    try {
      setLoading(true);
      const { avatarUrl } = await updateUserAvatar(file);
      // 确保更新头像时保留所有现有用户数据
      setUser({
        ...user,
        avatar: avatarUrl,
        token: user.token  // 显式保留token
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUsername = async (newUsername) => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await updateUserUsername(newUsername);
      
      // 检查响应数据是否有效
      if (!response) {
        throw new Error('更新用户名失败：服务器返回数据无效');
      }

      // API返回的是直接的用户名字符串
      const updatedUsername = response;

      // 确保更新用户名时保留所有现有用户数据
      const updatedUser = {
        ...user,
        username: updatedUsername,
        token: user.token  // 显式保留token
      };
      
      setUser(updatedUser);
    } catch (err) {
      console.error('Update username error:', err);
      setError(err.message || '更新用户名失败，请重试');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      error,
      login, 
      logout, 
      updateAvatar, 
      updateUsername,
      clearError,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

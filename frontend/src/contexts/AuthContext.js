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

  // 初始化和token变化时获取用户信息
  useEffect(() => {
    if (user?.token) {
      fetchUserProfile();
    }
  }, [user?.token]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await getUserProfile();
      // 保留token，合并新的用户数据
      setUser(prevUser => ({
        ...userData,
        token: prevUser.token
      }));
    } catch (err) {
      setError(err.message);
      // 如果获取用户信息失败，可能是token过期，清除用户状态
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    // 确保保存完整的用户数据，包括token
    setUser(userData);
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
      setUser({
        ...user,
        avatar: avatarUrl
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
      const { username } = await updateUserUsername(newUsername);
      setUser({
        ...user,
        username
      });
    } catch (err) {
      setError(err.message);
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
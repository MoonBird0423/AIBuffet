import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const updateAvatar = (avatarUrl) => {
    if (user) {
      setUser({
        ...user,
        avatar: avatarUrl
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateAvatar }}>
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
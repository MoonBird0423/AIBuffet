import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Library from './pages/Library';
import MyKnowledge from './pages/MyKnowledge';
import Chat from './pages/Chat';
import Login from './pages/Login';
import BookDetails from './pages/BookDetails';
import MainLayout from './components/layout/MainLayout';
import ToastContainer from './components/common/Toast';
import { AuthProvider } from './contexts/AuthContext';
import { AudioProvider } from './contexts/AudioContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// 导入Tailwind CSS样式
import './index.css';

function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
        <Routes>
          {/* 登录页面 */}
          <Route path="/login" element={<Login />} />
          
          {/* 需要登录的独立页面 */}
          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          
          {/* MainLayout下的路由 */}
          <Route element={<MainLayout />}>
            {/* 公开页面 */}
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/book/:id" element={<BookDetails />} />
            
            {/* 需要登录的页面 */}
            <Route path="/my-knowledge" element={
              <ProtectedRoute>
                <MyKnowledge />
              </ProtectedRoute>
            } />
          </Route>

          {/* 404重定向 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <ToastContainer />
        </Router>
      </AudioProvider>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Library from './pages/Library';
import MyKnowledge from './pages/MyKnowledge';
import Chat from './pages/Chat';
import Login from './pages/Login';
import MainLayout from './components/layout/MainLayout';
import ToastContainer from './components/common/Toast';
import { AuthProvider } from './contexts/AuthContext';

// 导入Tailwind CSS样式
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Chat路由独立，不使用MainLayout */}
          <Route path="/chat" element={<Chat />} />
          
          {/* 其他路由使用MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/my-knowledge" element={<MyKnowledge />} />
            <Route path="/login" element={<Login />} />
          </Route>
        </Routes>
        <ToastContainer />
      </Router>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Login from './pages/Login';
import ToastContainer from './components/common/Toast';
import { AuthProvider } from './contexts/AuthContext';

// 导入Tailwind CSS样式
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/login" element={<Login />} />
          <Route path="/comparison" element={<div>比较页面</div>} />
          <Route path="/learning" element={<div>学习页面</div>} />
          <Route path="/community" element={<div>社区页面</div>} />
          <Route path="/feedback" element={<div>反馈页面</div>} />
        </Routes>
        <ToastContainer />
      </Router>
    </AuthProvider>
  );
}

export default App;

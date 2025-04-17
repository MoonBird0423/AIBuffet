import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import KnowledgeGrid from './pages/KnowledgeGrid';
import MyKnowledge from './pages/MyKnowledge';
import Chat from './pages/Chat';
import CreateKnowledge from './pages/CreateKnowledge';
import KnowledgeDetail from './pages/KnowledgeDetail';
import Login from './pages/Login';
import Home from './pages/Home';
import ToastContainer from './components/common/Toast';
import { AuthProvider } from './contexts/AuthContext';

// 导入Tailwind CSS样式
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<KnowledgeGrid />} />
          <Route path="/my-knowledge" element={<MyKnowledge />} />
          <Route path="/old-home" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-knowledge" element={<CreateKnowledge />} />
          <Route path="/knowledge/:id" element={<KnowledgeDetail />} />
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

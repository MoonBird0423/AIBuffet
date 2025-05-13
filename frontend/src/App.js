import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Library from './pages/Library';
import MyKnowledge from './pages/MyKnowledge';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ToastContainer from './components/common/Toast';
import { AuthProvider } from './contexts/AuthContext';

// 导入Tailwind CSS样式
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="min-h-screen pt-16"> {/* Add padding-top to account for fixed navbar */}
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/my-knowledge" element={<MyKnowledge />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/login" element={<Login />} />
          </Routes>
        </div>
        <Footer />
        <ToastContainer />
      </Router>
    </AuthProvider>
  );
}

export default App;

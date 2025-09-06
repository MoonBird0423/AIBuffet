import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Library from './pages/Library';
import MyKnowledge from './pages/MyKnowledge';
import Chat from './pages/Chat';
import Login from './pages/Login';
import BookDetails from './pages/BookDetails';
import Pricing from './pages/Pricing';
import AboutUs from './pages/AboutUs';
import WechatCallback from './pages/WechatCallback';
import MainLayout from './components/layout/MainLayout';
import ToastContainer from './components/common/Toast';
import PurchaseModal from './components/common/PurchaseModal';
import UserLoginModal from './components/auth/UserLoginModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AudioProvider } from './contexts/AudioContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// 导入Tailwind CSS样式
import './index.css';

// 内部组件，用于处理购买弹窗逻辑
function AppContent() {
  const { purchaseModal, showPurchaseModal, hidePurchaseModal, loginModal, hideLoginModal } = useAuth();

  // 监听全局购买弹窗事件
  useEffect(() => {
    const handleShowPurchaseModal = (event) => {
      const { type } = event.detail || {};
      showPurchaseModal(type);
    };

    window.addEventListener('showPurchaseModal', handleShowPurchaseModal);
    
    return () => {
      window.removeEventListener('showPurchaseModal', handleShowPurchaseModal);
    };
  }, [showPurchaseModal]);

  return (
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
        {/* 微信扫码回调页面 */}
        <Route path="/wechat-callback" element={<WechatCallback />} />

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
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about-us" element={<AboutUs />} />
          
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
      
      {/* 全局购买弹窗 */}
      <PurchaseModal 
        open={purchaseModal.open}
        onClose={hidePurchaseModal}
        defaultType={purchaseModal.defaultType}
      />
      
      {/* 全局登录弹窗 */}
      <UserLoginModal 
        isOpen={loginModal.open}
        onClose={hideLoginModal}
      />
      </Router>
    </AudioProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

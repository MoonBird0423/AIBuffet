import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

// 导入Tailwind CSS样式
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/comparison" element={<div>比较页面</div>} />
        <Route path="/learning" element={<div>学习页面</div>} />
        <Route path="/community" element={<div>社区页面</div>} />
        <Route path="/feedback" element={<div>反馈页面</div>} />
      </Routes>
    </Router>
  );
}

export default App;

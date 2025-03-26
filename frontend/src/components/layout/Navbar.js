import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../common/Logo';
import UserProfile from '../common/UserProfile';

function Navbar() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-7">
            <div className="py-4">
              <Logo />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/" className="py-4 px-2 text-blue-500 border-b-4 border-blue-500 font-semibold">首页</Link>
            <Link to="/comparison" className="py-4 px-2 text-gray-500 font-semibold hover:text-blue-500 transition duration-300">对比</Link>
            <Link to="/learning" className="py-4 px-2 text-gray-500 font-semibold hover:text-blue-500 transition duration-300">学习</Link>
            <Link to="/community" className="py-4 px-2 text-gray-500 font-semibold hover:text-blue-500 transition duration-300">社区</Link>
            <Link to="/feedback" className="py-4 px-2 text-gray-500 font-semibold hover:text-blue-500 transition duration-300">反馈</Link>
            <div className="border-l pl-3 ml-3">
              <UserProfile />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

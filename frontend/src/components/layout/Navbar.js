import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../common/Logo';
import UserProfile from '../common/UserProfile';

function Navbar() {
  const location = useLocation();
  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Logo />
          </div>
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-8">
              <Link 
                to="/" 
                className={`text-base font-semibold min-w-[100px] text-center ${
                  location.pathname === '/' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                } h-16 flex items-center justify-center`}
              >
                公开知识库
              </Link>
              <Link 
                to="/my-knowledge" 
                className={`text-base font-semibold min-w-[100px] text-center ${
                  location.pathname === '/my-knowledge' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                } h-16 flex items-center justify-center`}
              >
                我的知识库
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <UserProfile />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

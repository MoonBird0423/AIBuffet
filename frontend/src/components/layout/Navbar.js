import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../common/Logo';
import UserProfile from '../common/UserProfile';

function Navbar() {
  const location = useLocation();
  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center flex-1">
            <Logo />
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex space-x-4">
              <Link 
                to="/library" 
                className={`text-base font-semibold min-w-[80px] text-center ${
                  location.pathname === '/library' ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
                } h-16 flex items-center justify-center`}
              >
                图书馆
              </Link>
              <Link 
                to="/my-knowledge" 
                className={`text-base font-semibold min-w-[80px] text-center ${
                  location.pathname === '/my-knowledge' ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
                } h-16 flex items-center justify-center`}
              >
                我的
              </Link>
            </div>
            <div className="flex items-center ml-2">
              <UserProfile />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

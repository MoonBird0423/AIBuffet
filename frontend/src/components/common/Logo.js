import React from 'react';
import { Link } from 'react-router-dom';

function Logo({ to = '/' }) {
  return (
    <Link to={to} className="group">
      <div className="flex items-center space-x-3">
        {/* Logo图标 */}
        <div className="relative">
          <div className="w-12 h-12 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
            <img src="/书意白.png" alt="DocuChat Logo" className="w-12 h-12 object-contain"/>
          </div>
        </div>
        
        {/* Logo文字 */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:via-indigo-500 group-hover:to-purple-500 transition-all duration-300">
            书意
          </h1>
        </div>
      </div>
    </Link>
  );
}

export default Logo;

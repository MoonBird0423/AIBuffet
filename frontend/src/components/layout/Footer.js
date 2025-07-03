import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-gray-400">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <p>&copy; 2025 书意. All rights reserved.</p>
            <a 
              href="https://beian.miit.gov.cn" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors duration-200"
            >
              备案号：蜀ICP备2025149751号
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

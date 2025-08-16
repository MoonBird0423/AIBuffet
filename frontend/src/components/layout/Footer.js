import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start space-y-8 lg:space-y-0">
          {/* 左侧：Logo、版权和备案信息 */}
          <div className="flex flex-col space-y-4 text-center lg:text-left">
            {/* 产品Logo */}
            <div className="flex justify-center lg:justify-start">
              <img 
                src="/书意渐变透明.png" 
                alt="书意Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
            
            {/* 版权和备案信息 */}
            <div className="flex flex-col space-y-2">
              <p className="text-gray-400 text-sm lg:text-base">
                &copy; 2025 书意. All rights reserved.
              </p>
              <a 
                href="https://beian.miit.gov.cn" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-300 transition-colors duration-200 text-sm lg:text-base"
              >
                蜀ICP备2025149751号
              </a>
            </div>
          </div>

          {/* 右侧：微信二维码 */}
          <div className="flex flex-col items-center space-y-3">
            <div className="bg-white p-3 rounded-lg shadow-lg">
              <img 
                src="/微信二维码.jpg" 
                alt="微信二维码"
                className="w-24 h-24 lg:w-28 lg:h-28 object-cover rounded"
              />
            </div>
            <p className="text-gray-400 text-xs lg:text-sm font-light">
              扫码联系我们
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

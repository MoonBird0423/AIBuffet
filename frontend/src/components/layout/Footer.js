import React from 'react';
import { FaQrcode } from 'react-icons/fa';

function Footer() {
  return (
    <footer className="py-6 border-t border-gray-200 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start">
          <div className="mb-4 md:mb-0 pt-2">
            <h3 className="text-lg font-bold text-blue-600">DocuChat</h3>
            <p className="text-sm text-gray-600">在对话中学习知识</p>
          </div>
          <div className="flex flex-col items-center self-center">
            <div className="w-24 h-24 bg-gray-200 flex items-center justify-center rounded-md mb-2">
              <FaQrcode className="text-gray-500 text-3xl" />
            </div>
            <p className="text-xs text-gray-500">扫码联系我们</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

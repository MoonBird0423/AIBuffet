import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';

function ChatHeader({ questionTarget, showNoTargetHint, onMenuClick }) {
  const navigate = useNavigate();

  return (
    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center">
        {/* 移动端汉堡菜单按钮 */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors mr-3"
          aria-label="打开菜单"
        >
          <FaBars size={20} />
        </button>
        
        {questionTarget ? (
          <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 min-w-0 flex-1 max-w-[250px] md:max-w-md">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded whitespace-nowrap mr-2 flex-shrink-0">
              {questionTarget.type === 'book' ? '图书' : '知识库'}
            </span>
            <span className="text-blue-900 font-medium text-sm truncate min-w-0" title={questionTarget.name}>
              {questionTarget.name}
            </span>
          </div>
        ) : (
          <h2 className="text-lg font-bold">AI助手</h2>
        )}
      </div>
    </div>
  );
}

export default ChatHeader;

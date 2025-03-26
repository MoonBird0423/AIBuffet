import React from 'react';
import Logo from '../common/Logo';
import UserProfile from '../common/UserProfile';

function ChatSidebar() {
  const chatHistory = [
    {
      title: '如何学习人工智能？',
      model: 'GPT-4',
      time: '今天 14:30',
      isActive: true
    },
    {
      title: '解释量子计算的基本原理',
      model: 'Claude',
      time: '昨天 10:15',
      isActive: false
    },
    {
      title: '推荐一些科幻小说',
      model: 'Gemini',
      time: '2023-12-10',
      isActive: false
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* 产品标识 */}
      <div className="p-4 border-b border-gray-200">
        <Logo />
      </div>
      
      {/* 对话历史 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            对话历史
          </h3>
          <ul className="space-y-2">
            {chatHistory.map((chat, index) => (
              <li 
                key={index}
                className={`${
                  chat.isActive ? 'bg-blue-50' : 'hover:bg-gray-100'
                } rounded-lg p-3 cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      chat.isActive ? 'text-blue-700' : 'text-gray-700'
                    } truncate`}>
                      {chat.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {chat.time} · {chat.model}
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* 用户信息 */}
      <div className="border-t border-gray-200 p-4">
        <UserProfile />
      </div>
    </div>
  );
}

export default ChatSidebar;
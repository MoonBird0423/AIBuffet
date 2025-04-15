import React from 'react';

function UserInfo({ avatar, username, knowledgeBaseCount }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex flex-col md:flex-row items-center md:items-start">
        <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
          <img 
            className="h-16 w-16 rounded-full object-cover border-4 border-white shadow" 
            src={avatar} 
            alt={username}
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-800">{username}</h2>
          <p className="text-gray-600 mt-1">已创建 {knowledgeBaseCount} 个知识库</p>
        </div>
      </div>
    </div>
  );
}

export default UserInfo;

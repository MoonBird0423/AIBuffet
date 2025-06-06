import React from 'react';
import { useNavigate } from 'react-router-dom';

function ChatHeader({ questionTarget, showNoTargetHint }) {
  const navigate = useNavigate();

  return (
    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center">
        {questionTarget ? (
          <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-600 mr-2">提问对象：</span>
            <span className="bg-blue-100 text-blue-800 text-lg font-medium px-2 py-1 rounded">
              【{questionTarget.type === 'book' ? '图书' : '知识库'}】{questionTarget.name}
            </span>
          </div>
        ) : (
          <h2 className="text-lg font-bold">AI助手</h2>
        )}
      </div>
      <div className="text-sm text-gray-400">
        内容由 AI 生成，请仔细甄别
      </div>
    </div>
  );
}

export default ChatHeader;

import React from 'react';
import { useNavigate } from 'react-router-dom';

function ChatHeader({ questionTarget, onRemoveTarget, showNoTargetHint }) {
  const navigate = useNavigate();

  const handleGoToLibrary = () => {
    window.open('/library', '_blank');
  };

  return (
    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center">
        {questionTarget ? (
          <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-600 mr-2">提问对象：</span>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
              【{questionTarget.type === 'book' ? '图书' : '知识库'}】{questionTarget.name}
            </span>
            <button 
              onClick={onRemoveTarget}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="删除提问对象"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        ) : showNoTargetHint ? (
          <div className="flex items-center text-gray-500">
            <span className="mr-4">你可以选择一本图书或者知识库进行提问</span>
            <button 
              onClick={handleGoToLibrary}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              逛逛图书馆
            </button>
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

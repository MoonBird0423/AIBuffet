import React, { memo } from 'react';
import { FaEllipsisV, FaTrashAlt } from 'react-icons/fa';

const ChatItem = memo(({
  chat,
  currentSessionId,
  onChatClick,
  onDeleteClick,
  isMoreMenuOpen,
  onToggleMoreMenu
}) => {
  if (!chat || !chat.sessionId) return null;

  return (
    <li 
      key={chat.sessionId}
      onClick={() => onChatClick(chat.sessionId)}
      className={`${
        currentSessionId === chat.sessionId ? 'bg-blue-50' : 'hover:bg-gray-100'
      } rounded-lg p-3 cursor-pointer group relative will-change-transform transition-all duration-200 ease-in-out`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${
            currentSessionId === chat.sessionId ? 'text-blue-700' : 'text-gray-700'
          } truncate`}>
            {chat.chatName || '未命名对话'}
          </p>
        </div>
        <div className="relative more-menu shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMoreMenu(chat.sessionId);
            }}
            className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 ml-2"
          >
            <FaEllipsisV />
          </button>
          {isMoreMenuOpen && (
            <div className="absolute right-0 mt-1 py-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick(chat.sessionId);
                }}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
              >
                <FaTrashAlt className="mr-2" />
                删除对话
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
});

ChatItem.displayName = 'ChatItem';

export default ChatItem;
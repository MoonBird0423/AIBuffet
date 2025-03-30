import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlus, FaEllipsisV, FaTrashAlt } from 'react-icons/fa';
import Logo from '../common/Logo';
import UserProfile from '../common/UserProfile';
import { getChatSessions, deleteChatSession } from '../../services/api';

function ChatSidebar({ onNewChat, onDeleteSuccess }) {
  const [chatSessions, setChatSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openMoreMenu, setOpenMoreMenu] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const currentSessionId = new URLSearchParams(location.search).get('session');

  const fetchChatSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching chat sessions...');
      const sessions = await getChatSessions();
      console.log('Received chat sessions:', sessions);
      setChatSessions(sessions);
    } catch (error) {
      console.error('获取对话列表失败:', error);
      setError('获取对话列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user');
    if (authUser) {
      console.log('Current auth user:', JSON.parse(authUser));
    }
    fetchChatSessions();
  }, []);

  const handleChatClick = (sessionId) => {
    setOpenMoreMenu(null);
    navigate(`/chat?session=${sessionId}`);
  };

  const handleNewChat = () => {
    setOpenMoreMenu(null);
    if (onNewChat) {
      onNewChat();
    }
    navigate('/chat');
  };

  const toggleMoreMenu = (sessionId, event) => {
    event.stopPropagation();
    if (openMoreMenu === sessionId) {
      setOpenMoreMenu(null);
    } else {
      setOpenMoreMenu(sessionId);
    }
  };

  const handleDeleteClick = (sessionId, event) => {
    event.stopPropagation();
    setOpenMoreMenu(null);
    setSessionToDelete(sessionId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      await deleteChatSession(sessionToDelete);
      if (currentSessionId === sessionToDelete) {
        navigate('/chat');
      }
      if (onDeleteSuccess) {
        onDeleteSuccess();
      } else {
        await fetchChatSessions();
      }
    } catch (error) {
      console.error('删除对话失败:', error);
      setError('删除对话失败，请稍后重试');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setSessionToDelete(null);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMoreMenu && !event.target.closest('.more-menu')) {
        setOpenMoreMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMoreMenu]);

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* 产品标识 */}
      <div className="p-4 border-b border-gray-200">
        <Logo />
      </div>
      
      {/* 新建对话按钮 */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <FaPlus className="mr-2 text-blue-700" />
          新建对话
        </button>
      </div>

      {/* 对话历史 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            对话历史
          </h3>
          {error && (
            <div className="text-red-500 text-sm mb-2 text-center">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : chatSessions.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              暂无对话记录
            </div>
          ) : (
            <ul className="space-y-2">
              {chatSessions.map((chat) => (
                <li 
                  key={chat.sessionId}
                  onClick={() => handleChatClick(chat.sessionId)}
                  className={`${
                    currentSessionId === chat.sessionId ? 'bg-blue-50' : 'hover:bg-gray-100'
                  } rounded-lg p-3 cursor-pointer group relative`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-2 min-w-0">
                      <p className={`text-sm font-medium ${
                        currentSessionId === chat.sessionId ? 'text-blue-700' : 'text-gray-700'
                      } truncate`}>
                        {chat.chatName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {formatTime(chat.lastMessageAt)}
                      </p>
                    </div>
                    <div className="relative more-menu">
                      <button 
                        onClick={(e) => toggleMoreMenu(chat.sessionId, e)}
                        className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      >
                        <FaEllipsisV />
                      </button>
                      {openMoreMenu === chat.sessionId && (
                        <div className="absolute right-0 mt-1 py-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <button
                            onClick={(e) => handleDeleteClick(chat.sessionId, e)}
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
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 用户信息 */}
      <div className="border-t border-gray-200 p-4">
        <UserProfile />
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">确认删除</h3>
            <p className="text-gray-600 mb-6">确定要删除这个对话吗？此操作不可恢复。</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {deleteLoading ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatSidebar;
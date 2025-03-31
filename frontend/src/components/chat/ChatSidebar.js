import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import Logo from '../common/Logo';
import UserProfile from '../common/UserProfile';
import { getChatSessions, deleteChatSession } from '../../services/api';
import ChatItem from './ChatItem';

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const ChatSidebar = React.forwardRef(({ onNewChat, onDeleteSuccess }, ref) => {
  // 使用Map存储对话数据
  const [chatSessionsMap, setChatSessionsMap] = useState(new Map());
  // 分类存储对话ID
  const [categories, setCategories] = useState({
    today: [],
    week: [],
    month: [],
    earlier: []
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openMoreMenu, setOpenMoreMenu] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const currentSessionId = new URLSearchParams(location.search).get('session');

  // 工具函数：根据日期判断分类
  const findCategoryByDate = useCallback((date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (date >= today) return 'today';
    if (date >= weekAgo) return 'week';
    if (date >= monthAgo) return 'month';
    return 'earlier';
  }, []);

  // 暴露方法给父组件
  React.useImperativeHandle(ref, () => ({
    handleChatCreated: (newChat) => {
      // 添加到Map
      setChatSessionsMap(prev => {
        const newMap = new Map(prev);
        newMap.set(newChat.sessionId, newChat);
        return newMap;
      });

      // 添加到today分类顶部
      setCategories(prev => ({
        ...prev,
        today: [newChat.sessionId, ...prev.today]
      }));
    },

    handleChatUpdated: (updatedChat) => {
      const oldChat = chatSessionsMap.get(updatedChat.sessionId);
      if (!oldChat) return;

      // 1. 获取新旧分类
      const oldCategory = findCategoryByDate(new Date(oldChat.lastMessageAt));
      const newCategory = findCategoryByDate(new Date(updatedChat.lastMessageAt));

      // 2. 更新Map数据
      setChatSessionsMap(prev => {
        const newMap = new Map(prev);
        newMap.set(updatedChat.sessionId, updatedChat);
        return newMap;
      });

      // 3. 更新分类和位置
      setCategories(prev => {
        const newCategories = { ...prev };

        if (oldCategory === newCategory) {
          // 同一分类内，移动到顶部
          newCategories[newCategory] = [
            updatedChat.sessionId,
            ...newCategories[newCategory].filter(id => id !== updatedChat.sessionId)
          ];
        } else {
          // 不同分类，从旧分类移除并添加到新分类顶部
          newCategories[oldCategory] = newCategories[oldCategory].filter(
            id => id !== updatedChat.sessionId
          );
          newCategories[newCategory] = [
            updatedChat.sessionId,
            ...newCategories[newCategory]
          ];
        }

        return newCategories;
      });
    },

    handleChatDeleted: (deletedSessionId) => {
      // 从Map中移除
      setChatSessionsMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(deletedSessionId);
        return newMap;
      });
      
      // 从所有分类中移除
      setCategories(prev => {
        const newCategories = { ...prev };
        Object.keys(newCategories).forEach(key => {
          newCategories[key] = newCategories[key].filter(id => id !== deletedSessionId);
        });
        return newCategories;
      });
    }
  }));

  // 初始获取对话列表
  const fetchChatSessions = useCallback(async () => {
    try {
      const sessions = await getChatSessions();
      if (!Array.isArray(sessions)) return;

      // 构建新的Map
      const newMap = new Map();
      sessions.forEach(session => {
        if (session && session.sessionId) {
          newMap.set(session.sessionId, session);
        }
      });
      setChatSessionsMap(newMap);

      // 对对话进行分类
      const newCategories = {
        today: [],
        week: [],
        month: [],
        earlier: []
      };

      sessions.forEach(chat => {
        if (!chat || !chat.lastMessageAt) return;
        const category = findCategoryByDate(new Date(chat.lastMessageAt));
        newCategories[category].unshift(chat.sessionId);
      });

      setCategories(newCategories);
    } catch (error) {
      console.error('获取对话列表失败:', error);
      setError('获取对话列表失败，请稍后重试');
    }
  }, [findCategoryByDate]);

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user');
    if (authUser) {
      console.log('Current auth user:', JSON.parse(authUser));
    }
    fetchChatSessions();
  }, [fetchChatSessions]);

  const handleChatClick = useCallback((sessionId) => {
    setOpenMoreMenu(null);
    navigate(`/chat?session=${sessionId}`);
  }, [navigate]);

  const handleNewChat = useCallback(() => {
    setOpenMoreMenu(null);
    if (onNewChat) {
      onNewChat();
    }
    navigate('/chat');
  }, [navigate, onNewChat]);

  const toggleMoreMenu = useCallback((sessionId, event) => {
    if (event) {
      event.stopPropagation();
    }
    setOpenMoreMenu(prev => prev === sessionId ? null : sessionId);
  }, []);

  const handleDeleteClick = useCallback((sessionId) => {
    setOpenMoreMenu(null);
    setSessionToDelete(sessionId);
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;

    try {
      setDeleteLoading(true);
      await deleteChatSession(sessionToDelete);
      if (currentSessionId === sessionToDelete) {
        navigate('/chat');
      }
      if (onDeleteSuccess) {
        onDeleteSuccess(sessionToDelete);
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

  const CategoryTitle = React.memo(({ title, count }) => (
    count > 0 ? (
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
        {title} ({count})
      </h3>
    ) : null
  ));

  CategoryTitle.displayName = 'CategoryTitle';

  const ChatList = React.memo(({ sessionIds = [], className = "" }) => {
    if (sessionIds.length === 0) return null;
    
    return (
      <ul className={`relative isolate space-y-2 mb-4 ${className}`}>
        {sessionIds.map((sessionId, index) => {
          const chat = chatSessionsMap.get(sessionId);
          if (!chat) return null;

          return (
            <div key={sessionId} className="relative" style={{ zIndex: openMoreMenu === sessionId ? 10 : 1 }}>
              <ChatItem
                chat={chat}
                currentSessionId={currentSessionId}
                onChatClick={handleChatClick}
                onDeleteClick={handleDeleteClick}
                isMoreMenuOpen={openMoreMenu === sessionId}
                onToggleMoreMenu={toggleMoreMenu}
              />
            </div>
          );
        })}
      </ul>
    );
  });

  ChatList.displayName = 'ChatList';

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

      {/* 对话列表 */}
      <div className="flex-1 overflow-y-auto min-h-0 overscroll-none scrollbar">
        <div className="p-3">
          {error && (
            <div className="text-red-500 text-sm mb-2 text-center">
              {error}
            </div>
          )}
          {chatSessionsMap.size > 0 ? (
            <div className="relative">
              <div className="space-y-2">
                {categories.today.length > 0 && (
                  <div className="relative">
                    <CategoryTitle title="今天" count={categories.today.length} />
                    <ChatList sessionIds={categories.today} className="relative" />
                  </div>
                )}
                
                {categories.week.length > 0 && (
                  <div className="relative">
                    <CategoryTitle title="近一周" count={categories.week.length} />
                    <ChatList sessionIds={categories.week} className="relative" />
                  </div>
                )}
                
                {categories.month.length > 0 && (
                  <div className="relative">
                    <CategoryTitle title="近一月" count={categories.month.length} />
                    <ChatList sessionIds={categories.month} className="relative" />
                  </div>
                )}
                
                {categories.earlier.length > 0 && (
                  <div className="relative">
                    <CategoryTitle title="更早" count={categories.earlier.length} />
                    <ChatList sessionIds={categories.earlier} className="relative" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              暂无对话记录
            </div>
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
});

ChatSidebar.displayName = 'ChatSidebar';

export default React.memo(ChatSidebar);
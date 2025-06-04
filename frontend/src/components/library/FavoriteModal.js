import React, { useState, useEffect } from 'react';
import { getMyKnowledgeBases, favoriteBook } from '../../services/api';
import { ToastManager } from '../common/Toast';

const FavoriteModal = ({ bookId, isOpen, onClose }) => {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingKnowledgeBases, setLoadingKnowledgeBases] = useState(false);

  // 获取我的知识库列表
  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      setLoadingKnowledgeBases(true);
      try {
        const response = await getMyKnowledgeBases({ page: 0 });
        const content = response?.data?.content || [];
        const kbList = Array.isArray(content) ? content : [];
        setKnowledgeBases(kbList);
        setSelectedKnowledgeBase('');  // 重置为空，让用户主动选择
      } catch (error) {
        console.error('获取知识库列表失败:', error);
        ToastManager.error('获取知识库列表失败，请重试');
        setKnowledgeBases([]);
      } finally {
        setLoadingKnowledgeBases(false);
      }
    };

    if (isOpen) {
      fetchKnowledgeBases();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedKnowledgeBase) {
      ToastManager.warning('请选择知识库');
      return;
    }

    setIsLoading(true);
    try {
      await favoriteBook(bookId, selectedKnowledgeBase);
      ToastManager.success('收藏成功');
      onClose();
    } catch (error) {
      console.error('收藏失败:', error);
      ToastManager.warning(error.response?.data?.message || '收藏失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      
      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-8">
        {/* 标题 */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900">收藏到知识库</h3>
          <p className="mt-1 text-gray-500">请选择要收藏到的知识库</p>
        </div>

        {/* 知识库选择器 */}
        <div className="mb-6">
          <label htmlFor="knowledge-base" className="block text-sm font-medium text-gray-700 mb-2">
            选择知识库
          </label>
        <div>
          <select
            id="knowledge-base"
            className="block w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            value={selectedKnowledgeBase}
            onChange={(e) => setSelectedKnowledgeBase(e.target.value)}
            disabled={isLoading || loadingKnowledgeBases}
          >
            <option value="" disabled>请选择知识库</option>
            {knowledgeBases.map(kb => (
              <option key={kb.id} value={kb.id}>
                {kb.name || '未命名知识库'}
              </option>
            ))}
          </select>
          
          {/* 显示加载状态 */}
          {loadingKnowledgeBases && (
            <div className="mt-2 text-sm text-gray-500 flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              加载知识库列表中...
            </div>
          )}
          
          {/* 显示无知识库提示 */}
          {!loadingKnowledgeBases && knowledgeBases.length === 0 && (
            <div className="mt-2 text-sm text-gray-500">
              暂无知识库，请先创建知识库
            </div>
          )}
        </div>
        </div>

        {/* 按钮区域 */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-200"
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || loadingKnowledgeBases || !selectedKnowledgeBase || knowledgeBases.length === 0}
            className={`
              px-6 py-3 rounded-xl text-white
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-700 hover:to-indigo-700
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center
            `}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                收藏中...
              </>
            ) : '确认收藏'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FavoriteModal;

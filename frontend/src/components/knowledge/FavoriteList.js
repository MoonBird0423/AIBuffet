import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, unfavoriteBook } from '../../services/api';
import { ToastManager } from '../common/Toast';
import Tooltip from '../common/Tooltip';

const FavoriteList = ({ knowledgeBaseId }) => {
  const [isMobile, setIsMobile] = useState(false);

  // 检测移动端
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  const truncateFileName = (fileName) => {
    if (fileName.length > 20) {
      const ext = fileName.split('.').pop();
      const name = fileName.substring(0, 17);
      return `${name}...${ext}`;
    }
    return fileName;
  };

  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 获取收藏列表
  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const response = await getDocuments(page, 10, {
          knowledgeBaseId,
          relationType: 'FAVORITE'
        });
        setBooks(response.data.content);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error('获取收藏列表失败:', error);
        ToastManager.error('获取收藏列表失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [knowledgeBaseId, page]);

  // 处理取消收藏
  const handleUnfavorite = async (book) => {
    try {
      await unfavoriteBook(book.id, knowledgeBaseId);
      setBooks(prev => prev.filter(b => b.id !== book.id));
      ToastManager.success('已取消收藏');
      setShowConfirmModal(false);
    } catch (error) {
      console.error('取消收藏失败:', error);
      ToastManager.error(error.response?.data?.message || '取消收藏失败，请重试');
    }
  };

  // 处理学习按钮点击
  const handleLearn = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  if (loading && books.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* 收藏列表 */}
      {books.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">暂无收藏的图书</div>
        </div>
      ) : (
        <>
          {/* 移动端网格布局 */}
          {isMobile ? (
            <div className="grid grid-cols-3 gap-4">
              {books.map(book => (
                <div key={book.id} className="relative group">
                  <div 
                    className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
                    onClick={() => handleLearn(book.id)}
                  >
                    <img 
                      src={book.coverUrl || '/default-cover.png'} 
                      alt={book.fileName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* 移动端取消收藏按钮 */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBook(book);
                      setShowConfirmModal(true);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center text-xs hover:bg-opacity-70 transition-all duration-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* PC端列表布局 */
            <div className="space-y-4">
              {books.map(book => (
                <div key={book.id} className="flex items-center p-6 bg-gray-50 rounded-2xl hover:shadow-lg transition-all duration-200">
                  <img 
                    src={book.coverUrl || '/default-cover.png'} 
                    alt={book.fileName}
                    className="w-16 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1 ml-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      <Tooltip content={book.fileName} position="top">
                        <span 
                          className="truncate block hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                          onClick={() => handleLearn(book.id)}
                        >
                          {truncateFileName(book.fileName)}
                        </span>
                      </Tooltip>
                    </h3>
                    <p className="text-gray-600 mb-2">{book.author || '未知作者'}</p>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => {
                        setSelectedBook(book);
                        setShowConfirmModal(true);
                      }}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                    >
                      取消收藏
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {/* 取消收藏确认弹窗 */}
      {showConfirmModal && selectedBook && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowConfirmModal(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">确认取消收藏</h3>
            <p className="text-gray-600 mb-6">
              确定要取消收藏《{selectedBook.fileName}》吗？
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                取消
              </button>
              <button
                onClick={() => handleUnfavorite(selectedBook)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
              >
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoriteList;

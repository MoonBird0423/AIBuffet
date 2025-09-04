import React from 'react';
import { FaUsers, FaBook } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function formatFileName(fileName) {
  // 移除扩展名
  let name = fileName.replace(/\.[^/.]+$/, "");
  // 移除括号及其内容
  name = name.replace(/\s*\([^)]*\)/g, "");
  // 移除方括号及其内容
  name = name.replace(/\s*\[[^\]]*\]/g, "");
  // 清理多余空格
  return name.trim();
}

function BookCard({ document }) {
  return (
    <Link
      to={`/book/${document.id}`}
      className="book-card bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <div className="aspect-w-3 aspect-h-4 relative">
        {document.coverUrl ? (
          <img
            src={document.coverUrl}
            alt={formatFileName(document.fileName)}
            className="w-full h-48 sm:h-52 lg:h-56 object-cover"
          />
        ) : (
          <div className="w-full h-48 sm:h-52 lg:h-56 bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
            <FaBook className="text-gray-400 text-4xl sm:text-5xl lg:text-6xl" />
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 lg:p-5 flex flex-col flex-grow">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 line-clamp-1">
          {formatFileName(document.fileName)}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">{document.author || '未知作者'}</p>
        <div className="mt-auto flex items-center text-xs sm:text-sm text-gray-500">
          <FaUsers className="mr-1.5" />
          <span>{(document.favoriteCount || 0).toLocaleString()}次收藏</span>
        </div>
      </div>
    </Link>
  );
}

export default BookCard;

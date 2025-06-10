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
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
            <FaBook className="text-gray-400 text-6xl" />
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {formatFileName(document.fileName)}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{document.author || '未知作者'}</p>
        <div className="mt-auto flex items-center text-sm text-gray-500">
          <FaUsers className="mr-2" />
          <span>{(document.learnerCount || 0).toLocaleString()}次收藏</span>
        </div>
      </div>
    </Link>
  );
}

export default BookCard;

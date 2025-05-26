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
      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      <div className="aspect-w-3 aspect-h-2">
        {document.coverUrl ? (
          <img
            src={document.coverUrl}
            alt={document.fileName}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <FaBook className="text-gray-400 text-5xl" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 truncate">{document.fileName}</h3>
        <p className="text-sm text-gray-600 mt-1">{document.author || '未知作者'}</p>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <FaUsers className="mr-1" />
          <span>{(document.learnerCount || 0).toLocaleString()}人学习</span>
        </div>
      </div>
    </Link>
  );
}

export default BookCard;

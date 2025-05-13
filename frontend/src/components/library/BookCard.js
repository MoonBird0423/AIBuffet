import React from 'react';
import { FaUsers } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function BookCard({ document }) {
  return (
    <Link
      to={`/documents/${document.id}`}
      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      <div className="aspect-w-3 aspect-h-2">
        <img
          src={document.coverUrl || 'https://via.placeholder.com/300x200'}
          alt={document.name}
          className="w-full h-48 object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 truncate">{document.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{document.author || '未知作者'}</p>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <FaUsers className="mr-1" />
          <span>{(document.learnerCount || 0).toLocaleString()}人学习</span>
        </div>
        {document.category && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {document.category}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default BookCard;

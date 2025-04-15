import React from 'react';
import { Link } from 'react-router-dom';
import { FaRobot, FaTrash, FaCalendarAlt, FaUsers } from 'react-icons/fa';

function MyKnowledgeCard({ id, title, documentCount, createdAt, visitors, gradient, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden group">
      {/* Knowledge Base Cover */}
      <Link to={`/knowledge/${id}`} className="block">
        <div className={`h-32 bg-gradient-to-r ${gradient} relative flex items-center justify-center`}>
          <div className="flex flex-col items-center justify-center text-white">
            <FaRobot className="text-4xl opacity-70" />
            <span className="mt-1 text-sm font-medium">{documentCount}个文档</span>
          </div>
          {/* Delete button - only shows on hover */}
          <button
            className="absolute top-2 right-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              if (window.confirm('确定要删除这个知识库吗？')) {
                onDelete(id);
              }
            }}
          >
            <FaTrash />
          </button>
        </div>
      </Link>
      {/* Knowledge Base Info */}
      <div className="p-4">
        <Link to={`/knowledge/${id}`} className="block">
          <h3 className="font-semibold text-lg text-gray-800 mb-4 truncate">{title}</h3>
        </Link>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <FaCalendarAlt className="mr-1" />
            <span>创建于 {createdAt}</span>
          </div>
          <div className="flex items-center">
            <FaUsers className="mr-1" />
            <span>{visitors}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyKnowledgeCard;

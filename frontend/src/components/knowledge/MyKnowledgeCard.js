import React from 'react';
import { Link } from 'react-router-dom';
import { FiDatabase, FiUsers, FiCalendar, FiTrash2 } from 'react-icons/fi';

const adjustColor = (color, amount) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  const newR = Math.min(255, r + amount);
  const newG = Math.min(255, g + amount);
  const newB = Math.min(255, b + amount);
  
  const newHex = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  return newHex;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
};

function MyKnowledgeCard({ id, title, documentCount, createdAt, visitors, colorMark, onDelete }) {
  const formattedDate = formatDate(createdAt);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden group">
      <Link to={`/knowledge/${id}`} className="block">
        <div 
          className="h-32 relative flex items-center justify-center"
          style={{ 
            background: colorMark 
              ? `linear-gradient(to right, ${colorMark}, ${adjustColor(colorMark, 20)})`
              : 'linear-gradient(to right, #4F46E5, #3B82F6)'
          }}
        >
          <div className="flex flex-col items-center justify-center text-white">
            <FiDatabase className="text-4xl opacity-70" />
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
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/knowledge/${id}`} className="block">
          <h3 className="font-semibold text-lg text-gray-800 mb-4 truncate">{title}</h3>
        </Link>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <FiCalendar className="mr-1" />
            <span>创建于 {formattedDate}</span>
          </div>
          <div className="flex items-center">
            <FiUsers className="mr-1" />
            <span>{visitors}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyKnowledgeCard;

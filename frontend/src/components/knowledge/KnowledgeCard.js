import React from 'react';
import { Link } from 'react-router-dom';
import { FiDatabase, FiUsers } from 'react-icons/fi';

const KnowledgeCard = ({ data }) => {
  const { 
    name, 
    docsCount, 
    creatorName, 
    creatorAvatar, 
    usageCount, 
    colorMark 
  } = data;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
      {/* Knowledge Base Cover */}
      <Link to="/knowledge-detail" className="block">
        <div 
          className="h-32 relative flex items-center justify-center"
          style={{ 
            backgroundColor: colorMark || '#4F46E5',
            backgroundImage: !colorMark ? 'linear-gradient(to right, #4F46E5, #3B82F6)' : 'none'
          }}
        >
          <div className="flex flex-col items-center justify-center text-white">
            <FiDatabase className="text-4xl opacity-70" />
            <span className="mt-1 text-sm font-medium">{docsCount}个文档</span>
          </div>
        </div>
      </Link>
      
      {/* Knowledge Base Info */}
      <div className="p-4">
        <Link to="/knowledge-detail" className="block">
          <h3 className="font-semibold text-lg text-gray-800 mb-4 truncate">{name}</h3>
        </Link>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <img 
              className="h-5 w-5 rounded-full mr-2 object-cover" 
              src={creatorAvatar || '/head.png'} 
              alt={creatorName}
            />
            <span className="truncate">{creatorName}</span>
          </div>
          <div className="flex items-center">
            <FiUsers className="mr-1" />
            <span>{usageCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCard;

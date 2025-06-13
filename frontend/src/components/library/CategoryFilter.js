import React from 'react';
import { DocumentCategory } from '../../services/api';
import { 
  FaGlobeAmericas, FaHeart, FaChartLine, FaChild, 
  FaBook, FaLaptopCode, FaUserTie, FaCoins, 
  FaHistory, FaBriefcase, FaHeartbeat, FaStar
} from 'react-icons/fa';

function CategoryFilter({ selectedCategory, onSelectCategory }) {
  const categoryIcons = {
    'all': FaGlobeAmericas,
    'MINDFULNESS': FaHeart,
    'PERSONAL_GROWTH': FaChartLine,
    'FAMILY_PARENTING': FaChild,
    'HUMANITIES_HISTORY': FaHistory,
    'FINANCE': FaCoins,
    'COMPUTER': FaLaptopCode,
    'CAREER_DEVELOPMENT': FaBriefcase,
    'BIOGRAPHY': FaUserTie,
    'HEALTHY_LIVING': FaHeartbeat,
    'PREMIUM_FICTION': FaStar,
    'OTHER': FaBook,
  };

  const categories = [
    { id: 'all', name: '全部分类' },
    ...Object.entries(DocumentCategory).map(([id, name]) => ({ id, name }))
  ];

  const getCategoryIcon = (categoryId) => {
    const IconComponent = categoryIcons[categoryId] || FaBook;
    return <IconComponent />;
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg sticky top-24">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <FaBook className="mr-3 text-blue-600" />
        图书分类
      </h2>
      <div className="space-y-2">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="mr-3">
              {getCategoryIcon(category.id)}
            </span>
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategoryFilter;

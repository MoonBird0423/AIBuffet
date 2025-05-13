import React from 'react';
import { DocumentCategory } from '../../services/api';

function CategoryFilter({ selectedCategory, onSelectCategory }) {
  const categories = [
    { id: 'all', name: '全部' },
    ...Object.entries(DocumentCategory).map(([id, name]) => ({ id, name }))
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-medium text-gray-900 mb-4">图书分类</h2>
      <ul>
        {categories.map(category => (
          <li key={category.id} className="mb-2">
            <button
              onClick={() => onSelectCategory(category.id)}
              className={`w-full text-left ${
                selectedCategory === category.id
                  ? 'text-indigo-600 font-medium'
                  : 'text-gray-600 hover:text-indigo-600'
              } flex items-center`}
            >
              <span
                className={`w-1 h-5 mr-2 rounded-r ${
                  selectedCategory === category.id ? 'bg-indigo-600' : 'bg-transparent'
                }`}
              />
              {category.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CategoryFilter;

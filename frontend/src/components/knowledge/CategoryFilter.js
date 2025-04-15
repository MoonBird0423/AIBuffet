import React from 'react';
import { FiChevronDown } from 'react-icons/fi';

const categories = [
  { id: 'all', name: '全部', active: true },
  { id: 'tech', name: '科技', active: false },
  { id: 'literature', name: '文学', active: false },
  { id: 'popular', name: '流行', active: false },
  { id: 'culture', name: '文化', active: false },
  { id: 'life', name: '生活', active: false },
  { id: 'business', name: '经管', active: false }
];

const sortOptions = [
  { value: 'latest', label: '最新' },
  { value: 'mostUsed', label: '最多人用' },
  { value: 'mostDocs', label: '最多文档' }
];

const CategoryTags = ({ activeCategory, onCategoryChange }) => {
  return (
    <ul className="flex flex-wrap text-sm font-medium">
      {categories.map(category => (
        <li key={category.id} className="mr-6">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onCategoryChange(category.id);
            }}
            className={`inline-block py-3 px-2 ${
              activeCategory === category.id
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            } font-medium`}
          >
            {category.name}
          </a>
        </li>
      ))}
    </ul>
  );
};

const SortSelect = ({ value, onChange }) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-gray-700 text-sm leading-4 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      >
        {sortOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <FiChevronDown className="text-xs" />
      </div>
    </div>
  );
};

const CategoryFilter = ({ activeCategory, onCategoryChange, sortValue, onSortChange }) => {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between">
      <CategoryTags activeCategory={activeCategory} onCategoryChange={onCategoryChange} />
      <SortSelect value={sortValue} onChange={onSortChange} />
    </div>
  );
};

export default CategoryFilter;

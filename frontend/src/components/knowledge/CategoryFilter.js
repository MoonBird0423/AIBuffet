import React from 'react';
import { FiChevronDown } from 'react-icons/fi';

// 与后端保持一致的分类枚举
const categories = [
  { id: 'all', name: '全部', value: null },
  { id: 'tech', name: '科技', value: 'TECH' },
  { id: 'literature', name: '文学', value: 'LITERATURE' },
  { id: 'popular', name: '流行', value: 'POPULAR' },
  { id: 'culture', name: '文化', value: 'CULTURE' },
  { id: 'life', name: '生活', value: 'LIFE' },
  { id: 'business', name: '经管', value: 'BUSINESS' }
];

// 与后端Category枚举保持一致
export const CategoryEnum = {
  TECH: 'TECH',
  LITERATURE: 'LITERATURE',
  POPULAR: 'POPULAR',
  CULTURE: 'CULTURE',
  LIFE: 'LIFE',
  BUSINESS: 'BUSINESS'
};

// 排序选项与后端对应
const sortOptions = [
  { value: 'latest', label: '最新' },
  { value: 'usage', label: '最多人用' },
  { value: 'docs', label: '最多文档' }
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
              onCategoryChange(category.value);
            }}
            className={`inline-block py-3 px-2 ${
              (category.value === null && activeCategory === null) || 
              category.value === activeCategory
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            } font-medium transition-colors duration-200`}
          >
            {category.name}
          </a>
        </li>
      ))}
    </ul>
  );
};

const SortSelect = ({ value, onChange, disabled }) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm leading-4 
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}
          transition-colors duration-200`}
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

const CategoryFilter = ({ activeCategory, onCategoryChange, sortValue, onSortChange, loading }) => {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between">
      <CategoryTags activeCategory={activeCategory} onCategoryChange={onCategoryChange} />
      <SortSelect value={sortValue} onChange={onSortChange} disabled={loading} />
    </div>
  );
};

export default CategoryFilter;

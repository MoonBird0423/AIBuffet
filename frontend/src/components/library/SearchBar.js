import React from 'react';
import { FaSearch } from 'react-icons/fa';

function SearchBar({ value, onChange }) {
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
        <FaSearch className="text-blue-600 text-xl transition-colors group-hover:text-blue-500 group-focus-within:text-blue-700" />
      </div>
      <input
        type="text"
        className="block w-full pl-14 pr-6 py-4 text-lg border-0 rounded-2xl bg-white/90 backdrop-blur-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white shadow-xl"
        placeholder="搜索图书名称..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default SearchBar;

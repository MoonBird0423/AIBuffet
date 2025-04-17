import React from 'react';
import { FiSearch } from 'react-icons/fi';

const SearchInput = ({ onChange }) => {
  const handleSearch = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative flex-grow">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
        <FiSearch className="text-gray-400" />
      </span>
      <input
        type="text"
        placeholder="搜索知识库"
        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        onChange={handleSearch}
      />
    </div>
  );
};

export default SearchInput;

import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

function ModelCard({ 
  name, 
  iconComponent: IconComponent,
  iconBgColor, 
  rating, 
  description, 
  tags,
  isSelected,
  onSelect 
}) {
  // 生成评分星星
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />);
      }
    }
    return stars;
  };

  // 获取标签背景颜色
  const getTagColor = (index) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-red-100 text-red-800',
      'bg-yellow-100 text-yellow-800',
      'bg-indigo-100 text-indigo-800'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden transition duration-300 ${
      isSelected ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:shadow-xl'
    }`}>
      <div className="p-6">
        <div className="flex items-center mb-3">
          <div className={`text-2xl mr-3 bg-${iconBgColor}-100 p-3 rounded-full`}>
            <IconComponent className={`text-${iconBgColor}-600`} />
          </div>
          <div>
            <h3 className="text-xl font-bold">{name}</h3>
            <div className="flex items-center">
              <div className="flex">
                {renderStars(rating)}
              </div>
              <span className="text-gray-600 text-sm ml-2">({rating}/5)</span>
            </div>
          </div>
          <div className="ml-auto">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(name)}
              className="rounded text-blue-500 focus:ring-blue-500 h-6 w-6 cursor-pointer"
            />
          </div>
        </div>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <span
              key={tag}
              className={`${getTagColor(index)} text-xs font-semibold px-2.5 py-0.5 rounded`}
            >
              {tag}
            </span>
          ))}
        </div>
        <button 
          className="text-blue-500 hover:text-blue-700 font-medium flex items-center transition duration-300"
          onClick={() => onSelect(name)}
        >
          {isSelected ? '取消选择' : '单独品尝'} 
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ModelCard;

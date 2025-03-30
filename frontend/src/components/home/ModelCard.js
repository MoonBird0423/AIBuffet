import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { getModelEmoji } from '../../config/defaultEmojis';

function ModelCard({
  name,
  emoji,
  rating,
  description,
  tags,
  purpose
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

  // 处理"立即尝鲜"按钮点击
  const handleTryClick = () => {
    const queryParams = new URLSearchParams({
      model: name,
      emoji: emoji || '',
      purpose: purpose || ''
    }).toString();
    window.open(`/chat?${queryParams}`, '_blank');
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition duration-300 hover:shadow-xl">
      <div className="p-8">
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-4 flex items-center justify-center w-14 h-14 bg-gray-50 rounded-full">
            {getModelEmoji(name, emoji)}
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">{name}</h3>
            <div className="flex items-center">
              <div className="flex">
                {renderStars(rating)}
              </div>
              <span className="text-gray-600 text-sm ml-2">({rating}/5)</span>
            </div>
          </div>
        </div>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="flex flex-wrap gap-2 mb-6">
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
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center transition duration-300"
          onClick={handleTryClick}
        >
          立即尝鲜
          <svg
            className="w-5 h-5 ml-2"
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

import React from 'react';
import { Link } from 'react-router-dom';

const foodEmojis = [
  { emoji: '🍎', style: { top: '15%', left: '10%' } },
  { emoji: '🍌', style: { top: '65%', left: '20%' } },
  { emoji: '🍞', style: { top: '25%', left: '85%' } },
  { emoji: '🍕', style: { top: '70%', left: '80%' } },
  { emoji: '🥗', style: { top: '40%', left: '30%' } },
  { emoji: '🍔', style: { top: '20%', left: '25%' } },
  { emoji: '🍣', style: { top: '75%', left: '55%' } },
  { emoji: '🥑', style: { top: '30%', left: '70%' } },
  { emoji: '🍇', style: { top: '50%', left: '15%' } },
  { emoji: '🥪', style: { top: '60%', left: '40%' } },
];

function Banner() {
  return (
    <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white py-16 relative overflow-hidden">
      {/* 食物emoji背景 */}
      <div className="absolute inset-0 z-0 opacity-15">
        {foodEmojis.map((food, index) => (
          <span
            key={index}
            className="absolute text-5xl transform hover:scale-110 transition-transform duration-300 animate-float"
            style={food.style}
          >
            {food.emoji}
          </span>
        ))}
      </div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <h1 className="text-5xl font-bold mb-4 animate-fadeIn">
          拿起您的餐盘，开启AI之旅！
        </h1>
        <p className="text-xl mb-8 animate-fadeIn delay-200">
          在一处探索、比较和了解前沿AI模型。
        </p>
        <div className="flex justify-center animate-fadeIn delay-400">
          <Link
            to="#models"
            className="bg-white text-blue-500 hover:bg-blue-50 font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 flex items-center"
          >
            探索AI模型
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
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Banner;

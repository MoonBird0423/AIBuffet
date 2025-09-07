import React from 'react';
import { openChatWindow } from '../../utils/chatWindowManager';
import { BookOpenIcon } from '@heroicons/react/24/outline';

function BookInfo({ bookData, onFavorite, onShare }) {
  // 如果没有数据，显示骨架屏
  if (!bookData) {
    return (
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-2 md:p-4 animate-pulse">
        <div className="flex flex-col lg:flex-row">          {/* 封面图片骨架 */}
          <div className="lg:w-1/3 p-4 md:p-8 flex justify-center">
            <div className="w-60 bg-gray-200/50 rounded-xl" style={{height: '360px'}} />
          </div>
          {/* 信息区域骨架 */}
          <div className="lg:w-2/3 p-4 md:p-8">
            <div className="h-8 bg-gray-200/50 rounded w-3/4 mb-4" />
            <div className="h-6 bg-gray-200/50 rounded w-1/4 mb-4" />
            <div className="h-4 bg-gray-200/50 rounded w-1/6 mb-6" />
            <div className="h-24 bg-gray-200/50 rounded w-full mb-6" />
            <div className="w-full md:w-auto">
              <div className="h-12 bg-gray-200/50 rounded-2xl w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-2 md:p-4">
      <div className="flex flex-col lg:flex-row">
        {/* 左侧封面图片 */}
        <div className="lg:w-1/3 p-4 md:p-8 flex justify-center">
          <div className="relative">
            {bookData.coverUrl ? (
              <img
                src={bookData.coverUrl}
                alt={bookData.fileName}
                className="w-40 md:w-60 object-cover rounded-xl shadow-2xl"
                style={{height: '240px md:360px'}}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`w-40 md:w-60 bg-white/20 backdrop-blur-sm rounded-xl shadow-2xl flex items-center justify-center ${bookData.coverUrl ? 'hidden' : ''}`}
              style={{height: '240px md:360px'}}
            >
              <BookOpenIcon className="h-12 md:h-20 w-12 md:w-20 text-white/70" />
            </div>
          </div>
        </div>

        {/* 右侧图书信息 */}
        <div className="lg:w-2/3 p-4 md:p-8">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4">{bookData.fileName}</h1>
            <p className="text-base md:text-xl text-white/80 mb-2">
              {bookData.author || '未知作者'}
            </p>
            <div className="flex items-center text-white/70 text-sm md:text-base">
              <i className="fas fa-heart mr-2"></i>
              <span>{(bookData.favoriteCount || 0).toLocaleString()}次收藏</span>
            </div>
          </div>

          <div className="prose max-w-none mb-4 md:mb-8">
            <p className="text-white/90 text-sm md:text-lg leading-relaxed">
              {bookData.description || '暂无简介'}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                openChatWindow({
                  type: 'book',
                  id: bookData.id,
                  name: bookData.fileName
                });
              }}
              className="flex-1 bg-white text-purple-600 px-4 md:px-8 py-3 md:py-4 rounded-2xl text-base md:text-lg font-semibold hover:bg-white/90 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <i className="fas fa-comments mr-2"></i>
              知识问答
            </button>
            
            {onFavorite && (
              <button
                onClick={onFavorite}
                className="bg-transparent border-2 border-white/50 text-white px-3 md:px-6 py-3 rounded-2xl text-base font-medium hover:bg-white hover:text-purple-600 hover:border-white transition-all duration-200"
                title="收藏到知识库"
              >
                <i className="fas fa-heart"></i>
                <span className="ml-2 hidden md:inline">收藏到知识库</span>
              </button>
            )}
            
            {onShare && (
              <button 
                onClick={onShare}
                className="bg-transparent border-2 border-white/50 text-white px-3 md:px-6 py-3 rounded-2xl text-base font-medium hover:bg-white hover:text-purple-600 hover:border-white transition-all duration-200"
                title="分享"
              >
                <i className="fas fa-share"></i>
                <span className="ml-2 hidden md:inline">分享</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookInfo;

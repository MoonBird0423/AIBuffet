import React from 'react';

function BookInfo({ bookData }) {
  // 如果没有数据，显示骨架屏
  if (!bookData) {
    return (
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-4 mb-6 animate-pulse">
        <div className="flex flex-col lg:flex-row">          {/* 封面图片骨架 */}
          <div className="lg:w-1/3 p-8 flex justify-center">
            <div className="w-60 bg-gray-200/50 rounded-xl" style={{height: '360px'}} />
          </div>
          {/* 信息区域骨架 */}
          <div className="lg:w-2/3 p-8">
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
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-4 mb-6">
      <div className="flex flex-col lg:flex-row">
        {/* 左侧封面图片 */}
        <div className="lg:w-1/3 p-8 flex justify-center">          <div className="relative">            <img
              src={bookData.coverUrl || 'https://via.placeholder.com/300x450'}
              alt={bookData.fileName}
              className="w-60 object-cover rounded-xl shadow-2xl"
              style={{height: '360px'}}
            />
          </div>
        </div>

        {/* 右侧图书信息 */}
        <div className="lg:w-2/3 p-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-white mb-4">{bookData.fileName}</h1>
            <p className="text-xl text-white/80 mb-2">
              {bookData.author || '未知作者'}
            </p>
            <div className="flex items-center text-white/70">
              <i className="fas fa-heart mr-2"></i>
              <span>{bookData.learnerCount || 0}次收藏</span>
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            <p className="text-white/90 text-lg leading-relaxed">
              {bookData.description || '暂无简介'}
            </p>
          </div>

          {/* CTA Button */}
          <button 
            onClick={() => {
              const chatUrl = `/chat?bookId=${bookData.id}&bookName=${encodeURIComponent(bookData.fileName)}`;
              window.open(chatUrl, '_blank');
            }}
            className="w-full md:w-auto bg-white text-purple-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-white/90 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <i className="fas fa-comments mr-2"></i>
            知识问答
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookInfo;

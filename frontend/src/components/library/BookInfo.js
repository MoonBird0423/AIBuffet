import React from 'react';

function BookInfo({ bookData }) {
  // 如果没有数据，显示骨架屏
  if (!bookData) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 animate-pulse">
        <div className="p-6 flex flex-col md:flex-row">
          {/* 封面图片骨架 */}
          <div className="md:w-1/4 flex justify-center mb-6 md:mb-0">
            <div className="w-48 h-64 bg-gray-200 rounded-md" />
          </div>
          {/* 信息区域骨架 */}
          <div className="md:w-3/4 md:pl-8">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/6 mb-6" />
            <div className="h-24 bg-gray-200 rounded w-full mb-6" />
            <div className="flex gap-4">
              <div className="h-10 bg-gray-200 rounded w-24" />
              <div className="h-10 bg-gray-200 rounded w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
      <div className="p-6 flex flex-col md:flex-row">
        {/* 左侧封面图片 */}
        <div className="md:w-1/4 flex justify-center mb-6 md:mb-0">
          <img
            src={bookData.coverUrl || 'https://via.placeholder.com/240x320'}
            alt={bookData.fileName}
            className="w-48 h-64 object-cover rounded-md shadow"
          />
        </div>

        {/* 右侧图书信息 */}
        <div className="md:w-3/4 md:pl-8">
          <h1 className="text-3xl font-bold text-gray-900">{bookData.fileName}</h1>
          
          <p className="text-lg text-gray-600 mt-2">
            {bookData.author || '未知作者'}
          </p>
          
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <i className="fas fa-user-friends mr-1"></i>
            <span>{bookData.learnerCount || 0}人使用</span>
          </div>
          
          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="text-gray-600">
              {bookData.description || '暂无简介'}
            </p>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-4">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <i className="fas fa-comments mr-2"></i>
              知识问答
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <i className="fas fa-plus mr-2"></i>
              收藏
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookInfo;

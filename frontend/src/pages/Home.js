import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      {/* 英雄区 */}
      <div className="relative min-h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
            alt="书籍阅读"
          />
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>
        <div className="relative z-0 max-w-7xl mx-auto">
          <div className="relative pt-10 pb-8 sm:pb-16 md:pb-20 lg:w-1/2 lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">每天学习一本书</span>
                  <span className="block text-indigo-300 xl:inline">成就更好的自己</span>
                </h1>
                <p className="mt-3 text-base text-gray-200 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  通过 DocuChat，获取深度解读、知识脑图、互动测试，让阅读更高效、知识更系统。
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link to="/my-knowledge" 
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                      上传图书
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link to="/library"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10">
                      浏览图书馆
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* 特性介绍 */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              为什么选择 DocuChat？
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              提供全方位的图书学习体验，让阅读和知识获取更高效
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <i className="fas fa-book"></i>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">书籍解读</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  书籍全面解读，快速了解核心观点，减少阅读时间，提高学习效率。
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <i className="fas fa-sitemap"></i>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">知识脑图</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  快速了解全书知识结构，建立系统化的知识体系，提高记忆和理解。
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <i className="fas fa-tasks"></i>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">知识测试</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  根据图书内容自动生成测试题目，检验对知识的掌握情况，强化学习成果。
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <i className="fas fa-comments"></i>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">知识问答</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  基于图书内容进行知识问答，解决阅读疑问，深化对书籍内容的理解。
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

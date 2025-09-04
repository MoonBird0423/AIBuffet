import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';

function Home() {
  useDocumentTitle('书意');
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      id: 0,
      image: "/知识问答.png",
      title: "知识问答",
      description: "互动问答体验"
    },
    {
      id: 1,
      image: "/语音解读.png",
      title: "语音解读",
      description: "深度语音解读体验"
    },
    {
      id: 2,
      image: "/知识脑图.png",
      title: "知识脑图",
      description: "系统化知识结构"
    },
    {
      id: 3,
      image: "/知识测试.png",
      title: "知识测试",
      description: "智能测试验证"
    }
  ];
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const showSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="font-sf">
      {/* Hero Section */}
      <section className="min-h-screen pt-12 md:pt-16 pb-6 md:pb-8 flex flex-col items-center justify-center relative overflow-hidden" style={{
        background: 'linear-gradient(180deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
        minHeight: '120vh'
      }}>
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Main Title */}
          <div className="mb-3 md:mb-4 mt-6 md:mt-8 max-w-6xl mx-auto">
            <h1 className="text-4xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
              <span className="text-white">问书答意</span>
              <span>，</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300">
                懂你所惑
              </span>
            </h1>
          </div>
          
          {/* Subtitle */}
          <div className="mb-3 md:mb-4 max-w-5xl mx-auto">
            <p className="text-lg lg:text-2xl text-white/90 leading-relaxed mx-auto font-light">
              AI生成语音解读、知识脑图、知识测试、知识问答，跨入高效阅读时代。
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="mb-6 md:mb-8 max-w-6xl mx-auto">
            <div className="flex flex-row items-center justify-center gap-4 md:gap-6">
              {/* Primary Button - 浏览图书馆 */}
              <Link to="/library">
                <button className="bg-white text-purple-600 px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg">
                  <i className="fas fa-book-open mr-2 text-purple-600"></i>
                  浏览图书
                </button>
              </Link>
              
              {/* Secondary Button - 上传图书 */}
              <Link to="/my-knowledge">
                <button className="group relative bg-white/10 backdrop-blur-xl text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-semibold border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-white/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 rounded-full transform -skew-x-12 group-hover:animate-pulse"></div>
                  <span className="relative flex items-center justify-center">
                    <i className="fas fa-upload mr-2 text-yellow-300"></i>
                    智能解读
                  </span>
                </button>
              </Link>
            </div>
          </div>

          {/* Product Interface Display */}
          <div className="relative max-w-7xl mx-auto mb-8">
            {/* Desktop Carousel */}
            <div className="hidden md:block">
              {/* Navigation Arrows */}
              <button 
                onClick={() => setCurrentSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1)}
                className="absolute left-8 top-1/2 transform -translate-y-1/2 z-30 bg-white/10 backdrop-blur-xl text-white p-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-xl hover:shadow-white/20 hover:scale-110"
              >
                <i className="fas fa-chevron-left text-xl"></i>
              </button>
              
              <button 
                onClick={() => setCurrentSlide((currentSlide + 1) % slides.length)}
                className="absolute right-8 top-1/2 transform -translate-y-1/2 z-30 bg-white/10 backdrop-blur-xl text-white p-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-xl hover:shadow-white/20 hover:scale-110"
              >
                <i className="fas fa-chevron-right text-xl"></i>
              </button>

              {/* Carousel Container */}
              <div className="relative h-[640px] flex items-center justify-center overflow-hidden">
                {slides.map((slide, index) => {
                  const isActive = index === currentSlide;
                  const isPrev = index === (currentSlide === 0 ? slides.length - 1 : currentSlide - 1);
                  const isNext = index === (currentSlide + 1) % slides.length;
                  
                  let transformClass = '';
                  let zIndexClass = '';
                  let opacityClass = '';
                  let scaleClass = '';
                  
                  if (isActive) {
                    transformClass = 'translate-x-0';
                    zIndexClass = 'z-20';
                    opacityClass = 'opacity-100';
                    scaleClass = 'scale-100';
                  } else if (isPrev) {
                    transformClass = '-translate-x-32';
                    zIndexClass = 'z-10';
                    opacityClass = 'opacity-60';
                    scaleClass = 'scale-90';
                  } else if (isNext) {
                    transformClass = 'translate-x-32';
                    zIndexClass = 'z-10';
                    opacityClass = 'opacity-60';
                    scaleClass = 'scale-90';
                  } else {
                    transformClass = 'translate-x-0';
                    zIndexClass = 'z-0';
                    opacityClass = 'opacity-0';
                    scaleClass = 'scale-75';
                  }

                  return (
                    <div 
                      key={slide.id}
                      className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${transformClass} ${zIndexClass} ${opacityClass} ${scaleClass}`}
                    >
                      <div className="relative w-full h-full flex items-center justify-center px-16">
                        <div className="relative w-full max-w-5xl">
                          <img 
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-auto object-contain rounded-3xl"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Slide Indicators */}
              <div className="flex justify-center mt-8 space-x-3">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-white shadow-lg scale-125' 
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Mobile Vertical Layout */}
            <div className="md:hidden space-y-4">
              {slides.map((slide, index) => (
                <div key={slide.id} className="relative">
                  <img 
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-auto object-contain rounded-2xl shadow-lg"
                  />
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-xl text-gray-800 px-4 py-2 rounded-full border border-gray-200">
                    <span className="text-sm font-medium">{slide.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20" style={{ backgroundColor: '#F2F2F7' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">为什么选择书意？</h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              AI伴读，直达书魂，30分钟读懂一本书。
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg transition-transform duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                <i className="fas fa-headphones text-xl md:text-2xl text-blue-600"></i>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">书籍解读</h3>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                书籍全面解读，能看也能听，快速了解核心观点，减少阅读时间，提高学习效率。
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg transition-transform duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                <i className="fas fa-project-diagram text-xl md:text-2xl text-green-600"></i>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">知识脑图</h3>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                快速了解全书知识结构，建立系统化的知识体系，提高记忆和理解。
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg transition-transform duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                <i className="fas fa-tasks text-xl md:text-2xl text-purple-600"></i>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">知识测试</h3>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                根据图书内容自动生成测试题目，检验对知识的掌握情况，强化学习成果。
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg transition-transform duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                <i className="fas fa-comments text-xl md:text-2xl text-orange-600"></i>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">知识问答</h3>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                基于图书内容进行知识问答，解决阅读疑问，深化对书籍内容的理解。
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-12 md:mt-16">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">准备开始您的智能阅读之旅？</h3>
              <p className="text-lg md:text-xl text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto">
                加入千万用户，体验AI驱动的高效阅读方式
              </p>
              <Link to="/login">
                <button className="bg-white text-purple-600 px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg">
                  <i className="fas fa-rocket mr-2"></i>
                  立即加入
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

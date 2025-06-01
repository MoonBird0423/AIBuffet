import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      id: 0,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&crop=face",
      title: "语音解读",
      description: "深度语音解读体验"
    },
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop",
      title: "知识脑图",
      description: "系统化知识结构"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1606868306217-dbf5046868d2?w=800&h=600&fit=crop",
      title: "知识测试",
      description: "智能测试验证"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop",
      title: "知识问答",
      description: "互动问答体验"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const showSlide = (index) => {
    setCurrentSlide(index);
  };

  return (    <div className="font-sf">
      {/* Hero Section */}      <section className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-2 text-center lg:text-left">
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                问书答意<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">懂你所惑</span>
              </h1>
              <p className="text-xl lg:text-2xl text-white/90 mb-8 leading-relaxed">
                通过 DocuChat 获取深度语音文字解读、知识脑图、知识测试、知识问答，跨入高效阅读时代。
              </p>
              <button className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg">
                <i className="fas fa-book-open mr-2"></i>
                <Link to="/library" className="text-blue-600">浏览图书馆</Link>
              </button>
            </div>

            {/* Right Carousel */}
            <div className="lg:col-span-3 relative">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
                <div className="relative h-[500px] rounded-2xl overflow-hidden">
                  {slides.map((slide, index) => (
                    <div 
                      key={slide.id}
                      className={`absolute inset-0 transition-opacity duration-500 ${
                        index === currentSlide ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <img 
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl"></div>
                      <div className="absolute bottom-6 left-6">
                        <h3 className="text-white text-2xl font-bold">{slide.title}</h3>
                        <p className="text-white/80">{slide.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Carousel Controls */}
                <div className="flex justify-center space-x-3 mt-6">
                  {slides.map((_, index) => (
                    <button 
                      key={index}
                      className={`w-3 h-3 rounded-full bg-white transition-opacity ${
                        index === currentSlide ? 'opacity-100' : 'opacity-30'
                      }`}
                      onClick={() => showSlide(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" style={{ backgroundColor: '#F2F2F7' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">为什么选择DocuChat？</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AI伴读，直达书魂，30分钟读懂一本书。
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-8 shadow-lg transition-transform duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <i className="fas fa-headphones text-2xl text-blue-600"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">书籍解读</h3>
              <p className="text-gray-600 leading-relaxed">
                书籍全面解读，能看也能听，快速了解核心观点，减少阅读时间，提高学习效率。
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-8 shadow-lg transition-transform duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <i className="fas fa-project-diagram text-2xl text-green-600"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">知识脑图</h3>
              <p className="text-gray-600 leading-relaxed">
                快速了解全书知识结构，建立系统化的知识体系，提高记忆和理解。
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-8 shadow-lg transition-transform duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <i className="fas fa-tasks text-2xl text-purple-600"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">知识测试</h3>
              <p className="text-gray-600 leading-relaxed">
                根据图书内容自动生成测试题目，检验对知识的掌握情况，强化学习成果。
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-3xl p-8 shadow-lg transition-transform duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6">
                <i className="fas fa-comments text-2xl text-orange-600"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">知识问答</h3>
              <p className="text-gray-600 leading-relaxed">
                基于图书内容进行知识问答，解决阅读疑问，深化对书籍内容的理解。
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
              <h3 className="text-3xl font-bold mb-4">准备开始您的智能阅读之旅？</h3>              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                加入千万用户，体验AI驱动的高效阅读方式
              </p>
              <Link to="/login">
                <button className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg">
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

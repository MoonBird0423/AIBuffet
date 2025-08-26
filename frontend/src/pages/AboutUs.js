import React from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';

function AboutUs() {
  useDocumentTitle('关于我们 - 书意');

  return (
    <div className="min-h-screen flex flex-col font-sf">
      {/* Hero Section */}
      <section className="pt-20 pb-6" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              关于我们
            </h1>
            <p className="text-xl text-white/90">
              专注软件开发领域的专业机构
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow pb-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 主要内容 */}
          <div className="space-y-8">
            {/* 公司介绍卡片 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 hover:shadow-xl transition-shadow duration-300">
              <div className="space-y-6">
                
                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                  <p className="text-lg mb-6">
                    郫都区征鸿于野软件开发工作室（个体工商户）是一家专注于软件开发领域的专业机构，工作室团队拥有超过10年的从业经验，致力于为客户提供高效、可靠的软件解决方案。
                  </p>
                  
                  <p className="text-lg mb-6">
                    我们擅长人工智能应用开发、软件外包服务、信息系统集成以及互联网数据服务，已成功交付多个AI落地项目，覆盖工业互联网、信息安全、数据处理等多个前沿领域。
                  </p>
                  
                  <p className="text-lg">
                    公司以技术实力和项目质量为核心，坚持"技术驱动创新"的理念。我们提供从技术咨询、定制开发到系统部署的全流程服务，注重技术创新与实用性结合，为客户提供可持续的数字化支持。
                  </p>
                </div>
              </div>
            </div>

            {/* 联系信息卡片 */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* 地址信息 */}
              <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">公司地址</h3>
                    <p className="text-gray-600 leading-relaxed">
                      成都市郫都区红光街道红高路88号综合楼栋1单元5楼504号
                    </p>
                  </div>
                </div>
              </div>

              {/* 联系方式 */}
              <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">联系方式</h3>
                    <a 
                      href="tel:19108289850" 
                      className="text-blue-600 hover:text-blue-700 font-medium text-lg transition-colors duration-200"
                    >
                      19108289850
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部装饰 */}
            <div className="text-center pt-8">
              <div className="inline-flex items-center space-x-2 text-gray-500">
                <div className="w-8 h-px bg-gray-300"></div>
                <span className="text-sm font-medium">感谢您的关注</span>
                <div className="w-8 h-px bg-gray-300"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AboutUs;

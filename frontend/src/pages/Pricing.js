import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PurchaseModal from '../components/common/PurchaseModal';

function Pricing() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('vip');

  const handleOpenModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleCloseModal = () => setModalOpen(false);

  return (
    <div className="font-sans min-h-screen relative overflow-hidden" style={{
        background: 'linear-gradient(180deg, #667eea 0%, #764ba2 50%, #667eea 100%)'
      }}>
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      {/* 会员介绍区 */}
      <section className="pt-32 pb-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white text-center mb-12">升级VIP会员，尽享AI智能</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 普通注册用户卡片 */}
            <div className="rounded-3xl p-8 text-center shadow-xl bg-gradient-to-r from-green-400 to-blue-500">
              <h2 className="text-2xl font-bold text-white mb-2">普通用户</h2>
              <div className="text-4xl font-bold text-white mb-2">免费</div>
              <button className="text-lg font-semibold bg-white text-blue-600 rounded-full px-8 py-3 hover:bg-gray-100 transition mb-6">立即注册</button>
              <ul className="text-white text-left space-y-3 mt-6">
                <li><i className="fas fa-check text-green-400 mr-2"></i>100+精品图书文字解读</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>100+精品图书语音解读</li>
              </ul>
            </div>

            {/* VIP用户卡片 */}
            <div className="rounded-3xl p-8 text-center shadow-2xl border-4 border-white scale-105 bg-gradient-to-r from-blue-600 to-purple-600">
              <h2 className="text-2xl font-bold text-white mb-2">VIP会员</h2>
              <div className="text-4xl font-bold text-white mb-2">低至9.9元/月</div>
              <button className="text-lg font-semibold bg-white text-purple-600 rounded-full px-8 py-3 hover:bg-gray-100 transition mb-6" onClick={() => handleOpenModal('vip')}>立即购买</button>
              <ul className="text-white text-left space-y-3 mt-6">
                <li><i className="fas fa-check text-green-400 mr-2"></i>100+精品图书文字解读</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>100+精品图书语音解读</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>100+精品图书脑图</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>100+精品图书测试题</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>100本/月-图书上传</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>10次/月-AI文字解读</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>5次/月-AI语音生成</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>10次/月-AI脑图生成</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>10次/月-AI测试题生成</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>无限次-图书知识问答</li>
              </ul>
            </div>

            {/* SVIP用户卡片 */}
            <div className="rounded-3xl p-8 text-center shadow-xl bg-gradient-to-r from-yellow-400 to-red-500">
              <h2 className="text-2xl font-bold text-white mb-2">SVIP会员</h2>
              <div className="text-4xl font-bold text-white mb-2">低至19.9元/月</div>
              <button className="text-lg font-semibold bg-white text-orange-600 rounded-full px-8 py-3 hover:bg-gray-100 transition mb-6" onClick={() => handleOpenModal('svip')}>立即购买</button>
              <ul className="text-white text-left space-y-3 mt-6">
                <li><i className="fas fa-check text-green-400 mr-2"></i>100+精品图书文字解读</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>100+精品图书语音解读</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>100+精品图书脑图</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>100+精品图书测试题</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>200本/月-图书上传</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>20次/月-AI文字解读</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>10次/月-AI语音生成</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>20次/月-AI脑图生成</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>20次/月-AI测试题生成</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>无限次-图书知识问答</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>无限次-知识库问答</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 权益对比区 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">会员权益对比</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-2xl shadow-xl text-center">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-4 px-2 text-lg font-semibold">权益</th>
                  <th className="py-4 px-2 text-lg font-semibold">普通用户</th>
                  <th className="py-4 px-2 text-lg font-semibold">VIP用户</th>
                  <th className="py-4 px-2 text-lg font-semibold">SVIP用户</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr>
                  <td className="py-3 px-2">热门图书文字解读</td>
                  <td><i className="fas fa-check text-green-400"></i></td>
                  <td><i className="fas fa-check text-green-400"></i></td>
                  <td><i className="fas fa-check text-green-400"></i></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-2">热门图书语音解读</td>
                  <td><i className="fas fa-check text-green-400"></i></td>
                  <td><i className="fas fa-check text-green-400"></i></td>
                  <td><i className="fas fa-check text-green-400"></i></td>
                </tr>
                <tr>
                  <td className="py-3 px-2">热门图书脑图</td>
                  <td><i className="fas fa-times text-gray-300"></i></td>
                  <td><i className="fas fa-check text-green-400"></i></td>
                  <td><i className="fas fa-check text-green-400"></i></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-2">热门图书知识测试题</td>
                  <td><i className="fas fa-times text-gray-300"></i></td>
                  <td><i className="fas fa-check text-green-400"></i></td>
                  <td><i className="fas fa-check text-green-400"></i></td>
                </tr>
                <tr>
                  <td className="py-3 px-2">上传图书</td>
                  <td><i className="fas fa-times text-gray-300"></i></td>
                  <td>100本/月</td>
                  <td>200本/月</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-2">生成对话式文字解读</td>
                  <td><i className="fas fa-times text-gray-300"></i></td>
                  <td>10次/月</td>
                  <td>20次/月</td>
                </tr>
                <tr>
                  <td className="py-3 px-2">生成对话式语音解读</td>
                  <td><i className="fas fa-times text-gray-300"></i></td>
                  <td>5次/月</td>
                  <td>10次/月</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-2">生成核心知识脑图</td>
                  <td><i className="fas fa-times text-gray-300"></i></td>
                  <td>10次/月</td>
                  <td>20次/月</td>
                </tr>
                <tr>
                  <td className="py-3 px-2">生成核心知识测试题</td>
                  <td><i className="fas fa-times text-gray-300"></i></td>
                  <td>10次/月</td>
                  <td>20次/月</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-2">图书问答</td>
                  <td><i className="fas fa-times text-gray-300"></i></td>
                  <td><span className="text-green-600 font-bold">不限次数</span></td>
                  <td><span className="text-green-600 font-bold">不限次数</span></td>
                </tr>
                <tr>
                  <td className="py-3 px-2">知识库问答</td>
                  <td><i className="fas fa-times text-gray-300"></i></td>
                  <td><i className="fas fa-times text-gray-300"></i></td>
                  <td><span className="text-green-600 font-bold">不限次数</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <PurchaseModal open={modalOpen} onClose={handleCloseModal} defaultType={modalType} />
    </div>
  );
}

export default Pricing;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { FaArrowLeft } from 'react-icons/fa';
import { createKnowledgeBase } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ToastManager } from '../components/common/Toast';

const CATEGORIES = [
  { label: '科技', value: 'TECH' },
  { label: '文学', value: 'LITERATURE' },
  { label: '流行', value: 'POPULAR' },
  { label: '文化', value: 'CULTURE' },
  { label: '生活', value: 'LIFE' },
  { label: '经管', value: 'BUSINESS' }
];
const DEFAULT_COLOR = '#3b82f6';

function CreateKnowledge() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'PRIVATE',
    category: '',
    colorMark: DEFAULT_COLOR
  });
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('创建知识库，提交数据:', formData);
      const requestData = {
        ...formData,
        visibility: formData.visibility.toUpperCase()
      };
      
      const response = await createKnowledgeBase(requestData);
      if (response.code === 200) {
        ToastManager.success('知识库创建成功');
        navigate('/my-knowledge');
      } else {
        console.error('创建知识库失败:', response.message);
        ToastManager.error(response.message || '创建失败');
      }
    } catch (error) {
      console.error('创建知识库出错:', error);
      ToastManager.error(error.message || '创建失败，请重试');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link to="/my-knowledge" className="text-blue-600 hover:text-blue-800 inline-flex items-center">
            <FaArrowLeft className="mr-2" /> 返回知识库列表
          </Link>
        </div>
        
        {/* 创建知识库表单 */}
        <div className="bg-white rounded-xl shadow-sm max-w-3xl mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">创建新知识库</h1>
          
          <form onSubmit={handleSubmit}>
            {/* 知识库名称 */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                知识库名称 <span className="text-red-500">*</span>
              </label>
              <input
                className="appearance-none border border-gray-300 rounded-md w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                id="name"
                name="name"
                type="text"
                placeholder="输入知识库名称"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <p className="text-sm text-gray-500 mt-1">名称应简洁明了，反映知识库的主要内容</p>
            </div>
            
            {/* 知识库描述 */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                知识库描述
              </label>
              <textarea
                className="appearance-none border border-gray-300 rounded-md w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                id="description"
                name="description"
                rows="3"
                placeholder="输入知识库描述（可选）"
                value={formData.description}
                onChange={handleInputChange}
              ></textarea>
            </div>
            
            {/* 可见性选项 */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                可见性
              </label>
              <div className="flex items-start space-x-6">
                <div className="flex items-start">
                  <input
                    type="radio"
                    id="private"
                    name="visibility"
                    value="PRIVATE"
                    className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300"
                    checked={formData.visibility === 'PRIVATE'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="private" className="ml-2 block text-gray-700">
                    私有
                    <span className="text-sm text-gray-500 block">仅自己可访问</span>
                  </label>
                </div>
                <div className="flex items-start">
                  <input
                    type="radio"
                    id="public"
                    name="visibility"
                    value="PUBLIC"
                    className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300"
                    checked={formData.visibility === 'PUBLIC'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="public" className="ml-2 block text-gray-700">
                    公开
                    <span className="text-sm text-gray-500 block">所有人可访问</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* 知识库分类 - 仅在公开时显示 */}
            {formData.visibility === 'PUBLIC' && (
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                  分类
                </label>
                <div className="relative">
                  <select
                    className="appearance-none border border-gray-300 rounded-md w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="" disabled>选择分类</option>
                    {CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            
            {/* 标识颜色 */}
            <div className="mb-8">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                标识颜色
              </label>
              <div className="relative">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                >
                  <div 
                    className="h-8 w-16 rounded-md border border-gray-300"
                    style={{ backgroundColor: formData.colorMark }}
                  ></div>
                  <span className="ml-3 text-sm text-gray-600">{formData.colorMark}</span>
                </div>
                
                {showColorPicker && (
                  <div className="absolute z-10 mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
                    <div className="grid grid-cols-10 gap-2 mb-3">
                      {[
                        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
                        '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
                        '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
                        '#ec4899', '#f43f5e', '#6b7280', '#374151', '#64748b'
                      ].map(color => (
                        <div
                          key={color}
                          className="h-6 w-6 rounded-md cursor-pointer"
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, colorMark: color }));
                            setShowColorPicker(false);
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 提交按钮 */}
            <div className="flex justify-end space-x-4">
              <Link 
                to="/my-knowledge"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </Link>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                创建知识库
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateKnowledge;

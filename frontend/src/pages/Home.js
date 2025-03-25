import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Banner from '../components/home/Banner';
import ModelCard from '../components/home/ModelCard';
import Features from '../components/home/Features';
import Footer from '../components/layout/Footer';
import { queryModels } from '../services/api';

function Home() {
  const [selectedModels, setSelectedModels] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      const data = await queryModels();
      const modelsWithTags = data.map(model => ({
        ...model,
        tags: model.purpose ? model.purpose.split(',') : []
      }));
      setModels(modelsWithTags);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const navigate = useNavigate();
  
  const handleModelSelect = (modelName) => {
    setSelectedModels(prev => {
      const isSelected = prev.includes(modelName);
      if (isSelected) {
        return prev.filter(name => name !== modelName);
      } else {
        if (prev.length >= 3) {
          alert('最多只能选择3个模型进行比较！');
          return prev;
        }
        return [...prev, modelName];
      }
    });
  };

  const handleComparisonClick = () => {
    if (selectedModels.length > 0) {
      const queryString = selectedModels.join(',');
      navigate(`/comparison?models=${queryString}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Banner />
      
      <div id="models" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">精选AI模型</h2>
        <p className="text-center text-gray-600 mb-6">选择最多3个模型进行比较，查看它们如何回应您的问题。</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full text-center py-8">加载中...</div>
          ) : models.length === 0 ? (
            <div className="col-span-full text-center py-8">没有找到匹配的模型</div>
          ) : (
            models.map((model) => (
              <ModelCard
                key={model.name}
                {...model}
                isSelected={selectedModels.includes(model.name)}
                onSelect={handleModelSelect}
              />
            ))
          )}
        </div>

        <div className="mt-12 text-center">
          <button 
            onClick={handleComparisonClick}
            disabled={selectedModels.length === 0}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 inline-flex items-center ${
              selectedModels.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            比较选定模型
          </button>
          <p className="text-gray-500 mt-3 text-sm">
            已选择 {selectedModels.length}/3 个模型
          </p>
        </div>
      </div>

      <Features />
      <Footer />
    </div>
  );
}

export default Home;

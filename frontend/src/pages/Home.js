import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/layout/Navbar';
import Banner from '../components/home/Banner';
import ModelCard from '../components/home/ModelCard';
import Features from '../components/home/Features';
import Footer from '../components/layout/Footer';
import { queryModels } from '../services/api';

function Home() {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Banner />
      
      <div id="models" className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">精选AI模型</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
            <div className="col-span-full text-center py-8">加载中...</div>
          ) : models.length === 0 ? (
            <div className="col-span-full text-center py-8">没有找到匹配的模型</div>
          ) : (
            models.map((model) => (
              <ModelCard
                key={model.name}
                {...model}
              />
            ))
          )}
        </div>
      </div>

      <Features />
      <Footer />
    </div>
  );
}

export default Home;

import React from 'react';
import { 
  FaExchangeAlt, 
  FaGraduationCap, 
  FaUsers 
} from 'react-icons/fa';

const features = [
  {
    icon: FaExchangeAlt,
    title: "并排比较",
    description: "查看不同AI模型对同一提示的回应，并高亮显示差异以便于比较。"
  },
  {
    icon: FaGraduationCap,
    title: "边用边学",
    description: "获取资源，了解AI模型的工作原理、优势和理想使用场景。"
  },
  {
    icon: FaUsers,
    title: "社区见解",
    description: "加入与其他用户的讨论，分享经验，发现利用AI技术的新方法。"
  }
];

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-md transform hover:scale-105 transition duration-300">
      <div className="text-blue-500 text-4xl mb-4">
        <Icon />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function Features() {
  return (
    <div className="bg-gray-100 py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          为什么选择AI自助餐？
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Features;

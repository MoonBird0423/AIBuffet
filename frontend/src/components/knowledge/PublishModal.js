import React, { useState } from 'react';
import Modal from '../common/Modal';

function PublishModal({ isOpen, onClose, onSuccess, fileName }) {
  const [currentStep, setCurrentStep] = useState(1);
  
  const steps = [
    { number: 1, text: '基本信息' },
    { number: 2, text: '生成解读' },
    { number: 3, text: '生成脑图' },
    { number: 4, text: '生成测试' }
  ];
  
  const [progress, setProgress] = useState({
    step2: 0,
    step3: 0,
    step4: 0
  });

  const renderStepIndicators = () => (
    <div className="p-4 bg-gray-50">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex-1 relative">
            <div className={`h-0.5 absolute left-0 top-1/2 transform -translate-y-1/2 w-full
              ${currentStep >= step.number ? 'bg-indigo-600' : 'bg-gray-200'}`}
            />
            <div className={`rounded-full h-8 w-8 flex items-center justify-center relative z-10 mx-auto
              ${currentStep >= step.number ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              {step.number}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-sm mt-2 text-gray-500">
        {steps.map(step => (
          <span 
            key={step.number}
            className={currentStep === step.number ? 'text-indigo-600 font-medium' : ''}
          >
            {step.text}
          </span>
        ))}
      </div>
    </div>
  );

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      // 模拟进度更新
      if (currentStep === 1) {
        simulateProgress('step2');
      } else if (currentStep === 2) {
        simulateProgress('step3');
      } else if (currentStep === 3) {
        simulateProgress('step4');
      }
    } else {
      onSuccess();
      onClose();
    }
  };

  const simulateProgress = (step) => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(prev => ({
        ...prev,
        [step]: Math.min(currentProgress, 100)
      }));
      
      if (currentProgress >= 100) {
        clearInterval(interval);
      }
    }, 100);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="w-32 h-44 bg-gray-100 flex items-center justify-center rounded border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="mt-1 text-sm text-gray-500">上传封面</p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">图书名称</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={fileName}
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">简介</label>
              <textarea
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="请输入图书简介..."
              />
            </div>
          </div>
        );
      case 2:
      case 3:
      case 4:
        const stepConfig = {
          2: {
            title: '生成解读',
            icon: 'M13 10V3L4 14h7v7l9-11h-7z',
            progressKey: 'step2'
          },
          3: {
            title: '生成脑图',
            icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
            progressKey: 'step3'
          },
          4: {
            title: '生成测试',
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
            progressKey: 'step4'
          }
        }[currentStep];

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="text-lg font-medium text-gray-900 mb-2">正在{stepConfig.title}</h4>
              <p className="text-gray-500">系统正在处理中，请稍候...</p>
            </div>
            
            <div className="bg-gray-50 rounded-md p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stepConfig.icon} />
                  </svg>
                </div>
                <div className="ml-3 w-full">
                  <h5 className="text-sm font-medium text-gray-900">处理进度</h5>
                  <div className="mt-1 relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${progress[stepConfig.progressKey]}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                      />
                    </div>
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {progress[stepConfig.progressKey]}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const footer = (
    <>
      {currentStep > 1 && (
        <button
          onClick={() => setCurrentStep(currentStep - 1)}
          className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          上一步
        </button>
      )}
      <button
        onClick={handleNextStep}
        className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {currentStep === 4 ? '完成发布' : '下一步'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="发布图书"
      footer={footer}
      width="5xl"
    >
      {renderStepIndicators()}
      <div className="p-6">
        {renderStepContent()}
      </div>
    </Modal>
  );
}

export default PublishModal;

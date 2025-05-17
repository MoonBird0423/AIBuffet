import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { updateDocument, updateDocumentPublishStatus, DocumentCategory, getDocument } from '../../services/api';
import { ToastManager } from '../common/Toast';
import Select from '../common/Select';

function PublishModal({ isOpen, onClose, onSuccess, fileName, documentId }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fileName: fileName || '',
    author: '',
    description: '',
    coverFile: null,
    coverPreview: null,
    category: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors({...errors, cover: '封面图片大小不能超过2MB'});
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrors({...errors, cover: '只支持JPG、PNG、WEBP格式的图片'});
        return;
      }
      setFormData({
        ...formData, 
        coverFile: file,
        coverPreview: URL.createObjectURL(file)
      });
      setErrors({...errors, cover: null});
    }
  };

  useEffect(() => {
    const loadDocumentInfo = async () => {
      try {
        const doc = await getDocument(documentId);
        setFormData(prev => ({
          ...prev,
          fileName: doc.fileName || '',
          author: doc.author || '',
          description: doc.description || '',
          category: doc.category || '',
          coverPreview: doc.coverUrl
        }));
      } catch (error) {
        ToastManager.error('加载文档信息失败');
      }
    };
    
    if (documentId) {
      loadDocumentInfo();
    }
  }, [documentId]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fileName.trim()) newErrors.fileName = '请输入图书名称';
    if (!formData.author.trim()) newErrors.author = '请输入作者';
    if (!formData.description.trim()) newErrors.description = '请输入简介';
    if (!formData.category) newErrors.category = '请选择分类';
    if (!formData.coverFile && !formData.coverPreview) newErrors.cover = '请上传封面';
    return newErrors;
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

  const handleNextStep = async () => {
    if (currentStep === 1) {
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setErrors(errors);
        return;
      }
      
      try {
        setIsUploading(true);
        const formDataObj = new FormData();
        if (formData.coverFile) {
          formDataObj.append('cover', formData.coverFile);
        }
        formDataObj.append('fileName', formData.fileName);
        formDataObj.append('author', formData.author);
        formDataObj.append('description', formData.description);
        formDataObj.append('category', formData.category);
        
        await updateDocument(documentId, formDataObj);
        setCurrentStep(currentStep + 1);
        simulateProgress('step2');
      } catch (error) {
        ToastManager.error('保存失败：' + (error.response?.data?.message || error.message));
      } finally {
        setIsUploading(false);
      }
    } else if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      if (currentStep === 2) {
        simulateProgress('step3');
      } else if (currentStep === 3) {
        simulateProgress('step4');
      }
    } else {
      try {
        await updateDocumentPublishStatus(documentId, 'PUBLISHED');
        onSuccess();
        onClose();
      } catch (error) {
        ToastManager.error('发布失败：' + (error.response?.data?.message || error.message));
      }
    }
  };

  const renderStepIndicators = () => (
    <div className="p-4 bg-gray-50">
      <div className="grid grid-cols-4 gap-4">
        {steps.map((step) => (
          <div key={step.number} className="flex-1">
            <div 
              className={`h-12 flex items-center rounded-md shadow-sm transition-all duration-200 ease-in-out
                ${currentStep >= step.number ? 'bg-indigo-400' : 'bg-gray-100'}`}
            >
              <div className={`flex items-center px-4 
                ${currentStep >= step.number ? 'text-white' : 'text-gray-500'}`}>
                <span className="font-medium mr-3">{step.number}</span>
                <span className="text-sm whitespace-nowrap">{step.text}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* 封面上传 */}
            <div className="flex items-center justify-center">
              <label className="w-32 h-44 bg-gray-100 flex items-center justify-center rounded border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
                {formData.coverPreview ? (
                  <img
                    src={formData.coverPreview}
                    alt="预览"
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="mt-1 text-sm text-gray-500">上传封面</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
            {errors.cover && <p className="text-red-500 text-sm text-center">{errors.cover}</p>}
            
            {/* 图书名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">图书名称</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm custom-select"
                value={formData.fileName}
                onChange={e => setFormData({...formData, fileName: e.target.value})}
              />
              {errors.fileName && <p className="text-red-500 text-sm">{errors.fileName}</p>}
            </div>
            
            {/* 作者 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">作者</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.author}
                onChange={e => setFormData({...formData, author: e.target.value})}
              />
              {errors.author && <p className="text-red-500 text-sm">{errors.author}</p>}
            </div>
            
            {/* 简介 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">简介</label>
              <textarea
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="请输入图书简介..."
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>

            {/* 分类 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">分类</label>
              <Select
                options={Object.entries(DocumentCategory).map(([key, value]) => ({
                  value: key,
                  label: value
                }))}
                value={formData.category}
                onChange={value => setFormData({...formData, category: value})}
                placeholder="请选择分类"
                error={errors.category}
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
    <div className="flex justify-end gap-2">
      {currentStep > 1 && (
        <button
          onClick={() => setCurrentStep(currentStep - 1)}
          className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          上一步
        </button>
      )}
      <button
        onClick={handleNextStep}
        disabled={isUploading}
        className={`px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
          ${isUploading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
      >
        {isUploading ? '保存中...' : currentStep === 4 ? '完成发布' : '下一步'}
      </button>
    </div>
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

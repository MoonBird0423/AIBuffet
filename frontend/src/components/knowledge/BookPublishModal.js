import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { updateDocument, updateDocumentPublishStatus, DocumentCategory, getDocument } from '../../services/api';
import { ToastManager } from '../common/Toast';
import Select from '../common/Select';

function BookPublishModal({ isOpen, onClose, onSuccess, fileName, documentId }) {
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

  // 监听弹窗打开状态，加载文档信息
  useEffect(() => {
    if (isOpen && documentId) {
      // 重置状态
      setErrors({});
      setIsUploading(false);
      
      // 加载文档信息
      const loadDocumentInfo = async () => {
        try {
          const doc = await getDocument(documentId);
          setFormData({
            fileName: doc.fileName || '',
            author: doc.author || '',
            description: doc.description || '',
            category: doc.category || '',
            coverFile: null,
            coverPreview: doc.coverUrl
          });
        } catch (error) {
          ToastManager.error('加载文档信息失败');
        }
      };
      
      loadDocumentInfo();
    }
  }, [isOpen, documentId]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fileName.trim()) newErrors.fileName = '请输入图书名称';
    if (!formData.author.trim()) newErrors.author = '请输入作者';
    if (!formData.description.trim()) newErrors.description = '请输入简介';
    if (!formData.category) newErrors.category = '请选择分类';
    if (!formData.coverFile && !formData.coverPreview) newErrors.cover = '请上传封面';
    return newErrors;
  };

  const handlePublish = async () => {
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
      await updateDocumentPublishStatus(documentId, 'PUBLISHED');
      ToastManager.success('图书发布成功');
      onSuccess();
      onClose();
    } catch (error) {
      ToastManager.error('发布失败：' + (error.response?.data?.message || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <button
        onClick={onClose}
        disabled={isUploading}
        className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        取消
      </button>
      <button
        onClick={handlePublish}
        disabled={isUploading}
        className={`px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
          ${isUploading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
      >
        {isUploading ? '发布中...' : '发布'}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="发布图书"
      footer={footer}
      width="2xl"
    >
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
    </Modal>
  );
}

export default BookPublishModal;

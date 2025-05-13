import React, { useState } from 'react';
import Modal from '../common/Modal';
import Popover from '../common/Popover';
import { createKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase } from '../../services/api';

function KnowledgeBaseList({ knowledgeBases = [], selectedKnowledgeBase, onSelect, onListChange }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingKnowledgeBase, setEditingKnowledgeBase] = useState(null);
  const [newKnowledgeBaseName, setNewKnowledgeBaseName] = useState('');
  const [error, setError] = useState('');
  const [openPopoverId, setOpenPopoverId] = useState(null);

  const handleCreate = async () => {
    if (!newKnowledgeBaseName.trim()) {
      setError('请输入知识库名称');
      return;
    }

    try {
      const response = await createKnowledgeBase({ name: newKnowledgeBaseName });
      if (response.data) {
        setIsCreateModalOpen(false);
        setNewKnowledgeBaseName('');
        setError('');
        onListChange();
      } else {
        setError('创建知识库失败，请重试');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = async () => {
    if (!newKnowledgeBaseName.trim()) {
      setError('请输入知识库名称');
      return;
    }

    try {
      const response = await updateKnowledgeBase({ 
        id: editingKnowledgeBase.id, 
        name: newKnowledgeBaseName 
      });
      if (response.data) {
        setIsEditModalOpen(false);
        setNewKnowledgeBaseName('');
        setEditingKnowledgeBase(null);
        setError('');
        onListChange();
      } else {
        setError('修改知识库失败，请重试');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteKnowledgeBase(editingKnowledgeBase.id);
      setIsDeleteModalOpen(false);
      setEditingKnowledgeBase(null);
      onListChange();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditClick = (knowledgeBase) => {
    setEditingKnowledgeBase(knowledgeBase);
    setNewKnowledgeBaseName(knowledgeBase.name);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (knowledgeBase) => {
    setEditingKnowledgeBase(knowledgeBase);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {/* 列表头部 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">我的知识库</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="p-1 rounded-full text-indigo-600 hover:bg-indigo-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* 知识库列表 */}
      <ul className="space-y-2 min-h-[200px]">
        {knowledgeBases.length === 0 ? (
          <li className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="mt-2">暂无知识库</p>
            <p className="mt-1 text-sm">点击右上角"+"按钮创建新知识库</p>
          </li>
        ) : (
          knowledgeBases.map((knowledgeBase) => (
          <li 
            key={knowledgeBase.id}
            onClick={() => onSelect(knowledgeBase)}
            className={`rounded-md p-3 flex justify-between items-center cursor-pointer ${
              selectedKnowledgeBase?.id === knowledgeBase.id 
                ? 'bg-indigo-50' 
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <i className={`fas fa-book-open mr-2 ${
                selectedKnowledgeBase?.id === knowledgeBase.id 
                  ? 'text-indigo-600' 
                  : 'text-gray-500'
              }`}></i>
              <span className={`${
                selectedKnowledgeBase?.id === knowledgeBase.id 
                  ? 'text-indigo-600 font-medium' 
                  : 'text-gray-700'
              }`}>
                {knowledgeBase.name}
              </span>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <Popover
                isOpen={openPopoverId === knowledgeBase.id}
                trigger={
                  <button 
                    onClick={() => setOpenPopoverId(openPopoverId === knowledgeBase.id ? null : knowledgeBase.id)}
                    className="text-gray-500 hover:text-gray-600"
                  >
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                }
                content={
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(knowledgeBase);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    编辑
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(knowledgeBase);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    删除
                  </button>
                </div>
                }
              />
            </div>
          </li>
          ))
        )}
      </ul>

      {/* 创建知识库弹窗 */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewKnowledgeBaseName('');
          setError('');
        }}
        title="新增知识库"
        footer={
          <>
            <button
              onClick={handleCreate}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ml-3"
            >
              确认
            </button>
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewKnowledgeBaseName('');
                setError('');
              }}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              取消
            </button>
          </>
        }
      >
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            知识库名称
          </label>
          <input
            type="text"
            id="name"
            value={newKnowledgeBaseName}
            onChange={(e) => setNewKnowledgeBaseName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2.5"
            placeholder="请输入知识库名称"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </Modal>

      {/* 编辑知识库弹窗 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setNewKnowledgeBaseName('');
          setError('');
        }}
        title="编辑知识库"
        footer={
          <>
            <button
              onClick={handleEdit}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ml-3"
            >
              确认
            </button>
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setNewKnowledgeBaseName('');
                setError('');
              }}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              取消
            </button>
          </>
        }
      >
        <div>
          <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
            知识库名称
          </label>
          <input
            type="text"
            id="edit-name"
            value={newKnowledgeBaseName}
            onChange={(e) => setNewKnowledgeBaseName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2.5"
            placeholder="请输入知识库名称"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="删除知识库"
        footer={
          <>
            <button
              onClick={handleDelete}
              className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ml-3"
            >
              确认
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              取消
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500">
          确定要删除知识库"{editingKnowledgeBase?.name}"吗？此操作不可恢复。
        </p>
      </Modal>
    </div>
  );
}

export default KnowledgeBaseList;

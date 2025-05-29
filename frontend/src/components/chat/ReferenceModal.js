import React from 'react';
import Modal from '../common/Modal';

function ReferenceModal({ isOpen, onClose, references = [] }) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="参考内容">
      <div className="max-h-96 overflow-y-auto">
        {references.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            暂无参考内容
          </div>
        ) : (
          <div className="space-y-4">
            {references.map((ref, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 truncate">
                    {ref.fileName}
                  </h3>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                    相似度: {(ref.similarity * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  {ref.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ReferenceModal;

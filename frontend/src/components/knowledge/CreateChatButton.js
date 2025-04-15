import React from 'react';
import { FiPlus } from 'react-icons/fi';

const CreateChatButton = () => {
  return (
    <div className="flex">
      <a
        href="/chat"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center"
      >
        <FiPlus className="mr-2" />
        开启对话
      </a>
    </div>
  );
};

export default CreateChatButton;

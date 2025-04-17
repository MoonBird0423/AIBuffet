import React from 'react';

const statusOptions = [
  { id: 'all', name: '全部', value: null },
  { id: 'public', name: '公开', value: 'public' },
  { id: 'private', name: '私有', value: 'private' }
];

const StatusFilter = ({ activeStatus, onStatusChange }) => {
  return (
    <ul className="flex flex-wrap text-sm font-medium">
      {statusOptions.map(status => (
        <li key={status.id} className="mr-6">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onStatusChange(status.value);
            }}
            className={`inline-block py-3 px-2 ${
              (status.value === null && activeStatus === null) || 
              status.value === activeStatus
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            } font-medium transition-colors duration-200`}
          >
            {status.name}
          </a>
        </li>
      ))}
    </ul>
  );
};

export default StatusFilter;

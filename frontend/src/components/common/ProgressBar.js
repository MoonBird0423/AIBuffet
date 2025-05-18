import React from 'react';

function ProgressBar({ progress, title, description, icon }) {
  return (
    <div>
      {(title || description) && (
        <div className="text-center">
          {title && <h4 className="text-lg font-medium text-gray-900 mb-2">{title}</h4>}
          {description && <p className="text-gray-500">{description}</p>}
        </div>
      )}
      
      <div className="bg-gray-50 rounded-md p-4 mt-4">
        <div className="flex items-start">
          {icon && (
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
            </div>
          )}
          <div className={`${icon ? 'ml-3' : ''} w-full`}>
            <h5 className="text-sm font-medium text-gray-900">处理进度</h5>
            <div className="mt-1 relative pt-1">
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                <div
                  style={{ width: `${progress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                />
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">
                {progress}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;

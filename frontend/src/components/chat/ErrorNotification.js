import React from 'react';
import PropTypes from 'prop-types';

const ErrorNotification = ({ message = '' }) => {
  if (!message) return null;

  return (
    <div className="flex items-center text-red-500 text-sm mt-1 animate-fade-in">
      <i className="fas fa-exclamation-circle mr-1" />
      <span>{message}</span>
    </div>
  );
};

ErrorNotification.propTypes = {
  message: PropTypes.string
};

export default ErrorNotification;
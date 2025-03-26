import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

function Logo({ theme = 'default', to = '/' }) {
  const textColorClass = theme === 'light' ? 'text-white' : 'text-gray-800';

  return (
    <Link to={to} className="flex items-center">
      <img src="/logo.png" alt="AI自助餐" className="h-8 w-8 mr-2" />
      <span className={`font-semibold text-lg ${textColorClass}`}>AI自助餐</span>
    </Link>
  );
}

Logo.propTypes = {
  theme: PropTypes.oneOf(['default', 'light']),
  to: PropTypes.string
};

export default Logo;
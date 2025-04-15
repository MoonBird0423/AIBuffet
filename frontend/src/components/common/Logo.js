import React from 'react';
import { Link } from 'react-router-dom';

function Logo({ to = '/' }) {
  return (
    <Link to={to} className="text-2xl font-bold text-blue-600">
      DocuChat
    </Link>
  );
}

export default Logo;

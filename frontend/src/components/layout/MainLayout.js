import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

function MainLayout() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-16">
        <Outlet />
      </div>
      <Footer />
    </>
  );
}

export default MainLayout;

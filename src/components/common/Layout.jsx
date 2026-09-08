import React from 'react';
import { Outlet } from 'react-router-dom';
import HorizontalNavbar from './HorizontalNavbar';
import Footer from './Footer';

function Layout() {
  return (
    <div className="app-layout-horizontal d-flex flex-column min-vh-100">
      <HorizontalNavbar />
      <div className="main-content-horizontal flex-grow-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default Layout;
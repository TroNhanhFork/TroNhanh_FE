import React from 'react';
import Header from '../../components/header/header';
import Sidebar from '../sidebar/SideBarCustomer';
import Footer from '../../components/footer/footer';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        <div className="w-64 bg-gray-100 p-4">
          <Sidebar />
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;

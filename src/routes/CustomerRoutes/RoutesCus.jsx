import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProfilePage from '../../pages/CustomerPage/Profile/Profile';

const CustomerRoutes = () => {
  return (
    <Routes>
      {/* Các route chính cho customer */}
      <Route path="profile/*" element={<ProfilePage />} />
      
      {/* Có thể thêm các route khác: */}
    </Routes>
  );
};

export default CustomerRoutes;

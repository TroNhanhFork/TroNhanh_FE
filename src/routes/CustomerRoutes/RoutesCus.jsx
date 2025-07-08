import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import CustomerLayout from "../../pages/CustomerPage/components/layout/CustomerLayout";
import ApartmentSearch from "../../pages/CustomerPage/ApartmentSearch/ApartmentSearch";
import ApartmentDetails from "../../pages/CustomerPage/ApartmentDetails/ApartmentDetails";
import OwnerInformation from "../../pages/CustomerPage/OwnerInfo/OwnerInfo";
import ProfilePage from "../../pages/CommonPage/Cus_Profile/Profile";
import CheckoutPage from "../../pages/CustomerPage/Checkout/CheckoutPage";
// import ProfilePage from "../../pages/CustomerPage/Profile/Profile";
const RoutesCus = () => {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<ApartmentSearch />} />
        <Route path="search" element={<ApartmentSearch />} />
        <Route path="property/:id" element={<ApartmentDetails />} />
        <Route path="owner/:id" element={<OwnerInformation />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path='profile/*' element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
        <Route path="profile/*" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
};

export default RoutesCus;

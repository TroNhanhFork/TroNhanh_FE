import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import CustomerLayout from "../../pages/CustomerPage/components/layout/CustomerLayout";
import ApartmentSearch from "../../pages/CustomerPage/ApartmentSearch/ApartmentSearch";
import ApartmentDetails from "../../pages/CustomerPage/ApartmentDetails/ApartmentDetails";
import OwnerInformation from "../../pages/CustomerPage/OwnerInfo/OwnerInfo";
import Profile from "../../pages/CommonPage/Profile/profile";
import CheckoutPage from "../../pages/CustomerPage/Checkout/CheckoutPage";

const RoutesCus = () => {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<ApartmentSearch />} />
        <Route path="search" element={<ApartmentSearch />} />
        <Route path="property/:id" element={<ApartmentDetails />} />
        <Route path="owner/:id" element={<OwnerInformation />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path='user-profile' element={<Profile />} />
        <Route path="*" element={<Navigate to="/404" replace />} />

      </Route>
    </Routes>
  );
};

export default RoutesCus;

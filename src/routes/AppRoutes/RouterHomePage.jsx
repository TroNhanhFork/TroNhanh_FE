// routes/AppRoutes/RouterHomePage.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "../../pages/HomePage/HomePage";

const RouterHomePage = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
};

export default RouterHomePage;

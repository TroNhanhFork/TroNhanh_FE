import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import RoutesOw from "./routes/OwnerRoutes/RoutesOw";
import RoutesAd from "./routes/AdminRoutes/RoutesAd";
import RoutesCus from "./routes/CustomerRoutes/RoutesCus";
import RoutesApp from "./routes/AppRoutes/RoutesApp";
import ExceptionRoutes from "./routes/ExceptionRoutes/ExceptionRoutes";
import HeaderComponent from './components/header/header';
import FooterComponent from "./components/footer/footer";

function App() {
  return (
    <BrowserRouter>
      <HeaderComponent />
      <main className="main-container">
        <Routes>
          <Route path="/" element={<Navigate to="/homepage" replace />} />
          <Route path="/homepage" element={<RoutesApp />} />
          <Route path="/owner/*" element={<RoutesOw />} />
          <Route path="/admin/*" element={<RoutesAd />} />
          <Route path="/customer/*" element={<RoutesCus />} />
          <Route path="*" element={<ExceptionRoutes/>} />

        </Routes>
      </main>
      <FooterComponent />
    </BrowserRouter>
  );
}

export default App;
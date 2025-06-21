// App.js
import React from "react";
import { BrowserRouter } from "react-router-dom";
import "./App.css";
import RoutesOw from "./routes/OwnerRoutes/RoutesOw";
import RoutesAd from "./routes/AdminRoutes/RoutesAd";
import HeaderComponent from './components/header/header';
import RoutesCus from "./routes/CustomerRoutes/RoutesCus";
import FooterComponent from "./components/footer/footer";

function App() {
  return (
    <BrowserRouter>
      <HeaderComponent />
      <RoutesOw />
      <RoutesAd/>
      <RoutesCus />
      <FooterComponent />
    </BrowserRouter>
  );
}

export default App;


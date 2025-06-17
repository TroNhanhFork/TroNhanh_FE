// App.jsx
import React from "react";
import { BrowserRouter } from "react-router-dom";
import './App.css';

import RouterHomePage from "./routes/AppRoutes/RouterHomePage";
import HeaderComponent from './components/header/header';
import FooterComponent from "./components/footer/footer";

function App() {
  return (
    <BrowserRouter>
      <HeaderComponent />
      <div style={{ minHeight: '100vh' }}>
        <RouterHomePage />
      </div>
      <FooterComponent />
    </BrowserRouter>
  );
}

export default App;

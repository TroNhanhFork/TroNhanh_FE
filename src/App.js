import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import HeaderComponent from './components/header/header';
import FooterComponent from './components/footer/footer';
import RouterAd from './routes/AdminRoutes/RoutesAd';
import RouterCus from './routes/CustomerRoutes/RoutesCus';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import { initAutoLogout, stopAutoLogout } from './services/autoLogout';
import useUser, { UserProvider } from './contexts/UserContext';
import { setupInterceptors } from './services/api';
function App() {
  const location = useLocation();
  const { logout } = useUser();

  useEffect(() => {
    setupInterceptors(logout); 
  }, [logout]);

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem('token');
    if (isLoggedIn) {
      initAutoLogout(logout); 
    } else {
      stopAutoLogout();
    }
    return () => {
      stopAutoLogout();
    };
  }, [location, logout]); 


  return (
    <>
      <Routes>
        {/* Route không layout */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Route cho customer */}
        <Route
          path="/customer/*"
          element={
            <>
              <HeaderComponent />
              <div style={{ marginTop: '80px' }}>
                <RouterCus />
              </div>
              <FooterComponent />
            </>
          }
        />

        {/* Route cho admin */}
        <Route
          path="/*"
          element={
            <>
              <HeaderComponent />
              <div style={{ marginTop: '80px' }}>
                <RouterAd />
              </div>
              <FooterComponent />
            </>
          }
        />
      </Routes>
    </>
  );
}

function AppWrapper() {
  return (
    <BrowserRouter>
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  );
}


export default AppWrapper;

import axios from 'axios';
import { getValidAccessToken, logout } from './authService';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: false,
});

api.interceptors.request.use(async (config) => {
  if (
    config.url.includes('/auth/login') ||
    config.url.includes('/auth/register') ||
    config.url.includes('/auth/refresh')
  ) {
    return config;
  }

  const token = await getValidAccessToken();
  if (!token) {
    logout('token expired');
    return Promise.reject(new Error('Token expired'));
  }

  config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

export default api;

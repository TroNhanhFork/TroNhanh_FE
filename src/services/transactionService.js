import axios from "axios";
import { getValidAccessToken } from "./authService";

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://tronhanh-be.onrender.com/api";

export const getTransactionHistory = async (params = {}) => {
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error("Authentication required");
  }
  
  const response = await axios.get(`${API_BASE_URL}/admin/transactions`, {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
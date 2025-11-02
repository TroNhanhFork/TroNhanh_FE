import api from './api';

export const getUserInfo = () => api.get('/customer/personal-info');
export const getUserFavorites = async () => {
  try {
    console.log("🚀 [Service] Calling GET /api/customer/favorites");
    const response = await api.get('/customer/favorites');

    // ✅ MAKE SURE YOU RETURN response.data HERE
    if (response && response.data) {
      return response.data; // Should return { favorites: [...] }
    } else {
      return { favorites: [] }; // Return default structure
    }
  } catch (error) {
    console.error('❌ [Service] Error fetching user favorites:', error.response?.data || error.message);
    throw error;
  }
}; export const getUserMessages = () => api.get('/customer/messages');
export const removeFavorite = async (boardingHouseId) => {
  const response = await api.delete(`/favorites/${boardingHouseId}`);
  return response.data;
};

export const updateUserInfo = (formData) =>
  api.put("/customer/personal-info", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
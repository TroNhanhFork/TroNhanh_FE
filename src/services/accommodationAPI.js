import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/accommodation';

// ✅ Tạo mới accommodation
export const createAccommodation = async (data) => {
    const response = await axios.post(`${API_BASE_URL}/`, data);
    return response.data;
};

// ✅ Lấy tất cả accommodations
export const getAllAccommodations = async () => {
    const response = await axios.get(`${API_BASE_URL}/`);
    return response.data;
};

// ✅ Tìm kiếm accommodation theo location (district, street, addressDetail)
export const searchAccommodations = async (filters) => {
    console.log("Search filters:", {
        district: filters.district,
        street: filters.street,
        addressDetail: filters.addressDetail,
    });
    const response = await axios.get(`${API_BASE_URL}/searchAccomodation`, {
        params: filters, // ví dụ: ?district=...&street=...
    });
    return response.data;
};

// ✅ Lấy accommodation theo ID
export const getAccommodationById = async (id) => {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
};

// ✅ Cập nhật accommodation
export const updateAccommodation = async (id, updatedData) => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, updatedData);
    return response.data;
};

// ✅ Xóa accommodation
export const deleteAccommodation = async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    return response.data;
};

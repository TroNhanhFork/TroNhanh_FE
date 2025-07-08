import axiosInstance from './axiosInstance'

const API_BASE_URL = 'http://localhost:5000/api/accommodation';
const API_FAV_URL = 'http://localhost:5000/api/favorites';

// CẢNH CÁO LÀ ĐÉO DÙNG CÁI FILE NÀY NỮA ANHBUI, VÌ BACK END T CODE Ở TRONG FOLDER accommodationController.js Ở PHÍA PROJECT BE KIA RỒI,
// M MÚN THÊM Tìm kiếm accommodation theo location THÌ BỎ CÁI CODE ĐÓ QUA BÊN FOLDER KIA RỒI LÀM GÌ THÌ LÀM CHỨ ĐÉO DÙNG CÁI FILE NÀY NỮA ĐÓ

//  Tạo mới accommodation
export const createAccommodation = async (data) => {
    console.log("📦 Payload gửi BE:", JSON.stringify(data, null, 2));

    const response = await axiosInstance.post(`${API_BASE_URL}/`, data);
    return response.data;
};

//  Lấy tất cả accommodations
export const getAllAccommodations = async () => {
    const response = await axiosInstance.get(`${API_BASE_URL}/`);
    return response.data;
};

//  Tìm kiếm accommodation theo location (district, street, addressDetail)
export const searchAccommodations = async (filters) => {
    console.log("Search filters:", {
        district: filters.district,
        street: filters.street,
        addressDetail: filters.addressDetail,
    });
    const response = await axiosInstance.get(`${API_BASE_URL}/searchAccomodation`, {
        params: filters, // ví dụ: ?district=...&street=...
    });
    return response.data;
};

//  Lấy accommodation theo ID
export const getAccommodationById = async (id) => {
    const response = await axiosInstance.get(`${API_BASE_URL}/${id}`);
    return response.data;
};

//  Cập nhật accommodation
export const updateAccommodation = async (id, updatedData) => {
    const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, updatedData);
    return response.data;
};

//  Xóa accommodation
export const deleteAccommodation = async (id) => {
    const response = await axiosInstance.delete(`${API_BASE_URL}/${id}`);
    return response.data;
};

//  Thêm vào Favorite
export const addToFavorite = async (data) => {
    const response = await axiosInstance.post(`${API_FAV_URL}/`, data);
    return response.data;
}
import axiosInstance from './axiosInstance';

/**
 * Generate a detailed and attractive description for a boarding house
 * @param {Object} boardingHouseInfo - Information about the boarding house
 * @param {string} boardingHouseInfo.name - Name of the boarding house
 * @param {Object} boardingHouseInfo.location - Location details (street, district, city)
 * @param {Array} boardingHouseInfo.rooms - Array of room information
 * @param {Array} boardingHouseInfo.amenities - Array of amenities
 * @returns {Promise<string>} Generated description
 */
export const generateBoardingHouseDescription = async (boardingHouseInfo) => {
    try {
        const response = await axiosInstance.post('/ai/generate-description', boardingHouseInfo);
        
        if (response.data?.description) {
            return response.data.description;
        }
        
        throw new Error('Không nhận được phản hồi hợp lệ từ server');
    } catch (error) {
        console.error('Error generating description:', error);
        throw new Error(
            error.response?.data?.message || 
            'Không thể tạo mô tả. Vui lòng thử lại sau.'
        );
    }
};

import axios from "axios";

const OPENCAGE_API_KEY = "51e840c1acc24e539a17b51d1e2fff99"; // Thay bằng key bạn lấy được

export const geocodeWithOpenCage = async (address) => {
  try {
    const response = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
      params: {
        q: address,
        key: OPENCAGE_API_KEY,
        language: "vi",         // ưu tiên tiếng Việt
        countrycode: "vn",      // giới hạn Việt Nam
      },
    });

    const results = response.data.results;
    if (results.length > 0) {
      const { lat, lng } = results[0].geometry;
      return {
        latitude: lat,
        longitude: lng,
      };
    } else {
      throw new Error("Không tìm thấy kết quả.");
    }
  } catch (error) {
    console.error("Lỗi khi lấy tọa độ từ OpenCage:", error);
    return null;
  }
};

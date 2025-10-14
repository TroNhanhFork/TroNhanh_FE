import { useState } from "react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import PropertyCard from "./PropertyCard";

const PropertyList = ({ data }) => {
    const navigate = useNavigate();
    const [visibleCount] = useState(7); // Giới hạn hiển thị 7 mục

    if (!data || data.length === 0) {
        return <p>Không tìm thấy kết quả nào.</p>;
    }

    // ✅ Chỉ lấy ra số lượng mục cần hiển thị
    const visibleProperties = data.slice(0, visibleCount);

    return (
        <div>
            {/* ✅ Lặp qua danh sách đã được cắt ngắn */}
            {visibleProperties.map((item) => (
                <PropertyCard key={item._id} property={item} />
            ))}

            {/* ✅ Chỉ hiển thị nút "Show more" nếu có nhiều hơn 7 mục */}
            {data.length > visibleCount && (
                <div style={{ marginTop: "35px", textAlign: "center" }}>
                    <Button
                        style={{
                            backgroundColor: "#49735A",
                            color: "#fff",
                            padding: "10px 24px",
                            fontSize: "16px",
                            borderRadius: "8px",
                            border: "none",
                            height: 'auto', // Thêm để padding hoạt động đúng
                        }}
                        onClick={() => navigate("/customer/apartments")}
                    >
                        Xem thêm nhà trọ
                    </Button>
                </div>
            )}
        </div>
    );
};

export default PropertyList;
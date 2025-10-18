// file: src/pages/Customer/RentalContract/RentalContract.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin, Card, Checkbox, message } from 'antd';
import { getContractTemplateForHouse, getBoardingHouseById } from '../../../services/boardingHouseAPI';
import { requestBooking } from '../../../services/bookingService';
import useUser from '../../../contexts/UserContext';
import './RentalContract.css';

const RentalContract = () => {
    const { boardingHouseId, roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();

    // ✅ SỬA LỖI: Khởi tạo messageApi và contextHolder
    const [messageApi, contextHolder] = message.useMessage();

    const [template, setTemplate] = useState(null);
    const [boardingHouse, setBoardingHouse] = useState(null);
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [templateData, houseData] = await Promise.all([
                    getContractTemplateForHouse(boardingHouseId),
                    getBoardingHouseById(boardingHouseId)
                ]);
                console.log("Signature :", templateData.signatureImage);

                const selectedRoom = houseData.rooms.find(r => r._id === roomId);

                if (!selectedRoom) {
                    messageApi.error("Phòng trọ không hợp lệ hoặc không còn tồn tại.");
                    navigate(-1); // Quay lại trang trước
                    return;
                }

                setTemplate(templateData); // Giả sử API trả về toàn bộ object template
                setBoardingHouse(houseData);
                setRoom(selectedRoom);
            } catch (error) {
                messageApi.error(error.response?.data?.message || "Không thể tải thông tin hợp đồng. Có thể chủ nhà chưa tạo mẫu.");
                console.error("Fetch contract data error:", error);
                navigate(-1); // Quay lại nếu có lỗi
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [boardingHouseId, roomId, navigate, messageApi]);

    const renderContractContent = () => {
        if (!template || !user || !room || !boardingHouse) return "";

        const replacements = {
            '{{tenantName}}': user.name,
            '{{tenantEmail}}': user.email,
            '{{customerPhone}}': user.phone,
            '{{roomNumber}}': room.roomNumber,
            '{{roomPrice}}': room.price.toLocaleString('vi-VN'),
            '{{roomArea}}': room.area,
            '{{houseAddress}}': `${boardingHouse.location.addressDetail}, ${boardingHouse.location.street}, ${boardingHouse.location.district}`,
            '{{ownerName}}': boardingHouse.ownerId.name,
            '{{ownerPhone}}': boardingHouse.ownerId.phone,
            '{{currentDate}}': new Date().toLocaleDateString('vi-VN'),
        };
        let content = template.content;
        for (const key in replacements) {
            content = content.replace(new RegExp(key, 'g'), replacements[key]);
        }
        return content;
    };

    const handleContinue = async () => { // Thêm async
        if (!agreed) {
            messageApi.warning("Bạn phải đồng ý với các điều khoản để tiếp tục.");
            return;
        }
        try {
            setLoading(true); 
            await requestBooking({ boardingHouseId, roomId });
            messageApi.success('Yêu cầu đặt phòng đã được gửi. Vui lòng đợi chủ nhà xác nhận.');
            navigate('/customer/my-bookings'); 
        } catch (error) {
            messageApi.error(error.response?.data?.message || 'Gửi yêu cầu thất bại.');
            console.error("Error requesting booking:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-container"><Spin size="large" /></div>;
    }

    if (!template) {
        // Xử lý trường hợp chủ nhà chưa có mẫu hợp đồng
        return <div className="loading-container">Chủ nhà chưa cung cấp mẫu hợp đồng cho khu trọ này.</div>
    }

    const owner = boardingHouse.ownerId;
    const today = new Date();

    return (
        <>
            {/* ✅ SỬA LỖI: Render contextHolder */}
            {contextHolder}
            <div className="contract-container">
                <Card title={template.title} bordered={false} className="contract-card">
                    {/* Phần nội dung hợp đồng được render động */}
                    <div className="contract-terms" style={{ whiteSpace: 'pre-wrap' }}>
                        {renderContractContent()}
                    </div>

                    <div className="signature-section">
                        <div className="signature-block">
                            <h4>ĐẠI DIỆN BÊN A</h4>
                            {template.signatureImage ? (
                                <img src={`http://localhost:5000${template.signatureImage}`} alt="Chữ ký chủ trọ" className="signature-image-display" />
                            ) : (
                                <div className="signature-image"><span className="signature-text">{owner.name}</span></div>
                            )}
                            <p>{owner.name}</p>
                        </div>
                        <div className="signature-block">
                            <h4>ĐẠI DIỆN BÊN B</h4>
                            <div className="signature-image"><span className="signature-text">{user.name}</span></div>
                            <p>{user.name}</p>
                        </div>
                    </div>

                    <div className="agreement-section">
                        <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)}>
                            Tôi đã đọc, hiểu rõ và đồng ý với tất cả các điều khoản trong hợp đồng này.
                        </Checkbox>
                    </div>

                    <div className="action-buttons">
                        <Button onClick={() => navigate(-1)}>Quay lại</Button>
                        <Button type="primary" disabled={!agreed} onClick={handleContinue}>
                            Đồng ý và Tiếp tục
                        </Button>
                    </div>
                </Card>
            </div>
        </>
    );
};

export default RentalContract;
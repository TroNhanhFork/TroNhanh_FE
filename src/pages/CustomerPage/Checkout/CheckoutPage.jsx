import React, { useEffect, useState } from "react";
import axiosInstance from "../../../services/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import bookingService from "../../../services/bookingService";
import {
  Row,
  Col,
  Input,
  Select,
  Radio,
  Checkbox,
  Button,
  Divider,
  notification,
  DatePicker,
  Spin,
  Result,
  message
} from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import "./CheckoutPage.css";
import { getBoardingHouseById } from "../../../services/boardingHouseAPI";
import useUser from "../../../contexts/UserContext";

const { Option } = Select;

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const propertyId = location.state?.accommodationId;

  // form state to auto-fill user info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");

  const [startDate, setStartDate] = useState(null);
  const [leaseDuration, setLeaseDuration] = useState(null);
  const [guests, setGuests] = useState(1);

  // get user info from context
  const { user } = useUser();
  const [paymentMethod, setPaymentMethod] = useState(null);

  const [messageApi, contextHolder] = message.useMessage();
  const [booking, setBooking] = useState(null);
  const [roomDetails, setRoomDetails] = useState(null);
  const [boardingHouseDetails, setBoardingHouseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to disable past dates
  const disabledDate = (current) => {
    // Can not select days before today
    return current && current < dayjs().startOf('day');
  };

  // handle payment result after redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      notification.success({
        message: "Payment Successful",
        description: "Your booking has been confirmed!",
      });
      setTimeout(() => {
        navigate("/");
      }, 2000);
    }
    if (params.get("success") === "false") {
      notification.error({
        message: "Payment Failed",
        description: "Your payment was not successful.",
      });
    }
  }, [navigate]);

  // --- Fetch Booking and Related Data ---
  useEffect(() => {
    const fetchBookingDetails = async () => {
      // Lấy bookingId từ location.state
      const { bookingId } = location.state || {};

      if (!bookingId) {
        setError("Thông tin đặt phòng không hợp lệ.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Fetch booking data
        const bookingData = await bookingService.getBookingById(bookingId);

        // 2. Validate status
        if (!bookingData) throw new Error("Không tìm thấy thông tin đặt phòng.");
        if (bookingData.contractStatus !== 'approved') {
          throw new Error(`Yêu cầu đặt phòng này ${bookingData.contractStatus === 'pending_approval' ? 'đang chờ duyệt' : 'đã bị từ chối'}. Không thể thanh toán.`);
        }
        if (bookingData.status === 'paid') {
          throw new Error('Đơn đặt phòng này đã được thanh toán.');
        }
        setBooking(bookingData);

        // 3. Fetch House and Room details
        const houseData = await getBoardingHouseById(bookingData.boardingHouseId);
        const specificRoom = houseData.rooms.find(r => r._id === bookingData.roomId);

        if (!houseData || !specificRoom) {
          throw new Error("Không thể tải thông tin chi tiết phòng hoặc nhà trọ.");
        }
        setBoardingHouseDetails(houseData);
        setRoomDetails(specificRoom);

        // 4. Pre-fill form
        if (bookingData.guestInfo) {
          setFirstName(bookingData.guestInfo.firstName || user?.name.split(' ')[0] || "");
          setLastName(bookingData.guestInfo.lastName || user?.name.split(' ').slice(1).join(' ') || "");
          setEmail(bookingData.guestInfo.email || user?.email || "");
          setPhone(bookingData.guestInfo.phone || user?.phone || "");
          setPurpose(bookingData.guestInfo.purpose || "");
          setStartDate(bookingData.guestInfo.startDate ? dayjs(bookingData.guestInfo.startDate) : null);
          setLeaseDuration(bookingData.guestInfo.leaseDuration || null);
          setGuests(bookingData.guestInfo.guests || 1);
        } else if (user) { // Fallback
          setFirstName(user.name.split(' ')[0] || "");
          setLastName(user.name.split(' ').slice(1).join(' ') || "");
          setEmail(user.email || "");
          setPhone(user.phone || "");
        }

      } catch (err) {
        setError(err.message || "Lỗi khi tải thông tin đặt phòng.");
        console.error("Checkout fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [location.state, user]);

  // --- Handle Payment Redirect Results ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("vnp_ResponseCode") === "00") { // VNPay success code
      messageApi.success({ content: "Thanh toán thành công! Đặt phòng của bạn đã được xác nhận.", duration: 5 });
      // Navigate to a success page or booking history
      setTimeout(() => navigate('/customer/my-bookings'), 3000);
    } else if (params.get("vnp_ResponseCode")) { // VNPay failed or cancelled
      messageApi.error({ content: "Thanh toán thất bại hoặc đã bị hủy.", duration: 5 });
      // Clear VNPay params from URL without reloading
      window.history.replaceState(null, '', window.location.pathname);
    }
    // Add similar checks for PayPal if using it
  }, [navigate, messageApi]);

  // VNPay booking handler
  const handleBook = async () => {
    console.log("Book button pressed");
    if (!paymentMethod) return messageApi.warning("Vui lòng chọn phương thức thanh toán.");
    // ✅ SỬA: Kiểm tra state mới
    if (!booking || !roomDetails) return messageApi.error("Thông tin đặt phòng chưa được tải.");
    if (!user?._id) return messageApi.error("Vui lòng đăng nhập lại.");
    if (!startDate || !leaseDuration || !guests || !purpose || !firstName || !lastName || !email || !phone) {
      return messageApi.warning("Vui lòng điền đầy đủ thông tin khách và chi tiết đặt phòng.");
    }
    if (startDate && startDate.isBefore(dayjs().startOf('day'))) {
      notification.error({ 
        message: "Invalid Date", 
        description: "Start date cannot be in the past. Please select today or a future date." 
      });
      return;
    }

    // 1. Create booking first
    try {
      const bookingRes = await axios.post(
        "http://localhost:5000/api/bookings",
        {
          userId: user._id,
          propertyId: property._id,
          guestInfo: {
            firstName,
            lastName,
            email,
            phone,
            purpose,
            startDate: startDate ? startDate.format("YYYY-MM-DD") : null,
            leaseDuration,
            guests,
          },
        }
      );

      // 2. Only proceed to payment if booking is created
if (paymentMethod === "payos") {
  const res = await axios.post("http://localhost:5000/api/payment/create", {
    amount: Math.round(property.price * 1.003 + 500000),
    userId: user._id,
    bookingId: bookingRes.data._id,
     type: "booking",
  });

  // redirect sang PayOS checkout page
  window.location.href = res.data.url;
}
 else {
        // Handle other payment methods if needed
      }
    } catch (err) {
      // ✅ SỬA: Dùng messageApi
      messageApi.error("Không thể tạo yêu cầu thanh toán. Vui lòng thử lại.");
      console.error("Payment initiation error:", err.response?.data || err.message);
    }
  };
useEffect(() => {
  // Prefill từ user (nếu có)
  if (user && Object.keys(user).length > 0) {
    if (user.name) {
      const nameParts = user.name.trim().split(" ");
      const first = nameParts.pop();
      const last = nameParts.join(" ");
      setFirstName((prev) => prev || first);
      setLastName((prev) => prev || last);
    } else {
      setFirstName((prev) => prev || user.firstName || "");
      setLastName((prev) => prev || user.lastName || "");
    }
    setEmail((prev) => prev || user.email || "");
    setPhone((prev) => prev || user.phone || "");
  }

  // Prefill từ accommodation (nếu có)
  if (propertyId) {
    getAccommodationById(propertyId).then((data) => {
      setProperty(data);
      if (data.guestFirstName) setFirstName(data.guestFirstName);
      if (data.guestLastName) setLastName(data.guestLastName);
      if (data.guestEmail) setEmail(data.guestEmail);
      if (data.guestPhone) setPhone(data.guestPhone);
      if (data.purpose) setPurpose(data.purpose);
    });
  }
}, [user, propertyId]);



  return (
    <div className="checkout-container">
      <Row gutter={[40, 40]}>
        {/* Left side - Guest details */}
        <Col xs={24} md={14}>
          <h2 className="section-title">Guest details</h2>
          <Row gutter={16}>
            <Col span={12}><Input placeholder="Tên" size="large" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></Col>
            <Col span={12}><Input placeholder="Họ" size="large" value={lastName} onChange={(e) => setLastName(e.target.value)} /></Col>
          </Row>
          <Input placeholder="Email" size="large" style={{ marginTop: 16 }} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input addonBefore="+84" placeholder="Số điện thoại" size="large" style={{ marginTop: 16 }} value={phone} onChange={(e) => setPhone(e.target.value)} />

          <div className="sub-section">
            <p className="sub-label">Chi tiết đặt phòng</p>
            <DatePicker placeholder="Ngày bắt đầu thuê" suffixIcon={<CalendarOutlined />} value={startDate} onChange={setStartDate} disabledDate={disabledDate} style={{ width: "100%", marginBottom: 12 }} format="DD/MM/YYYY" />
            <Select placeholder="Thời hạn thuê" style={{ width: "100%", marginBottom: 12 }} value={leaseDuration} onChange={setLeaseDuration}>
              <Option value={3}>3 tháng</Option>
              <Option value={6}>6 tháng</Option>
              <Option value={12}>12 tháng</Option>
            </Select>
            <Input type="number" min={1} placeholder="Số người ở" value={guests} onChange={(e) => setGuests(Number(e.target.value))} style={{ width: "100%" }} />
          </div>

          <div className="sub-section">
            <p className="sub-label">Mục đích thuê</p>
            <Radio.Group className="purpose-options" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              <Radio value="work">Đi làm/Công tác</Radio>
              <Radio value="moving">Chuyển đến thành phố</Radio>
              <Radio value="study">Học tập</Radio>
              <Radio value="other">Khác</Radio>
            </Radio.Group>
          </div>

          {/* Payment Method */}
          <div className="payment-method-section">
            <h3 className="section-title">Payment method</h3>
            <Select
              placeholder="Select payment method"
              size="large"
              style={{ width: "100%" }}
              value={paymentMethod}
              onChange={setPaymentMethod}
            >
              <Option value="payos">PayOS</Option>
            </Select>
            <p className="terms-note">Bằng việc nhấn "Thanh toán", bạn đồng ý với các điều khoản...</p>
            {/* ✅ SỬA: Disable nút nếu thiếu thông tin */}
            <Button className="book-button" onClick={handleBook} disabled={!user || !paymentMethod}>
              Thanh toán
            </Button>
          </div>
        </Col>

        {/* Right side - Summary */}
        <Col xs={24} md={10}>
          <div className="summary-card">
            <img
              // ✅ SỬA: Dùng boardingHouseDetails
              src={boardingHouseDetails.photos?.[0] ? `http://localhost:5000${boardingHouseDetails.photos[0]}` : "/default-image.jpg"}
              alt={boardingHouseDetails.name}
              className="summary-image"
            />
            <div className="summary-section">
              {/* ✅ SỬA: Dùng boardingHouseDetails và roomDetails */}
              <h3>{boardingHouseDetails.name}</h3>
              <p>Phòng: {roomDetails.roomNumber}</p>
              <p>{`${boardingHouseDetails.location.addressDetail}, ${boardingHouseDetails.location.street}, ${boardingHouseDetails.location.district}`}</p>
              <Divider />
              <Row>
                <Col span={12}>
                  <CalendarOutlined /> Nhận phòng
                  {/* ✅ SỬA: Hiển thị ngày đã chọn */}
                  <div>{startDate ? startDate.format('DD/MM/YYYY') : 'N/A'}</div>
                </Col>
                <Col span={12}>
                  <CalendarOutlined /> Trả phòng
                  {/* ✅ SỬA: Tính ngày trả phòng */}
                  <div>{endDate}</div>
                </Col>
              </Row>
              <Divider />
              <h4>Chi tiết thanh toán</h4>
              <div className="payment-detail-row">
                <span>Tiền thuê tháng đầu</span>
                {/* ✅ SỬA: Dùng giá từ roomDetails */}
                <span>{roomDetails.price.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              {/* Bạn có thể thêm tiền cọc ở đây nếu backend yêu cầu */}
              {/* <div className="payment-detail-row">
                                <span>Tiền cọc</span>
                                <span>{depositFee.toLocaleString('vi-VN')} VNĐ</span>
                            </div> */}
              <Divider />
              <div className="payment-detail-row total-cost">
                <span>Tổng cộng thanh toán ngay</span>
                <span>{amountDueNow.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <Divider />
              <h4>Lịch trình thanh toán</h4>
              <div className="payment-detail-row">
                <span>Average monthly rent</span>
                <span>
                  {boardingHouseDetails
                    ? new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(boardingHouseDetails.price * 0.93)
                    : "—"}
                  <br />
                  <span className="vat-label">incl. VAT</span>
                </span>
              </div>
              <div className="payment-detail-row">
                <span>
                  Pay upon booking <InfoCircleOutlined />
                </span>
                <span>
                  {boardingHouseDetails
                    ? new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(boardingHouseDetails.price * 0.9998)
                    : "—"}
                  <br />
                  <span className="vat-label">incl. VAT</span>
                </span>
              </div>
              <div className="payment-detail-row">
                <span>
                  Total costs <InfoCircleOutlined />
                </span>
                <span>
                  {boardingHouseDetails
                    ? new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(boardingHouseDetails.price * 1.003)
                    : "—"}
                  <br />
                  <span className="vat-label">incl. VAT</span>
                </span>
              </div>

              <Divider />

              <h4>Payment timeline</h4>
              <div className="payment-timeline">
                <div className="timeline-line"></div>

                <div className="payment-item">
                  <div className="bullet-point" />
                  <div className="payment-content">
                    <strong>Reserve this apartment</strong>
                    <div className="sub-note">
                      Due now {"(Including deposit fee)"}
                    </div>
                  </div>
                  <div className="payment-amount">
                    <span>
                      {boardingHouseDetails
                        ? new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(boardingHouseDetails.price * 1.003 + 500000)
                        : "—"}
                      <br />
                    </span>
                  </div>
                </div>

                <div className="payment-item">
                  <div className="bullet-point" />
                  <div className="payment-content">
                    <strong>After move-out</strong>
                    <div className="sub-note">
                      Receive your 500.000đ deposit after move out{" "}
                      <InfoCircleOutlined style={{ fontSize: 12 }} />
                    </div>
                  </div>
                  <div className="payment-amount">
                    <span>
                      {boardingHouseDetails
                        ? new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(boardingHouseDetails.price * 1.003 - 500000)
                        : "—"}
                      <br />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div >
  );
};

export default CheckoutPage;
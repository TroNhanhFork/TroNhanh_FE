import { useParams, useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Button,
  DatePicker,
  Input,
  Divider,
  Result,
  Card,
  Avatar,
  Select,
  Tag,
  message,
  Modal,
  List,
  Carousel
} from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  HeartOutlined,
  HeartFilled,
  LeftOutlined,
  RightOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  TagOutlined
} from "@ant-design/icons";


import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  getBoardingHouseById,
  addToFavorite,
  getUserFavorites,
  removeFromFavorite
} from "../../../services/boardingHouseAPI";
import { getUserBookingForBoardingHouse } from "../../../services/bookingService";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./ApartmentDetails.css";
import { useEffect, useState, useRef } from "react";
import useUser from "../../../contexts/UserContext";
import RoommatePostModal from "./RoommatePostModal";
import { getRoommatePosts } from "../../../services/roommateAPI";
// riel-time messaging
import { useSocket } from "../../../contexts/SocketContext";

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Slider from "react-slick";
import { getValidAccessToken } from "../../../services/authService";
import VisitRequestModal from "./VisitRequestModal";
dayjs.extend(relativeTime);
const { Option } = Select;
const { TextArea } = Input;

const RoomCard = ({ room, onBook, bookingStatus }) => (
  <Card size="small" style={{ marginBottom: 12 }} bodyStyle={{ padding: "12px" }}>
    <Row align="middle" justify="space-between" gutter={8}>
      <Col flex="auto">
        <p style={{ margin: 0, fontWeight: "bold" }}>Phòng {room.roomNumber}</p>
        <small>{room.area} m²</small>
      </Col>

      <Col>
        <p
          style={{
            margin: 0,
            color: "#004d40",
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}
        >
          {room.price.toLocaleString("vi-VN")} VNĐ/tháng
        </p>
      </Col>

      <Col>
        {onBook ? (
          <Button type="primary" onClick={() => onBook(room._id)}>
            Đặt ngay
          </Button>
        ) : bookingStatus ? (
          <Tag
            color={
              bookingStatus === "Paid"
                ? "green"
                : bookingStatus === "Pending"
                  ? "gold"
                  : "default"
            }
          >
            {bookingStatus}
          </Tag>
        ) : null}
      </Col>

    </Row>
  </Card>
);


const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { socket, isConnected, onlineUsers } = useSocket();
  const [messageApi, contextHolder] = message.useMessage();

  const [boardingHouse, setBoardingHouse] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userHasBooking, setUserHasBooking] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [roommatePosts, setRoommatePosts] = useState([]);
  const sliderRef = useRef();

  // Review states
  const [reviewContent, setReviewContent] = useState("");
  const [reviewPurpose, setReviewPurpose] = useState("");
  const [reviewRating, setReviewRating] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editedReviewContent, setEditedReviewContent] = useState("");
  const [editedReviewRating, setEditedReviewRating] = useState(null);
  const [editedReviewPurpose, setEditedReviewPurpose] = useState("");
  const [token, setToken] = useState('');
  const [isVisitModalVisible, setIsVisitModalVisible] = useState(false);
  // Tạo function riêng để fetch boarding-house data
  const fetchBoardingHouseData = async () => {
    try {
      const data = await getBoardingHouseById(id);
      console.log(data)
      setBoardingHouse(data);
      const userToken = await getValidAccessToken();
      setToken(userToken);
    } catch (error) {
      console.log("Không tìm thấy nhà trọ!", error);
    }
  };

  useEffect(() => {
    fetchBoardingHouseData();
  }, [id]);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user || !boardingHouse?._id) return;
      try {
        const favorites = await getUserFavorites();
        const isFav = favorites.some((fav) => fav.boardingHouseId?._id === boardingHouse._id);
        setIsFavorite(isFav);
      } catch (err) {
        console.error("Lỗi khi kiểm tra yêu thích", err);
      }
    };
    checkFavoriteStatus();
  }, [user, boardingHouse?._id]);

  useEffect(() => {
    const checkUserBooking = async () => {
      if (!user || !boardingHouse?._id) return;
      try {
        const booking = await getUserBookingForBoardingHouse(user._id, boardingHouse._id);
        setUserHasBooking(!!booking);
      } catch (error) {
        setUserHasBooking(false);
      }
    };
    checkUserBooking();
  }, [user, boardingHouse?._id]);

  const fetchRoommates = async () => {
    if (boardingHouse?._id) {
      try {
        const posts = await getRoommatePosts(boardingHouse._id);
        setRoommatePosts(posts);
      } catch (err) {
        console.log("Không thể tải bài đăng tìm phòng", err);
      }
    }
  };

  useEffect(() => {
    fetchRoommates();
  }, [boardingHouse?._id]);

  if (!boardingHouse) {
    return <div className="boarding-house-not-found">Đang tải hoặc không tìm thấy nhà trọ...</div>;
  }

  const toggleFavorite = async () => {
    if (!user) {
      messageApi.warning("Vui lòng đăng nhập để thêm vào yêu thích.");
      return;
    }
    try {
      if (isFavorite) {
        await removeFromFavorite(boardingHouse._id);
        setIsFavorite(false);
        messageApi.success("Đã xóa khỏi danh sách yêu thích");
      } else {
        await addToFavorite({ boardingHouseId: boardingHouse._id });
        setIsFavorite(true);
        messageApi.success("Đã thêm vào danh sách yêu thích");
      }
    } catch (error) {
      messageApi.error("Cập nhật thất bại");
    }
  };

  const handleBookRoom = (roomId) => {
    if (!user) {
      messageApi.warning("Vui lòng đăng nhập để đặt phòng!");
      return;
    }
    navigate(`/customer/contract/${id}/${roomId}`);
    // navigate("/customer/checkout", { state: { boardingHouseId: id, roomId } });
  };

  const handleContactOwner = async () => {
    if (!user) {
      messageApi.warning("Vui lòng đăng nhập để liên hệ chủ nhà!");
      return;
    }

    if (!boardingHouse?.ownerId?._id) {
      messageApi.error("Không tìm thấy thông tin chủ nhà!");
      return;
    }

    try {
      // Create or get existing chat
      const res = await axios.post("http://localhost:5000/api/chats/get-or-create", {
        user1Id: user._id,
        user2Id: boardingHouse.ownerId._id,
      });

      const chat = res.data;

      // Join socket room
      if (socket) {
        socket.emit("joinRoom", chat._id);
        console.log(`🔌 Joined chat room: ${chat._id}`);
      }

      // Navigate to communication page with owner ID
      navigate(`/customer/communication`);
      messageApi.success("Đã kết nối với chủ nhà!");
    } catch (error) {
      console.error("Error creating chat:", error);
      messageApi.error("Không thể kết nối với chủ nhà. Vui lòng thử lại!");
    }
  };
  const handleScheduleVisitClick = () => {
    if (!user) {
      messageApi.warning("Please log in to schedule a visit.");
      return;
    }

    if (user._id === boardingHouse.ownerId?._id) {
      messageApi.info("You cannot schedule a visit for your own accomodation.");
      return;
    }
    setIsVisitModalVisible(true);
  };

  const handleVisitModalClose = () => {
    setIsVisitModalVisible(false);
  };

  const handleVisitModalSuccess = () => {
    setIsVisitModalVisible(false);
    messageApi.success("Your visit request has been sent to the owner!");
  };
  // Render booking card hoặc booking info
  const renderBookingSection = () => {

    if (!boardingHouse || !boardingHouse.rooms) return null;

    const rooms = boardingHouse.rooms;

    const availableRooms = boardingHouse.rooms.filter(room => room.status === 'Available');

    if (userHasBooking) {
      return (
        <Card className="booking-card">
          <Result
            status="success"
            title="Bạn đã đặt một phòng tại đây!"
            subTitle="Kiểm tra trang 'Chuyến đi của tôi' để xem chi tiết."
          />
          <Divider />
          <Button
            icon={<MessageOutlined />}
            onClick={handleContactOwner}
            style={{ width: '100%' }}
            type="primary"
          >
            Liên hệ chủ nhà
          </Button>
        </Card>
      );
    }

    if (rooms.every((room) => room.bookingStatus !== "Available")) {
      return (
        <Card className="booking-card">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ color: '#ff4d4f' }}>Đã hết phòng</h3>
            <p>Rất tiếc, tất cả các phòng tại đây đã được đặt. Vui lòng quay lại sau!</p>
          </div>
          <Divider />
          <Button
            icon={<MessageOutlined />}
            onClick={handleContactOwner}
            style={{ width: '100%' }}
            type="default"
          >
            Liên hệ chủ nhà
          </Button>
        </Card>
      );
    }

    return (
      <div className="booking-card">
        <h3 className="booking-price">
          {boardingHouse.minPrice?.toLocaleString("vi-VN")} -{" "}
          {boardingHouse.maxPrice?.toLocaleString("vi-VN")} VNĐ/tháng
        </h3>
        <Divider />
        <h4>Chọn phòng:</h4>

        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            paddingRight: "8px",
          }}
        >
          {rooms.map((room) => (
            <RoomCard
              key={room._id}
              room={room}
              bookingStatus={room.bookingStatus !== "Available" ? room.bookingStatus : null}
              onBook={room.bookingStatus === "Available" ? handleBookRoom : undefined}
            />
          ))}

        </div>

        <Button
          icon={<MessageOutlined />}
          onClick={handleContactOwner}
          style={{ width: "100%", marginTop: "16px" }}
        >
          Liên hệ chủ nhà
        </Button>
      </div>
    );
  };
  const sliderSettings = {
    dots: false,
    infinite: roommatePosts.length > 3,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  // Review handlers
  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewContent || !reviewPurpose) {
      messageApi.error("Vui lòng điền đầy đủ thông tin đánh giá.");
      return;
    }
    try {
      // ✅ SỬA: Dùng boardingHouse._id
      const response = await fetch(`http://localhost:5000/api/boarding-houses/${boardingHouse._id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: reviewRating, comment: reviewContent, purpose: reviewPurpose }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gửi đánh giá thất bại');
      }
      messageApi.success("Gửi đánh giá thành công!");
      fetchBoardingHouseData(); // Tải lại toàn bộ dữ liệu
      setReviewContent("");
      setReviewPurpose("");
      setReviewRating(null);
    } catch (error) {
      messageApi.error(error.message);
    }
  };

  const handleEditReview = async (reviewId) => {
    try {
      // ✅ SỬA: Dùng boardingHouse._id
      const response = await fetch(`http://localhost:5000/api/boarding-houses/${boardingHouse._id}/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: editedReviewRating, comment: editedReviewContent, purpose: editedReviewPurpose }),
      });
      const result = await response.json();
      if (response.ok) {
        messageApi.success("Cập nhật đánh giá thành công!");
        // ✅ SỬA: Dùng setBoardingHouse
        setBoardingHouse(prev => ({
          ...prev,
          reviews: prev.reviews.map(r => (r._id === reviewId ? result.review : r)),
        }));
        setEditingReviewId(null);
      } else {
        throw new Error(result.message || "Cập nhật đánh giá thất bại.");
      }
    } catch (err) {
      messageApi.error(err.message);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    try {
      // ✅ SỬA: Dùng boardingHouse._id
      const response = await fetch(`http://localhost:5000/api/boarding-houses/${boardingHouse._id}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        messageApi.success("Xóa đánh giá thành công.");
        // ✅ SỬA: Dùng setBoardingHouse
        setBoardingHouse(prev => ({
          ...prev,
          reviews: prev.reviews.filter((r) => r._id !== reviewId),
        }));
      } else {
        const result = await response.json();
        throw new Error(result.message || "Xóa đánh giá thất bại.");
      }
    } catch (err) {
      messageApi.error(err.message);
    }
  };


  // // riel-time messaging section
  // const handleOpen = () => {
  //   if (!user) {
  //     return Modal.warning({ title: "Please login to message the owner." });
  //   }
  //   setIsModalOpen(true);
  //   fetchMessages(); // Load existing chat
  // };

  // const handleSend = async () => {
  //   if (!inputValue.trim()) return;
  //   const messageData = {
  //     senderId: user._id,
  //     receiverId: boardingHouse.ownerId,
  //     boardingHouseId: boardingHouse._id,
  //     text: inputValue,
  //   };
  //   try {
  //     await axios.post(
  //       process.env.REACT_APP_API_URL + "/messages/send",
  //       messageData,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${user.token}`,
  //         },
  //       }
  //     );
  //     setMessages((prev) => [
  //       ...prev,
  //       { ...messageData, createdAt: new Date() },
  //     ]);
  //     setInputValue("");
  //   } catch (err) {
  //     console.error("Message send failed", err);
  //   }
  // };

  // const fetchMessages = async () => {
  //   const boardingHouseId = boardingHouse?._id;

  //   try {
  //     console.log(
  //       "[DEBUG] GET messages for:",
  //       `/api/messages/${boardingHouseId}`
  //     );

  //     console.log("[DEBUG] boardingHouseId length:", boardingHouseId.length);

  //     const res = await axios.get(process.env.REACT_APP_API_URL + `/messages/${boardingHouseId}`, {
  //       headers: {
  //         Authorization: `Bearer ${user.token}`,
  //       },
  //     });
  //     setMessages(res.data);
  //   } catch (err) {
  //     console.error("Fetch messages failed", err);
  //   }
  // };

  return (
    <div>
      {contextHolder}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <div className="boardingHouse-main-image-wrapper">
            <img
              src={boardingHouse.photos?.[0] ? `http://localhost:5000${boardingHouse.photos[0]}` : "/image/default-image.jpg"}
              alt={boardingHouse.name}
              className="boardingHouse-main-image"
            />
            <button className="favorite-btn" onClick={toggleFavorite}>
              {isFavorite ? <HeartFilled style={{ color: "red", fontSize: 24 }} /> : <HeartOutlined style={{ color: "black", fontSize: 24 }} />}
            </button>
          </div>
        </Col>
      </Row>

      <Row gutter={32} className="boardingHouse-main-content">
        <Col xs={24} md={16}>
          <h1 className="boardingHouse-title">{boardingHouse.name}</h1>
          <p className="boardingHouse-location">
            {`${boardingHouse.location.addressDetail}, ${boardingHouse.location.street}, ${boardingHouse.location.district}`}
          </p>
          <h2>Mô tả</h2>
          <p>{boardingHouse.description}</p>
        </Col>

        <Col xs={24} md={8}>
          {renderBookingSection()}
        </Col>
      </Row>

      <Divider />
      <h1 className="text-heading">Tiện ích</h1>
      <Row gutter={[24, 24]} className="boardingHouse-amenities">
        {boardingHouse.amenities?.map((amenity, index) => (
          <Col xs={12} sm={8} md={6} key={index} className="amenity-item">
            <CheckCircleOutlined className="amenity-icon" />
            <div><strong>{amenity}</strong></div>
          </Col>
        ))}
      </Row>

      <Divider />
      <h1 className="text-heading">Vị trí</h1>
      <div className="map-container">
        <MapContainer
          center={[boardingHouse.location.latitude, boardingHouse.location.longitude]}
          zoom={15} scrollWheelZoom={false} className="map-leaflet"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[boardingHouse.location.latitude, boardingHouse.location.longitude]}>
            <Popup>{boardingHouse.name}</Popup>
          </Marker>
        </MapContainer>
      </div>

      <Divider />
      <h1 className="text-heading">Tìm bạn cùng phòng</h1>
      <Button onClick={() => setShowModal(true)} type="primary" style={{ marginBottom: "1rem" }}>
        + Đăng bài tìm bạn
      </Button>
      {roommatePosts.length === 0 ? (
        <p>Chưa có bài đăng tìm bạn cùng phòng nào.</p>
      ) : (
        <div style={{ position: "relative" }}>
          <Slider {...sliderSettings} ref={sliderRef}>
            {roommatePosts.map((post) => {
              // Lấy thông tin người đăng bài
              const author = post.userId;

              return (
                <div key={post._id} style={{ padding: "0 8px" }}> {/* Giảm padding ngang */}
                  <Card
                    className="roommate-card"
                    hoverable
                    style={{ height: '100%' }} // Để Card tự điều chỉnh chiều cao
                    bodyStyle={{ padding: '16px' }} // Giảm padding body
                  >
                    {/* Phần thông tin người đăng */}
                    <Card.Meta
                      avatar={
                        <Avatar
                          size={48} // Kích thước avatar
                          src={author?.avatar ? `http://localhost:5000${author.avatar}` : null} // ✅ Lấy avatar của người đăng bài
                          style={{
                            backgroundColor: author?.avatar ? 'transparent' : '#004d40', // Màu nền nếu không có avatar
                            border: '1px solid #eee'
                          }}
                        >
                          {/* Hiển thị chữ cái đầu nếu không có avatar */}
                          {!author?.avatar && author?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      title={author?.name || "Người dùng ẩn danh"}
                      description={`Đăng ${dayjs(post.createdAt).fromNow()}`} // Hiển thị thời gian tương đối
                      style={{ marginBottom: '12px' }}
                    />

                    {/* Phần nội dung bài đăng */}
                    <div className="roommate-post-content">
                      {/* Hiển thị ảnh nếu có */}
                      {post.images?.length > 0 && (
                        <Carousel autoplay dotPosition="bottom" style={{ marginBottom: '12px' }}>
                          {post.images.map((img, idx) => (
                            <div key={idx}>
                              <img
                                src={`http://localhost:5000${img}`} // Giả sử ảnh được lưu tương đối
                                alt={`Giới thiệu ${idx + 1}`}
                                style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 4 }}
                              />
                            </div>
                          ))}
                        </Carousel>
                      )}

                      {/* Phần giới thiệu */}
                      <p style={{ fontStyle: 'italic', color: '#555', marginBottom: '10px' }}>"{post.intro}"</p>

                      {/* Thông tin chi tiết */}
                      <div className="roommate-details">
                        <p>
                          <UserOutlined style={{ marginRight: 8, color: '#004d40' }} />
                          <strong>Giới tính mong muốn:</strong> {post.genderPreference || "Linh hoạt"}
                        </p>
                        {/* Hiển thị Habits dưới dạng Tag */}
                        {post.habits && post.habits.length > 0 && (
                          <p style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                            <TagOutlined style={{ marginRight: 8, color: '#004d40' }} />
                            <strong>Thói quen:</strong>
                            {post.habits.map((habit, i) => (
                              <Tag key={i} color="blue">{habit}</Tag>
                            ))}
                          </p>
                        )}
                        {/* Nút liên hệ (ví dụ) */}
                        <Button
                          icon={<MessageOutlined />}
                          style={{ marginTop: '12px', width: '100%' }}
                          onClick={(e) => {
                            e.stopPropagation(); // Ngăn Card kích hoạt link (nếu có)
                            navigate(`/customer/chat/${author?._id}`);
                          }}
                        >
                          Nhắn tin
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </Slider >
          <div className="custom-carousel-buttons">
            <button className="nav-button" onClick={() => sliderRef.current.slickPrev()}><LeftOutlined /></button>
            <button className="nav-button" onClick={() => sliderRef.current.slickNext()}><RightOutlined /></button>
          </div>
        </div >
      )}
      <RoommatePostModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        boardingHouseId={boardingHouse._id}
        onSuccess={fetchRoommates}
      />
      <VisitRequestModal
        visible={isVisitModalVisible}
        onClose={handleVisitModalClose}
        onSuccess={handleVisitModalSuccess}
        boardingHouseId={boardingHouse._id}
        ownerId={boardingHouse.ownerId?._id}
      />
      <Divider />

      <h1 className="text-heading">Reviews</h1>

      <Row gutter={32} align="top">
        {/* Left: Add Review */}
        <Col xs={24} md={10}>
          <div className="leave-review-section">
            <h2 className="leave-review-title">Leave a Review</h2>

            {user ? (
              userHasBooking ? (
                <div className="review-form-container">
                  <div className="review-form-row">
                    <label className="review-form-label">Your Review</label>
                    <Input.TextArea
                      rows={4}
                      placeholder="Share your experience about this boardingHouse..."
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      className="review-custom-textarea"
                    />
                  </div>

                  <div className="review-form-row">
                    <label className="review-form-label">Purpose</label>
                    <Input
                      placeholder="e.g., Business trip, Vacation, Study"
                      value={reviewPurpose}
                      onChange={(e) => setReviewPurpose(e.target.value)}
                      className="review-custom-input"
                    />
                  </div>

                  <div className="review-form-row">
                    <label className="review-form-label">Rating (1-5)</label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      placeholder="Rate from 1 to 5 stars"
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="review-custom-input"
                    />
                  </div>

                  <Button
                    className="review-submit-button"
                    onClick={handleSubmitReview}
                    size="large"
                  >
                    Submit Review
                  </Button>
                </div>
              ) : (
                <div className="login-prompt-custom">
                  <div className="review-prompt-container">
                    <i className="bi bi-info-circle review-prompt-icon"></i>
                    <h3 className="review-prompt-title">Only Verified Guests Can Review</h3>
                    <p className="review-prompt-description">
                      You need to book and stay at this boardingHouse to leave a review.
                    </p>
                    <p className="review-prompt-note">
                      This helps ensure authentic and helpful reviews for other travelers.
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="login-prompt-custom">
                Please log in to leave a review.
              </div>
            )}
          </div>
        </Col>

        {/* Right: Review List */}
        <Col xs={24} md={14}>
          <h2 className="reviews-section-header">
            Reviews from Others
          </h2>

          {boardingHouse.reviews && boardingHouse.reviews.length > 0 ? (
            boardingHouse.reviews.map((review, index) => (
              <Card
                key={index}
                className="custom-review-card"
                style={{ marginBottom: 16 }}
              >
                <div className="review-header">
                  <Avatar
                    size={48}
                    style={{ backgroundColor: "#004d47", marginRight: 12 }}
                  >
                    {review.name?.[0]?.toUpperCase() ||
                      review.user?.name?.[0]?.toUpperCase() ||
                      review.customerId?.name?.[0]?.toUpperCase() ||
                      "U"}{" "}
                  </Avatar>
                  <div className="review-meta">
                    <div className="review-name-rating">
                      <strong className="review-customer-name">
                        {review.name || review.user?.name || review.customerId?.name || "Unknown User"}
                      </strong>
                      <span className="review-rating">
                        <i
                          className="bi bi-star-fill"
                          style={{ color: "#004d40" }}
                        />{" "}
                        {review.rating}/5
                      </span>
                    </div>
                    <span className="review-time">
  • {dayjs(review.createdAt).fromNow()}
</span>
                  </div>
                </div>

                {editingReviewId === review._id ? (
                  <>
                    <Input.TextArea
                      rows={3}
                      value={editedReviewContent}
                      onChange={(e) => setEditedReviewContent(e.target.value)}
                      style={{ marginBottom: 8 }}
                    />
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      placeholder="Rating (1-5 stars)"
                      value={editedReviewRating}
                      onChange={(e) =>
                        setEditedReviewRating(Number(e.target.value))
                      }
                      style={{ marginBottom: 8 }}
                    />
                    <Input
                      placeholder="Purpose"
                      value={editedReviewPurpose}
                      onChange={(e) => setEditedReviewPurpose(e.target.value)}
                      style={{ marginBottom: 8 }}
                    />
                    <Button
                      type="primary"
                      onClick={() =>
                        handleEditReview(review._id || review?.user?._id)
                      }
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => setEditingReviewId(null)}
                      style={{ marginLeft: 8 }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <div className="review-body">
                    <p>{review.comment}</p>
                    <p>
                      <strong>Purpose:</strong> {review.purpose}
                    </p>

                    {user &&
                      (review.user?._id || review.customerId?._id) &&
                      (String(review.user?._id || review.customerId?._id) === String(user._id)) && (
                        <div className="review-action-buttons">
                          <Button
                            size="small"
                            onClick={() => {
                              setEditingReviewId(review._id);
                              setEditedReviewContent(review.comment);
                              setEditedReviewRating(review.rating);
                              setEditedReviewPurpose(review.purpose);
                            }}
                          >
                            Edit
                          </Button>

                          <Button
                            size="small"
                            onClick={() => handleDeleteReview(review._id)}
                            style={{ marginLeft: 8 }}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                  </div>
                )}
              </Card>
            ))
          ) : (
            <p>No reviews yet for this boarding-house.</p>
          )}
        </Col>
      </Row>

      <Divider />
      <h1 className="text-heading">Policy detail</h1>
      <Row gutter={[32, 32]} justify="center">
        <Col xs={24} md={8}>
          <h3>House rules</h3>
          <ul className="policy-list">
            <li>
              <i className="bi bi-clock-fill" /> Checkin time
            </li>
            <li>
              <i className="bi bi-clock-fill" /> Checkout time
            </li>
            <li>
              <i className="bi bi-x-circle" /> No smoking
            </li>
            <li>
              <i className="bi bi-slash-circle" /> No pets
            </li>
            <li>
              <i className="bi bi-ban" /> No parties or events
            </li>
          </ul>
        </Col>

        <Col xs={24} md={8}>
          <h3>Cancellation Policy</h3>
          <ul className="policy-list">
            <li>
              <i className="bi bi-dot" /> Free cancellation up to 24hrs before
              checkin
            </li>
          </ul>
        </Col>

        <Col xs={24} md={8}>
          <h3>Health & Safety</h3>
          <ul className="policy-list">
            <li>
              <i className="bi bi-shield-check" /> Cleaner follows COVID policy
            </li>
          </ul>
        </Col>
      </Row>
    </div >
  );
};

export default PropertyDetails;
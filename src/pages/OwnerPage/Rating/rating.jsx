import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./rating.css";
import { Button, Table, Tag, Spin, message, Rate } from "antd";
import { getOwnerRatings } from "../../../services/boardingHouseAPI";

const Rating = () => {
  const navigate = useNavigate();
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overallAvgRating, setOverallAvgRating] = useState(null);

  useEffect(() => {
    fetchOwnerRatings();
  }, []);

  const fetchOwnerRatings = async () => {
    try {
      setLoading(true);
      console.log("🔍 [DEBUG] Calling getOwnerRatings API...");
      const response = await getOwnerRatings();
      console.log("📝 [DEBUG] API Response:", response);

      if (response.success && response.boardingHouses) {
        console.log("✅ [DEBUG] API Success:", response.boardingHouses);
        setBoardingHouses(response.boardingHouses);

        // Tính tổng trung bình đánh giá
        const rated = response.boardingHouses.filter(
          (bh) => bh.totalReviews > 0
        );
        if (rated.length > 0) {
          const totalRating = rated.reduce(
            (sum, bh) => sum + bh.averageRating,
            0
          );
          const avgRating = (totalRating / rated.length).toFixed(1);
          setOverallAvgRating(avgRating);
        }
      } else {
        message.error("Không thể tải dữ liệu đánh giá");
      }
    } catch (error) {
      console.error("💥 [DEBUG] Error fetching owner ratings:", error);
      message.error("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Tên Nhà Trọ",
      dataIndex: "name",
      key: "name",
    },
   
  
    {
      title: "Điểm Trung Bình",
      key: "averageRating",
      render: (_, record) =>
        record.totalReviews > 0 ? (
          <span>
            <Rate disabled allowHalf value={record.averageRating} />
            <span style={{ marginLeft: 8 }}>({record.averageRating})</span>
          </span>
        ) : (
          <span>Chưa có đánh giá</span>
        ),
    },
    {
      title: "Số Lượng Đánh Giá",
      dataIndex: "totalReviews",
      key: "totalReviews",
    },
    {
      title: "Thao Tác",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          className="view-rating-btn"
          onClick={() => navigate(`/owner/rating/${record._id}`)}
        >
          Xem đánh giá
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div
        className="rating-wrapper"
        style={{ textAlign: "center", marginTop: 50 }}
      >
        <Spin size="large" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="rating-wrapper">
      <h2>Your Boarding Houses</h2>

      {overallAvgRating && (
        <div className="overall-rating">
          <strong>Overall Average Rating:</strong>{" "}
          <Rate disabled allowHalf value={parseFloat(overallAvgRating)} /> (
          {overallAvgRating})
        </div>
      )}

      <Table
        className="rating-table"
        dataSource={boardingHouses.map((b) => ({ ...b, key: b._id }))}
        columns={columns}
        pagination={{ pageSize: 8 }}
      />
    </div>
  );
};

export default Rating;

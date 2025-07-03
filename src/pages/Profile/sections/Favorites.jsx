import React, { useEffect, useState } from "react";
import { Card, Spin, Row, Col, Pagination,Modal,Button,message as antMessage  } from "antd";
import { getUserFavorites } from "../../../../src/services/profileServices";
import useUser from "../../../../src/contexts/UserContext";
import { removeFavorite } from "../../../../src/services/profileServices";

const Favorites = () => {
  const { user, loading: userLoading } = useUser();
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [messageApi, contextHolder] = antMessage.useMessage();

  const handleImageClick = (imageUrl) => {
    setPreviewImage(imageUrl);
    setPreviewVisible(true);
  };

  const handleCancel = () => setPreviewVisible(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
const handleRemoveFavorite = async (accommodationId) => {
  try {
    await removeFavorite({
      accommodationId,
    });

    messageApi.success("Removed from favorites");

    setFavorites((prev) =>
      prev.filter((fav) => fav.accommodationId._id !== accommodationId)
    );
  } catch (err) {
    console.error(err);
    messageApi.error("Failed to remove favorite");
  }
};

  useEffect(() => {
    if (userLoading) return;

    if (!user?._id) {
      setError("Bạn phải login để vào trang này.");
      return;
    }

    setLoading(true);

    getUserFavorites()
      .then((res) => {
        setFavorites(res.data.favorites);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Lỗi khi lấy danh sách favorite.");
        setLoading(false);
      });
  }, [user, userLoading]);

  if (userLoading) return <Spin />;

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  if (loading) return <Spin />;

  const startIndex = (currentPage - 1) * pageSize;
  const currentFavorites = favorites.slice(startIndex, startIndex + pageSize);

  return (
    <div style={{ padding: "16px" }}>
      {contextHolder}
      <h2>Your Favorites</h2>

      {favorites.length === 0 && (
        <p>Chưa có accommodation nào trong favorite.</p>
      )}

      <Row gutter={[16, 16]}>
        {currentFavorites.map((fav) => {
          const acc = fav.accommodationId;

          return (
            
            <Col xs={24} sm={10} md={8} key={fav._id}>
              <Card
                title={acc?.title || "No title"}
                style={{ marginBottom: "16px" }}
                cover={
                  acc?.image ? (
                    <img
                      alt={acc.title}
                      src={acc.image}
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "contain",
                        backgroundColor: "#f5f5f5",
                        display: "block",
                        margin: "auto",
                      }}
                      onClick={() => handleImageClick(acc.image)}
                    />
                  ) : null
                }
              >
                <p>{acc?.description || "No description"}</p>
                <p>
                  <strong>Price:</strong> {acc?.price?.toLocaleString()} VNĐ
                </p>
                <p>
                  <strong>Status:</strong> {acc?.status}
                </p>

                {acc?.location && (
                  <>
                    <p>
                      <strong>Địa chỉ:</strong>{" "}
                      {acc.location.addressDetail
                        ? `${acc.location.addressDetail}, `
                        : ""}
                      {acc.location.street ? `${acc.location.street}, ` : ""}
                      {acc.location.district || ""}
                    </p>
                    {(acc.location.latitude || acc.location.longitude) && (
                      <p>
                        <strong>Tọa độ:</strong> {acc.location.latitude},{" "}
                        {acc.location.longitude}
                      </p>
                    )}
                  </>
                )}
                     <Button
                  danger
                  type="primary"
                  onClick={() => handleRemoveFavorite(acc._id)}
                  style={{ marginTop: 8 }}
                  block
                >
                  Remove from favorites
                </Button>
              </Card>
            </Col>
          );
        })}
      </Row>

      {favorites.length > pageSize && (
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={favorites.length}
          onChange={setCurrentPage}
          style={{ marginTop: "24px", textAlign: "center" }}
        />
      )}
      <Modal
        visible={previewVisible}
        footer={null}
        onCancel={handleCancel}
        centered
        bodyStyle={{ padding: 0 }}
      >
        <img alt="preview" src={previewImage}  style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
      </Modal>
    </div>
  );
};

export default Favorites;
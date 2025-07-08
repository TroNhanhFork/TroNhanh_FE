// file OwnerPage/Accommodation/accommodation.jsx
import React, { useEffect, useState } from "react";
import { Table, Button, Tag, Modal, message } from "antd";
import "./accommodation.css";
import { getAllAccommodations, createAccommodation, getAccommodationById, updateAccommodation, deleteAccommodation } from "../../../services/accommodationAPI";
import { geocodeWithOpenCage } from "../../../services/OpenCage";
import useUser from "../../../contexts/UserContext"

import roomImage0 from "../../../assets/images/Accommodation/room0.png";
import roomImage1 from "../../../assets/images/Accommodation/room1.png";
import roomImage2 from "../../../assets/images/Accommodation/room2.png";
import roomImage3 from "../../../assets/images/Accommodation/room3.png";

const photoOptions = [
  { label: "Ảnh 1", value: roomImage1 },
  { label: "Ảnh 2", value: roomImage2 },
  { label: "Ảnh 3", value: roomImage3 },
];

const Accommodation = () => {
  const [data, setData] = useState([]);
  const { user } = useUser()

  const fetchData = async () => {
    try {
      const accomData = await getAllAccommodations()
      setData(accomData)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const [selectedRow, setSelectedRow] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [accommodationToDelete, setAccommodationToDelete] = useState(null);

  const [newAccommodation, setNewAccommodation] = useState({
    title: "",
    location: {
      district: "",
      street: "",
      addressDetail: "",
      latitude: null,
      longitude: null,
    },
    price: "",
    description: "",
    photos: roomImage1,
    status: "Available",
  });


  const handleView = (record) => {
    setSelectedRow(record);
    setIsModalVisible(true);
  };

  const handleRemove = (record) => {
    setAccommodationToDelete(record);
    setIsDeleteModalVisible(true);
  };

  const handleUpdate = (record) => {
    setEditingRow({
      ...record,
      location: {
        district: record.location?.district || "",
        street: record.location?.street || "",
        addressDetail: record.location?.addressDetail || "",
        latitude: record.location?.latitude || null,
        longitude: record.location?.longitude || null,
      },
    });
    setIsUpdateModalVisible(true);
  };


  const columns = [
    {
      title: "Title",
      dataIndex: "title",
    },
    {
      title: "Location",
      dataIndex: "location",
      render: (location) => {
        if (!location) return "N/A";
        const { street, district, addressDetail } = location;
        return [street, district, addressDetail].filter(Boolean).join(", ");
      },
    },

    {
      title: "Price (VND)",
      dataIndex: "price",
      render: (text) => (text ? Number(text).toLocaleString() : "0"),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "Available" ? "green" : "volcano"}>{status}</Tag>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <div className="action-buttons">
          <Button onClick={() => handleView(record)} className="view-btn">View</Button>
          <Button className="update-btn" onClick={() => handleUpdate(record)}>Update</Button>
          <Button className="remove-btn" onClick={() => handleRemove(record)}>Remove</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="accommodation-wrapper">
      <div className="header-row">
        <h2>Manage Accommodation</h2>
        <Button className="add-btn" onClick={() => setIsAddModalVisible(true)}>ADD</Button>

      </div>

      <Table className="accommodation-table" columns={columns} dataSource={data} pagination={false} rowKey="_id" />

      <Modal

        title="Add New Accommodation"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onOk={async () => {
          try {
            const fullAddress = `${newAccommodation.location?.street}, ${newAccommodation.location?.district}, Đà Nẵng, Việt Nam`;
            const coords = await geocodeWithOpenCage(fullAddress);
            console.log("Coords:", coords);

            const payload = {
              ...newAccommodation,
              price: Number(newAccommodation.price),
              location: {
                district: newAccommodation.location?.district || "",  // nếu bạn có select quận
                street: newAccommodation.location?.street || "",       // nếu bạn tách ra
                addressDetail: newAccommodation.location.addressDetail || "",
                latitude: coords?.latitude || null,
                longitude: coords?.longitude || null,
              },
              photos: [newAccommodation.photos],
              ownerId: user._id,
            };

            const savedAccommodation = await createAccommodation(payload);
            console.log("Payload gửi lên:", payload);

            setData([...data, savedAccommodation]); // gán từ BE trả về
            setIsAddModalVisible(false);

            // Reset
            setNewAccommodation({
              title: "",
              location: "",
              price: "",
              description: "",
              photos: roomImage1,
              status: "Available",
            });
            Modal.error({
              title: "Thành công",
              content: "Thêm trọ mới thành công!",
            });

            fetchData()
          } catch (err) {
            console.error("Failed to add accommodation:", err);
            Modal.error({
              title: "Thất bại",
              content: "Thêm trọ mới thất bại. Vui lòng thử lại.",
            });

          }
        }}

        okText="Add"
        cancelText="Cancel"
        okButtonProps={{ success: true }}
      >
        <div className="modal-form">
          <label>Choose photos option:</label>
          <div className="photo-options">
            {photoOptions.map((photo, index) => (
              <img
                key={index}
                src={photo.value}
                alt={`photo-${index}`}
                className={`photo-thumb ${newAccommodation.photos === photo.value ? "selected" : ""}`}
                onClick={() => setNewAccommodation({ ...newAccommodation, photos: photo.value })}
              />
            ))}
          </div>

          <label>Title:</label>
          <input
            type="text"
            value={newAccommodation.title}
            onChange={(e) => setNewAccommodation({ ...newAccommodation, title: e.target.value })}
          />

          <label>District:</label>
          <input
            type="text"
            value={newAccommodation.location.district}
            onChange={(e) =>
              setNewAccommodation((prev) => ({
                ...prev,
                location: { ...prev.location, district: e.target.value },
              }))
            }
          />

          <label>Street:</label>
          <input
            type="text"
            value={newAccommodation.location.street}
            onChange={(e) =>
              setNewAccommodation((prev) => ({
                ...prev,
                location: { ...prev.location, street: e.target.value },
              }))
            }
          />

          <label>Address Detail:</label>
          <input
            type="text"
            value={newAccommodation.location.addressDetail}
            onChange={(e) =>
              setNewAccommodation((prev) => ({
                ...prev,
                location: { ...prev.location, addressDetail: e.target.value },
              }))
            }
          />


          <label>Price (VND):</label>
          <input
            type="number"
            value={newAccommodation.price}
            onChange={(e) => setNewAccommodation({ ...newAccommodation, price: e.target.value })}
          />

          <label>Description:</label>
          <textarea
            value={newAccommodation.description}
            onChange={(e) => setNewAccommodation({ ...newAccommodation, description: e.target.value })}
          />

          <label>Status:</label>
          <select
            value={newAccommodation.status}
            onChange={(e) => setNewAccommodation({ ...newAccommodation, status: e.target.value })}
          >
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>
      </Modal>



      <Modal
        title="Accommodation Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        {selectedRow && (
          <div>
            <img src={selectedRow.photos} alt="room" style={{ width: "100%", borderRadius: 8 }} />
            <p><strong>Title:</strong> {selectedRow.title}</p>
            <p><strong>District:</strong> {selectedRow.location?.district}</p>
            <p><strong>Street:</strong> {selectedRow.location?.street}</p>
            <p><strong>Address:</strong> {selectedRow.location?.addressDetail}</p>
            <p><strong>Price:</strong> {selectedRow.price.toLocaleString()} VND</p>
            <p><strong>Status:</strong> {selectedRow.status}</p>
            <p><strong>Description:</strong> {selectedRow.description}</p>
          </div>
        )}
      </Modal>


      <Modal
        title="Update Accommodation"
        open={isUpdateModalVisible}
        onCancel={() => setIsUpdateModalVisible(false)}
        onOk={async () => {
          const { district, street, addressDetail } = editingRow.location;
          const fullAddress = `${street}, ${district}, Đà Nẵng, Việt Nam`;

          const coords = await geocodeWithOpenCage(fullAddress);

          if (!coords) {
            Modal.error({
              title: "Không thể lấy tọa độ",
              content: "Vui lòng kiểm tra lại địa chỉ bạn nhập.",
            });
            return;
          }

          const payload = {
            ...editingRow,
            price: Number(editingRow.price),
            location: {
              ...editingRow.location,
              latitude: coords.latitude,
              longitude: coords.longitude,
            },
          };

          try {
            const updatedAccommodation = await updateAccommodation(editingRow._id, payload);
            const updatedData = data.map((item) =>
              item._id === updatedAccommodation._id ? updatedAccommodation : item
            );
            setData(updatedData);
            Modal.success({
              title: "Thành công",
              content: "Cập nhật thành công!",
            });
            setIsUpdateModalVisible(false);
            fetchData()
          } catch (err) {
            console.error("Update failed:", err);
            Modal.error({
              title: "Thất bại",
              content: "Cập nhật thất bại. Vui lòng thử lại.",
            });
          }
        }}

        okText="Save"
        cancelText="Cancel"
        okButtonProps={{ primary: true }}
      >
        {editingRow && (
          <div className="modal-form">
            <label>Choose photos option:</label>
            <div className="photo-options">
              {photoOptions.map((photo, index) => (
                <img
                  key={index}
                  src={photo.value}
                  alt={`photo-${index}`}
                  className={`photo-thumb ${editingRow.photos === photo.value ? "selected" : ""
                    }`}
                  onClick={() =>
                    setEditingRow({ ...editingRow, photos: photo.value })
                  }
                />
              ))}
            </div>

            <label>Title:</label>
            <input
              type="text"
              value={editingRow.title}
              onChange={(e) =>
                setEditingRow({ ...editingRow, title: e.target.value })
              }
            />
            <label>District:</label>
            <input
              type="text"
              value={editingRow.location.district}
              onChange={(e) =>
                setEditingRow((prev) => ({
                  ...prev,
                  location: { ...prev.location, district: e.target.value },
                }))
              }
            />

            <label>Street:</label>
            <input
              type="text"
              value={editingRow.location.street}
              onChange={(e) =>
                setEditingRow((prev) => ({
                  ...prev,
                  location: { ...prev.location, street: e.target.value },
                }))
              }
            />

            <label>Address Detail:</label>
            <input
              type="text"
              value={editingRow.location.addressDetail}
              onChange={(e) =>
                setEditingRow((prev) => ({
                  ...prev,
                  location: { ...prev.location, addressDetail: e.target.value },
                }))
              }
            />


            <label>Price (VND):</label>
            <input
              type="number"
              value={editingRow.price}
              onChange={(e) =>
                setEditingRow({ ...editingRow, price: Number(e.target.value) })
              }
            />

            <label>Description:</label>
            <textarea
              value={editingRow.description}
              onChange={(e) =>
                setEditingRow({ ...editingRow, description: e.target.value })
              }
            />

            <label>Status:</label>
            <select
              value={editingRow.status}
              onChange={(e) =>
                setEditingRow({ ...editingRow, status: e.target.value })
              }
            >
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>
        )}

      </Modal>

      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalVisible}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setAccommodationToDelete(null);
        }}
        onOk={async () => {
          if (!accommodationToDelete) return;

          try {
            await deleteAccommodation(accommodationToDelete._id);
            setData((prevData) =>
              prevData.filter((item) => item._id !== accommodationToDelete._id)
            );
            Modal.success({
              title: "Thành công",
              content: "Xóa thành công!",
            });
          } catch (err) {
            console.error("Xóa thất bại:", err);
            Modal.error({
              title: "Thất bại",
              content: "Xóa chỗ ở thất bại. Vui lòng thử lại.",
            });
          } finally {
            setIsDeleteModalVisible(false);
            setAccommodationToDelete(null);
          }
        }}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}      >
        <p>Bạn có chắc chắn muốn xóa chỗ ở <strong>{accommodationToDelete?.title}</strong> không?</p>
      </Modal>



    </div>
  );
};

export default Accommodation;
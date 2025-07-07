// file TroNhanh_FE/src/pages/OwnerPage/Accommodation/accommodation.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Tag, Modal, Carousel } from "antd";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";

import "./accommodation.css";
import { getValidAccessToken } from "../../../services/authService";

const Accommodation = () => {
  const [data, setData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newAccommodation, setNewAccommodation] = useState({
    title: "",
    location: { street: "", district: "" },
    price: "",
    description: "",
    photos: [],
    status: "available",
    files: [],
  });

  useEffect(() => {
    fetchAccommodations();
  }, []);

  const fetchAccommodations = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.id) return;
  
      const res = await axios.get(`http://localhost:5000/api/accommodation?ownerId=${user.id}`);
      const fetchedData = res.data.map((item) => ({
        ...item,
        key: item._id,
      }));
      setData(fetchedData);
    } catch (error) {
      console.error("Error fetching accommodations:", error);
    }
  };
  

  const handleView = (record) => {
    setSelectedRow(record);
    setIsModalVisible(true);
  };

  const handleRemove = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/accommodation/${id}`);
      setData(data.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error deleting accommodation:", error);
    }
  };

  const handleUpdate = (record) => {
    setEditingRow({ ...record, files: [] });
    setIsUpdateModalVisible(true);
  };

  const columns = [
    { title: "Title", dataIndex: "title" },
    {
      title: "Street",
      dataIndex: "location",
      render: (loc) => loc?.street || "N/A",
    },
    {
      title: "District",
      dataIndex: "location",
      render: (loc) => loc?.district || "N/A",
    },
    {
      title: "Price (VND)",
      dataIndex: "price",
      render: (text) => text.toLocaleString(),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "available" ? "green" : "volcano"}>{status}</Tag>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <div className="action-buttons">
          <Button onClick={() => handleView(record)} className="view-btn">
            View
          </Button>
          <Button className="update-btn" onClick={() => handleUpdate(record)}>
            Update
          </Button>
          <Button
            className="remove-btn"
            onClick={() => handleRemove(record._id)}
          >
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="accommodation-wrapper">
      <div className="header-row">
        <h2>Manage Accommodation</h2>
        <Button className="add-btn" onClick={() => setIsAddModalVisible(true)}>
          ADD
        </Button>
      </div>

      <Table
        className="accommodation-table"
        columns={columns}
        dataSource={data}
        pagination={false}
      />

      {/* ADD MODAL */}
      <Modal
        title="Add New Accommodation"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onOk={async () => {
          try {
            const user = JSON.parse(localStorage.getItem("user"));
            const token = await getValidAccessToken();
            if (!user || !user.id || !token) {
              return alert("Bạn chưa đăng nhập. Hãy đăng nhập lại!");
            }

            const formData = new FormData();
            formData.append("title", newAccommodation.title);
            formData.append("description", newAccommodation.description);
            formData.append("price", newAccommodation.price);
            formData.append("status", newAccommodation.status);
            formData.append("ownerId", user.id);
            formData.append(
              "location",
              JSON.stringify(newAccommodation.location)
            );
            for (let i = 0; i < newAccommodation.files.length; i++) {
              formData.append("photos", newAccommodation.files[i]);
            }

            const res = await axios.post(
              "http://localhost:5000/api/accommodation",
              formData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            setData([...data, { ...res.data.data, key: res.data.data._id }]);
            setIsAddModalVisible(false);
            setNewAccommodation({
              title: "",
              location: { street: "", district: "" },
              price: "",
              description: "",
              photos: [],
              status: "available",
              files: [],
            });

            alert("Accommodation added successfully!");
          } catch (error) {
            console.error("Error adding accommodation:", error);
          }
        }}
        okText="Add"
        cancelText="Cancel"
      >
        <div className="modal-form">
          <label>Upload Images:</label>
          <input
            type="file"
            accept="image/*"
            multiple

            onChange={(e) =>
              setNewAccommodation({
                ...newAccommodation,
                files: Array.from(e.target.files),
              })
            }
          />

          <label>Title:</label>
          <input
            type="text"
            value={newAccommodation.title}
            onChange={(e) =>
              setNewAccommodation({ ...newAccommodation, title: e.target.value })
            }
          />

          <label>Street:</label>
          <input
            type="text"
            value={newAccommodation.location.street}
            onChange={(e) =>
              setNewAccommodation({
                ...newAccommodation,
                location: {
                  ...newAccommodation.location,
                  street: e.target.value,
                },
              })
            }
          />

          <label>District:</label>
          <input
            type="text"
            value={newAccommodation.location.district}
            onChange={(e) =>
              setNewAccommodation({
                ...newAccommodation,
                location: {
                  ...newAccommodation.location,
                  district: e.target.value,
                },
              })
            }
          />

          <label>Price (VND):</label>
          <input
            type="number"
            value={newAccommodation.price}
            onChange={(e) =>
              setNewAccommodation({
                ...newAccommodation,
                price: e.target.value,
              })
            }
          />

          <label>Description:</label>
          <textarea
            value={newAccommodation.description}
            onChange={(e) =>
              setNewAccommodation({
                ...newAccommodation,
                description: e.target.value,
              })
            }
          />

          <label>Status:</label>
          <select
            value={newAccommodation.status}
            onChange={(e) =>
              setNewAccommodation({ ...newAccommodation, status: e.target.value })
            }
          >
            <option value="available">available</option>
            <option value="unavailable">unavailable</option>
          </select>
        </div>
      </Modal>

      {/* VIEW MODAL */}
      <Modal
        title="Accommodation Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        {selectedRow && (
          <div>
            {selectedRow.photos && selectedRow.photos.length > 0 && (
              <Carousel
              autoplay
              arrows
              prevArrow={<AiOutlineLeft className="custom-arrow arrow-left" />}
              nextArrow={<AiOutlineRight className="custom-arrow arrow-right" />}
            >
              {selectedRow.photos.map((photo, index) => (
                <div key={index}>
                  <img
                    src={`http://localhost:5000${photo}`}
                    alt={`photo-${index}`}
                    style={{
                      width: "100%",
                      maxHeight: "300px",
                      objectFit: "cover",
                      borderRadius: "8px"
                    }}
                  />
                </div>
              ))}
            </Carousel>
            
            )}
            <p><strong>Title:</strong> {selectedRow.title}</p>
            <p><strong>Street:</strong> {selectedRow.location?.street}</p>
            <p><strong>District:</strong> {selectedRow.location?.district}</p>
            <p><strong>Price:</strong> {selectedRow.price.toLocaleString()} VND</p>
            <p><strong>Status:</strong> {selectedRow.status}</p>
            <p><strong>Description:</strong> {selectedRow.description}</p>
          </div>
        )}
      </Modal>


      {/* UPDATE MODAL */}
      <Modal
        title="Update Accommodation"
        open={isUpdateModalVisible}
        onCancel={() => setIsUpdateModalVisible(false)}
        onOk={async () => {
          try {
            const token = await getValidAccessToken();
            const formData = new FormData();

            formData.append("title", editingRow.title);
            formData.append("description", editingRow.description);
            formData.append("price", editingRow.price);
            formData.append("status", editingRow.status);
            formData.append("location", JSON.stringify(editingRow.location));
            for (let i = 0; i < editingRow.files.length; i++) {
              formData.append("photos", editingRow.files[i]);
            }

            const res = await axios.put(
              `http://localhost:5000/api/accommodation/${editingRow._id}`,
              formData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            const updatedItem = res.data.data;
            const updatedList = data.map((item) =>
              item._id === updatedItem._id ? { ...updatedItem, key: updatedItem._id } : item
            );
            setData(updatedList);
            setIsUpdateModalVisible(false);
          } catch (error) {
            console.error("Error updating accommodation:", error);
          }
        }}
        okText="Save"
        cancelText="Cancel"
      >
        {editingRow && (
          <div className="modal-form">
            <label>Upload New Images:</label>
            <input
              type="file"
              accept="image/*"
              multiple

              onChange={(e) =>
                setEditingRow({
                  ...editingRow,
                  files: Array.from(e.target.files),
                })
              }
            />

            <label>Title:</label>
            <input
              type="text"
              value={editingRow.title}
              onChange={(e) =>
                setEditingRow({ ...editingRow, title: e.target.value })
              }
            />

            <label>Street:</label>
            <input
              type="text"
              value={editingRow.location?.street}
              onChange={(e) =>
                setEditingRow({
                  ...editingRow,
                  location: {
                    ...editingRow.location,
                    street: e.target.value,
                  },
                })
              }
            />

            <label>District:</label>
            <input
              type="text"
              value={editingRow.location?.district}
              onChange={(e) =>
                setEditingRow({
                  ...editingRow,
                  location: {
                    ...editingRow.location,
                    district: e.target.value,
                  },
                })
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
              <option value="available">available</option>
              <option value="unavailable">unavailable</option>
            </select>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Accommodation;
// file TroNhanh_FE/src/pages/OwnerPage/Report/report.jsx
import React, { useState, useEffect } from "react";
import "./report.css";
import { Table, Button, Select, Modal, message } from "antd";
const { Option } = Select;

const Report = () => {
  const [reportList, setReportList] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reportForm, setReportForm] = useState({
    type: "",
    content: "",
  });

  useEffect(() => {
  const fetchReports = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) return;

    try {
      const res = await fetch(`http://localhost:5000/api/reports?reporterId=${user.id}`);
      const data = await res.json();

      if (res.ok) {
        const formatted = data.reports.map((r) => ({
          ...r,
          key: r._id,
          submittedAt: new Date(r.createAt).toLocaleString(),
        }));
        setReportList(formatted);
      } else {
        console.error("❌ Lỗi khi tải danh sách report:", data.message);
      }
    } catch (err) {
      console.error("❌ Không thể tải danh sách report:", err);
    }
  };

  fetchReports();
}, []);

  const handleChange = (field, value) => {
    setReportForm({ ...reportForm, [field]: value });
  };

  const handleSubmit = async () => {
    const user = JSON.parse(localStorage.getItem("user")); // 👈 cần có id

    const { type, content } = reportForm;
    if (!type || content.trim().length < 10) {
      alert("Vui lòng chọn loại report và nội dung tối thiểu 10 ký tự.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reporterId: user.id,
          type,
          content,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReportList([...reportList, {
          ...data.data,
          key: data.data._id,
          submittedAt: new Date(data.data.createAt).toLocaleString(),
        }]);

        setIsModalVisible(false);
        setReportForm({ type: "", content: "" });
        alert("✅ Report đã được gửi tới admin!");
      } else {
        alert("❌ Lỗi gửi report: " + data.message);
      }
    } catch (err) {
      console.error("❌ Error sending report:", err);
      alert("Không thể gửi report. Vui lòng thử lại.");
    }
  };


  const columns = [
    {
      title: "Type",
      dataIndex: "type",
    },
    {
      title: "Content",
      dataIndex: "content",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <span className={`status-tag ${status.toLowerCase()}`}>{status}</span>
      ),
    },
    {
      title: "Submitted At",
      dataIndex: "submittedAt",
    },
    {
      title: "Admin Feedback",
      dataIndex: "adminFeedback",
    },
  ];

  return (
    <div className="report-wrapper">
      <div className="report-header">
        <h2>Report to Admin</h2>
        <Button className="open-modal-btn" onClick={() => setIsModalVisible(true)}>
          Create Report
        </Button>
      </div>

      <Table className="report-table" dataSource={reportList} columns={columns} pagination={false} />

      <Modal
        title="New Report"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSubmit}
        okText="Submit"
        cancelText="Cancel"
      >
        <div className="report-form">
          <label>Type:</label>
          <Select
            value={reportForm.type}
            onChange={(value) => handleChange("type", value)}
            placeholder="Select type"
            style={{ width: "100%" }}
          >
            <Option value="Fake Booking">Fake Booking</Option>
            <Option value="Abusive Renter">Abusive Renter</Option>
            <Option value="System Issue">System Issue</Option>
            <Option value="Spam/Scam">Spam / Scam</Option>
            <Option value="Violation of Terms">Violation of Terms</Option>
            <Option value="Technical Error">Technical Error</Option>
            <Option value="Other">Other</Option>
          </Select>

          <label>Content:</label>
          <textarea
            rows={4}
            placeholder="Enter your report content..."
            value={reportForm.content}
            onChange={(e) => handleChange("content", e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Report;

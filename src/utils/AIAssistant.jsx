import React, { useState, useEffect } from "react";
import { MessageOutlined, CloseOutlined } from "@ant-design/icons";
import { Modal, Input, Button } from "antd";
import { getValidAccessToken } from "../services/authService";
import { marked } from "marked";
function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
 const [showBubble, setShowBubble] = useState(true);
  const [token, setToken] = useState(null);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Xin chào 👋! Tôi là trợ lí ảo của Trọ Nhanh.", completed: true },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { from: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    // Thêm message bot kiểu "Đang suy nghĩ..."
    setMessages((prev) => [
      ...prev,
      { from: "bot", text: "Đang suy nghĩ...", completed: false },
    ]);

    try {
      const response = await fetch("https://tronhanh-be.onrender.com/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let partial = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partial += decoder.decode(value, { stream: true });

        const newText = partial; // Lưu giá trị riêng
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = {
            ...last,
            text: newText,
            completed: false,
          };
          return updated;
        });
      }

      // Khi xong stream, đánh dấu completed
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = { ...last, completed: true };
        return updated;
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Lỗi khi kết nối AI", completed: true },
      ]);
    }

    setLoading(false);
  };

  return (
    <>
{/* Wrapper bọc icon và bubble */}
<div
  style={{
    position: "fixed",
    bottom: 60,
    right: 20,
    zIndex: 1000,
  }}
  onMouseEnter={() => setShowBubble(true)}
  onMouseLeave={() => setShowBubble(false)}
>
  {/* Bubble tooltip -  */}
{showBubble && (() => {
  const ICON_SIZE = 60; 
  const ICON_CENTER_OFFSET = ICON_SIZE / 2; // 30
  const BUBBLE_WIDTH = 260; // px
  return (
    <div
      style={{
        position: "absolute",
        bottom: "100%",
        right: 0,                 
        marginBottom: 12,
        background: "white",
        padding: "10px 14px",
        borderRadius: 16,
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        width: BUBBLE_WIDTH,
           wordBreak: "break-word",   
        lineHeight: "1.35",       
        pointerEvents: "none",
        animation: "fadeInUp 0.3s ease-out",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 500 }}>
        Bạn muốn tìm phòng trọ? <span style={{ color: "#1890ff" }}>Chat với tôi ngay!</span>
      </div>

      {/* Mũi tên */}
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: `calc(100% - ${ICON_CENTER_OFFSET}px)`,
          transform: "translateX(-50%)", 
          width: 0,
          height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: "12px solid white",
          pointerEvents: "none",
        }}
      />
    </div>
  );
})()}


  {/* Nút chat */}
<Button
  type="primary"
  shape="circle"
  size="large"
  icon={<MessageOutlined style={{ fontSize: 24 }} />}
  onClick={async () => {
    setIsOpen(true);
    setShowBubble(false);

    // Lấy token ngay khi mở chat
    const t = await getValidAccessToken();
    setToken(t);
  }}
  style={{
    width: 60,
    height: 60,
    boxShadow: "0 6px 20px rgba(24, 144, 255, 0.35)",
  }}
/>

</div>
      <Modal
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        footer={null}
        closeIcon={<CloseOutlined />}
        centered
        width={600}
        bodyStyle={{
          display: "flex",
          flexDirection: "column",
          height: 500,
          padding: 0,
        }}
        title="🤖 Trọ Nhanh Chat Bot"
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 10,
            background: "#fafafa",
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 8,
                textAlign: msg.from === "bot" ? "left" : "right",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: msg.from === "bot" ? "#f0f0f0" : "#d9f7be",
                  maxWidth: "80%",
                  wordWrap: "break-word",
                  textAlign: "left",
                }}
                dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }}
              />
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            padding: 10,
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập tin nhắn..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            type="primary"
            onClick={handleSend}
            style={{ marginLeft: 8 }}
            loading={loading}
          >
            Gửi
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default AIAssistant;
